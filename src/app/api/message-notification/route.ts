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
    const { receiver_id, receiver_email, booking_id } = await req.json();

    let emailToSend = "";
    let booking = null;

    // 🔹 Only fetch booking IF booking_id exists
    if (booking_id) {
      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          user_id,
          listings (
            owner_id
          )
        `)
        .eq("id", booking_id)
        .maybeSingle();

      booking = data;
    }

    // 🔹 Determine recipient email
    if (receiver_id) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", receiver_id)
        .single();

      if (error || !profile?.email) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      emailToSend = profile.email;
    }

    if (!receiver_id && receiver_email) {
      emailToSend = receiver_email;
    }

    if (!emailToSend) {
      return NextResponse.json({ error: "No valid recipient" }, { status: 400 });
    }

    // 🔹 Build link + button
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    let link = "";
    let buttonText = "";

    if (booking_id && booking) {
      // ✅ FIX: listings is an array
      const ownerId = booking.listings?.[0]?.owner_id;

      const isProvider = receiver_id === ownerId;

      link = isProvider
        ? `${baseUrl}/provider/bookings/details?id=${booking_id}`
        : `${baseUrl}/my-bookings?id=${booking_id}`;

      buttonText = isProvider
        ? "View Booking Request"
        : "View Booking";

    } else {
      // 🔵 GENERAL MESSAGE → INBOX
      link = `${baseUrl}/login?redirect=/inbox`;
      buttonText = "View Inbox";
    }

     // 🔹 Build premium message text
     let messageText = "You received a new message.";

     if (booking_id && booking) {
       const ownerId = booking.listings?.[0]?.owner_id;
       const isProvider = receiver_id === ownerId;

       messageText = isProvider
         ? "You have a new booking request. Please review the details and respond to proceed."
         : "Your booking has been updated. Review the details for the latest information.";
     }

    // 🔹 Send email
    await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: emailToSend,
      subject: booking_id
             ? "New booking activity on Prosperity Hub"
             : "You have a new message on Prosperity Hub",
      html: `
        <p>${messageText}</p>

        <p style="margin:20px 0;">
          <a href="${link}"
            style="display:inline-block;padding:12px 20px;background:#ea580c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
            ${buttonText}
          </a>
        </p>

        <p>Please log in to view full details and take action.</p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}