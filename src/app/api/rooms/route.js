import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeReservations = searchParams.get("include") === "true";
    const selectedDateParam = searchParams.get("date");

    const selectedDate = selectedDateParam
      ? new Date(selectedDateParam)
      : new Date();

    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    const rooms = await prisma.rooms.findMany({
      include: includeReservations
        ? {
            reservations: {
              include: { users: true },
            },
          }
        : undefined,
      orderBy: { room_number: "asc" },
    });

    const updatedRooms = rooms.map((room) => {
      let current_status = room.status || "available";
      let activeReservation = null;

      room.reservations?.forEach((r) => {
        const start = new Date(r.start_date);
        const end = new Date(r.end_date);

        const startDateOnly = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate()
        );
        const endDateOnly = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate()
        );

        if (
          selectedDateOnly.getTime() >= startDateOnly.getTime() &&
          selectedDateOnly.getTime() < endDateOnly.getTime()
        ) {
          current_status = "booked";
          activeReservation = r;
        } else if (endDateOnly.getTime() <= selectedDateOnly.getTime()) {
          if (room.status !== "available") {
            current_status = "needs_cleaning";
          }
        }
      });

      return {
        ...room,
        current_status,
        active_reservation: activeReservation,
      };
    });

    return NextResponse.json(updatedRooms);
  } catch (error) {
    console.error("GET /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { room_id } = await request.json();
    if (!room_id) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    const room = await prisma.rooms.findUnique({
      where: { id: Number(room_id) },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const updatedRoom = await prisma.rooms.update({
      where: { id: Number(room_id) },
      data: { status: "available" },
    });

    return NextResponse.json({
      message: "✅ Room marked as cleaned",
    });
  } catch (error) {
    console.error("PATCH /rooms error:", error);
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
