// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

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

    const cookieStore = cookies();

    // ✅ Correct usage for your current Supabase version
    const supabase = createRouteHandlerClient({ cookies: cookieStore });

    // Load session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("SESSION:", session);
    console.log("SESSION ERROR:", sessionError);

    if (!session?.user?.id) {
      console.error("❌ Not authenticated");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user_id = session.user.id;

    // Verify listing ownership
    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    console.log("LISTING:", listing);
    console.log("LISTING ERROR:", listingErr);

    if (listingErr || !listing) {
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

    // Delete listing
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

    console.log("SUCCESS DELETE:", listing_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Internal error", detail: err },
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
