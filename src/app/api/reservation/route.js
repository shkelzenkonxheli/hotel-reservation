import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import { logActivity } from "../../../../lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Convert YYYY-MM-DD to a UTC midnight Date for day-precision comparisons.
function parseDateOnlyToUTC(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Handle POST requests for this route.
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

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
      payment_method, // "cash" | "card"
      payment_status, // "PAID" | "UNPAID"
    } = await request.json();

    if (!type || !startDate || !endDate || !fullname || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Normalize input dates to UTC (date-only) for consistent overlap checks.
    const start = parseDateOnlyToUTC(startDate);
    const end = parseDateOnlyToUTC(endDate);

    if (end <= start) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 },
      );
    }

    // s’lejojmë start në të kaluarën (date-only)
    // Today's date at UTC midnight (date-only).
    const today = parseDateOnlyToUTC(new Date().toISOString().slice(0, 10));
    if (start < today) {
      return NextResponse.json(
        { error: "Cannot create reservation in the past" },
        { status: 400 },
      );
    }

    const rooms = await prisma.rooms.findMany({
      where: { type },
      include: {
        reservations: {
          where: { cancelled_at: null, admin_hidden: false },
          select: { start_date: true, end_date: true },
        },
      },
    });

    const availableRoom = rooms.find((room) => {
      if (room.status === "out_of_order") return false;

      // Overlap rule: start < existing_end AND end > existing_start.
      const conflict = room.reservations.some((r) => {
        // overlap: start < existing_end AND end > existing_start
        return start < new Date(r.end_date) && end > new Date(r.start_date);
      });

      return !conflict;
    });

    if (!availableRoom) {
      return NextResponse.json(
        { error: "No rooms available" },
        { status: 400 },
      );
    }

    // Normalize pricing and payment metadata.
    const total = Number(total_price || 0);
    const payStatus = payment_status === "PAID" ? "PAID" : "UNPAID";
    const payMethod = payment_method === "card" ? "card" : "cash";

    // If unpaid, amount_paid is zero.
    const amountPaid = payStatus === "PAID" ? total : 0;

    const reservation = await prisma.reservations.create({
      data: {
        room_id: availableRoom.id,
        reservation_code: "RES-" + nanoid(6).toUpperCase(),
        user_id: userId ?? session?.user?.id ?? null,

        start_date: start,
        end_date: end,

        // walk-in zakonisht confirmed
        status: "confirmed",

        full_name: fullname,
        phone,
        address: address || null,
        guests: guests ? parseInt(guests, 10) : null,
        total_price: total,

        payment_method: payMethod, // ✅ (pasi ta shtosh në DB)
        payment_status: payStatus, // ✅ ekziston
        amount_paid: amountPaid, // ✅ ekziston
        paid_at: payStatus === "PAID" ? new Date() : null, // ✅ ekziston
      },
    });
    // Create a padded invoice number like INV-2026-000123.
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(reservation.id).padStart(6, "0")}`;

    await prisma.reservations.update({
      where: { id: reservation.id },
      data: { invoice_number: invoiceNumber },
    });

    await logActivity({
      action: "CREATE",
      entity: "reservation",
      entity_id: reservation.id,
      description: `Created reservation #${reservation.id} (${payMethod}, ${payStatus})`,
      performed_by: session?.user?.email || "system",
    });

    await prisma.notifications.create({
      data: {
        type: "reservation_created",
        title: "New reservation",
        message: `New reservation created for ${fullname || "guest"}.`,
        reservation_id: reservation.id,
        user_id: session?.user?.id ?? null,
        is_read: false,
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("POST /reservation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Kontrollo disponueshmërinë
// Handle GET requests for this route.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = Number(searchParams.get("reservation_id"));
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
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toLowerCase();

    if (listAll === "true" || (userId && userRole)) {
      let where = {};

      if (userRole === "client") {
        where.user_id = Number(userId);
        where.client_hidden = false;
      }
      if (role === "admin" || role === "worker") {
        where.admin_hidden = false;
      }

      const reservations = await prisma.reservations.findMany({
        where,
        include: { rooms: true, users: true },
        orderBy: { id: "desc" },
      });

      console.log("📦 Found reservations:", reservations.length);

      // Ensure numeric totals for client-side calculations.
      const payload = reservations.map((r) => ({
        ...r,
        total_price: r.total_price ? Number(r.total_price) : 0,
      }));

      return NextResponse.json(payload);
    }

    if (roomType && startDate && endDate) {
      const rooms = await prisma.rooms.findMany({
        where: { type: roomType },
        include: {
          reservations: {
            where: {
              cancelled_at: null,
              admin_hidden: false,
            },
          },
        },
      });

      const availableRoom = rooms.find((room) => {
        if (room.status === "out_of_order") return;
        // Overlap rule: start < existing_end AND end > existing_start.
        const conflict = room.reservations.some((res) => {
          if (reservationId && res.id === reservationId) return false;
          if (res.cancelled_at) return false;
          return (
            new Date(startDate) < new Date(res.end_date) &&
            new Date(endDate) > new Date(res.start_date)
          );
        });
        return !conflict;
      });

      return NextResponse.json({ available: !!availableRoom });
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
