import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "../../../../../lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Convert YYYY-MM-DD to a UTC midnight Date for day-precision comparisons.
function parseDateOnlyToUTC(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isOverlapError(error) {
  return (
    error?.code === "23P01" ||
    error?.message?.includes("violates exclusion constraint") ||
    error?.meta?.cause?.includes?.("exclusion constraint")
  );
}

// Handle PATCH requests for this route.
export async function PATCH(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);
    const performedBy = session?.user?.email ?? "system";

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
      roomId,
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
    const start = parseDateOnlyToUTC(startDate);
    const end = parseDateOnlyToUTC(endDate);
    const today = parseDateOnlyToUTC(new Date().toISOString().slice(0, 10));
    if (end <= start) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
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

    // Detect whether room type or date range is being changed.
    const isTypeChanged = type !== existing.rooms.type;
    const isDatesChanged =
      startDate !== existing.start_date.toISOString().split("T")[0] ||
      endDate !== existing.end_date.toISOString().split("T")[0];

    let newRoomId = existing.room_id;

    const rooms = await prisma.rooms.findMany({
      where: { type },
      include: {
        reservations: { where: { cancelled_at: null, admin_hidden: false } },
      },
    });

    const availableRooms = rooms.filter((room) => {
      if (room.status === "out_of_order") return false;
      const conflict = room.reservations.some((reservation) => {
        if (reservation.id === existing.id) return false;
        const rStart = parseDateOnlyToUTC(
          reservation.start_date.toISOString().slice(0, 10),
        );
        const rEnd = parseDateOnlyToUTC(
          reservation.end_date.toISOString().slice(0, 10),
        );
        return start < rEnd && end > rStart;
      });
      return !conflict;
    });

    const hasSelectedRoom = roomId !== undefined && roomId !== null && roomId !== "";
    if (hasSelectedRoom) {
      const selected = availableRooms.find((room) => room.id === Number(roomId));
      if (!selected) {
        return NextResponse.json(
          { error: "Selected room is not available for these dates." },
          { status: 400 },
        );
      }
      newRoomId = selected.id;
    } else if (isTypeChanged || isDatesChanged) {
      const fallback = availableRooms[0];
      if (!fallback) {
        return NextResponse.json(
          { error: "No available rooms for the new type or dates." },
          { status: 400 },
        );
      }
      newRoomId = fallback.id;
    }

    const updated = await prisma.reservations.update({
      where: { id: Number(id) },
      data: {
        room_id: newRoomId,
        full_name: fullname,
        phone,
        address,
        // Coerce numeric and date fields before update.
        guests: Number(guests),
        start_date: start,
        end_date: end,
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
    if (isOverlapError(error)) {
      return NextResponse.json(
        { error: "No rooms available for the selected dates" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update reservation", details: error.message },
      { status: 500 },
    );
  }
}
// Handle DELETE requests for this route.
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  try {
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = null;
    try {
      body = await req.json();
    } catch {}

    const isNumericId = !Number.isNaN(Number(id));
    const ids =
      Array.isArray(body?.ids) && body.ids.length > 0
        ? body.ids.map(Number).filter((n) => Number.isFinite(n))
        : [];

    if (!id) {
      return NextResponse.json({ error: "It needs an id" }, { status: 400 });
    }

    if (!isNumericId && ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid id or empty ids list" },
        { status: 400 },
      );
    }

    if (!isNumericId && ids.length > 0) {
      await prisma.reservations.updateMany({
        where: { id: { in: ids } },
        data: {
          admin_hidden: true,
          admin_hidden_at: new Date(),
        },
      });

      await logActivity({
        action: "ARCHIVE_BULK",
        entity: "reservation",
        entity_id: null,
        description: `Admin archived reservations: ${ids.join(", ")}`,
        performed_by: session.user.email,
      });

      return NextResponse.json({
        message: `Archived ${ids.length} reservations`,
      });
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
