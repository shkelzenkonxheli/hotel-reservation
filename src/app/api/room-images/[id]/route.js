import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { requireSameOrigin } from "@/lib/security";
import { logActivity } from "../../../../../lib/activityLogger";

export const runtime = "nodejs";

// Handle DELETE requests for this route.
export async function DELETE(req, { params }) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const { session, error } = await requireRole(["admin", "worker"]);
    if (error) return error;

    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const image = await prisma.roomImage.findUnique({
      where: { id },
      select: { id: true, type: true },
    });
    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.roomImage.delete({ where: { id } });

    await logActivity({
      action: "DELETE",
      entity: "room_image",
      entity_id: id,
      description: `Deleted image for room type "${image.type}"`,
      performed_by: session.user.email || "system",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/room-images/:id error:", err);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
