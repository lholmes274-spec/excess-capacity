import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Read Vercel geo headers
    const signup_country =
      req.headers.get("x-vercel-ip-country") || null;

    const signup_region =
      req.headers.get("x-vercel-ip-country-region") || null;

    const rawCity = req.headers.get("x-vercel-ip-city");
    const signup_city = rawCity ? decodeURIComponent(rawCity) : null;

    // Only update if we actually have geo data
    if (!signup_country && !signup_region && !signup_city) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        signup_country,
        signup_region,
        signup_city,
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
