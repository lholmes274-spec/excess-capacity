import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Stripe with your LIVE secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// ✅ Initialize Supabase client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // ✅ Verify the Stripe event signature
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
      // ✅ Checkout completed — save payment to Supabase
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const { error } = await supabase.from("payments").insert([
          {
            stripe_session_id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : null,
            currency: session.currency,
            customer_email: session.customer_email,
            status: session.payment_status,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) console.error("❌ Error inserting payment:", error);
        else console.log("✅ Payment recorded:", session.id);
        break;
      }

      // ✅ Handle successful PaymentIntents (backup)
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id}`);
        break;
      }

      // ⚠️ Unhandled events
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handling error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// ⛔ Block GET requests (to prevent 405 errors from browsers)
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
