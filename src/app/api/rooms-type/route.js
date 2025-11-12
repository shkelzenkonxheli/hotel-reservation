import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rooms = await prisma.rooms.findMany({
      where: {
        images: {
          isEmpty: false,
        },
      },
    });

    const grouped = {};
    for (const room of rooms) {
      if (!grouped[room.type]) {
        grouped[room.type] = {
          type: room.type,
          price: room.price,
          name: room.name,
          description: room.description,
          images: room.images,
        };
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
