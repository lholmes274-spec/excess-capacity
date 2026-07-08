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
    const {
      booking_id,
      receiver_email,
    } = await req.json();

    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: receiver_email,
      subject: "Additional Travel Fee Required",
      html: `
        <h2>Additional Payment Required</h2>

        <p>
          Your provider has requested an additional travel fee for your mobile appointment.
        </p>

        <p>
          <strong>Travel Fee:</strong> $${booking.travel_fee}
        </p>

        <p>
          Your booking will remain pending until this payment has been completed.
        </p>

        <p style="margin:25px 0;">
          <a
            href="${booking.travel_payment_url}"
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
            Pay Travel Fee
          </a>
        </p>

        <p>
          Once payment has been received, your provider will automatically be notified and can finalize your booking.
        </p>
      `,
    });

    if (booking.guest_phone) {
      await sendSMS(
        booking.guest_phone,
        `Prosperity Hub: Your provider requested a $${booking.travel_fee} travel fee for your mobile appointment. Please check your email to complete payment securely.`
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}