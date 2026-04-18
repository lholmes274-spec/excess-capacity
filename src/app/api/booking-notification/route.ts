import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("🔥 BOOKING NOTIFICATION API HIT");

    const body = await req.json();
    console.log("📦 BODY:", body);
    const { receiver_id, receiver_email, booking_id, booking_status } = body;

    if (!receiver_id) {
      return NextResponse.json({ error: "Missing receiver_id" }, { status: 400 });
    }

    // 🔥 Get provider email directly from listings table
    const { data: listings, error: listingError } = await supabase
      .from("listings")
      .select("contact_email")
      .eq("owner_id", receiver_id)
      .limit(1);

    const providerEmail = listings?.[0]?.contact_email;

    console.log("📧 SENDING TO:", providerEmail);

    if (listingError || !providerEmail) {
      console.error("❌ No email found for provider:", listings);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔥 NEW — dynamic button text based on booking status
    const buttonText =
      booking_status === "pending"
      ? "View Booking Request"
      : "View Booking";

    const redirectUrl = `/my-bookings/${booking_id}`;
    const encodedRedirect = encodeURIComponent(redirectUrl);

    let subject = "Booking Update on Prosperity Hub";
    let message = "There has been an update to a booking.";

    if (booking_status === "pending") {
      subject = "You have a new booking request on Prosperity Hub";
      message = "You have received a new booking request for one of your listings.";
    }

    if (booking_status === "completed") {
      subject = "New Booking Confirmed on Prosperity Hub";
      message = "A booking has been confirmed for one of your listings.";
    }

    if (booking_status === "cancelled") {
      subject = "Booking Cancelled on Prosperity Hub";
      message = "A booking has been cancelled for one of your listings.";
    }

    const emailResponse = await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: providerEmail,
      subject,
      html: `
        <p>${message}</p>

        <p style="margin:20px 0;">
          <a 
            href="${process.env.NEXT_PUBLIC_SITE_URL}/auth-redirect?to=${encodedRedirect}"
            style="display:inline-block;padding:12px 20px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
            ${buttonText}
          </a>
        </p>

        <p>Please log in to view customer details and respond.</p>
      `,
    });
    console.log("📨 RESEND RESPONSE:", emailResponse);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}