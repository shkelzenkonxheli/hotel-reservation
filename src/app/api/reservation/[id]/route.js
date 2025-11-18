import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req, context) {
  try {
    const params = await context.params;
    const { id } = params;

    const {
      fullname,
      phone,
      address,
      type,
      guests,
      startDate,
      endDate,
      total_price,
    } = await req.json();

    if (!fullname || !phone || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existing = await prisma.reservations.findUnique({
      where: { id: Number(id) },
      include: { rooms: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const isTypeChanged = type !== existing.rooms.type;
    const isDatesChanged =
      startDate !== existing.start_date.toISOString().split("T")[0] ||
      endDate !== existing.end_date.toISOString().split("T")[0];

    let newRoomId = existing.roomId;

    if (isTypeChanged || isDatesChanged) {
      const rooms = await prisma.rooms.findMany({
        where: { type },
        include: { reservations: true },
      });

      const availableRoom = rooms.find((room) => {
        const conflict = room.reservations.some((reservation) => {
          if (reservation.id === existing.id) return false;
          return (
            new Date(startDate) < new Date(reservation.end_date) &&
            new Date(endDate) > new Date(reservation.start_date)
          );
        });
        return !conflict;
      });

      if (!availableRoom) {
        return NextResponse.json(
          { error: "No available rooms for the new type or dates." },
          { status: 400 }
        );
      }

      newRoomId = availableRoom.id;
    }

    const updated = await prisma.reservations.update({
      where: { id: Number(id) },
      data: {
        room_id: newRoomId,
        full_name: fullname,
        phone,
        address,
        guests: Number(guests),
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        total_price: parseFloat(total_price),
      },
      include: {
        users: { select: { name: true, email: true } },
        rooms: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error updating reservation:", error);
    return NextResponse.json(
      { error: "Failed to update reservation", details: error.message },
      { status: 500 }
    );
  }
}
