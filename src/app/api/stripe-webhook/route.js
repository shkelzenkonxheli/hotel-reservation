import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { Resend } from "resend";
import { nanoid } from "nanoid";

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const adminEmail = "shkonxheli@gmail.com";

export const config = {
  api: { bodyParser: false },
};

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object;
    const meta = session.metadata;

    // ✅ safety: ensure actually paid
    if (session.payment_status !== "paid") {
      console.log(
        "ℹ️ Session completed but not paid:",
        session.id,
        session.payment_status,
      );
      return NextResponse.json({ received: true });
    }

    // ✅ idempotency: do not create twice
    const already = await prisma.reservations.findFirst({
      where: { stripe_session_id: session.id },
      select: { id: true },
    });

    if (already) {
      console.log(
        "↩️ Webhook replay detected, reservation already exists:",
        already.id,
      );
      return NextResponse.json({ received: true });
    }

    console.log("✅ Payment confirmed for:", session.customer_email);

    const user = await prisma.users.findUnique({
      where: { email: session.customer_email },
    });

    if (!user) {
      console.warn("⚠️ User not found:", session.customer_email);
      return NextResponse.json({ message: "User not found" }, { status: 200 });
    }

    // Load candidate rooms
    const rooms = await prisma.rooms.findMany({
      where: { type: meta.type },
      include: { reservations: true },
    });

    // Find one available room

    const availableRoom = rooms.find((room) => {
      if (room.status === "out_of_order") return;
      const conflict = room.reservations.some((reservation) => {
        if (reservation.cancelled_at) return false;
        if (reservation.admin_hidden) return false;

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

    const totalPrice = Number(meta.totalPrice || 0);

    // ✅ create reservation with payment fields
    const created = await prisma.reservations.create({
      data: {
        room_id: availableRoom.id,
        reservation_code: "RES-" + nanoid(6).toUpperCase(),
        user_id: user.id,
        start_date: new Date(meta.startDate),
        end_date: new Date(meta.endDate),

        status: "confirmed",

        full_name: meta.fullname,
        phone: meta.phone,
        address: meta.address,
        guests: parseInt(meta.guests, 10),

        total_price: totalPrice,

        // payment tracking
        payment_method: "card",
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent ?? null,
        payment_status: "PAID",
        amount_paid: totalPrice,
        paid_at: new Date(),
        // invoice_number: `INV-${new Date().getFullYear()}-${String(session.id).slice(-8).toUpperCase()}`, // opsionale
      },
    });
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(created.id).padStart(6, "0")}`;

    await prisma.reservations.update({
      where: { id: created.id },
      data: {
        invoice_number: invoiceNumber,
      },
    });

    await prisma.notifications.create({
      data: {
        type: "reservation_created",
        title: "New reservation",
        message: `New reservation created for ${meta.fullname || "guest"}.`,
        reservation_id: created.id,
        user_id: user.id ?? null,
        is_read: false,
      },
    });
    await resend.emails.send({
      from: "Hotel Reservation <onboarding@resend.dev>",
      to: session.customer_email,
      subject: "Your Reservation is Confirmed!",
      html: `
        <h2>Hello ${meta.fullname},</h2>
        <p>Your reservation has been successfully confirmed.</p>

        <h3>Reservation Details</h3>
        <p><strong>Room:</strong> ${availableRoom.name}</p>
        <p><strong>Check-in:</strong> ${meta.startDate}</p>
        <p><strong>Check-out:</strong> ${meta.endDate}</p>
        <p><strong>Total Price:</strong> €${meta.totalPrice}</p>

        <p><strong>Reservation code:</strong> ${created.reservation_code}</p>

        <br/>
        <p>Thank you for choosing our hotel!</p>
      `,
    });

    await resend.emails.send({
      from: "Hotel System <onboarding@resend.dev>",
      to: adminEmail,
      subject: "📩 New Reservation Received",
      html: `
        <h2>New Reservation Created</h2>
        <p><strong>Client:</strong> ${meta.fullname}</p>
        <p><strong>Phone:</strong> ${meta.phone}</p>
        <p><strong>Room Type:</strong> ${meta.type}</p>
        <p><strong>Assigned Room:</strong> ${availableRoom.name}</p>
        <p><strong>Dates:</strong> ${meta.startDate} → ${meta.endDate}</p>
        <p><strong>Total:</strong> €${meta.totalPrice}</p>
        <p><strong>Stripe session:</strong> ${session.id}</p>
      `,
    });

    console.log(
      `🏨 Reservation confirmed (#${created.id}) for ${user.email} in room #${availableRoom.id}`,
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
