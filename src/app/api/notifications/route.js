import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Handle GET requests for this route.
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role === "client") {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("count") === "true";

  if (countOnly) {
    const unreadCount = await prisma.notifications.count({
      where: { is_read: false },
    });
    return NextResponse.json({ unreadCount });
  }

  const notifications = await prisma.notifications.findMany({
    orderBy: { created_at: "desc" },
    take: 20,
  });

  return NextResponse.json(notifications);
}
// Handle PATCH requests for this route.
export async function PATCH() {
  await prisma.notifications.updateMany({
    where: { is_read: false },
    data: { is_read: true },
  });

  return NextResponse.json({ success: true });
}
