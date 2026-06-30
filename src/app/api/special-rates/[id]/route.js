import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { requireSameOrigin } from "@/lib/security";
import { logActivity } from "../../../../../lib/activityLogger";

function parseDateOnlyToUTC(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function parsePromoPrice(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session?.user || (role !== "admin" && role !== "worker")) {
    return { session, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { session, error: null };
}

async function getBaseRoomPrice(roomType) {
  const room = await prisma.rooms.findFirst({
    where: { type: roomType },
    orderBy: { id: "asc" },
    select: { price: true },
  });

  return room ? Number(room.price) : null;
}

async function findOverlappingActiveRate({
  roomType,
  startDate,
  endDate,
  excludeId,
}) {
  return prisma.special_rates.findFirst({
    where: {
      room_type: roomType,
      active: true,
      NOT: { id: excludeId },
      AND: [
        { start_date: { lte: endDate } },
        { end_date: { gte: startDate } },
      ],
    },
    select: { id: true },
  });
}

export async function PATCH(request, context) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    const { session, error } = await requireStaff();
    if (error) return error;

    const { id } = await context.params;
    const rateId = Number(id);
    if (!Number.isFinite(rateId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.special_rates.findUnique({
      where: { id: rateId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Special rate not found" }, { status: 404 });
    }

    const body = await request.json();
    const roomType = String(body.room_type || "").trim();
    const label = String(body.label || "").trim();
    const promoPrice = parsePromoPrice(body.promo_price);
    const active = body.active !== false;

    if (!roomType || !label || !body.start_date || !body.end_date || promoPrice === null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const startDate = parseDateOnlyToUTC(body.start_date);
    const endDate = parseDateOnlyToUTC(body.end_date);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be after or equal to start date" },
        { status: 400 },
      );
    }

    const basePrice = await getBaseRoomPrice(roomType);
    if (basePrice === null) {
      return NextResponse.json(
        { error: "Selected room type does not exist" },
        { status: 400 },
      );
    }

    if (promoPrice >= basePrice) {
      return NextResponse.json(
        { error: "Promo price must be lower than the standard room price" },
        { status: 400 },
      );
    }

    if (active) {
      const overlappingRate = await findOverlappingActiveRate({
        roomType,
        startDate,
        endDate,
        excludeId: rateId,
      });

      if (overlappingRate) {
        return NextResponse.json(
          { error: "Another active special rate already overlaps this period" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.special_rates.update({
      where: { id: rateId },
      data: {
        room_type: roomType,
        label,
        start_date: startDate,
        end_date: endDate,
        promo_price: promoPrice,
        active,
      },
    });

    await logActivity({
      action: "UPDATE",
      entity: "special_rate",
      entity_id: updated.id,
      description: `Updated special rate "${updated.label}"`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json({
      ...updated,
      promo_price: Number(updated.promo_price),
      base_price: basePrice,
    });
  } catch (error) {
    console.error("PATCH /special-rates/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update special rate" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, context) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    const { session, error } = await requireStaff();
    if (error) return error;

    const { id } = await context.params;
    const rateId = Number(id);
    if (!Number.isFinite(rateId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.special_rates.findUnique({
      where: { id: rateId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Special rate not found" }, { status: 404 });
    }

    await prisma.special_rates.delete({
      where: { id: rateId },
    });

    await logActivity({
      action: "DELETE",
      entity: "special_rate",
      entity_id: rateId,
      description: `Deleted special rate "${existing.label}"`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /special-rates/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete special rate" },
      { status: 500 },
    );
  }
}
