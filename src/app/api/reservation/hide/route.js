import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Handle PATCH requests for this route.
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { reservationId } = await req.json();
    if (!reservationId) {
      return NextResponse.json(
        { error: "Missing reservationId" },
        { status: 400 },
      );
    }
    const reservation = await prisma.reservations.findUnique({
      where: { id: Number(reservationId) },
      select: { id: true, user_id: true },
    });
    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (Number(reservation.user_id) !== Number(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.reservations.update({
      where: { id: Number(reservationId) },
      data: {
        client_hidden: true,
        client_hidden_at: new Date(),
      },
      select: { id: true, client_hidden: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/reservation/hide error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
