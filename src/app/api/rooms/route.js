import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeReservations = searchParams.get("include") === "true";
    const selectedDateParam = searchParams.get("date");

    // IF only listing rooms (Manage Rooms)
    if (!includeReservations) {
      const rooms = await prisma.rooms.findMany({
        orderBy: { room_number: "asc" },
      });
      return NextResponse.json(rooms);
    }

    const selectedDate = selectedDateParam
      ? new Date(selectedDateParam)
      : new Date();

    const selectedDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    const rooms = await prisma.rooms.findMany({
      include: {
        reservations: {
          include: { users: true },
        },
      },
      orderBy: { room_number: "asc" },
    });

    const updatedRooms = [];

    for (const room of rooms) {
      let newStatus = room.status;
      let activeReservation = null;

      for (const r of room.reservations) {
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);

        const startDay = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        );
        const endDay = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate()
        );

        // BOOKED (between start and end)
        if (selectedDay >= startDay && selectedDay < endDay) {
          newStatus = "booked";
          activeReservation = r;
        }

        // CHECKOUT DAY ONLY → needs cleaning
        if (selectedDay.getTime() === endDay.getTime()) {
          if (room.status !== "available") {
            newStatus = "needs_cleaning";
          }
        }
      }

      // Update DB only if status changed
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

    if (!room_id) {
      console.log("❌ No room_id provided");
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
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

    const { name, room_number, type, price, description } = body;

    // Basic validation
    if (!name || !room_number || !type || !price) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
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

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("POST /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
