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

// Supabase Service Role (bypasses RLS completely)
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

  // -----------------------------------------------------
  // ✅ CHECKOUT SUCCESS → CREATE BOOKING
  // -----------------------------------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Metadata included from the checkout session
    const listing_id = session.metadata?.listing_id || null;
    const metadataEmail = session.metadata?.user_email || "";
    const metadataUserId = session.metadata?.user_id || null;

    const checkoutEmail = session.customer_details?.email;
    const finalEmail =
      metadataEmail && metadataEmail !== "" ? metadataEmail : checkoutEmail;

    const amountPaid = session.amount_total
      ? session.amount_total / 100
      : null;

    console.log("📌 Booking metadata resolved:", {
      listing_id,
      metadataUserId,
      finalEmail,
      amountPaid,
      session_id: session.id,
    });

    // -----------------------------------------------------
    // 🚨 SAFETY CHECK: listing_id MUST exist
    // -----------------------------------------------------
    if (!listing_id) {
      console.error("❌ ERROR: Missing listing_id in metadata");
      return NextResponse.json(
        { error: "Missing listing_id in metadata" },
        { status: 400 }
      );
    }

    // Fetch owner of listing
    const { data: listingData, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (listingErr) {
      console.error("❌ Listing lookup failed:", listingErr);
      return NextResponse.json(
        { error: "Listing not found", details: listingErr },
        { status: 400 }
      );
    }

    const owner_id = listingData?.owner_id || null;

    // -----------------------------------------------------
    // 🚨 SAFETY CHECK: Assign fallback user_id
    // -----------------------------------------------------
    const safeUserId =
      metadataUserId ??
      "00000000-0000-0000-0000-000000000000"; // fallback UUID so insert never fails

    // -----------------------------------------------------
    // 🚀 INSERT BOOKING
    // -----------------------------------------------------
    const { data: inserted, error: insertErr } = await supabase
      .from("bookings")
      .insert([
        {
          listing_id,
          owner_id,
          user_id: safeUserId,
          user_email: finalEmail,
          amount_paid: amountPaid,
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

    console.log("✅ Booking inserted:", inserted);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
