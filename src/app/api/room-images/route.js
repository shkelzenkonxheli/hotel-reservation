import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, url } = body;

    if (!type || !url) {
      return NextResponse.json(
        { error: "Missing type or url" },
        { status: 400 },
      );
    }

    // gjej order e radhës për këtë type
    const last = await prisma.roomImage.findFirst({
      where: { type },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (last?.order ?? -1) + 1;

    // nëse s’ka asnjë foto për këtë type, kjo bëhet cover
    const count = await prisma.roomImage.count({ where: { type } });

    const created = await prisma.roomImage.create({
      data: {
        type,
        url,
        order: nextOrder,
        isCover: count === 0,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error("POST /api/room-images error:", err);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 },
    );
  }
}
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const images = await prisma.roomImage.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: "asc" }, { order: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(images);
  } catch (err) {
    console.error("GET /api/room-images error:", err);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}
