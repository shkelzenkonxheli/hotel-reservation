import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import crypto from "crypto";

// Handle POST requests for this route.
export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 },
      );
    }

    // Hash the password with a cost factor of 10.
    const hashedPassword = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "client",
        email_verified: false,
        email_verification_token: verifyToken,
        email_verification_expires: expiresAt,
        created_at: new Date(),
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verifyToken}`;

    await resend.emails.send({
      from: "Dijari Premium <onboarding@resend.dev>",
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Please verify your email to activate your account.</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return NextResponse.json({
      message: "Registration successful. Please verify your email.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
