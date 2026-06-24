import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { sendSMS } from "@/lib/twilio";

const resend = new Resend(
  process.env.RESEND_API_KEY!
);

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

    const { data: booking } =
      await supabase
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
      from:
        "Prosperity Hub <no-reply@prosperityhub.app>",

      to: receiver_email,

      subject:
        "Booking Approved",

      html: `
        <h2>
          Booking Approved
        </h2>

        <p>
          Your booking request has been approved.
        </p>

        <p>
          Booking ID:
          ${booking.id}
        </p>

        <p>
          Your provider has accepted your booking request.
        </p>
      `,
    });

    const phone =
      booking.guest_phone;

    if (phone) {
      await sendSMS(
        phone,
        `Your Prosperity Hub booking has been approved.`
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}