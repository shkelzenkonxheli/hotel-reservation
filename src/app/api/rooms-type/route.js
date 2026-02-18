import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Handle GET requests for this route.
export async function GET() {
  try {
    // 1. Merr rooms (vetëm për info bazë)
    const rooms = await prisma.rooms.findMany({
      select: {
        type: true,
        price: true,
        name: true,
        description: true,
        amenities: true,
      },
    });

    // 2. Build a map of unique room types.
    const grouped = {};
    for (const room of rooms) {
      if (!grouped[room.type]) {
        grouped[room.type] = {
          id: room.type,
          type: room.type,
          price: room.price,
          name: room.name,
          description: room.description,
          amenities: room.amenities || [],
          images: [], // do mbushet më poshtë
        };
      }
    }

    // 3. Merr fotot nga RoomImage
    const images = await prisma.roomImage.findMany({
      orderBy: { order: "asc" },
    });

    // 4. Attach image URLs to their matching room type.
    for (const img of images) {
      if (grouped[img.type]) {
        grouped[img.type].images.push(img.url);
      }
    }

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("Error fetching room types:", error);
    return NextResponse.json(
      { error: "Failed to fetch room types" },
      { status: 500 }
    );
  }
}
