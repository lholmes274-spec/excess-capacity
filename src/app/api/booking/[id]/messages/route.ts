// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// --------------------------------------------------
// Clients
// --------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

// --------------------------------------------------
// POST: Send booking message + notify participant
// --------------------------------------------------
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const { sender_id, message } = await req.json();

    if (!bookingId || !sender_id || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Load booking
    // --------------------------------------------------
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, owner_id, user_id, user_email")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Determine receiver
    // --------------------------------------------------
    const receiver_id =
      sender_id === booking.owner_id
        ? booking.user_id
        : booking.owner_id;

    if (!receiver_id) {
      return NextResponse.json(
        { error: "Unable to determine recipient" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Insert message
    // --------------------------------------------------
    const { error: insertErr } = await supabase
      .from("booking_messages")
      .insert({
        booking_id: bookingId,
        sender_id,
        receiver_id,
        message: message.trim(),
      });

    if (insertErr) {
      console.error("❌ Message insert failed:", insertErr);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Lookup recipient email (AUTH USER OR GUEST)
    // --------------------------------------------------
    let recipientEmail: string | null = null;

    // 1️⃣ Try Supabase auth user
    const { data: recipient } =
      await supabase.auth.admin.getUserById(receiver_id);

    if (recipient?.user?.email) {
      recipientEmail = recipient.user.email;
    }

    // 2️⃣ Fallback to booking email (guest / express checkout)
    if (!recipientEmail) {
      recipientEmail = booking.user_email || null;
    }

    // If still no email, exit gracefully
    if (!recipientEmail) {
      console.warn("⚠️ No recipient email found. Skipping email send.");
      return NextResponse.json({ success: true });
    }

    // --------------------------------------------------
    // Send Prosperity Hub™ email
    // --------------------------------------------------
    try {
      await resend.emails.send({
        from: `Prosperity Hub™ <${process.env.RESEND_FROM_EMAIL}>`,
        to: recipientEmail,
        subject: "New message regarding your booking on Prosperity Hub™",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <p>You have a new message related to a booking on Prosperity Hub™.</p>

            <p>
              To keep communication secure, messages are available only inside the platform.
            </p>

            <p>
              <a href="https://prosperityhub.app/booking/${bookingId}/messages"
                 style="display:inline-block;padding:10px 16px;
                        background:#16a34a;color:white;
                        text-decoration:none;border-radius:6px;">
                View Conversation
              </a>
            </p>

            <hr />
            <p style="font-size:12px;color:#666">
              Prosperity Hub™ — Unlock. Share. Prosper.
            </p>
          </div>
        `,
      });

      console.log("📧 Message notification email sent");
    } catch (emailErr) {
      console.error("❌ Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// Block unsupported methods
// --------------------------------------------------
export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
