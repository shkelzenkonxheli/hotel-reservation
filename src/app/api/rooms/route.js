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
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeReservations = searchParams.get("include") === "true";
    const selectedDateParam = searchParams.get("date");

    if (!includeReservations) {
      const rooms = await prisma.rooms.findMany({
        orderBy: { room_number: "asc" },
      });
      return NextResponse.json(rooms);
    }

    const selectedDate = selectedDateParam
      ? new Date(selectedDateParam)
      : new Date();
    const selectedDay = normalizeUTC(selectedDate);

    const rooms = await prisma.rooms.findMany({
      include: {
        reservations: { include: { users: true } },
      },
      orderBy: { room_number: "asc" },
    });

    const updatedRooms = [];

    for (const room of rooms) {
      let newStatus = "available";
      let activeReservation = null;
      let hasCheckoutToday = false;

      for (const r of room.reservations) {
        const startDay = normalizeUTC(r.start_date);
        const endDay = normalizeUTC(r.end_date);

        // Booked: start <= selected < end
        if (selectedDay >= startDay && selectedDay < endDay) {
          newStatus = "booked";
          activeReservation = r;
          // booked ka prioritet => s’ka nevojë me kontrollu tjerat
          break;
        }

        // Checkout day: selected == end
        if (selectedDay.getTime() === endDay.getTime()) {
          hasCheckoutToday = true;
        }
      }

      // Nëse s’është booked, por ka checkout sot => needs_cleaning
      if (newStatus !== "booked" && hasCheckoutToday) {
        newStatus = "needs_cleaning";
      }

      if (newStatus !== room.status) {
        await prisma.rooms.update({
          where: { id: room.id },
          data: { status: newStatus },
        });
      }

      updatedRooms.push({
        ...room,
        status: newStatus,
        current_status: newStatus,
        active_reservation: activeReservation,
      });
    }

    return NextResponse.json(updatedRooms);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PATCH(request) {
  try {
    const { room_id, status } = await request.json();
    const session = await getServerSession(authOptions);

    if (!room_id) {
      console.log("❌ No room_id provided");
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 },
      );
    }
    const newStatus = status || "available";

    const room = await prisma.rooms.findUnique({
      where: { id: Number(room_id) },
    });

    console.log("Found room in DB:", room);

    if (!room) {
      console.log("❌ Room not found");
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const updated = await prisma.rooms.update({
      where: { id: Number(room_id) },
      data: { status: newStatus },
    });
    await logActivity({
      action: "CLEAN",
      entity: "room",
      entity_id: updated.id,
      description: `Cleaned room "${room.type}" (Room #${room.room_number})`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json({
      message: "Room cleaned",
      room: updated,
    });
  } catch (error) {
    console.error("❌ PATCH /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    const { name, room_number, type, price, description } = body;

    // Basic validation
    if (!name || !room_number || !type || !price) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 },
      );
    }

    // Create new room
    const newRoom = await prisma.rooms.create({
      data: {
        name,
        room_number,
        type,
        price: Number(price),
        description: description || "",
        status: "available", // default status
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "room",
      entity_id: newRoom.id,
      description: `Created room "${newRoom.type}" (Room #${newRoom.room_number})`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("POST /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
