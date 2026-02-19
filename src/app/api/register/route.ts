import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // ✅ Get Geo from Vercel headers (Next 14 compatible)
    const signup_country =
      req.headers.get("x-vercel-ip-country") || null;

    const signup_region =
      req.headers.get("x-vercel-ip-country-region") || null;

    const rawCity = req.headers.get("x-vercel-ip-city");
    const signup_city = rawCity ? decodeURIComponent(rawCity) : null;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "User creation failed." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: email,
          display_name: displayName?.trim() || null,
          signup_country,
          signup_region,
          signup_city,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
