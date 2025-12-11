// @ts-nocheck
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { listing_id } = await req.json();
    if (!listing_id)
      return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });

    // 1️⃣ Create a server client WITH cookies (required to get user)
    const supabase = createRouteHandlerClient({ cookies });

    // 2️⃣ Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user_id = user.id;

    // 3️⃣ Load listing to verify ownership
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

    // 4️⃣ Delete listing (RLS now allows it)
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
