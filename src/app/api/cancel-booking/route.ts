import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing booking ID" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Get listing (provider info)
    const { data: listing } = await supabase
      .from("listings")
      .select("*")
      .eq("id", booking.listing_id)
      .single();

    // 3️⃣ Cancel booking
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      console.error("Cancel booking error:", error);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
    }

    // 4️⃣ 🔥 SEND EMAIL TO PROVIDER
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/message-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_id: booking.owner_id,
          receiver_email: listing?.contact_email,
          booking_id: booking.id,
          type: "booking_cancelled",
        }),
      });
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      // ❗ DO NOT FAIL THE REQUEST if email fails
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}