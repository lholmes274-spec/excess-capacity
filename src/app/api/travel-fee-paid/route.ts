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
    const { booking_id } = await req.json();

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

    const { data: provider } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("id", booking.owner_id)
      .single();

    if (!provider?.email) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

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
          You may now return to Prosperity Hub and accept the booking.
        </p>

        <p>
          Booking ID: ${booking.id}
        </p>
      `,
    });

    if (provider.phone) {
      await sendSMS(
        provider.phone,
        "Prosperity Hub: Your customer has paid the travel fee. You may now review and accept the booking."
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