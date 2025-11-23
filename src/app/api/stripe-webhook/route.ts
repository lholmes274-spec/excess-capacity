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

// Supabase service role client
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
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const listing_id = session.metadata?.listing_id || null;

      // Determine email
      const metadata_email = session.metadata?.user_email;
      const checkout_email = session.customer_details?.email;

      const final_email =
        metadata_email && metadata_email !== "" ? metadata_email : checkout_email;

      const amount = session.amount_total ? session.amount_total / 100 : null;

      // Get owner_id from listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("owner_id")
        .eq("id", listing_id)
        .single();

      const owner_id = listingData?.owner_id ?? null;

      // 🔥 Correct insert matching ALL your DB columns
      await supabase.from("bookings").insert([
        {
          listing_id,
          owner_id,
          user_email: final_email,    // logged-in or guest email
          guest_email: final_email,   // duplicate for your schema
          user_id: session.metadata?.user_id || null,
          booking_date: new Date().toISOString(),
          amount_paid: amount,
          stripe_session_id: session.id,
          status: "paid",
        },
      ]);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
