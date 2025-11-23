// @ts-nocheck
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "Missing booking_id" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking_id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
