import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const roomId = parseInt(id);
    const { name, room_number, type, price, description, status } =
      await request.json();

    const existingRoom = await prisma.rooms.findFirst({
      where: {
        room_number,
        type,
        NOT: { id: roomId },
      },
    });
    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists." },
        { status: 400 }
      );
    }
    const updatedRoom = await prisma.rooms.update({
      where: { id: roomId },
      data: {
        name,
        room_number,
        type,
        price: parseFloat(price),
        description,
        status: status || undefined,
      },
    });
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("PATCH /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    await prisma.rooms.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /rooms/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
