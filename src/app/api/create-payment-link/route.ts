import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    }

    // 🔎 Get booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 🔎 Get listing
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", booking.listing_id)
      .single();

    const amount = Number(booking.final_amount || listing.baseprice);

    // 💳 Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: booking.guest_email || booking.user_email,

      line_items: [
        {
          price_data: {
            currency: listing.currency || "usd",
            product_data: {
              name: listing.title,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/listings`,
    });

    // 📧 SEND EMAIL TO GUEST
    await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: booking.guest_email || booking.user_email,
      subject: "Complete your booking payment",
      html: `
        <p>Your booking request has been approved.</p>

        <p>Please click below to complete your payment:</p>

        <p style="margin:20px 0;">
          <a 
            href="${session.url}"
            style="display:inline-block;padding:12px 20px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
            Complete Payment
          </a>
        </p>

        <p>This link will secure your booking.</p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}