import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { enrichRoomTypeWithSpecialRate } from "@/lib/specialRates";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const today = new Date().toISOString().slice(0, 10);
    const effectiveStartDate = startDate || today;
    const effectiveEndDate = endDate || effectiveStartDate;

    const rooms = await prisma.rooms.findMany({
      select: {
        type: true,
        price: true,
        included_guests: true,
        max_guests: true,
        extra_guest_price: true,
        name: true,
        description: true,
        amenities: true,
      },
    });

    const grouped = {};
    for (const room of rooms) {
      if (!grouped[room.type]) {
        grouped[room.type] = {
          id: room.type,
          type: room.type,
          price: room.price,
          included_guests: room.included_guests,
          max_guests: room.max_guests,
          extra_guest_price: room.extra_guest_price,
          name: room.name,
          description: room.description,
          amenities: room.amenities || [],
          images: [],
        };
      }
    }

    const images = await prisma.roomImage.findMany({
      orderBy: [{ isCover: "desc" }, { order: "asc" }, { id: "asc" }],
    });

    for (const img of images) {
      if (grouped[img.type]) {
        grouped[img.type].images.push(img.url);
      }
    }

    let payload = Object.values(grouped);

    payload = await Promise.all(
      payload.map((roomType) =>
        enrichRoomTypeWithSpecialRate(
          roomType,
          effectiveStartDate,
          effectiveEndDate,
        ),
      ),
    );

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching room types:", error);
    return NextResponse.json(
      { error: "Failed to fetch room types" },
      { status: 500 },
    );
  }
}
