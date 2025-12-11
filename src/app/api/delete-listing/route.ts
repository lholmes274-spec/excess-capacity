// @ts-nocheck
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { listing_id } = await req.json();

    if (!listing_id) {
      return NextResponse.json(
        { error: "Missing listing_id" },
        { status: 400 }
      );
    }

    // ✔ CORRECT Supabase SSR client (fixes context.cookies errors)
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );

    // ✔ Load session with SSR-safe client
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("SESSION ERROR:", sessionError);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user_id = session.user.id;

    // ✔ Confirm this user owns the listing
    const { data: listing, error: fetchErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (fetchErr || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.owner_id !== user_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // ✔ Delete (RLS will allow it now)
    const { error: deleteErr } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing_id);

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
