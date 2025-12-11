// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { listing_id } = await req.json();
    if (!listing_id)
      return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });

    // 1️⃣ Extract JWT token from Authorization header
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token)
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    // 2️⃣ Public client to validate the user
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user_id = user.id;

    // 3️⃣ Service role client to bypass RLS during delete logic
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4️⃣ Verify listing ownership
    const { data: listing } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (!listing)
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    if (listing.owner_id !== user_id)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );

    // 5️⃣ Delete listing
    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing_id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete listing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Delete listing route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
