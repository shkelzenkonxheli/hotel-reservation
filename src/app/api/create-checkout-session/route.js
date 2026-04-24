import { NextResponse } from "next/server";

// Handle POST requests for this route.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Online payment is currently disabled. Please reserve now and pay in cash at the hotel.",
    },
    { status: 410 },
  );
}

export async function POST_DISABLED(req) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const rl = rateLimit(req, {
      scope: "create-checkout-session",
      limit: 15,
      windowMs: 10 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!userEmail || !startDate || !endDate || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // ⚠️ Ideal: calculate totalPrice on server.
    // Convert total price to cents for Stripe (EUR uses 2 decimal places).
    const unitAmount = Math.round(Number(totalPrice) * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid totalPrice" },
        { status: 400 },
      );
    }

    const normalizedUserEmail = String(userEmail || "").toLowerCase().trim();
    const sessionEmail = String(session.user.email).toLowerCase().trim();
    if (normalizedUserEmail !== sessionEmail) {
      return NextResponse.json({ error: "Invalid user context" }, { status: 403 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: sessionEmail,
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

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
