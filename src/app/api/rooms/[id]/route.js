import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "../../../../../lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { requireSameOrigin } from "@/lib/security";

function normalizeAmenities(input) {
  if (!Array.isArray(input)) return [];
  const clean = input
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return [...new Set(clean)];
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeDecimal(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
// Handle PATCH requests for this route.
export async function PATCH(request, context) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;

    const { id } = await context.params;
    // Parse route param to a numeric ID.
    const roomId = parseInt(id);
    const {
      name,
      room_number,
      type,
      price,
      included_guests,
      max_guests,
      extra_guest_price,
      description,
      status,
      amenities,
      apply_to_type,
    } =
      await request.json();
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "worker")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingRoom = await prisma.rooms.findFirst({
      where: {
        room_number,
        type,
        NOT: { id: roomId },
      },
    });
    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists." },
        { status: 400 }
      );
    }
    const normalizedIncludedGuests = parsePositiveInt(included_guests, 2);
    const normalizedMaxGuests = parsePositiveInt(
      max_guests,
      normalizedIncludedGuests,
    );
    const normalizedExtraGuestPrice = parseNonNegativeDecimal(
      extra_guest_price,
      0,
    );

    if (normalizedMaxGuests < normalizedIncludedGuests) {
      return NextResponse.json(
        { error: "Max guests must be greater than or equal to included guests." },
        { status: 400 },
      );
    }

    const updatedRoom = await prisma.rooms.update({
      where: { id: roomId },
      data: {
        name,
        room_number,
        type,
        // Coerce price to a number for storage.
        price: parseFloat(price),
        included_guests: normalizedIncludedGuests,
        max_guests: normalizedMaxGuests,
        extra_guest_price: normalizedExtraGuestPrice,
        description,
        amenities: normalizeAmenities(amenities),
        status: status || undefined,
      },
    });

    let bulkUpdated = 0;
    if (apply_to_type) {
      const result = await prisma.rooms.updateMany({
        where: {
          type: updatedRoom.type,
          NOT: { id: roomId },
        },
        data: {
          name,
          price: parseFloat(price),
          included_guests: normalizedIncludedGuests,
          max_guests: normalizedMaxGuests,
          extra_guest_price: normalizedExtraGuestPrice,
          description,
          amenities: normalizeAmenities(amenities),
        },
      });
      bulkUpdated = result.count || 0;
    }

    await logActivity({
      action: "UPDATE",
      entity: "room",
      entity_id: updatedRoom.id,
      description: `Updated room #${updatedRoom.room_number}`,
      performed_by: session.user.email,
    });

    return NextResponse.json({
      ...updatedRoom,
      bulk_updated: bulkUpdated,
      message: apply_to_type
        ? `Updated this room and ${bulkUpdated} more room(s) of type "${updatedRoom.type}".`
        : "Room updated successfully.",
    });
  } catch (error) {
    console.error("PATCH /rooms error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handle DELETE requests for this route.
export async function DELETE(req, { params }) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "worker")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }
    const room = await prisma.rooms.findUnique({
      where: {
        id: Number(id),
      },
    });

    await prisma.rooms.delete({
      where: {
        id: Number(id),
      },
    });
    await logActivity({
      action: "DELETE",
      entity: "room",
      entity_id: room.id,
      description: `Deleted room "${room.type}" (Room #${room.room_number})`,
      performed_by: session?.user?.email || "system",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /rooms/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
