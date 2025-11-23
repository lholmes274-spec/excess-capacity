// @ts-nocheck
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stripe Client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Supabase (SERVICE ROLE KEY required)
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
    console.error("❌ Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const listing_id = session.metadata?.listing_id || null;
      const user_id = session.metadata?.user_id || null;

      // Logged in → metadata.user_email
      const logged_in_email = session.metadata?.user_email || null;

      // Guest → Stripe customer email
      const guest_email = session.customer_email || null;

      // Convert cents → dollars
      const amount =
        session.amount_total !== null ? session.amount_total / 100 : null;

      // Get owner_id from listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("owner_id")
        .eq("id", listing_id)
        .single();

      const owner_id = listingData?.owner_id || null;

      // Insert booking — MATCHES YOUR DATABASE COLUMNS EXACTLY
      const { error: bookingError } = await supabase.from("bookings").insert([
        {
          listing_id,
          owner_id,
          user_id: user_id || null,
          user_email: logged_in_email || null,
          guest_email: logged_in_email ? null : guest_email, // guest only
          amount_paid: amount,
          stripe_session_id: session.id,
          status: "paid",
        },
      ]);

      if (bookingError) {
        console.error("❌ Failed to insert booking:", bookingError);
      } else {
        console.log("✅ Booking saved:", session.id);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

// Prevent accidental GET calls
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
