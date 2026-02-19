import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Read Vercel geo headers
    const signup_country =
      req.headers.get("x-vercel-ip-country") || null;

    const signup_region =
      req.headers.get("x-vercel-ip-country-region") || null;

    const rawCity = req.headers.get("x-vercel-ip-city");
    const signup_city = rawCity ? decodeURIComponent(rawCity) : null;

    if (!signup_country && !signup_region && !signup_city) {
      return NextResponse.json({ success: true });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        signup_country,
        signup_region,
        signup_city,
      })
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Geo reconcile error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
