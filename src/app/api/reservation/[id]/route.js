import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "../../../../../lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);
    const performedBy = session?.user?.email ?? "system";

    const today = new Date().setHours(0, 0, 0, 0);
    const start = new Date().setHours(0, 0, 0, 0);
    const body = await req.json();

    if (body.status && Object.keys(body).length === 1) {
      const updated = await prisma.reservations.update({
        where: { id: Number(id) },
        data: { status: body.status },
        include: {
          users: { select: { email: true } },
          rooms: true,
        },
      });
      await logActivity({
        action: "STATUS_CHANGE",
        entity: "reservation",
        entity_id: updated.id,
        description: `Reservation #${updated.id} status → ${body.status}`,
        performed_by: performedBy,
      });

      return NextResponse.json(updated);
    }

    const {
      fullname,
      phone,
      address,
      type,
      guests,
      startDate,
      endDate,
      total_price,
    } = body;

    if (!fullname || !phone || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (start < today) {
      return NextResponse.json(
        { error: "Cannot create or edit reservation in the past" },
        { status: 400 },
      );
    }

    const existing = await prisma.reservations.findUnique({
      where: { id: Number(id) },
      include: { rooms: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
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
          { status: 400 },
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
    await logActivity({
      action: "UPDATE",
      entity: "reservation",
      entity_id: updated.id,
      description: `Updated reservation #${updated.id}`,
      performed_by: performedBy,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error updating reservation:", error);
    return NextResponse.json(
      { error: "Failed to update reservation", details: error.message },
      { status: 500 },
    );
  }
}
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  try {
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "It needs an id" }, { status: 400 });
    }

    const reservationId = Number(id);

    const existing = await prisma.reservations.findUnique({
      where: { id: reservationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    // ✅ ADMIN HIDE (JO DELETE)
    await prisma.reservations.update({
      where: { id: reservationId },
      data: {
        admin_hidden: true,
        admin_hidden_at: new Date(),
      },
    });

    await logActivity({
      action: "ARCHIVE",
      entity: "reservation",
      entity_id: reservationId,
      description: `Admin archived reservation #${reservationId}`,
      performed_by: session.user.email,
    });

    return NextResponse.json({
      message: "Reservation archived successfully",
    });
  } catch (error) {
    console.error("❌ Error archiving reservation:", error);
    return NextResponse.json(
      { error: "Failed to archive reservation" },
      { status: 500 },
    );
  }
}
