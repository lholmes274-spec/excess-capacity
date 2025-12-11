// @ts-nocheck

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();

    // Correct PKCE-safe server Supabase client
    const supabase = createRouteHandlerClient<Database>({
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    });

    // Fetch listings (public endpoint)
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
