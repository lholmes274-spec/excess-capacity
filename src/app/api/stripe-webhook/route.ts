// @ts-nocheck
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Supabase Service Role (server-side only — NEVER use NEXT_PUBLIC here)
const supabase = createClient(
  process.env.SUPABASE_URL!,                // 🔥 FIXED
  process.env.SUPABASE_SERVICE_ROLE_KEY!    // 🔥 FIXED
);

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("🔔 Webhook received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const listing_id = session.metadata?.listing_id ?? null;
    const rawUserId = session.metadata?.user_id ?? null;
    const rawEmail = session.metadata?.user_email ?? null;

    // Convert amount
    const amountPaid = session.amount_total ? session.amount_total / 100 : null;

    // Normalize user_id
    const user_id =
      !rawUserId || rawUserId === "guest" || rawUserId === "0" || rawUserId === ""
        ? null
        : rawUserId;

    // Best email available
    const user_email = rawEmail || session.customer_details?.email || null;

    if (!listing_id) {
      console.error("❌ Missing listing_id");
      return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });
    }

    // Get listing owner
    const { data: listingData, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (listingErr || !listingData) {
      console.error("❌ Listing lookup failed:", listingErr);
      return NextResponse.json({ error: "Listing not found" }, { status: 400 });
    }

    const owner_id = listingData.owner_id;

    // Clean session ID
    const cleanSessionId = String(session.id).trim();

    // Insert booking
    const { error: insertErr } = await supabase.from("bookings").insert([
      {
        listing_id,
        owner_id,
        user_id,
        user_email,
        amount_paid: amountPaid,
        stripe_session_id: cleanSessionId,
        status: "paid",
      },
    ]);

    if (insertErr) {
      console.error("❌ SUPABASE INSERT FAILED:", insertErr);
      return NextResponse.json({ error: "Insert failed", details: insertErr }, { status: 500 });
    }

    console.log("✅ Booking inserted successfully!");
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
