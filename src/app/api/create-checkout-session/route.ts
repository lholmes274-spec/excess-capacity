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

    // 1️⃣ Get listing
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

    // 3️⃣ User info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userEmail = user?.email || null;

    // ❗ Critical fix for Stripe email issue:
    // If userEmail is empty string "", set to undefined so Stripe doesn't fail.
    const finalCustomerEmail =
      userEmail && userEmail.trim() !== "" ? userEmail : undefined;

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
        user_id: user?.id ?? "",
        user_email: userEmail ?? "",
      },

      // ✅ Fixed
      customer_email: finalCustomerEmail,

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
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
