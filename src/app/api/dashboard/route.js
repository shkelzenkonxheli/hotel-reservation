import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalUsers = await prisma.users.count();
    const totalReservation = await prisma.reservations.count();

    const totalEarningsResults = await prisma.reservations.aggregate({
      _sum: { total_price: true },
    });
    const totalEarnings = Number(totalEarningsResults._sum.total_price ?? 0);

    return NextResponse.json({
      totalUsers,
      totalReservation,
      totalEarnings,
    });
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
