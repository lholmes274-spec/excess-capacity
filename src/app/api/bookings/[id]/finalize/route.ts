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

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Fetch listing
    const { data: listing } = await supabase
      .from("listings")
      .select("baseprice, minimum_hours")
      .eq("id", booking.listing_id)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

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
      return NextResponse.json({ success: true });
    }

    // Checkout session → customer
    const session = await stripe.checkout.sessions.retrieve(
      booking.stripe_session_id
    );

    if (!session.customer) {
      return NextResponse.json(
        { error: "Stripe customer not found" },
        { status: 400 }
      );
    }

    // Lister Stripe account
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", booking.owner_id)
      .single();

    if (!ownerProfile?.stripe_account_id) {
      return NextResponse.json(
        { error: "Lister Stripe account not found" },
        { status: 400 }
      );
    }

    const chargeAmountCents = Math.round(additionalAmount * 100);
    const platformFee = Math.min(
      Math.round(chargeAmountCents * 0.1),
      chargeAmountCents - 1
    );

    const stripeAccount = ownerProfile.stripe_account_id;

    // 1️⃣ Invoice item (CONNECTED ACCOUNT)
    await stripe.invoiceItems.create(
      {
        customer: session.customer,
        amount: chargeAmountCents,
        currency: "usd",
        description: "Final hourly service charge",
        metadata: { booking_id: bookingId },
      },
      { stripeAccount }
    );

    // 2️⃣ Create invoice (CONNECTED ACCOUNT)
    const invoice = await stripe.invoices.create(
      {
        customer: session.customer,
        collection_method: "charge_automatically",
        application_fee_amount: platformFee,
        transfer_data: { destination: stripeAccount },
        metadata: { booking_id: bookingId },
      },
      { stripeAccount }
    );

    // 3️⃣ Finalize invoice (CONNECTED ACCOUNT)
    await stripe.invoices.finalizeInvoice(invoice.id, {}, { stripeAccount });

    // 4️⃣ Pay invoice (CONNECTED ACCOUNT)
    await stripe.invoices.pay(invoice.id, {}, { stripeAccount });

    return NextResponse.json({
      success: true,
      charged: additionalAmount,
      invoice_id: invoice.id,
    });
  } catch (err) {
    console.error("Finalize booking error:", err);
    return NextResponse.json(
      { error: "Failed to finalize booking", details: String(err) },
      { status: 500 }
    );
  }
}
