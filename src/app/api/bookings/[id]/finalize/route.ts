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
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Fetch listing
    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("baseprice, minimum_hours")
      .eq("id", booking.listing_id)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const hourlyRate = Number(listing.baseprice);
    const minimumHours = Number(listing.minimum_hours) || 1;

    // Calculate amounts
    const upfrontAmount = hourlyRate * minimumHours;
    const finalAmount = hourlyRate * final_hours;
    const additionalAmount = finalAmount - upfrontAmount;

    // Save final hours + amount
    await supabase
      .from("bookings")
      .update({
        final_hours,
        final_amount: finalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    // No additional charge needed
    if (additionalAmount <= 0) {
      return NextResponse.json({
        success: true,
        message: "No additional charge required",
      });
    }

    // Calculate Stripe amounts
    const chargeAmountCents = Math.round(additionalAmount * 100);
    const platformFee = Math.min(
      Math.round(chargeAmountCents * 0.1),
      chargeAmountCents - 1
    );

    // Create additional charge
    await stripe.paymentIntents.create({
      amount: chargeAmountCents,
      currency: "usd",
      customer: booking.stripe_customer_id,
      description: "Additional hourly service charge",
      application_fee_amount: platformFee,
      transfer_data: {
        destination: booking.owner_id,
      },
      metadata: {
        booking_id: bookingId,
        type: "hourly_adjustment",
      },
    });

    return NextResponse.json({
      success: true,
      charged: additionalAmount,
    });
  } catch (err) {
    console.error("Finalize booking error:", err);
    return NextResponse.json(
      { error: "Failed to finalize booking", details: String(err) },
      { status: 500 }
    );
  }
}
