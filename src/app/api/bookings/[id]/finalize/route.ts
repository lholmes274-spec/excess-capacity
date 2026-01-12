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

    const hourlyRate = Number(listing.baseprice);
    const minimumHours = Number(listing.minimum_hours) || 1;

    const upfrontAmount = hourlyRate * minimumHours;
    const finalAmount = hourlyRate * final_hours;
    const additionalAmount = finalAmount - upfrontAmount;

    /**
     * =========================================================
     * CASE 1 — NO ADDITIONAL CHARGE NEEDED
     * =========================================================
     */
    if (additionalAmount <= 0) {
      await supabase
        .from("bookings")
        .update({
          final_hours,
          final_amount: finalAmount,
          status: "completed", // ✅ FIX
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      return NextResponse.json({
        success: true,
        charged: 0,
      });
    }

    /**
     * =========================================================
     * CASE 2 — ADDITIONAL CHARGE REQUIRED
     * =========================================================
     */

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(
      booking.stripe_session_id
    );

    const customerId = session.customer;

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "Unable to charge additional hours automatically. Please coordinate payment through messaging.",
        },
        { status: 400 }
      );
    }

    /**
     * Retrieve customer's default / latest payment method
     */
    const customer =
      typeof customerId === "string"
        ? await stripe.customers.retrieve(customerId)
        : null;

    let paymentMethodId =
      customer?.invoice_settings?.default_payment_method || null;

    if (!paymentMethodId) {
      const methods = await stripe.paymentMethods.list({
        customer: customerId as string,
        type: "card",
        limit: 1,
      });

      paymentMethodId = methods.data[0]?.id || null;
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        {
          error:
            "Unable to charge additional hours automatically. Please coordinate payment through messaging.",
        },
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

    // OFF-SESSION STRIPE CHARGE
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmountCents,
      currency: "usd",
      customer: customerId as string,
      payment_method: paymentMethodId as string,
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

    /**
     * =========================================================
     * FINALIZE AFTER SUCCESSFUL CHARGE
     * =========================================================
     */
    await supabase
      .from("bookings")
      .update({
        final_hours,
        final_amount: finalAmount,
        status: "completed", // ✅ FIX
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

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
