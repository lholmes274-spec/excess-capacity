// @ts-nocheck

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const booking_id = body.booking_id;
    const amount = Number(body.amount);

    if (!booking_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing booking_id or amount" },
        { status: 400 }
      );
    }

    // 🔍 LOAD BOOKING
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

    // 🔍 LOAD LISTING
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", booking.listing_id)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const amountInCents = Math.round(amount * 100);

    // ✅ CREATE STRIPE SESSION
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      customer_email:
        booking.guest_email ||
        booking.user_email ||
        undefined,

      metadata: {
        booking_id: String(booking.id),
        listing_id: String(listing.id),
        payment_type: "travel_fee",
      },

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Mobile Travel Fee",
              description: listing.title,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success-booking?travel_paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
    });

    return NextResponse.json({
      url: stripeSession.url,
    });

  } catch (err) {
    console.error("TRAVEL PAYMENT ERROR:", err);

    return NextResponse.json(
      {
        error: "Failed to create travel payment session",
      },
      { status: 500 }
    );
  }
}