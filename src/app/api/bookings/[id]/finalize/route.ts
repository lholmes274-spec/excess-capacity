// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Service role Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const { final_hours } = await req.json();

    if (!bookingId || !final_hours || final_hours <= 0) {
      return NextResponse.json(
        { error: "Invalid booking or hours" },
        { status: 400 }
      );
    }

    // Fetch booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    // Fetch listing
    const { data: listing } = await supabase
      .from("listings")
      .select("baseprice, minimum_hours")
      .eq("id", booking.listing_id)
      .single();

    const hourlyRate = Number(listing.baseprice);
    const minimumHours = Number(listing.minimum_hours) || 1;

    const upfrontAmount = hourlyRate * minimumHours;
    const finalAmount = hourlyRate * final_hours;
    const additionalAmount = finalAmount - upfrontAmount;

    await supabase
      .from("bookings")
      .update({
        final_hours,
        final_amount: finalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (additionalAmount <= 0) {
      return NextResponse.json({
        success: true,
        charged: 0,
      });
    }

    // Retrieve checkout session + original payment intent
    const session = await stripe.checkout.sessions.retrieve(
      booking.stripe_session_id,
      { expand: ["payment_intent"] }
    );

    const customerId = session.customer;
    const paymentMethodId =
      typeof session.payment_intent === "object"
        ? session.payment_intent.payment_method
        : null;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "No saved payment method for this booking" },
        { status: 400 }
      );
    }

    // Fetch lister Stripe account
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", booking.owner_id)
      .single();

    const chargeAmountCents = Math.round(additionalAmount * 100);
    const platformFee = Math.min(
      Math.round(chargeAmountCents * 0.1),
      chargeAmountCents - 1
    );

    // ✅ THIS WILL ACTUALLY CHARGE
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmountCents,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,

      application_fee_amount: platformFee,
      on_behalf_of: ownerProfile.stripe_account_id,
      transfer_data: {
        destination: ownerProfile.stripe_account_id,
      },

      metadata: {
        booking_id: bookingId,
        type: "hourly_adjustment",
      },
    });

    return NextResponse.json({
      success: true,
      charged: additionalAmount,
      payment_intent_id: paymentIntent.id,
    });
  } catch (err) {
    console.error("Finalize booking error:", err);
    return NextResponse.json(
      { error: "Failed to finalize booking" },
      { status: 500 }
    );
  }
}
