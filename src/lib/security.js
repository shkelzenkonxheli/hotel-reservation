import { NextResponse } from "next/server";

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(req) {
  const set = new Set();

  const envOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ];
  for (const origin of envOrigins) {
    const normalized = normalizeOrigin(origin);
    if (normalized) set.add(normalized);
  }

  const host = req.headers.get("host");
  if (host) {
    set.add(`https://${host}`);
    set.add(`http://${host}`);
  }

  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    set.add(`https://${vercel}`);
  }

  return set;
}

// Lightweight CSRF protection for mutating API routes.
// If Origin exists and does not match known app origins, reject request.
export function requireSameOrigin(req) {
  const origin = normalizeOrigin(req.headers.get("origin"));
  if (!origin) return null;

  const allowedOrigins = getAllowedOrigins(req);
  if (allowedOrigins.has(origin)) return null;

  return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
}
