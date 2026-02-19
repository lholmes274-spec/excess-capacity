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

    // ✅ Get IP address from headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    const ip =
      forwardedFor?.split(",")[0]?.trim() ||
      realIp ||
      "8.8.8.8"; // fallback for local dev

    // ✅ Fetch geo data from ipapi
    let country = null;
    let country_code = null;
    let city = null;
    let region = null;

    try {
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
      const geoData = await geoRes.json();

      country = geoData.country_name || null;
      country_code = geoData.country || null;
      city = geoData.city || null;
      region = geoData.region || null;
    } catch (geoError) {
      console.error("Geo lookup failed:", geoError);
    }

    // ✅ Create Supabase Admin Client (server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: must exist
    );

    // ✅ Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "User creation failed." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // ✅ Insert into profiles with geo data
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: email,
        display_name: displayName?.trim() || null,
        country,
        country_code,
        signup_ip: ip,
        signup_city: city,
        signup_region: region,
      });

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
