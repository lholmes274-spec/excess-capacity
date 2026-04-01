// src/app/api/create-booking/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 important
  );

  console.log(
    "SERVICE KEY:",
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)
  );

  // 🔥 INSERT BOOKING
  const { data, error } = await supabase
    .from("bookings")
    .insert(body)
    .select()
    .single();

  if (error) {
    console.error("Server insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 🔥 SEND EMAIL TO PROVIDER (NEW)
  try {
    if (data?.owner_id && data?.id) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/booking-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_id: data.owner_id, // provider
          booking_id: data.id,
          booking_status: "pending", // or "confirmed" if you use that
        }),
      });

      console.log("BOOKING EMAIL TRIGGERED:", {
        provider: data.owner_id,
        booking: data.id,
      });
    } else {
      console.warn("Missing owner_id or booking id — email not sent");
    }
  } catch (emailErr) {
    console.error("Email trigger failed:", emailErr);
  }

  return NextResponse.json(data);
}