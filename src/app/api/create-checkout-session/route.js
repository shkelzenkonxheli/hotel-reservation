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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail,
      metadata: {
        roomId: roomId.toString(),
        roomName,
        totalPrice,
        type,
        startDate,
        endDate,
        fullname,
        phone,
        address,
        guests: guests.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Booking: ${roomName}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
