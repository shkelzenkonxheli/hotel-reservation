import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

function normalizeUTC(date) {
  const d = new Date(date);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function blocksRoom(status) {
  const normalized = String(status || "").toLowerCase();
  return normalized !== "cancelled" && normalized !== "completed";
}

export async function GET() {
  try {
    const { error } = await requireRole(["admin", "worker"]);
    if (error) return error;

    const todayOnly = normalizeUTC(new Date());

    const rooms = await prisma.rooms.findMany({
      include: {
        reservations: {
          select: {
            start_date: true,
            end_date: true,
            status: true,
            cancelled_at: true,
          },
        },
      },
    });

    let checkout_today = 0;
    let checkin_today = 0;
    let out_of_order = 0;

    for (const room of rooms) {
      if (room.status === "out_of_order") {
        out_of_order++;
        continue;
      }

      let roomHasCheckinToday = false;
      let roomHasCheckoutToday = false;

      for (const reservation of room.reservations) {
        if (reservation.cancelled_at) continue;
        if (!blocksRoom(reservation.status)) continue;

        const startDay = normalizeUTC(reservation.start_date);
        const endDay = normalizeUTC(reservation.end_date);

        if (startDay.getTime() === todayOnly.getTime()) {
          roomHasCheckinToday = true;
        }

        if (endDay.getTime() === todayOnly.getTime()) {
          roomHasCheckoutToday = true;
        }

        if (roomHasCheckinToday && roomHasCheckoutToday) {
          break;
        }
      }

      if (roomHasCheckinToday) {
        checkin_today++;
      }

      if (roomHasCheckoutToday) {
        checkout_today++;
      }
    }

    return NextResponse.json({
      checkout_today,
      checkin_today,
      needs_cleaning: 0,
      out_of_order,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
