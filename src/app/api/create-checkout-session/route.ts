import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ Load and verify your Stripe Secret Key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY is missing. Check your .env.local or Vercel settings.");
}

const stripe = new Stripe(stripeSecretKey!, { apiVersion: "2024-04-10" });

export async function POST(req: Request) {
  try {
    // Parse incoming JSON body
    const body = await req.json();
    const { title, amount } = body;

    console.log("🔹 Incoming checkout request:", { title, amount });

    if (!title) {
      console.error("❌ Missing 'title' in request body.");
      return NextResponse.json({ error: "Missing 'title' field" }, { status: 400 });
    }

    // Ensure the amount is valid and not zero
    const unitAmount = Math.max(Number(amount || 0) * 100, 100); // at least $1.00

    console.log("💵 Creating checkout session for:", title, "| Amount (cents):", unitAmount);

    // ✅ Create the Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title || "Listing",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
    });

    console.log("✅ Checkout session created successfully:", session.id);

    // Return checkout URL to frontend
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("❌ Stripe Checkout Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
