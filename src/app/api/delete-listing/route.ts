// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ❗ Use SERVICE ROLE CLIENT for deletes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { listing_id } = await req.json();

    if (!listing_id) {
      return NextResponse.json(
        { error: "Missing listing_id" },
        { status: 400 }
      );
    }

    // Delete the listing (service role bypasses RLS)
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listing_id);

    if (error) {
      console.error("Delete listing error:", error);
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
