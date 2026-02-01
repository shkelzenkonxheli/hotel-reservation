import { NextResponse } from "next/server";

// Handle POST requests for this route.
export async function POST() {
  const res = NextResponse.json({ message: "Logged out successfully" });
  res.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
