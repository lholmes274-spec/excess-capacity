// src/app/api/stripe-webhook/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Stripe with your secret key (no API version needed)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// ✅ Create Supabase client (server-side role key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  // Stripe sends a signature header we must verify
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  try {
    // ✅ Verify this request really came from Stripe
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    // ✅ Handle checkout completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("✅ Payment succeeded:", session.id);

      // Extract your custom metadata (set when creating the Checkout Session)
      const listingId = session.metadata?.listingId;

      if (listingId) {
        // ✅ Update your Supabase database to mark the item as SOLD
        const { error } = await supabase
          .from("listings")
          .update({
            status: "sold",
            paid: true,
            sold_at: new Date().toISOString(),
          })
          .eq("id", listingId);

        if (error) {
          console.error("❌ Failed to update Supabase listing:", error.message);
        } else {
          console.log(`✅ Listing ${listingId} marked as sold in Supabase`);
        }
      } else {
        console.warn("⚠️ No listingId found in session metadata.");
      }
    }

    // ✅ Always respond to Stripe to confirm receipt
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }
}
