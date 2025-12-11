// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();

    // Validate session_id
    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing session_id" },
        { status: 400 }
      );
    }

    // Retrieve Stripe session securely
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Payment must be completed
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 403 }
      );
    }

    const metadata = session.metadata || {};

    // Return only safe values to frontend
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
  } catch (err: any) {
    console.error("Stripe session verification error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ❌ Block GET requests for security
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
