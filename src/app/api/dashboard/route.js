import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function utcDateOnly(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export async function GET() {
  try {
    // ================= DATES (UTC DATE-ONLY) =================
    const today = utcDateOnly(); // 00:00 UTC
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    // ================= OVERALL STATS =================
    const totalUsers = await prisma.users.count();
    const totalReservation = await prisma.reservations.count();

    const totalEarningsResult = await prisma.reservations.aggregate({
      _sum: { total_price: true },
      // Nëse don me i numëru vetëm jo-cancelled, aktivizo:
      // where: { cancelled_at: null },
    });

    const totalEarnings = Number(totalEarningsResult._sum.total_price ?? 0);

    // ================= TODAY CHECK-INS (exclude cancelled) =================
    const todayCheckins = await prisma.reservations.count({
      where: {
        cancelled_at: null,
        start_date: { gte: today, lt: tomorrow },
      },
    });

    // ================= UPCOMING (exclude cancelled) =================
    const upcomingReservations = await prisma.reservations.count({
      where: {
        cancelled_at: null,
        start_date: { gte: tomorrow },
      },
    });

    // ================= REVENUE TODAY (exclude cancelled) =================
    // NOTE: Kjo llogarit revenue për rezervimet që FILLON sot.
    // Nëse don revenue vetëm për pagesa "confirmed", shto: status: "confirmed"
    const revenueTodayResult = await prisma.reservations.aggregate({
      _sum: { total_price: true },
      where: {
        cancelled_at: null,
        start_date: { gte: today, lt: tomorrow },
        // status: "confirmed",
      },
    });

    const revenueToday = Number(revenueTodayResult._sum.total_price ?? 0);

    // ================= OCCUPANCY (unique rooms, exclude cancelled) =================
    const totalRooms = await prisma.rooms.count();

    const occupiedReservations = await prisma.reservations.findMany({
      where: {
        cancelled_at: null,
        room_id: { not: null },
        start_date: { lte: today },
        end_date: { gt: today },
      },
      select: { room_id: true },
    });

    const occupiedRoomsToday = new Set(
      occupiedReservations.map((r) => r.room_id),
    ).size;

    const occupancyPercent =
      totalRooms > 0 ? Math.round((occupiedRoomsToday / totalRooms) * 100) : 0;

    // (opsionale) debug - hiqe kur të jesh ok
    // console.log({ today, tomorrow, totalUsers, totalReservation, todayCheckins, upcomingReservations, revenueToday, totalRooms, occupiedRoomsToday, occupancyPercent });

    // ================= RESPONSE =================
    return NextResponse.json({
      totalUsers,
      totalReservation,
      totalEarnings,
      todayCheckins,
      upcomingReservations,
      revenueToday,
      occupancyPercent,
    });
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
