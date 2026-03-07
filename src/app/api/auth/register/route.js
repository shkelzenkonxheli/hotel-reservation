import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import crypto from "crypto";
import { rateLimit } from "@/lib/rateLimit";
import { requireSameOrigin } from "@/lib/security";
import {
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
  toSafeString,
} from "@/lib/validators";

// Handle POST requests for this route.
export async function POST(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const rl = rateLimit(req, {
      scope: "auth-register",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 },
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 8 characters and include one uppercase letter and one number.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const safeName = toSafeString(name, 120);

    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });
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
        name: safeName,
        email: normalizedEmail,
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
      to: normalizedEmail,
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
