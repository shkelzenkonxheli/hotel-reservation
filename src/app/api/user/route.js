import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Handle GET requests for this route.
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rolesParam = searchParams.get("roles");
    const roles = rolesParam ? rolesParam.split(",") : null;
    const where = roles ? { role: { in: roles } } : {};
    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        allowed_tabs: true,
        created_at: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// Handle PATCH requests for this route.
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, newRole } = await request.json();
    if (!userId || !newRole) {
      return NextResponse.json(
        {
          error: "Missing userId or newRole",
        },
        { status: 400 },
      );
    }

    // Coerce userId to number before updating.
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
// Handle POST requests for this route.
export async function POST(req) {
  const { name, email, password, role } = await req.json();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }
    // Hash the password with a cost factor of 10.
    const hashedPassrod = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassrod,
        role: role || "client",
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Mising Fields" }, { status: 400 });
  }
}
// Handle DELETE requests for this route.
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Admin users cannot be deleted" },
        { status: 403 },
      );
    }

    await prisma.users.delete({
      where: { id: Number(userId) },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
