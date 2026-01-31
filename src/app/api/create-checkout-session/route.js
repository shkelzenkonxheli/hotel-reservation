import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const {
      totalPrice,
      roomName,
      userEmail,
      type,
      startDate,
      endDate,
      fullname,
      phone,
      address,
      guests,
      roomId,
    } = await req.json();

    // ✅ Minimum sanity checks (mos i lër të zbrazëta)
    if (!userEmail || !startDate || !endDate || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ⚠️ Ideal: calculate totalPrice on server.
    const unitAmount = Math.round(Number(totalPrice) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid totalPrice" },
        { status: 400 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail,
      client_reference_id: String(roomId ?? userEmail),

      metadata: {
        roomId: String(roomId ?? ""),
        type,
        startDate,
        endDate,
        fullname: fullname ?? "",
        phone: phone ?? "",
        address: address ?? "",
        guests: String(guests ?? ""),
        // ❌ mos vendos reservation_code këtu
        // ❌ mos u mbështet te totalPrice nga klienti (për moment po e lëmë vetëm për email UX)
        totalPrice: String(totalPrice ?? ""),
        roomName: roomName ?? "",
      },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Booking: ${roomName}` },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],

      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      // expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
