import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Handle GET requests for this route.
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
// Handle DELETE requests for this route.
export async function DELETE(req) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }

    // Coerce incoming IDs to numbers before using the IN filter.
    await prisma.activity_logs.deleteMany({
      where: {
        id: { in: ids.map(Number) },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete logs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
