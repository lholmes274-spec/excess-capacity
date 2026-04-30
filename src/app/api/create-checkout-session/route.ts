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
    console.log("🔥 NEW BACKEND VERSION LOADED");
    const body = await req.json();
    console.log("🔥 REQUEST BODY:", body);

    // 🔍 DEBUG — what frontend is sending
    console.log("🔥 DEBUG body.time_slot:", body.time_slot);
    console.log("🔥 DEBUG body.start_date:", body.start_date);
    console.log("🔥 DEBUG body.end_date:", body.end_date);

    let listing_id = body.listing_id;
    let days = body.days;
    let start_date = body.start_date;
    let end_date = body.end_date;
    let transaction_type = body.transaction_type;
    let booking_id = body.booking_id;

    // 🔐 CREATE SUPABASE CLIENT FIRST
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

    if (!booking_id && (!listing_id || !transaction_type)) {
      return NextResponse.json(
        { error: "Missing listing_id or transaction_type" },
        { status: 400 }
      );
    }

    if (!booking_id && !["booking", "sale"].includes(transaction_type)) {
      return NextResponse.json(
        { error: "Invalid transaction_type" },
        { status: 400 }
      );
    }

    // 🔥 HANDLE EXISTING BOOKING (guest → logged in flow)
    if (booking_id) {
      const { data: booking, error: bookingError } = await supabase
         .from("bookings")
         .select("*")
         .eq("id", booking_id)
         .single();
      
      if (bookingError || !booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      listing_id = booking.listing_id;
      start_date = booking.start_date;
      end_date = booking.end_date;
      days = booking.days || 1;
      transaction_type = 
        booking.transaction_type === "sale" ? "sale" : "booking";
    }


    // Fetch listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    console.log("🔥 DEBUG listing.pricing_type:", listing?.pricing_type);
    console.log("🔥 DEBUG listing.booking_mode:", listing?.booking_mode);

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
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", listing.owner_id)
      .single();

    // ✅ Allow bookings even if lister has no Stripe
    const hasStripe =
      !!listerProfile?.stripe_account_id &&
      listerProfile?.stripe_charges_enabled === true;

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
    const guestEmail = body.guest_email;
    const userEmail = user?.email || guestEmail || null;

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
        customer_email: stripeCustomerId ? undefined : userEmail || undefined,

        metadata: {
          listing_id: String(listing_id),
          transaction_type: "sale",
          lister_id: String(listing.owner_id),
          user_id: String(userId),
          user_email: String(userEmail),
        },

        payment_intent_data: hasStripe
          ? {
             application_fee_amount: platformFee,
             transfer_data: {
               destination: listerProfile.stripe_account_id,
            },
           }
         : {
             application_fee_amount: platformFee,
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

    // 🔐 Calculate quantity from dates on the server
    if (
      start_date &&
      end_date &&
      (
        listing.pricing_type === "per_day" ||
        listing.pricing_type === "per_night" ||
        listing.pricing_type === "per_month"
      )
    ) {
      const start = new Date(start_date + "T00:00:00");
      const end = new Date(end_date + "T00:00:00");

      const diffTime = end.getTime() - start.getTime();
      const rawDays = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
      );

      quantity = Math.max(1, rawDays);
    }
    
    // Per hour override
    if (listing.pricing_type === "per_hour") {
      quantity = Math.max(1, Number(listing.minimum_hours) || 1);
    }

    // HARD AVAILABILITY CHECK
    if (start_date && end_date) {
      let query = supabase
        .from("bookings")
        .select("id")
        .eq("listing_id", listing_id)
        .eq("start_date", start_date)
        .in("status", ["paid", "completed", "confirmed"]);

      if (body.time_slot) {
        query = query.eq("time_slot", body.time_slot);
     }

     const { data: overlappingBookings, error: overlapError } = await query;

      if (overlapError) {
        return NextResponse.json(
          { error: "Availability check failed" },
          { status: 500 }
        );
      }

      if (overlappingBookings && overlappingBookings.length > 0) {
         return NextResponse.json(
           { error: "These dates are no longer available." },
           { status: 400 }
         );
      }
    }

    const unitAmountInCents = Math.round(Number(listing.baseprice) * 100);
    const baseTotal = unitAmountInCents * quantity;
    const PLATFORM_FEE = 500; // $5 in cents
    const totalAmountInCents = baseTotal + PLATFORM_FEE;

    const platformFee = Math.min(
      Math.round(baseTotal * 0.1) + PLATFORM_FEE,
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

   // ✅ FINAL LOGIC — ONLY require time if BOTH conditions match
   const requiresTimeSlot =
     listing.booking_mode === "time_slots" &&
     (
      listing.pricing_type === "per_hour" ||
      listing.pricing_type === "per_use" ||
      listing.pricing_type === "per_service" 
     );

   // ✅ ONLY enforce time slot IF listing actually uses time slots
  if (
    transaction_type === "booking" &&
    requiresTimeSlot &&
    listing.booking_mode === "time_slots" &&
    (!body.time_slot || body.time_slot === "")
  ) {
    return NextResponse.json(
      { error: "Missing time selection" },
      { status: 400 }
    );
  }

   // 🚀 BYPASS STRIPE IF NO CONNECTED ACCOUNT
   if (!hasStripe) {
     const { error: insertError } = await supabase.from("bookings").insert({
       listing_id,
       user_id: userId !== "0" ? userId : null,
       guest_email: userId === "0" ? userEmail : null,
       start_date,
       end_date,
       days: quantity,
       time_slot: body.time_slot || null,
       status: "confirmed",
       transaction_type: "booking",
       total_price: totalAmountInCents / 100,
    });

    if (insertError) {
       console.error("❌ Booking insert failed:", insertError);
       return NextResponse.json(
         { error: "Failed to create booking" },
         { status: 500 }
       );
    }

    return NextResponse.json({
       url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-booking?manual=true`,
    });
  }

  
   // ✅ STRIPE FLOW (only runs if hasStripe === true)
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
        days: String(quantity),
        start_date: String(start_date),
        end_date: String(end_date),
        time_slot: String(body.time_slot || ""),
      },

        payment_intent_data: hasStripe
          ? {
             application_fee_amount: platformFee,
             transfer_data: {
               destination: listerProfile.stripe_account_id,
            },
        setup_future_usage: "off_session",
      }
    : {
        application_fee_amount: platformFee,
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
                  ? quantity === 1 ? "day" : "days"
                  : listing.pricing_type === "per_night"
                  ? quantity === 1 ? "night" : "nights"
                  : listing.pricing_type === "per_month"
                  ? quantity === 1 ? "month" : "months"
                  : listing.pricing_type === "per_hour"
                  ? quantity === 1 ? "hour" : "hours"
                  : quantity === 1 ? "session" : "sessions"
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
