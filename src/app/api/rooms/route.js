import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { logActivity } from "../../../../lib/activityLogger";
import { authOptions } from "../auth/[...nextauth]/route";
import { requireSameOrigin } from "@/lib/security";

// Normalize any date to UTC midnight (date-only comparisons).
function normalizeUTC(date) {
  const d = new Date(date);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isSameDay(a, b) {
  return a.getTime() === b.getTime();
}

function normalizeAmenities(input) {
  if (!Array.isArray(input)) return [];
  const clean = input
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return [...new Set(clean)];
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeDecimal(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function blocksRoom(status) {
  const s = String(status || "").toLowerCase();
  return s !== "cancelled" && s !== "completed";
}

// Handle GET requests for this route.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeReservations = searchParams.get("include") === "true";
    const selectedDateParam = searchParams.get("date");

    // Use the provided date (or today) and normalize to UTC day.
    const selectedDate = selectedDateParam
      ? new Date(selectedDateParam)
      : new Date();
    const selectedDay = normalizeUTC(selectedDate);

    const rooms = await prisma.rooms.findMany({
      include: includeReservations
        ? {
            reservations: {
              where: {
                cancelled_at: null,
                admin_hidden: false,
              },
              select: {
                id: true,
                start_date: true,
                end_date: true,
                full_name: true,
                phone: true,
                total_price: true,
                status: true,
              },
            },
          }
        : undefined,
      orderBy: { room_number: "asc" },
    });

    if (!includeReservations) {
      return NextResponse.json(rooms);
    }

    const updatedRooms = rooms.map((room) => {
      const operationalStatus = room.status || "available";

      // out_of_order ka prioritet
      if (operationalStatus === "out_of_order") {
        return {
          ...room,
          operational_status: operationalStatus,
          current_status: "out_of_order",
          active_reservation: null,
          has_checkout_today: false,
        };
      }

      let activeReservation = null;
      let hasCheckoutToday = false;

      for (const r of room.reservations) {
        if (!blocksRoom(r.status)) continue;

        const startDay = normalizeUTC(r.start_date);
        const endDay = normalizeUTC(r.end_date);

        // booked: start <= selected < end
        if (selectedDay >= startDay && selectedDay < endDay) {
          activeReservation = r;
          break;
        }

        // checkout day: selected == end
        if (isSameDay(selectedDay, endDay)) {
          hasCheckoutToday = true;
        }


      }

      const currentStatus = activeReservation
        ? "booked"
        : operationalStatus === "out_of_order"
          ? "out_of_order"
          : "available";

      return {
        ...room,
        operational_status: operationalStatus,
        current_status: currentStatus,
        active_reservation: activeReservation,
        has_checkout_today: hasCheckoutToday, // vetÃ«m info pÃ«r UI
      };
    });


    return NextResponse.json(updatedRooms);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle POST requests for this route.
export async function POST(request) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "worker")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      name,
      room_number,
      type,
      price,
      description,
      amenities,
      included_guests,
      max_guests,
      extra_guest_price,
    } =
      await request.json();

    if (!name || !room_number || !type || price === undefined || price === "") {
      return NextResponse.json(
        { error: "name, room_number, type and price are required" },
        { status: 400 },
      );
    }

    const existingRoom = await prisma.rooms.findFirst({
      where: { room_number, type },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists for this type." },
        { status: 400 },
      );
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const includedGuests = parsePositiveInt(included_guests, 2);
    const maxGuests = parsePositiveInt(max_guests, includedGuests);
    const extraGuestPrice = parseNonNegativeDecimal(extra_guest_price, 0);

    if (maxGuests < includedGuests) {
      return NextResponse.json(
        { error: "Max guests must be greater than or equal to included guests" },
        { status: 400 },
      );
    }

    const room = await prisma.rooms.create({
      data: {
        name: String(name).trim(),
        room_number: String(room_number).trim(),
        type: String(type).trim(),
        price: parsedPrice,
        included_guests: includedGuests,
        max_guests: maxGuests,
        extra_guest_price: extraGuestPrice,
        description: description ? String(description).trim() : null,
        amenities: normalizeAmenities(amenities),
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "room",
      entity_id: room.id,
      description: `Created room "${room.name}" (#${room.room_number})`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("POST /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH super i thjeshtÃ« me action
  * TOGGLE_OUT_OF_ORDER -> out_of_order/available
  */
// Handle PATCH requests for this route.
export async function PATCH(request) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    const { room_id, action } = await request.json();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "worker")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!room_id || !action) {
      return NextResponse.json(
        { error: "room_id and action are required" },
        { status: 400 },
      );
    }

    const room = await prisma.rooms.findUnique({
      where: { id: Number(room_id) },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Compute next status based on action and current status.
    const currentStatus = room.status || "available";
    let nextStatus = currentStatus;

    if (action === "TOGGLE_OUT_OF_ORDER") {
      nextStatus =
        currentStatus === "out_of_order" ? "available" : "out_of_order";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const roomIdNum = Number(room_id);
    const updated = await prisma.$transaction(async (tx) => {
      const updatedRoom = await tx.rooms.update({
        where: { id: roomIdNum },
        data: { status: nextStatus },
      });
      return updatedRoom;
    });

    await logActivity({
      action,
      entity: "room",
      entity_id: updated.id,
      description: `Room #${room.room_number} status: ${currentStatus} -> ${nextStatus}`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json({ message: "Room updated", room: updated });
  } catch (error) {
    console.error("PATCH /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



