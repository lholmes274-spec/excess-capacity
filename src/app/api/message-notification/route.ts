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
    console.log("MESSAGE NOTIFICATION ROUTE HIT");

    const rawBody = await req.clone().text();
    console.log("RAW BODY:", rawBody);
    const { receiver_id, receiver_email, booking_id, type } = await req.json();

    console.log("PARSED BODY");
    console.log({
      receiver_id,
      receiver_email,
      booking_id,
      type,
    });

    let emailToSend = "";
    let booking = null;

    // 🔹 Only fetch booking IF booking_id exists
    if (booking_id) {
      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          user_id,
          guest_name,
          guest_email,
          guest_phone,
          appointment_type,
          start_date,
          end_date,
          listing:listings(
            owner_id,
            title
          )
        `)
        .eq("id", booking_id)
        .maybeSingle();

      booking = data;
      console.log("BOOKING DATA DEBUG");
      console.log(JSON.stringify(data, null, 2));
    }

    // 🔹 Determine recipient email
    if (receiver_email) {
       emailToSend = receiver_email;
    }

    else if (receiver_id) {

  // ✅ FIRST try profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", receiver_id)
    .maybeSingle();

  if (profile?.email) {
    emailToSend = profile.email;
  }

  // ✅ FALLBACK: use auth.users
  if (!emailToSend) {
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(receiver_id);

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 404 }
      );
    }

    emailToSend = authUser.user.email;
  }
}

    if (!receiver_id && receiver_email) {
      emailToSend = receiver_email;
    }

    if (!emailToSend) {
     console.error("NO VALID RECIPIENT");
     console.log({
       receiver_id,
       receiver_email,
       emailToSend,
     });
      return NextResponse.json(
        { error: "No valid recipient" },
        { status: 400 }
     );
    }

    console.log("EMAIL API:", {
      receiver_id,
      receiver_email,
      emailToSend,
    });

    // 🔹 Build link + button
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    let link = "";
    let buttonText = "";

    if (booking_id && booking) {
      const isProvider = !!receiver_id;

      const redirectPath = isProvider
         ? `/provider-bookings/${booking_id}`
         : `/my-bookings/${booking_id}`;
      link = `${baseUrl}/auth-redirect?to=${encodeURIComponent(redirectPath)}`;

    if (isProvider) {
      buttonText = "View Booking Request";
    } else if (booking.user_id) {
      buttonText = "View Booking";
    } else {
      buttonText = "";
    }

    } else {
      // 🔵 GENERAL MESSAGE → INBOX
      link = `${baseUrl}/login?redirect=/inbox`;
      buttonText = "View Inbox";
    }

     // 🔹 Build premium message text
     let messageText = "You received a new message.";

if (type === "booking_cancelled") {

  messageText =
    "A booking has been cancelled. Please review the details.";

} else if (booking_id && booking) {
  const isProvider = !!receiver_id;

  if (isProvider) {

    messageText = `
      <strong>New Booking Request</strong><br><br>

      Service: ${booking.listing?.[0]?.title || "Service"}<br>
      Customer Name: ${booking.guest_name || "Not Provided"}<br>
      Customer Email: ${booking.guest_email || "Not Provided"}<br>
      Customer Phone: ${booking.guest_phone || "Not Provided"}<br>
      Appointment Type: ${booking.appointment_type || "office"}<br>
      Start Date: ${booking.start_date || "N/A"}<br>
      End Date: ${booking.end_date || "N/A"}<br>
      Booking ID: ${booking.id}
    `;

  } else {

    messageText = `
      <strong>Booking Request Received</strong><br><br>

      Booking ID: ${booking.id}<br><br>

      Your booking request has been received and payment has been processed.

      <br><br>

      Status: Pending Provider Approval

      <br><br>

      You will receive another notification once the provider accepts or declines your booking request.
    `;
  }
}

    // 🔹 Send email
    const emailResult = await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: emailToSend,
      subject: 
        type === "booking_cancelled"
             ? "Booking Cancelled on Prosperity Hub"
             : booking_id
             ? "New booking activity on Prosperity Hub"
             : "You have a new message on Prosperity Hub",
      html: `
        <p>${messageText}</p>

        ${buttonText ? `
        <p style="margin:20px 0;">
          <a href="${link}"
            style="display:inline-block;padding:12px 20px;background:#ea580c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
            ${buttonText}
          </a>
        </p>
        ` : ""}
      `,
    });

    console.log("RESEND RESULT TYPE:", typeof emailResult);
    console.log("RESEND RESULT:", JSON.stringify(emailResult, null, 2));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}