import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const rooms = await prisma.rooms.findMany({
      include: { reservations: true },
    });

    let checkout_today = 0;
    let checkin_today = 0;
    let needs_cleaning = 0;
    let out_of_order = 0;

    for (const room of rooms) {
      // Out of order count
      if (room.status === "out_of_order") {
        out_of_order++;
        continue;
      }

      // Needs cleaning (status already saved)
      if (room.status === "needs_cleaning") {
        needs_cleaning++;
      }

      // Check if checkout is today
      for (const res of room.reservations) {
        if (res.cancelled_at) continue; // ✅ mos i llogarit të anuluarat

        const start = new Date(res.start_date);
        const end = new Date(res.end_date);

        const startDay = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
        );
        const endDay = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate(),
        );

        if (endDay.getTime() === todayOnly.getTime()) {
          checkout_today++;
          break;
        }

        if (startDay.getTime() === todayOnly.getTime()) {
          checkin_today++;
          break;
        }
      }
    }

    return NextResponse.json({
      checkout_today,
      checkin_today,
      needs_cleaning,
      out_of_order,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
