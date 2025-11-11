import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Required for Next.js 14+ (fixes the Vercel build error)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ✅ Initialize Stripe (LIVE secret key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// ✅ Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    console.error("❌ Missing Stripe signature header");
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // ✅ Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ✅ Record payment in Supabase (optional but useful)
        const { error: paymentError } = await supabase.from("payments").insert([
          {
            stripe_session_id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : null,
            currency: session.currency,
            customer_email: session.customer_email,
            status: session.payment_status,
            created_at: new Date().toISOString(),
          },
        ]);

        if (paymentError) console.error("❌ Error inserting payment:", paymentError);
        else console.log("✅ Payment recorded:", session.id);

        // ✅ Upgrade user's membership tier in profiles table
        const userId = session.metadata?.userId;
        if (userId) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ membership_tier: "pro" })
            .eq("id", userId);

          if (updateError) {
            console.error("❌ Error upgrading membership:", updateError);
          } else {
            console.log(`✅ User ${userId} upgraded to Pro membership`);
          }
        } else {
          console.warn("⚠️ No userId found in Stripe session metadata");
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handling error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// ⛔ Handle GET requests (browsers)
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
