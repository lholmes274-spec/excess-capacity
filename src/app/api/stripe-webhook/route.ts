// @ts-nocheck
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Supabase (requires SERVICE ROLE KEY)
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
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    // ============================================================
    // EVENT: checkout.session.completed
    // ============================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const listing_id = session.metadata?.listing_id || null;
      const user_id = session.metadata?.user_id || null; // logged-in users
      const user_email = session.metadata?.user_email || null;
      const guest_email = session.customer_email || null;

      const amount = session.amount_total
        ? session.amount_total / 100
        : null;

      // ⭐ Determine booker email (guest OR logged in)
      const booker_email = user_email || guest_email;

      // ⭐ Get owner_id of listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("owner_id")
        .eq("id", listing_id)
        .single();

      const owner_id = listingData?.owner_id || null;

      // ⭐ Insert booking
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            listing_id,
            booker_email,
            amount_paid: amount,
            stripe_session_id: session.id,
            status: "paid",
            owner_id,
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
    console.error("Webhook handler failed:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

// Block accidental GET request
export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
