import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const logs = await prisma.activity_logs.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("❌ Activity log GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
