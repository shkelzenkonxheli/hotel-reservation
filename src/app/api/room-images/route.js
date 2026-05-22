import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { requireSameOrigin } from "@/lib/security";
import { logActivity } from "../../../../lib/activityLogger";

export const runtime = "nodejs";

export async function PATCH(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const { session, error } = await requireRole(["admin", "worker"]);
    if (error) return error;

    const body = await req.json();
    const type = String(body?.type || "").trim();
    const orderedIds = Array.isArray(body?.orderedIds)
      ? body.orderedIds.map(Number).filter(Boolean)
      : [];

    if (!type || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "Missing type or ordered ids" },
        { status: 400 },
      );
    }

    const existing = await prisma.roomImage.findMany({
      where: { type },
      select: { id: true },
      orderBy: [{ isCover: "desc" }, { order: "asc" }, { id: "asc" }],
    });

    if (existing.length !== orderedIds.length) {
      return NextResponse.json(
        { error: "The provided image list is incomplete" },
        { status: 400 },
      );
    }

    const existingIds = new Set(existing.map((img) => img.id));
    const invalidId = orderedIds.find((id) => !existingIds.has(id));
    if (invalidId) {
      return NextResponse.json(
        { error: "The provided image list contains invalid items" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.roomImage.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    await logActivity({
      action: "UPDATE",
      entity: "room_image",
      entity_id: orderedIds[0],
      description: `Reordered images for room type "${type}"`,
      performed_by: session.user.email || "system",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/room-images error:", err);
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 },
    );
  }
}

// Handle POST requests for this route.
export async function POST(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const { session, error } = await requireRole(["admin", "worker"]);
    if (error) return error;

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

    // Append the new image after the current max order.
    const nextOrder = (last?.order ?? -1) + 1;

    // nëse s’ka asnjë foto për këtë type, kjo bëhet cover
    // First image for a type becomes the cover by default.
    const count = await prisma.roomImage.count({ where: { type } });

    const created = await prisma.roomImage.create({
      data: {
        type,
        url,
        order: nextOrder,
        isCover: count === 0,
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "room_image",
      entity_id: created.id,
      description: `Added image for room type "${type}"`,
      performed_by: session.user.email || "system",
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
// Handle GET requests for this route.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const images = await prisma.roomImage.findMany({
      where: type ? { type } : undefined,
      orderBy: [
        { type: "asc" },
        { isCover: "desc" },
        { order: "asc" },
        { id: "asc" },
      ],
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
