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

// Supabase Service Role client (bypasses RLS)
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
  // STRIPE CONNECT ACCOUNT UPDATED
  // -----------------------------------------------------
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    const stripe_account_id = account.id;
    const charges_enabled = account.charges_enabled === true;
    const payouts_enabled = account.payouts_enabled === true;
    const requirements_due =
      account.requirements?.currently_due ?? [];

    const { error } = await supabase
      .from("profiles")
      .update({
        stripe_charges_enabled: charges_enabled,
        stripe_payouts_enabled: payouts_enabled,
        stripe_requirements_currently_due: requirements_due,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", stripe_account_id);

    if (error) {
      console.error("❌ Failed to update Stripe account status:", error);
    } else {
      console.log("✅ Stripe account synced:", stripe_account_id);
    }
  }

  // -----------------------------------------------------
  // CHECKOUT SESSION COMPLETED
  // -----------------------------------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // 🟡 SUBSCRIPTIONS: DO NOT ACTIVATE HERE
    if (session.mode === "subscription") {
      const user_id = session.metadata?.user_id;
      const customer_id = session.customer as string;
      const subscription_id = session.subscription as string;

      if (user_id && customer_id) {
        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customer_id,
            stripe_subscription_id: subscription_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user_id);

        console.log("🟡 Subscription checkout completed (awaiting payment)");
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // -----------------------------------------------------
    // BOOKINGS (UNCHANGED)
    // -----------------------------------------------------
    const listing_id = session.metadata?.listing_id;
    const rawUserId = session.metadata?.user_id;
    const rawEmail = session.metadata?.user_email;

    const amountPaid = session.amount_total
      ? session.amount_total / 100
      : null;

    if (!listing_id) {
      console.error("❌ Missing listing_id");
      return NextResponse.json(
        { error: "Missing listing_id in metadata" },
        { status: 400 }
      );
    }

    const user_id = rawUserId === "0" ? null : rawUserId;

    const user_email =
      rawEmail && rawEmail !== "unknown"
        ? rawEmail
        : session.customer_details?.email || null;

    const booker_email =
      session.customer_details?.email ||
      user_email ||
      null;

    const { data: listingData, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (listingErr || !listingData) {
      console.error("❌ Owner lookup failed:", listingErr);
      return NextResponse.json(
        { error: "Listing owner lookup failed" },
        { status: 400 }
      );
    }

    const owner_id = listingData.owner_id;

    const { error: insertErr } = await supabase.from("bookings").insert([
      {
        listing_id,
        owner_id,
        user_id,
        user_email,
        booker_email,
        amount_paid: amountPaid,
        stripe_session_id: session.id,
        status: "paid",
      },
    ]);

    if (insertErr) {
      console.error("❌ SUPABASE INSERT FAILED:", insertErr);
      return NextResponse.json(
        { error: "Insert failed", details: insertErr },
        { status: 500 }
      );
    }

    console.log("✅ Booking inserted successfully!");
  }

  // -----------------------------------------------------
  // 🔥 SUBSCRIPTION INVOICE PAID (ACTIVATE PRO) — FIXED
  // -----------------------------------------------------
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscription_id = invoice.subscription as string;

    if (!subscription_id) {
      console.error("❌ Missing subscription on invoice");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 🔥 FIX: get user_id from subscription metadata
    const subscription = await stripe.subscriptions.retrieve(subscription_id);
    const user_id = subscription.metadata?.user_id;

    if (!user_id) {
      console.error("❌ Missing user_id on subscription metadata");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        is_subscribed: true,
        membership_tier: "pro",
        stripe_subscription_id: subscription_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id);

    if (updateErr) {
      console.error("❌ Failed to activate Pro (invoice.paid)", updateErr);
    } else {
      console.log("✅ Pro activated via invoice.paid for user:", user_id);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
