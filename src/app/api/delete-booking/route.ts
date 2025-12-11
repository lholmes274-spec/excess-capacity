// @ts-nocheck
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "Missing booking_id" },
        { status: 400 }
      );
    }

    // ✔ Correct SSR Supabase client
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );

    // ✔ Load session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) console.error("SESSION ERROR:", sessionError);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user_id = session.user.id;

    // ✔ Confirm this booking belongs to the user
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("user_id")
      .eq("id", booking_id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.user_id !== user_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // ✔ Delete booking (RLS now allows it)
    const { error: deleteErr } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking_id);

    if (deleteErr) {
      console.error("DELETE ERROR:", deleteErr);
      return NextResponse.json(
        { error: deleteErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err },
      { status: 500 }
    );
  }
}
