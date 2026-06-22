import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { rateLimit } from "@/lib/rateLimit";
import { requireSameOrigin } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { isValidEmail, normalizeEmail } from "@/lib/validators";
import {
  passwordResetSubject,
  passwordResetTemplate,
} from "@/lib/email/passwordResetTemplate";

function normalizeLocale(locale) {
  return String(locale || "").toLowerCase().startsWith("en") ? "en" : "sq";
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

const GENERIC_MESSAGE =
  "If an account with that email exists, a reset link has been sent.";

export async function POST(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const rl = rateLimit(req, {
      scope: "auth-forgot-password",
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const { email, locale, captchaToken } = await req.json();

    const captchaCheck = await verifyTurnstileToken(req, captchaToken);
    if (!captchaCheck.ok) {
      return NextResponse.json(
        { message: captchaCheck.message },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: expiresAt,
      },
    });

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resetUrl = `${getBaseUrl()}/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: "Dijari Premium <onboarding@dijaripremium.com>",
        to: user.email,
        subject: passwordResetSubject(locale),
        html: passwordResetTemplate({
          locale: normalizeLocale(locale),
          name: user.name,
          resetUrl,
        }),
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Failed to process password reset request." },
      { status: 500 },
    );
  }
}
