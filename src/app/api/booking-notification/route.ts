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
    const { receiver_id, receiver_email, booking_id, booking_status } = await req.json();

    if (!receiver_id) {
      return NextResponse.json({ error: "Missing receiver_id" }, { status: 400 });
    }

    // Get provider email
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", receiver_id)
      .single();

    if (error || !profile?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔥 NEW — dynamic button text based on booking status
    const buttonText =
      booking_status === "pending"
      ? "View Booking Request"
      : "View Booking";

    const redirectUrl = `/provider/bookings/details?id=${booking_id}`;
    const encodedRedirect = encodeURIComponent(redirectUrl);

    await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: profile.email,
      subject: "You have a new booking request on Prosperity Hub",
      html: `
        <p>You have received a new booking request for one of your listings.</p>

        <p style="margin:20px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login?redirect=${encodedRedirect}"
             style="display:inline-block;padding:12px 20px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
             ${buttonText}
          </a>
        </p>

        <p>Please log in to view customer details and respond.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}