import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reservationId, reason } = await req.json();
    if (!reservationId) {
      return NextResponse.json(
        { error: "Missing reservationId" },
        { status: 400 },
      );
    }

    // ✅ siguri: klienti mund të anulojë vetëm rezervimin e vet
    const reservation = await prisma.reservations.findUnique({
      where: { id: Number(reservationId) },
      select: { id: true, user_id: true, cancelled_at: true, start_date: true },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (Number(reservation.user_id) !== Number(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ mos e lejo anulimin nëse është anuluar më parë
    if (reservation.cancelled_at) {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }

    // ✅ opsionale: mos e lejo anulimin në ditën e check-in ose pas (mund ta heqim nëse s’e do)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(reservation.start_date);
    start.setHours(0, 0, 0, 0);
    if (start <= today) {
      return NextResponse.json(
        { error: "Cannot cancel on/after check-in date" },
        { status: 400 },
      );
    }

    const updated = await prisma.reservations.update({
      where: { id: Number(reservationId) },
      data: {
        cancelled_at: new Date(),
        cancel_reason: typeof reason === "string" ? reason.slice(0, 255) : null,
      },
      select: { id: true, cancelled_at: true, cancel_reason: true },
    });
    await prisma.notifications.create({
      data: {
        type: "reservation_cancelled",
        title: "Reservation cancelled",
        message: `Reservation #${reservationId} was cancelled by client.`,
        reservation_id: Number(reservationId),
        user_id: Number(session.user.id),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/reservation/cancel error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
