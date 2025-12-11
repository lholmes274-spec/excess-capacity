// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Human readable pricing unit for Stripe
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
    const { listing_id } = await req.json();

    if (!listing_id) {
      return NextResponse.json(
        { error: "Missing listing_id" },
        { status: 400 }
      );
    }

    // 🍪 Correct new SSR Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Fetch listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      console.error("Listing fetch error:", listingError);
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Get logged-in user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user || null;

    // Always strings for Stripe metadata
    const userId = user?.id ? String(user.id) : "0"; // 0 = guest
    const userEmail = user?.email ? String(user.email) : "unknown";

    const pricingLabel = formatPricingUnit(listing.pricing_type);

    // Create the Stripe Checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "required",

      customer_email:
        userEmail !== "unknown" ? userEmail : undefined,

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

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: String(err),
      },
      { status: 500 }
    );
  }
}
