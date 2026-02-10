import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=0", req.url));
  }

  const user = await prisma.users.findFirst({
    where: {
      email_verification_token: token,
      email_verification_expires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login?verified=0", req.url));
  }

  await prisma.users.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null,
    },
  });

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
