import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { logActivity } from "../../../../lib/activityLogger";
import { authOptions } from "../auth/[...nextauth]/route";

function normalizeUTC(date) {
  const d = new Date(date);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function isSameDay(a, b) {
  return a.getTime() === b.getTime();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeReservations = searchParams.get("include") === "true";
    const selectedDateParam = searchParams.get("date");

    const selectedDate = selectedDateParam
      ? new Date(selectedDateParam)
      : new Date();
    const selectedDay = normalizeUTC(selectedDate);

    const rooms = await prisma.rooms.findMany({
      include: includeReservations
        ? {
            reservations: {
              // ✅ mos i merr krejt users nëse s’të duhet (e ngadalëson)
              // nëse të duhet, ktheje prap include: { users: true }
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

      // ✅ current_status i thjeshtë:
      // - nëse ka rezervim aktiv -> booked
      // - përndryshe -> statusi i DB (available / needs_cleaning)
      const currentStatus = activeReservation ? "booked" : operationalStatus;

      return {
        ...room,
        operational_status: operationalStatus,
        current_status: currentStatus,
        active_reservation: activeReservation,
        has_checkout_today: hasCheckoutToday, // vetëm info për UI
      };
    });

    return NextResponse.json(updatedRooms);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH super i thjeshtë me action
 * CLEAN -> available
 * TOGGLE_OUT_OF_ORDER -> out_of_order/available
 * MARK_NEEDS_CLEANING -> needs_cleaning
 */
export async function PATCH(request) {
  try {
    const { room_id, action } = await request.json();
    const session = await getServerSession(authOptions);

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

    const currentStatus = room.status || "available";
    let nextStatus = currentStatus;

    if (action === "CLEAN") {
      nextStatus = "available";
    } else if (action === "TOGGLE_OUT_OF_ORDER") {
      nextStatus =
        currentStatus === "out_of_order" ? "available" : "out_of_order";
    } else if (action === "MARK_NEEDS_CLEANING") {
      nextStatus = "needs_cleaning";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.rooms.update({
      where: { id: Number(room_id) },
      data: { status: nextStatus },
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
