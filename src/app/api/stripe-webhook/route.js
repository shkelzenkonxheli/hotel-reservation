import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};
export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata;

      console.log("✅ Payment confirmed for:", session.customer_email);

      const user = await prisma.users.findUnique({
        where: { email: session.customer_email },
      });

      if (!user) {
        console.warn("⚠️ User not found:", session.customer_email);
        return NextResponse.json({ message: "User not found" });
      }

      const rooms = await prisma.rooms.findMany({
        where: { type: meta.type },
        include: { reservations: true },
      });

      const availableRoom = rooms.find((room) => {
        const conflict = room.reservations.some((reservation) => {
          return (
            new Date(meta.startDate) < new Date(reservation.end_date) &&
            new Date(meta.endDate) > new Date(reservation.start_date)
          );
        });
        return !conflict;
      });

      if (!availableRoom) {
        console.error("❌ No available rooms for:", meta.type);
        return NextResponse.json({ message: "No available room found" });
      }

      await prisma.reservations.create({
        data: {
          room_id: availableRoom.id,
          user_id: user.id,
          start_date: new Date(meta.startDate),
          end_date: new Date(meta.endDate),
          status: "confirmed",
          full_name: meta.fullname,
          phone: meta.phone,
          address: meta.address,
          guests: parseInt(meta.guests),
          total_price: parseFloat(meta.totalPrice),
        },
      });
      await prisma.rooms.update({
        where: { id: availableRoom.id },
        data: { status: "booked" },
      });

      console.log(
        `🏨 Reservation confirmed for ${user.email} in room #${availableRoom.id}`
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
