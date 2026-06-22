import { NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rateLimit";
import { requireSameOrigin } from "@/lib/security";
import { isValidEmail, toSafeString } from "@/lib/validators";
import { verifyTurnstileToken } from "@/lib/turnstile";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const rl = rateLimit(req, {
      scope: "contact-form",
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const { name, email, phone, message, captchaToken } = await req.json();

    const captchaCheck = await verifyTurnstileToken(req, captchaToken);
    if (!captchaCheck.ok) {
      return NextResponse.json(
        { message: captchaCheck.message },
        { status: 400 },
      );
    }

    if (!name || !email || !message || !isValidEmail(email)) {
      return NextResponse.json(
        { message: "Please fill in the required fields with valid details." },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { message: "Contact service is not configured." },
        { status: 500 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const recipient =
      process.env.CONTACT_TO_EMAIL ||
      process.env.RESERVATION_ADMIN_EMAIL ||
      "dijaripremium@gmail.com";

    const safeName = toSafeString(name, 120);
    const safeEmail = String(email).trim().toLowerCase();
    const safePhone = toSafeString(phone || "-", 60);
    const safeMessage = toSafeString(message, 4000);

    await resend.emails.send({
      from: "Dijari Premium <onboarding@dijaripremium.com>",
      to: recipient,
      replyTo: safeEmail,
      subject: `Contact request from ${safeName}`,
      html: `
        <h2>New contact request</h2>
        <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(safePhone)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(safeMessage).replace(/\n/g, "<br/>")}</p>
      `,
    });

    return NextResponse.json({
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { message: "Failed to send your message. Please try again." },
      { status: 500 },
    );
  }
}
