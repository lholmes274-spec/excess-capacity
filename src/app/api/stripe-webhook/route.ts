// @ts-nocheck
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  const body = await req.text();

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
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // --------------------------------
    // MAIN EVENT — CHECKOUT COMPLETED
    // --------------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const listing_id = session.metadata?.listing_id || null;
      const user_id = session.metadata?.user_id || null;
      const user_email = session.metadata?.user_email || null;
      const guest_email = session.customer_email || null; // Stripe collects guest email

      const amount = session.amount_total
        ? session.amount_total / 100
        : null;

      // ⭐ Insert booking into Supabase
      const { error } = await supabase.from("bookings").insert([
        {
          listing_id,
          user_id,
          user_email,
          guest_email,
          amount_paid: amount,
          stripe_session_id: session.id,
          status: "paid",
        },
      ]);

      if (error) {
        console.error("❌ Failed to insert booking:", error);
      } else {
        console.log("✅ Booking created:", session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
