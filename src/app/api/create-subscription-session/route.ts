import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST() {
  try {
    // ✅ Create a recurring subscription checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          // ✅ Your real Stripe Price ID
          price: "price_1SSBDNBa56XBDKPxw7GtbCjM",
          quantity: 1,
        },
      ],
      // ✅ Redirects after payment success or cancel
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"}/canceled`,
    });

    // ✅ Check if Stripe returned a valid checkout URL
    if (!session?.url) {
      console.error("Stripe session returned no URL");
      return NextResponse.json({ error: "No checkout URL returned" }, { status: 400 });
    }

    // ✅ Send the checkout URL back to the frontend
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Subscription session error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
