// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    // ✅ Read user data from request body (frontend already knows user)
    let body: any = null; // NEW

    try {
      body = await req.json(); // NEW (wrapped safely)
    } catch (jsonErr) {
      console.error("❌ Invalid or missing JSON body", jsonErr); // NEW
    }

    const userId = body?.user_id;
    const email = body?.email;

    if (!userId || !email) {
      console.error("❌ Missing user_id or email", body); // NEW

      return NextResponse.json(
        { error: "Missing user_id or email" },
        { status: 400 }
      );
    }

    // ✅ Create Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      customer_email: email,

      line_items: [
        {
          price: "price_1SSBDNBa56XBDKPxw7GtbCjM", // $9.99 Pro plan
          quantity: 1,
        },
      ],

      metadata: {
        user_id: userId,
      },

      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/success`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/canceled`,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error("❌ Stripe subscription error:", error);

    return NextResponse.json(
      { error: error?.message || "Stripe subscription error" },
      { status: 500 }
    );
  }
}
