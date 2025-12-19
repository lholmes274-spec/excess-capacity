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
    // ✅ Read user data from request body
    let body: any = null;

    try {
      body = await req.json();
    } catch (jsonErr) {
      console.error("❌ Invalid or missing JSON body", jsonErr);
    }

    const userId = body?.user_id;
    const email = body?.email;

    if (!userId || !email) {
      console.error("❌ Missing user_id or email", body);

      return NextResponse.json(
        { error: "Missing user_id or email" },
        { status: 400 }
      );
    }

    // ✅ Create Stripe Checkout session (SUBSCRIPTION)
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

      // ✅ FIXED REDIRECTS (NO 404)
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/dashboard?subscribed=true`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/subscribe`,
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
