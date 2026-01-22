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
        ? { reservations: { include: { users: true } } }
        : undefined,
      orderBy: { room_number: "asc" },
    });

    if (!includeReservations) {
      return NextResponse.json(rooms);
    }

    // ✅ Përdor for..of që me mujt me await kur duhet (për update në DB)
    const updatedRooms = [];

    for (const room of rooms) {
      const operationalStatus = room.status || "available";

      // 1) out_of_order ka prioritet
      if (operationalStatus === "out_of_order") {
        updatedRooms.push({
          ...room,
          operational_status: operationalStatus,
          current_status: "out_of_order",
          active_reservation: null,
          has_checkout_today: false,
        });
        continue;
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

      // 2) current_status (computed) me rregull të saktë
      let currentStatus = operationalStatus;

      if (activeReservation) {
        currentStatus = "booked";
      } else if (operationalStatus === "needs_cleaning") {
        currentStatus = "needs_cleaning";
      } else if (hasCheckoutToday) {
        // ✅ Checkout day -> needs_cleaning
        currentStatus = "needs_cleaning";

        // ✅ Shkruje 1 herë në DB që të mbesë needs_cleaning derisa pastrohet
        // (por mos e prek nëse dikush e ka vendos out_of_order ose e ka ba already needs_cleaning)
        if (room.status !== "needs_cleaning") {
          await prisma.rooms.update({
            where: { id: room.id },
            data: { status: "needs_cleaning" },
          });
        }
      } else {
        currentStatus = "available";
      }

      updatedRooms.push({
        ...room,
        operational_status: operationalStatus,
        current_status: currentStatus,
        active_reservation: activeReservation,
        has_checkout_today: hasCheckoutToday,
      });
    }

    return NextResponse.json(updatedRooms);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH me "action"
 * action: "CLEAN" | "TOGGLE_OUT_OF_ORDER" | "MARK_NEEDS_CLEANING"
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

    const currentOperational = room.status || "available";
    let nextOperational = currentOperational;

    if (action === "CLEAN") {
      // lejo CLEAN vetëm në needs_cleaning
      if (currentOperational !== "needs_cleaning") {
        return NextResponse.json(
          { error: "Room is not marked as needs_cleaning" },
          { status: 400 },
        );
      }
      nextOperational = "available";
    }

    if (action === "TOGGLE_OUT_OF_ORDER") {
      nextOperational =
        currentOperational === "out_of_order" ? "available" : "out_of_order";
    }

    if (action === "MARK_NEEDS_CLEANING") {
      if (currentOperational === "out_of_order") {
        return NextResponse.json(
          { error: "Room is out_of_order" },
          { status: 400 },
        );
      }
      nextOperational = "needs_cleaning";
    }

    const updated = await prisma.rooms.update({
      where: { id: Number(room_id) },
      data: { status: nextOperational },
    });

    await logActivity({
      action,
      entity: "room",
      entity_id: updated.id,
      description: `Room #${room.room_number} status: ${currentOperational} -> ${nextOperational}`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json({ message: "Room updated", room: updated });
  } catch (error) {
    console.error("PATCH /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
