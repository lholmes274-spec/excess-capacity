import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/twilio";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("✅ TRAVEL-FEE-PAID ROUTE HIT");

    const { booking_id } = await req.json();

    console.log("📌 Booking ID:", booking_id);

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    console.log("📖 Booking:", booking);

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Get provider email
    const { data: provider, error: providerError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", booking.owner_id)
      .single();

    console.log("👤 Provider:", provider);
    console.log("❌ Provider Error:", providerError);

    if (!provider?.email) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Get provider phone from listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("contact_phone")
      .eq("id", booking.listing_id)
      .single();

    console.log("📋 Listing:", listing);
    console.log("❌ Listing Error:", listingError);

    const bookingLink =
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth-redirect?to=` +
      encodeURIComponent(`/provider-bookings/${booking.id}`);

    // Send Email
    await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: provider.email,
      subject: "Travel Fee Received",
      html: `
        <h2>Travel Fee Received</h2>

        <p>
          Your customer has successfully paid the requested travel fee.
        </p>

        <p>
          You may now review the booking and accept it.
        </p>

        <p style="margin:25px 0;">
          <a
            href="${bookingLink}"
            style="
              display:inline-block;
              background:#ea580c;
              color:#ffffff;
              text-decoration:none;
              padding:14px 22px;
              border-radius:8px;
              font-weight:bold;
            "
          >
            View Booking
          </a>
        </p>

        <p>
          Booking ID:<br>
          ${booking.id}
        </p>
      `,
    });

    console.log("✅ Provider email sent");

    // Send SMS
    if (listing?.contact_phone) {
      await sendSMS(
        listing.contact_phone,
        "Prosperity Hub: Your customer has paid the travel fee. You may now review and accept the booking."
      );

      console.log("✅ Provider SMS sent");
    } else {
      console.log("⚠️ Listing does not have a contact phone.");
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error("❌ TRAVEL-FEE-PAID ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}