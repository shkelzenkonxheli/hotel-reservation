import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/route";
import { requireSameOrigin } from "@/lib/security";
import { logActivity } from "../../../../lib/activityLogger";

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
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      AND: [
        { start_date: { lte: endDate } },
        { end_date: { gte: startDate } },
      ],
    },
    select: {
      id: true,
      label: true,
      start_date: true,
      end_date: true,
    },
  });
}

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;

    const rates = await prisma.special_rates.findMany({
      orderBy: [{ active: "desc" }, { start_date: "asc" }, { created_at: "desc" }],
    });

    const roomTypes = [...new Set(rates.map((rate) => rate.room_type))];
    const baseRooms = roomTypes.length
      ? await prisma.rooms.findMany({
          where: { type: { in: roomTypes } },
          select: { type: true, price: true },
          distinct: ["type"],
        })
      : [];

    const basePriceMap = new Map(
      baseRooms.map((room) => [room.type, Number(room.price)]),
    );

    return NextResponse.json(
      rates.map((rate) => ({
        ...rate,
        promo_price: Number(rate.promo_price),
        base_price: basePriceMap.get(rate.room_type) ?? null,
      })),
    );
  } catch (error) {
    console.error("GET /special-rates error:", error);
    return NextResponse.json(
      { error: "Failed to load special rates" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    const { session, error } = await requireStaff();
    if (error) return error;

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
      });

      if (overlappingRate) {
        return NextResponse.json(
          { error: "Another active special rate already overlaps this period" },
          { status: 400 },
        );
      }
    }

    const created = await prisma.special_rates.create({
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
      action: "CREATE",
      entity: "special_rate",
      entity_id: created.id,
      description: `Created special rate "${label}" for ${roomType}`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json(
      { ...created, promo_price: Number(created.promo_price), base_price: basePrice },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /special-rates error:", error);
    return NextResponse.json(
      { error: "Failed to create special rate" },
      { status: 500 },
    );
  }
}
