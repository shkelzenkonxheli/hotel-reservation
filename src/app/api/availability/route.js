// /app/api/availability/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Handle GET requests for this route.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomType = searchParams.get("room_type");

    if (!roomType) {
      return NextResponse.json({ roomCount: 0, reservations: [] });
    }

    // Merr të gjitha dhomat e atij tipi
    const rooms = await prisma.rooms.findMany({
      where: { type: roomType },
      select: { id: true },
    });

    // Extract IDs so we can query reservations and compute total capacity.
    const roomIds = rooms.map((r) => r.id);
    // Count of rooms for the selected type (used by the client to gauge capacity).
    const roomCount = roomIds.length;

    // Merr të gjitha rezervimet për ato dhoma
    const reservations = await prisma.reservations.findMany({
      where: {
        room_id: { in: roomIds },
        cancelled_at: null,
        admin_hidden: false,
      },
      select: {
        room_id: true,
        start_date: true,
        end_date: true,
      },
    });

    return NextResponse.json({ roomCount, reservations });
  } catch (err) {
    console.error("Availability API error:", err);
    return NextResponse.json({ roomCount: 0, reservations: [] });
  }
}
