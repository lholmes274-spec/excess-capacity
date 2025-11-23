// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: "Missing listing_id" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // 1️⃣ Retrieve listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Validate price
    if (listing.baseprice === null || isNaN(Number(listing.baseprice))) {
      return NextResponse.json(
        { error: "Invalid base price for listing" },
        { status: 400 }
      );
    }

    const priceInCents = Math.round(Number(listing.baseprice) * 100);

    // 3️⃣ Logged-in user info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? "";
    const userEmail = user?.email ?? "";

    // 4️⃣ Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: listing.title },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],

      metadata: {
        listing_id,
        user_id: userId,
        user_email: userEmail,
      },

      customer_email: userEmail || null,

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    // 🔥 TEMPORARY DEBUG BLOCK — SHOW THE REAL ERROR IN BROWSER
    console.error("Checkout session error:", err);

    return NextResponse.json(
      {
        error: err?.message || "Unknown error",
        stack: err?.stack || null,
        raw: JSON.stringify(err, null, 2) || null,
      },
      { status: 500 }
    );
  }
}
