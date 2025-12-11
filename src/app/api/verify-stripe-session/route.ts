// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();

    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing session_id" },
        { status: 400 }
      );
    }

    // 🔍 Retrieve the Stripe checkout session securely
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // ❌ Payment incomplete
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 403 }
      );
    }

    // Metadata validation
    const metadata = session.metadata || {};

    // Sanitize for frontend — only safe values returned
    return NextResponse.json(
      {
        ok: true,
        listing_id: metadata.listing_id || null,
        user_id: metadata.user_id || null,
        pricing_type: metadata.pricing_type || null,
        customer_email: session.customer_details?.email || null,
        amount_total: session.amount_total || null,
        payment_status: session.payment_status,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Stripe session verification error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Block GET requests
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
