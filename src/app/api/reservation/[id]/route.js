import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const { id } = params; // merret nga URL
    const { status } = await req.json(); // merret nga body

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing reservation ID or status" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updated = await prisma.reservations.update({
      where: { id: Number(id) },
      data: { status: status.toLowerCase() },
      include: {
        users: { select: { name: true, email: true } },
        rooms: { select: { name: true, room_number: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return NextResponse.json(
      { error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing reservation ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.reservations.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      console.log("⚠️ Reservation not found in DB");
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    await prisma.reservations.delete({ where: { id: Number(id) } });

    console.log("🗑️ Reservation deleted successfully!");
    return NextResponse.json({ message: "Reservation deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting reservation:", error);
    return NextResponse.json(
      { error: "Failed to delete reservation", details: error.message },
      { status: 500 }
    );
  }
}
