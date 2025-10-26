import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────
// Initialize Stripe + Supabase
// ─────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─────────────────────────────
// Verify and handle Stripe Webhook
// ─────────────────────────────
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("❌ No stripe-signature header");
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log(`⚡ Stripe event received: ${event.type}`);

  // ─────────────────────────────
  // Handle checkout.session.completed
  // ─────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const listing_id = session.metadata?.listing_id ?? null;
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const currency = session.currency || "usd";
    const email = session.customer_details?.email || null;

    if (!listing_id) {
      console.warn("⚠️ checkout.session.completed received without listing_id metadata");
    }

    try {
      // Insert payment (idempotent)
      const { error: insertError } = await supabase.from("payments").upsert(
        {
          stripe_session_id: session.id,
          payment_intent_id: session.payment_intent as string,
          listing_id,
          amount,
          currency,
          customer_email: email,
          status: "paid",
          created_at: new Date().toISOString(),
        },
        { onConflict: "stripe_session_id" }
      );

      if (insertError) {
        console.error("❌ Error inserting payment:", insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      console.log(`✅ Payment saved for session ${session.id}`);

      // Decrement available units if listing_id exists
      if (listing_id) {
        const { error: rpcError } = await supabase.rpc("decrement_units", {
          listing_id_param: listing_id,
        });
        if (rpcError) {
          console.error("⚠️ Failed to decrement units:", rpcError.message);
        } else {
          console.log(`📉 Units decremented for listing: ${listing_id}`);
        }
      }
    } catch (err: any) {
      console.error("❌ Webhook processing error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Log other events for visibility
  else if (event.type === "payment_intent.succeeded") {
    console.log("💰 PaymentIntent succeeded");
  } else {
    console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
