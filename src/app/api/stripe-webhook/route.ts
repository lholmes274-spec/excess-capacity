// @ts-nocheck
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Stripe client (PLATFORM SECRET KEY ONLY)
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
    console.error("❌ Invalid Stripe signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("🔔 Stripe webhook received:", event.type);

  // -----------------------------------------------------
  // STRIPE CONNECT — ACCOUNT STATUS SYNC
  // -----------------------------------------------------
  if (
    event.type === "account.updated" ||
    event.type === "account.application.authorized" ||
    event.type === "account.capability.updated"
  ) {
    const account = event.data.object as Stripe.Account;

    const stripe_account_id = account.id;
    const charges_enabled = account.charges_enabled === true;
    const payouts_enabled = account.payouts_enabled === true;

    const isFullyActive = charges_enabled && payouts_enabled;

    await supabase
      .from("profiles")
      .update({
        stripe_charges_enabled: charges_enabled,
        stripe_payouts_enabled: payouts_enabled,
        stripe_account_status: isFullyActive ? "active" : "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", stripe_account_id);
  }

  // -----------------------------------------------------
  // CHECKOUT SESSION COMPLETED
  // -----------------------------------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // -------------------------
    // SUBSCRIPTIONS — PRO
    // -------------------------
    if (session.mode === "subscription") {
      const user_id = session.metadata?.user_id;
      if (!user_id) return NextResponse.json({ received: true });

      await supabase
        .from("profiles")
        .update({
          is_subscribed: true,
          membership_tier: "pro",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id);

      return NextResponse.json({ received: true });
    }

    // -------------------------
    // COMMON METADATA
    // -------------------------
    const listing_id = session.metadata?.listing_id;
    const rawUserId = session.metadata?.user_id;
    const rawEmail = session.metadata?.user_email;

    if (!listing_id) {
      return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });
    }

    const buyer_id = rawUserId === "0" ? null : rawUserId;
    const buyer_email =
      rawEmail && rawEmail !== "unknown"
        ? rawEmail
        : session.customer_details?.email || null;

    const amountPaid = session.amount_total
      ? session.amount_total / 100
      : null;

    // -------------------------
    // LOOK UP LISTING
    // -------------------------
    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id, transaction_type, title")
      .eq("id", listing_id)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json(
        { error: "Listing lookup failed" },
        { status: 400 }
      );
    }

    const seller_id = listing.owner_id;

    // =====================================================
    // SALE FLOW — CREATE CONVERSATION
    // =====================================================
    if (listing.transaction_type === "sale") {

      // 🔑 INSERT SALE INTO BOOKINGS (THIS IS THE FIX) 
      await supabase.from("bookings").insert([ 
        { 
          listing_id,  
          owner_id: seller_id, 
          user_id: buyer_id, 
          user_email: buyer_email, 
          amount_paid: amountPaid, 
          stripe_session_id: session.id,
          status: "completed",
          }, 
      ]);
      
      // Prevent duplicate conversations
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listing_id)
        .eq("transaction_type", "sale")
        .single();

      let conversation_id = existingConversation?.id;

      if (!conversation_id) {
        const { data: convo } = await supabase
          .from("conversations")
          .insert([
            {
              listing_id,
              transaction_type: "sale",
              buyer_id,
              seller_id,
            },
          ])
          .select()
          .single();

        conversation_id = convo.id;

        await supabase.from("messages").insert([
          {
            conversation_id,
            sender_id: null,
            is_system: true,
            message: `🛒 Purchase completed. A buyer has purchased "${listing.title}". Use this chat to coordinate next steps.`,
          },
        ]);
      }

      console.log("✅ Sale conversation created");
      return NextResponse.json({ received: true });
    }

    // =====================================================
    // BOOKING FLOW — CREATE BOOKING
    // =====================================================
    if (session.metadata?.transaction_type === "booking") {
      const start_date = session.metadata?.start_date || null;
      const end_date = session.metadata?.end_date || null;
      const days = session.metadata?.days
        ? Number(session.metadata.days)
        : null;
      const estimated_time_window =
        session.metadata?.time_window || null;

      const { error } = await supabase.from("bookings").insert([
        {
          listing_id,
          owner_id: seller_id,
          user_id: buyer_id,
          user_email: buyer_email,
          booker_email: buyer_email,
          amount_paid: amountPaid,
          stripe_session_id: session.id,
          status: "paid",

          // ✅ NEW — persist booking data
          start_date,
          end_date,
          days,
        },
      ]);

      if (error) {
        console.error("❌ Booking insert failed:", error);
        return NextResponse.json({ error }, { status: 500 });
      }

      console.log("✅ Booking inserted successfully");
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
