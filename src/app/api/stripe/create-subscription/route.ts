// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    // ✅ Get userId from the request body sent by SubscribeButton.tsx
    const { userId } = await req.json();

    if (!userId) {
      console.error("❌ Missing userId in request body");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ Create a Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1SSBDNBa56XBDKPxw7GtbCjM", // Your live $9.99/month plan
          quantity: 1,
        },
      ],

      // ✅ Attach userId to identify which Supabase profile to upgrade
      metadata: { userId },

      // ✅ Redirect URLs after successful or canceled payment
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/success`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/canceled`,
    });

    // ✅ Validate and return the checkout URL
    if (!session?.url) {
      console.error("❌ Stripe session returned no URL");
      return NextResponse.json(
        { error: "No checkout URL returned" },
        { status: 400 }
      );
    }

    // ✅ Send Stripe Checkout URL to the frontend
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("💥 Subscription session error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
