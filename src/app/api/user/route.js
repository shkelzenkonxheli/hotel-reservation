import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { requireSameOrigin } from "@/lib/security";
import { logActivity } from "../../../../lib/activityLogger";
import { isValidEmail, normalizeEmail, toSafeString } from "@/lib/validators";

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
        avatar_url: true,
        staff_position: true,
        employment_start_date: true,
        employment_status: true,
        salary_type: true,
        base_salary: true,
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
    const originError = requireSameOrigin(request);
    if (originError) return originError;

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

    await logActivity({
      action: "UPDATE",
      entity: "user",
      entity_id: Number(userId),
      description: `Changed user role to "${newRole}"`,
      performed_by: session.user.email || "system",
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Patch error", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
// Handle POST requests for this route.
export async function POST(req) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

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
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
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
        name: toSafeString(name, 120),
        email: normalizedEmail,
        password: hashedPassrod,
        role: role || "client",
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "user",
      entity_id: user.id,
      description: `Created user "${user.email}" with role "${user.role}"`,
      performed_by: session.user.email || "system",
    });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Mising Fields" }, { status: 400 });
  }
}
// Handle DELETE requests for this route.
export async function DELETE(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

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

    await logActivity({
      action: "DELETE",
      entity: "user",
      entity_id: Number(userId),
      description: `Deleted user "${user.email}"`,
      performed_by: session.user.email || "system",
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
