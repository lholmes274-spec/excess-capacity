// @ts-nocheck

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Convert pricing type for Stripe display
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

    // 🍪 Correct server-side Supabase client with PKCE-safe cookie adapter
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    });

    // Load listing
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

    // Load logged-in user (session)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user || null;

    // Metadata must ALWAYS be strings
    const userId = user?.id ? String(user.id) : "0";
    const userEmail = user?.email ? String(user.email) : "unknown";

    const pricingLabel = formatPricingUnit(listing.pricing_type);

    // Create Stripe Checkout session
    const sessionStripe = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "required",

      customer_email: userEmail !== "unknown" ? userEmail : undefined,

      metadata: {
        listing_id: String(listing_id),
        user_id: String(userId),
        user_email: String(userEmail),
        pricing_type: String(listing.pricing_type),
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: pricingLabel,
            },
            unit_amount: Math.round(Number(listing.baseprice) * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-booking?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
    });

    return NextResponse.json({ url: sessionStripe.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: `${err}` },
      { status: 500 }
    );
  }
}
