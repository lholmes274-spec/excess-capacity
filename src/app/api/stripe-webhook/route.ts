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

// Supabase service client (bypasses RLS)
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

    console.log("🧾 Session:", session);

    const listing_id = session.metadata?.listing_id || null;

    const checkoutEmail = session.customer_details?.email;
    const metadataEmail = session.metadata?.user_email;

    // Final email (logged-in OR express checkout)
    const finalEmail =
      metadataEmail && metadataEmail !== "" ? metadataEmail : checkoutEmail;

    const amount = session.amount_total
      ? session.amount_total / 100
      : null;

    console.log("📌 Booking Data:", {
      listing_id,
      finalEmail,
      amount,
      stripe_session_id: session.id,
    });

    // Fetch owner_id
    const { data: listingData, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (listingErr) {
      console.error("❌ Could not find listing owner:", listingErr);
    }

    const owner_id = listingData?.owner_id || null;

    // Insert booking
    const { data: insertData, error: insertErr } = await supabase
      .from("bookings")
      .insert([
        {
          listing_id,
          owner_id,
          user_email: finalEmail,
          amount_paid: amount,
          stripe_session_id: session.id,
          status: "paid",
        },
      ])
      .select();

    if (insertErr) {
      console.error("❌ SUPABASE INSERT FAILED:", insertErr);
      return NextResponse.json(
        { error: "Insert failed", details: insertErr },
        { status: 500 }
      );
    }

    console.log("✅ Booking inserted:", insertData);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
