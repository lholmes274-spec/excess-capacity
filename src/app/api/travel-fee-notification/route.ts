import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "Missing booking_id" },
        { status: 400 }
      );
    }

    // Load booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Load listing
    const { data: listing } = await supabase
      .from("listings")
      .select("title")
      .eq("id", booking.listing_id)
      .single();

    console.log("==================================");
    console.log("TRAVEL FEE REQUESTED");
    console.log("Booking:", booking.id);
    console.log("Customer:", booking.guest_email);
    console.log("Travel Fee:", booking.travel_fee);
    console.log("Listing:", listing?.title);
    console.log("==================================");

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}