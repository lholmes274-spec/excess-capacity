// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      baseprice,
      type,
      location,
      state,
      city,
      zip,
      address_line1,
      address_line2,
      contact_name,
      contact_phone,
      contact_email,
      pickup_instructions,
      private_instructions,
      demo_mode,
      image_url,
      image_urls,
    } = body;

    // ✔ Correct Supabase SSR client (NO deprecated auth helpers)
    const supabase = createRouteHandlerClient<Database>(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );

    // ✔ Load authenticated user with SSR-safe token refresh
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session Error:", sessionError);
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const owner_id = session.user.id;

    // ✔ RLS-safe insert
    const { data, error } = await supabase.from("listings").insert([
      {
        owner_id,
        title,
        description,
        baseprice: Number(baseprice),
        type: type?.toLowerCase(),
        location,
        state,
        city,
        zip,
        address_line1,
        address_line2,
        contact_name,
        contact_phone,
        contact_email,
        pickup_instructions,
        private_instructions,
        demo_mode,
        image_url,
        image_urls,
      },
    ]);

    if (error) {
      console.error("Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Listing added successfully", data },
      { status: 201 }
    );
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: err },
      { status: 500 }
    );
  }
}
