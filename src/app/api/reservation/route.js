import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const {
      userId,
      type,
      startDate,
      endDate,
      fullname,
      phone,
      address,
      guests,
      total_price,
    } = await request.json();

    const rooms = await prisma.rooms.findMany({
      where: { type },
      include: { reservations: true },
    });

    const availableRoom = rooms.find((room) => {
      const conflict = room.reservations.some((reservation) => {
        return (
          new Date(startDate) < new Date(reservation.end_date) &&
          new Date(endDate) > new Date(reservation.start_date)
        );
      });
      return !conflict;
    });

    if (!availableRoom) {
      return NextResponse.json(
        { error: "No rooms available" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservations.create({
      data: {
        room_id: availableRoom.id,
        user_id: userId,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        status: "pending",
        full_name: fullname,
        phone,
        address,
        guests: parseInt(guests),
        total_price: parseFloat(total_price),
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Kontrollo disponueshmërinë
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listAll = searchParams.get("list");
    const userId = searchParams.get("user_id");
    const userRole = searchParams.get("role")?.toLowerCase();
    const roomType = searchParams.get("room_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    if (searchParams.get("latest") === "true") {
      const userId = parseInt(searchParams.get("userId"));
      const latest = await prisma.reservations.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        include: { rooms: true },
      });
      return NextResponse.json(latest);
    }

    // ✅ 1️⃣ Nëse kërkohet lista e rezervimeve (për dashboard ose për user)
    if (listAll === "true" || (userId && userRole)) {
      let where = {};

      // nëse është klient → filtro sipas user_id
      if (userRole === "client") {
        where.user_id = Number(userId);
      }

      const reservations = await prisma.reservations.findMany({
        where,
        include: { rooms: true, users: true },
        orderBy: { id: "desc" },
      });

      console.log("📦 Found reservations:", reservations.length);

      const payload = reservations.map((r) => ({
        ...r,
        total_price: r.total_price ? Number(r.total_price) : 0,
      }));

      return NextResponse.json(payload);
    }

    // ✅ 2️⃣ Nëse kërkohet kontrollim disponueshmërie
    if (roomType && startDate && endDate) {
      const rooms = await prisma.rooms.findMany({
        where: { type: roomType },
        include: { reservations: true },
      });

      const availableRoom = rooms.find((room) => {
        const conflict = room.reservations.some((res) => {
          return (
            new Date(startDate) < new Date(res.end_date) &&
            new Date(endDate) > new Date(res.start_date)
          );
        });
        return !conflict;
      });

      return NextResponse.json({ available: !!availableRoom });
    }

    // nëse s’përputhet asnjë rast, kthe bosh
    return NextResponse.json([]);
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
