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

    // 🔐 SERVICE ROLE CLIENT (bypasses RLS)
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() {
            return undefined;
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
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Fetch lister profile (owner)
    const { data: listerProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", listing.owner_id)
      .single();

    if (!listerProfile?.stripe_account_id) {
      return NextResponse.json(
        { error: "Lister is not connected to Stripe" },
        { status: 400 }
      );
    }

    // Booker (optional auth)
    const cookieStore = cookies();
    const authClient = createServerClient<Database>(
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

    const {
      data: { session },
    } = await authClient.auth.getSession();

    const user = session?.user || null;
    const userId = user?.id ? String(user.id) : "0";
    const userEmail = user?.email ? String(user.email) : "unknown";

    const pricingLabel = formatPricingUnit(listing.pricing_type);
    const amountInCents = Math.round(Number(listing.baseprice) * 100);

    // 🟢 10% platform fee
    const rawPlatformFee = Math.round(amountInCents * 0.1);
    const platformFee = Math.min(rawPlatformFee, amountInCents - 1);

    /**
     * =========================================================
     * STORAGE (MONTHLY) → SUBSCRIPTION
     * =========================================================
     */
    if (listing.pricing_type === "per_month") {
      const stripeSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        billing_address_collection: "required",

        customer_email:
          userEmail !== "unknown" ? userEmail : undefined,

        metadata: {
          listing_id: String(listing_id),
          lister_id: String(listing.owner_id),
          user_id: String(userId),
          user_email: String(userEmail),
          pricing_type: String(listing.pricing_type),
        },

        subscription_data: {
          application_fee_percent: 10,
          transfer_data: {
            destination: listerProfile.stripe_account_id,
          },
        },

        line_items: [
          {
            price_data: {
              currency: "usd",
              recurring: {
                interval: "month",
              },
              product_data: {
                name: listing.title,
                description: pricingLabel,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],

        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-booking?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
      });

      return NextResponse.json({ url: stripeSession.url });
    }

    /**
     * =========================================================
     * EVERYTHING ELSE → ONE-TIME PAYMENT (UNCHANGED)
     * =========================================================
     */
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "required",

      customer_email:
        userEmail !== "unknown" ? userEmail : undefined,

      metadata: {
        listing_id: String(listing_id),
        lister_id: String(listing.owner_id),
        user_id: String(userId),
        user_email: String(userEmail),
        pricing_type: String(listing.pricing_type),
      },

      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: listerProfile.stripe_account_id,
        },
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: pricingLabel,
            },
            unit_amount: amountInCents,
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
      { error: "Failed to create checkout session", details: String(err) },
      { status: 500 }
    );
  }
}
