// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { listing_id } = await req.json();
    console.log("🟦 Incoming listing_id:", listing_id);

    if (!listing_id) {
      console.error("❌ Missing listing_id");
      return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });
    }

    const cookieStore = cookies();

    // ✅ FIX: Correct Supabase client for server-side + PKCE auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    console.log("🟦 Loading session...");
    const { data: sessionData, error: sessionErr } =
      await supabase.auth.getSession();

    console.log("🟦 Session response:", sessionData);
    console.log("🟧 Session error:", sessionErr);

    const session = sessionData?.session;

    if (!session?.user?.id) {
      console.error("❌ User not authenticated on server");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user_id = session.user.id;
    console.log("🟦 Authenticated USER ID:", user_id);

    // Fetch listing to verify owner
    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listing_id)
      .single();

    console.log("🟦 Listing query:", listing);
    console.log("🟧 Listing error:", listingErr);

    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.owner_id !== user_id) {
      console.error("❌ Unauthorized delete");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log("🟦 Deleting listing:", listing_id);
    const { error: deleteErr } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing_id);

    if (deleteErr) {
      console.error("❌ DELETE ERROR:", deleteErr);
      return NextResponse.json(
        { error: deleteErr.message },
        { status: 500 }
      );
    }

    console.log("✅ Listing deleted:", listing_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: err },
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
