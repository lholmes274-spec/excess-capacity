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

    // ✅ FIXED: correct Supabase client for server-side auth
    const supabase = createRouteHandlerClient({ cookies });

    // ✅ Load authenticated session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session load error:", sessionError);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user_id = session.user.id;

    // ✅ Confirm listing exists & belongs to user
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    if (listingError) {
      console.error("Listing load error:", listingError);
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

    // ✅ Delete listing (RLS will allow it)
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
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405 }
  );
}
