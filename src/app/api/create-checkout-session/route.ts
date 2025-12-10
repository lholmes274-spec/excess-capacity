// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Convert pricing type into readable text for Stripe Checkout
function formatPricingUnit(type: string) {
  switch (type) {
    case "per_hour":
      return "per hour";
    case "per_day":
      return "per day";
    case "per_week":
      return "per week";
    case "per_month":
      return "per month";
    case "per_use":
      return "per use";
    case "per_item":
      return "per item";
    case "per_service":
      return "per service";
    case "per_trip":
      return "per trip";
    case "for_sale":
      return "for sale";
    case "flat_rate":
      return "flat rate";
    default:
      return "per unit";
  }
}

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

    // Supabase client with cookie auth (VERY IMPORTANT)
    const supabase = createRouteHandlerClient({ cookies });

    // Fetch listing info
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

    // Logged-in user check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 🔥 FIX #1 — DO NOT USE EMPTY STRINGS
    const userId = user?.id ?? null;
    const userEmail = user?.email ?? null;

    // Pricing wording for Stripe
    const pricingLabel = formatPricingUnit(listing.pricing_type);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "required",

      // Pre-fill Stripe email if logged in
      customer_email: userEmail || undefined,

      // 🔥 FIX #2 — Metadata must NEVER be empty strings
      metadata: {
        listing_id,
        user_id: userId ?? "guest", // guests labeled safely
        user_email: userEmail ?? "",
        pricing_type: listing.pricing_type,
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: `${pricingLabel}`,
            },
            unit_amount: Math.round(Number(listing.baseprice) * 100),
          },
          quantity: 1,
        },
      ],

      // 🔥 FIX #3 — Correct success page route
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-booking?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: err.message },
      { status: 500 }
    );
  }
}
