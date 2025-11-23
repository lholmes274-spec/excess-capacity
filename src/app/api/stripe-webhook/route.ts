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
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Extract metadata
      const listing_id = session.metadata?.listing_id || null;

      // PRIORITY EMAIL SOURCE (FIXED)
      const finalEmail =
        session.metadata?.user_email ||
        session.customer_details?.email ||
        session.customer_email ||
        null;

      // Convert cents → dollars
      const amount =
        session.amount_total !== null ? session.amount_total / 100 : null;

      // Fetch owner_id
      const { data: listingData } = await supabase
        .from("listings")
        .select("owner_id")
        .eq("id", listing_id)
        .single();

      const owner_id = listingData?.owner_id || null;

      // ⭐ Insert booking into DB using booker_email ⭐
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            listing_id,
            owner_id,
            booker_email: finalEmail,  // ⭐ THIS FIXES EVERYTHING
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
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
