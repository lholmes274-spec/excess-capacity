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

    // ✅ Use Vercel built-in geo (NO external API)
    const geo = (req as any).geo || {};

    const signup_country = geo.country || null;
    const signup_region = geo.region || null;
    const signup_city = geo.city || null;

    // ✅ Create Supabase Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ Create auth user
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

    // ✅ Insert into profiles (clean geo structure)
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
