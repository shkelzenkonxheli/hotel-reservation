import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DASHBOARD_TABS } from "@/lib/dashboardTabs";

const ALL_TABS = DASHBOARD_TABS.map((t) => t.key);

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = Number(params.id);
  const body = await req.json();
  const tabs = Array.isArray(body.allowed_tabs) ? body.allowed_tabs : [];

  // sanitize: lejo vetëm tabs që ekzistojnë
  const sanitized = [...new Set(tabs)].filter((t) => ALL_TABS.includes(t));

  const updated = await prisma.users.update({
    where: { id: userId },
    data: { allowed_tabs: sanitized },
    select: { id: true, allowed_tabs: true },
  });

  return NextResponse.json(updated);
}
