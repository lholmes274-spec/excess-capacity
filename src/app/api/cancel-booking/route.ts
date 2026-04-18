import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing booking ID" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Get listing (provider info)
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", booking.listing_id)
      .single();

    // 🔥 3️⃣ CHECK 24-HOUR REFUND WINDOW
    const bookingTime = new Date(booking.created_at);
    const now = new Date();

    const diffHours =
      (now.getTime() - bookingTime.getTime()) / (1000 * 60 * 60);

    let refundIssued = false;

    if (diffHours <= 24 && booking.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          booking.stripe_session_id
        );

        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
          });

          refundIssued = true;
          console.log("💰 Refund issued");
        }
      } catch (err) {
        console.error("❌ Refund failed:", err);
      }
    }

    // 4️⃣ Cancel booking + store refund status
    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        refunded: refundIssued,
      })
      .eq("id", bookingId);

    if (error) {
      console.error("Cancel booking error:", error);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    // 5️⃣ 🔥 SEND EMAIL TO PROVIDER (UPDATED API)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/booking-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_id: booking.owner_id,
          booking_id: booking.id,
          booking_status: "cancelled",
        }),
      });
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      // ❗ DO NOT FAIL THE REQUEST if email fails
    }

    return NextResponse.json({
      success: true,
      refunded: refundIssued,
    });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}