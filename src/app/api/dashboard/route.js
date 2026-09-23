import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

function utcDateOnly(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Handle GET requests for this route.
export async function GET() {
  try {
    const { error } = await requireRole(["admin", "worker"]);
    if (error) return error;

    // ================= DATES (UTC DATE-ONLY) =================
    const today = utcDateOnly(); // 00:00 UTC
    // Compute the next day boundary for "today" range queries.
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    // ================= OVERALL STATS =================
    const totalUsers = await prisma.users.count();
    const totalReservation = await prisma.reservations.count();

    const totalEarningsResult = await prisma.reservations.aggregate({
      _sum: { total_price: true },
    });

    // Normalize aggregate result to a number (Prisma can return null).
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
    const revenueTodayResult = await prisma.reservations.aggregate({
      _sum: { total_price: true },
      where: {
        cancelled_at: null,
        start_date: { gte: today, lt: tomorrow },
      },
    });

    // Sum of today's reservation totals (converted to a plain number).
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

    // Deduplicate room IDs to get unique occupied rooms.
    const occupiedRoomsToday = new Set(
      occupiedReservations.map((r) => r.room_id),
    ).size;

    // Occupancy = occupied rooms / total rooms (rounded percentage).
    const occupancyPercent =
      totalRooms > 0 ? Math.round((occupiedRoomsToday / totalRooms) * 100) : 0;

    // ================= ANALYTICS: LAST 6 MONTHS (READ-ONLY) =================
    // Buckets for the last 6 months (oldest first), current month included.
    const monthBuckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1),
      );
      monthBuckets.push({
        key: monthKey(d),
        revenue: 0,
        bookings: 0,
      });
    }
    const bucketIndex = Object.fromEntries(
      monthBuckets.map((m, i) => [m.key, i]),
    );

    // Single lightweight read: only the fields needed for aggregation.
    const recentReservations = await prisma.reservations.findMany({
      where: { start_date: { gte: new Date(monthBuckets[0].key + "-01T00:00:00.000Z") } },
      select: {
        start_date: true,
        total_price: true,
        cancelled_at: true,
      },
    });

    for (const r of recentReservations) {
      if (r.cancelled_at) continue; // cancelled never counts
      const idx = bucketIndex[monthKey(r.start_date)];
      if (idx === undefined) continue;
      monthBuckets[idx].bookings += 1;
      monthBuckets[idx].revenue += Number(r.total_price ?? 0);
    }

    // ================= ANALYTICS: STATUS BREAKDOWN (ALL TIME) =================
    const statusGroup = await prisma.reservations.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const statusBreakdown = statusGroup
      .map((g) => ({ status: g.status || "pending", count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    // ================= RESPONSE =================
    return NextResponse.json({
      totalUsers,
      totalReservation,
      totalEarnings,
      todayCheckins,
      upcomingReservations,
      revenueToday,
      occupancyPercent,
      monthly: monthBuckets,
      statusBreakdown,
    });
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
