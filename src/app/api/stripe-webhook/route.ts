import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Stripe with a valid API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

// ✅ Create a Supabase client using service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook signature error:", errorMessage);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        await supabase.from("payments").insert([
          {
            stripe_session_id: session.id,
            amount: session.amount_total ? session.amount_total / 100 : null,
            currency: session.currency,
            customer_email: session.customer_email,
            status: session.payment_status,
          },
        ]);

        console.log("✅ Payment saved:", session.id);
        break;
      }

      case "payment_intent.succeeded":
        console.log("💰 PaymentIntent succeeded");
        break;

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook handling error:", errorMessage);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// ⛔ Block other methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
