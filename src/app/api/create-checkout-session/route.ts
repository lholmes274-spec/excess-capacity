import { NextResponse } from "next/server";
import Stripe from "stripe";

// ✅ Initialize Stripe with your secret key from the environment file (.env.local)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10", // Correct stable version
});

// ✅ Handle POST requests to create a checkout session
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Destructure required fields from the frontend request
    const { lineItems, successUrl, cancelUrl } = body;

    // ✅ Create a new Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    // ✅ Return the session ID to the frontend
    return NextResponse.json({ id: session.id });
  } catch (error: any) {
    console.error("❌ Stripe Checkout Session Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
