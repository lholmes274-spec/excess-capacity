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
    case "per_night":
      return "per night";
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
    const { listing_id, days, transaction_type } = await req.json();

    if (!listing_id || !transaction_type) {
      return NextResponse.json(
        { error: "Missing listing_id or transaction_type" },
        { status: 400 }
      );
    }

    if (!["booking", "sale"].includes(transaction_type)) {
      return NextResponse.json(
        { error: "Invalid transaction_type" },
        { status: 400 }
      );
    }

    const safeDays = Math.max(1, Number(days) || 1);

    // 🔐 SERVICE ROLE CLIENT
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

    // 🔒 SOFT AVAILABILITY ENFORCEMENT
    if (listing.listing_status !== "active") {
      return NextResponse.json(
        { error: "This listing is currently unavailable" },
        { status: 400 }
      );
    }

    // Fetch lister profile
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

    // Booker auth
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

    /**
     * =========================================================
     * STEP 1 — ENSURE REUSABLE STRIPE CUSTOMER
     * =========================================================
     */
    let stripeCustomerId: string | undefined = undefined;

    if (userEmail !== "unknown") {
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            user_id: userId,
          },
        });
        stripeCustomerId = customer.id;
      }
    }

    const pricingLabel = formatPricingUnit(listing.pricing_type);

    /**
     * =========================================================
     * SALE — ONE TIME PURCHASE
     * =========================================================
     */
    if (transaction_type === "sale") {
      const amountInCents = Math.round(Number(listing.baseprice) * 100);
      const platformFee = Math.min(
        Math.round(amountInCents * 0.1),
        amountInCents - 1
      );

      const stripeSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        billing_address_collection: "required",
        customer: stripeCustomerId,
        customer_email: stripeCustomerId ? undefined : userEmail,

        metadata: {
          listing_id: String(listing_id),
          transaction_type: "sale",
          lister_id: String(listing.owner_id),
          user_id: String(userId),
          user_email: String(userEmail),
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

        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-purchase?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
      });

      return NextResponse.json({ url: stripeSession.url });
    }

    /**
     * =========================================================
     * BOOKINGS — TIME BASED
     * =========================================================
     */
    let quantity = 1;

    if (
      listing.pricing_type === "per_day" ||
      listing.pricing_type === "per_night" ||
      listing.pricing_type === "per_month"
    ) {
      quantity = safeDays;
    }

    if (listing.pricing_type === "per_hour") {
      quantity = Math.max(1, Number(listing.minimum_hours) || 1);
    }

    const unitAmountInCents = Math.round(Number(listing.baseprice) * 100);
    const totalAmountInCents = unitAmountInCents * quantity;

    const platformFee = Math.min(
      Math.round(totalAmountInCents * 0.1),
      totalAmountInCents - 1
    );

    const unitLabel =
      listing.pricing_type === "per_day"
        ? "per day"
        : listing.pricing_type === "per_night"
        ? "per night"
        : listing.pricing_type === "per_month"
        ? "per month"
        : listing.pricing_type === "per_hour"
        ? "per hour"
        : pricingLabel;

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "required",
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : userEmail,

      metadata: {
        listing_id: String(listing_id),
        transaction_type: "booking",
        lister_id: String(listing.owner_id),
        user_id: String(userId),
        user_email: String(userEmail),
        quantity: String(quantity),
      },

      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: listerProfile.stripe_account_id,
        },
        setup_future_usage: "off_session",
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${listing.title} (${unitLabel})`,
              description: `Duration: ${quantity} ${
                listing.pricing_type === "per_day"
                  ? "days"
                  : listing.pricing_type === "per_night"
                  ? "nights"
                  : listing.pricing_type === "per_month"
                  ? "months"
                  : listing.pricing_type === "per_hour"
                  ? "hours"
                  : "units"
              }`,
            },
            unit_amount: unitAmountInCents,
          },
          quantity,
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
