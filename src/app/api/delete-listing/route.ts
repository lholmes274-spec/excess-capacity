// @ts-nocheck
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { listing_id } = await req.json();
    if (!listing_id) {
      return NextResponse.json(
        { error: "Missing listing_id" },
        { status: 400 }
      );
    }

    // 1️⃣ Create cookie-based Supabase client (REQUIRED)
    const supabase = createRouteHandlerClient({ cookies });

    // 2️⃣ Get session → this is the ONLY method that works in API routes
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user_id = session.user.id;

    // 3️⃣ Fetch listing to verify owner
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.owner_id !== user_id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this listing" },
        { status: 403 }
      );
    }

    // 4️⃣ Delete listing (passes RLS)
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
