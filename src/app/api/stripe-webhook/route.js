import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import { reservationConfirmationTemplate } from "@/lib/email/reservationConfirmationTemplate";
import { adminReservationTemplate } from "@/lib/email/adminReservationTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const adminEmail = "shkonxheli@gmail.com";

// Convert YYYY-MM-DD to a UTC midnight Date for day-precision comparisons.
function parseDateOnlyToUTC(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isOverlapError(error) {
  return (
    error?.code === "23P01" ||
    error?.message?.includes("violates exclusion constraint") ||
    error?.meta?.cause?.includes?.("exclusion constraint")
  );
}

export const config = {
  api: { bodyParser: false },
};

// Handle POST requests for this route.
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

    // Safety: ensure actually paid.
    if (session.payment_status !== "paid") {
      console.log(
        "Session completed but not paid:",
        session.id,
        session.payment_status,
      );
      return NextResponse.json({ received: true });
    }

    // Idempotency: do not create twice.
    const already = await prisma.reservations.findFirst({
      where: { stripe_session_id: session.id },
      select: { id: true },
    });

    if (already) {
      console.log(
        "Webhook replay detected, reservation already exists:",
        already.id,
      );
      return NextResponse.json({ received: true });
    }

    console.log("Payment confirmed for:", session.customer_email);

    const user = await prisma.users.findUnique({
      where: { email: session.customer_email },
    });

    if (!user) {
      console.warn("User not found:", session.customer_email);
      return NextResponse.json({ message: "User not found" }, { status: 200 });
    }

    const rooms = await prisma.rooms.findMany({
      where: { type: meta.type },
      include: { reservations: true },
    });

    const start = parseDateOnlyToUTC(meta.startDate);
    const end = parseDateOnlyToUTC(meta.endDate);

    const availableRoom = rooms.find((room) => {
      if (room.status === "out_of_order") return false;

      const conflict = room.reservations.some((reservation) => {
        if (reservation.cancelled_at) return false;
        if (reservation.admin_hidden) return false;

        const rStart = parseDateOnlyToUTC(
          reservation.start_date.toISOString().slice(0, 10),
        );
        const rEnd = parseDateOnlyToUTC(
          reservation.end_date.toISOString().slice(0, 10),
        );

        return start < rEnd && end > rStart;
      });

      return !conflict;
    });

    if (!availableRoom) {
      console.error("No available rooms for:", meta.type);
      return NextResponse.json({ message: "No available room found" });
    }

    const totalPrice = Number(meta.totalPrice || 0);

    let created;
    try {
      created = await prisma.reservations.create({
        data: {
          room_id: availableRoom.id,
          reservation_code: "RES-" + nanoid(6).toUpperCase(),
          user_id: user.id,
          start_date: start,
          end_date: end,
          status: "confirmed",
          full_name: meta.fullname,
          phone: meta.phone,
          address: meta.address,
          guests: parseInt(meta.guests, 10),
          total_price: totalPrice,
          payment_method: "card",
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent ?? null,
          payment_status: "PAID",
          amount_paid: totalPrice,
          paid_at: new Date(),
        },
      });
    } catch (error) {
      if (isOverlapError(error)) {
        console.error("Overlap prevented by DB constraint");
        return NextResponse.json({ message: "No available room found" });
      }
      throw error;
    }

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
      from: "Hotel Reservation <onboarding@dijaripremium.com>",
      to: session.customer_email,
      subject: "Your Reservation is Confirmed!",
      html: reservationConfirmationTemplate({
        fullname: meta.fullname,
        roomName: availableRoom.name,
        startDate: meta.startDate,
        endDate: meta.endDate,
        totalPrice: meta.totalPrice,
        reservationCode: created.reservation_code,
      }),
    });

    await resend.emails.send({
      from: "Hotel System <onboarding@dijaripremium.com>",
      to: adminEmail,
      subject: "New Reservation Received",
      html: adminReservationTemplate({
        fullname: meta.fullname,
        phone: meta.phone,
        roomType: meta.type,
        roomName: availableRoom.name,
        startDate: meta.startDate,
        endDate: meta.endDate,
        totalPrice: meta.totalPrice,
        sessionId: session.id,
      }),
    });

    console.log(
      `Reservation confirmed (#${created.id}) for ${user.email} in room #${availableRoom.id}`,
    );

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
