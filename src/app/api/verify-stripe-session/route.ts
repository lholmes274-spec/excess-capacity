// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // 1. Retrieve Stripe session securely
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // 2. Ensure the payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 403 }
      );
    }

    // 3. Metadata must exist for verification
    if (!session.metadata) {
      return NextResponse.json(
        { error: "Missing metadata" },
        { status: 400 }
      );
    }

    // 4. Return secure session info to frontend
    return NextResponse.json(
      {
        metadata: session.metadata,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
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

// Block GET requests for security
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
