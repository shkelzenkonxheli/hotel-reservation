import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { rateLimit } from "@/lib/rateLimit";
import { requireSameOrigin } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req) {
  try {
    const GENERIC_MESSAGE = "If an account with that email exists, a verification link has been sent.";

    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const rl = rateLimit(req, {
      scope: "auth-resend-verification",
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const { email, captchaToken } = await req.json();

    const captchaCheck = await verifyTurnstileToken(req, captchaToken);
    if (!captchaCheck.ok) {
      return NextResponse.json(
        { error: captchaCheck.message },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    if (user.email_verified) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const verifyToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        email_verification_token: verifyToken,
        email_verification_expires: expiresAt,
      },
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verifyToken}`;

    await resend.emails.send({
      from: "Hotel Reservation <onboarding@dijaripremium.com>",
      to: normalizedEmail,
      subject: "Verify your email",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email.</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "Failed to resend verification email." },
      { status: 500 },
    );
  }
}
