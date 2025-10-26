import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

// Initialize Stripe with your server-side secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export async function POST(req: Request) {
  try {
    // Support both shapes:
    //  - { listing: { id, title, basePrice } }
    //  - { id, title, basePrice }
    const body = await req.json();
    const payload = body?.listing ?? body;

    const id = payload?.id ?? null;
    const title = payload?.title;
    const basePrice = payload?.basePrice ?? payload?.base_price; // accept snake_case too

    if (!title || basePrice == null) {
      return NextResponse.json(
        { error: "Missing required fields (title, basePrice)" },
        { status: 400 }
      );
    }

    const amountCents = Math.max(0, Math.round(Number(basePrice) * 100));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: String(title) },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      // include listing id so webhook can decrement inventory
      metadata: {
        listing_id: id ? String(id) : "",
        title: String(title),
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
