import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PATCH(request) {
  try {
    const { userId, newRole } = await request.json();
    if (!userId || !newRole) {
      return NextResponse.json(
        {
          error: "Missing userId or newRole",
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.users.update({
      where: { id: Number(userId) },
      data: { role: newRole },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Patch error", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
