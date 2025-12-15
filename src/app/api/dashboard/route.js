import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // ================= DATES =================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const start_date = new Date();
    start_date.setHours(0, 0, 0, 0);

    // ================= OVERALL STATS =================
    const totalUsers = await prisma.users.count();
    const totalReservation = await prisma.reservations.count();

    const totalEarningsResult = await prisma.reservations.aggregate({
      _sum: { total_price: true },
    });

    const totalEarnings = Number(totalEarningsResult._sum.total_price ?? 0);

    // ================= TODAY CHECK-INS =================
    const todayCheckins = await prisma.reservations.count({
      where: {
        start_date: today,
      },
    });

    // ================= UPCOMING =================
    const upcomingReservations = await prisma.reservations.count({
      where: {
        start_date: {
          gte: tomorrow,
        },
      },
    });

    // ================= REVENUE TODAY =================
    const revenueTodayResult = await prisma.reservations.aggregate({
      _sum: { total_price: true },
      where: {
        start_date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const revenueToday = Number(revenueTodayResult._sum.total_price ?? 0);

    // ================= OCCUPANCY =================
    const totalRooms = await prisma.rooms.count();

    const occupiedRoomsToday = await prisma.reservations.count({
      where: {
        start_date: { lte: today },
        end_date: { gt: today },
      },
    });

    const occupancyPercent =
      totalRooms > 0 ? Math.round((occupiedRoomsToday / totalRooms) * 100) : 0;

    // ================= RESPONSE =================
    return NextResponse.json({
      // existing (do NOT break frontend)
      totalUsers,
      totalReservation,
      totalEarnings,

      // new
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
