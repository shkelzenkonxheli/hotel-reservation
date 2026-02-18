import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "../../../../../lib/activityLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

function normalizeAmenities(input) {
  if (!Array.isArray(input)) return [];
  const clean = input
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return [...new Set(clean)];
}
// Handle PATCH requests for this route.
export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    // Parse route param to a numeric ID.
    const roomId = parseInt(id);
    const {
      name,
      room_number,
      type,
      price,
      description,
      status,
      amenities,
      apply_to_type,
    } =
      await request.json();
    const session = await getServerSession(authOptions);

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
    const updatedRoom = await prisma.rooms.update({
      where: { id: roomId },
      data: {
        name,
        room_number,
        type,
        // Coerce price to a number for storage.
        price: parseFloat(price),
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
    const { id } = await params;
    const session = await getServerSession(authOptions);

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
