// @ts-nocheck
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🟦 Incoming body:", body);

    const { listing_id } = body;
    if (!listing_id) {
      console.error("❌ Missing listing_id in request");
      return NextResponse.json(
        { error: "Missing listing_id" },
        { status: 400 }
      );
    }

    console.log("🟦 Listing ID received:", listing_id);

    // ✅ Correct Supabase client for server-side session loading
    const supabase = createRouteHandlerClient({ cookies });

    console.log("🟦 Loading session...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("🟦 Session result:", session);
    console.log("🟧 Session error (if any):", sessionError);

    if (!session?.user?.id) {
      console.error("❌ No authenticated user found in session");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user_id = session.user.id;
    console.log("🟦 Authenticated USER ID:", user_id);

    console.log("🟦 Fetching listing from DB...");
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    console.log("🟦 Listing lookup result:", listing);
    console.log("🟧 Listing lookup error:", listingError);

    if (listingError || !listing) {
      console.error("❌ Listing not found or error:", listingError);
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    console.log("🟦 Listing owner_id:", listing.owner_id);

    if (listing.owner_id !== user_id) {
      console.error(
        `❌ Unauthorized delete attempt. Owner=${listing.owner_id}, User=${user_id}`
      );
      return NextResponse.json(
        { error: "Unauthorized: You do not own this listing" },
        { status: 403 }
      );
    }

    console.log("🟦 Attempting delete of listing:", listing_id);

    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing_id);

    if (deleteError) {
      console.error("❌ DELETE ERROR DETAILS:", deleteError);
      return NextResponse.json(
        {
          error: "Failed to delete listing",
          details: deleteError.message,
          full: deleteError,
        },
        { status: 500 }
      );
    }

    console.log("✅ Listing deleted successfully:", listing_id);

    return NextResponse.json(
      { success: true, listing_id },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 SERVER ERROR in delete-listing route:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err },
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
