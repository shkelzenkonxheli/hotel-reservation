import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/security";

// Handle PATCH requests for this route.
export async function PATCH(req) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const updated = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        avatar_url: body.avatar_url ?? undefined,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }
}
