// @ts-nocheck

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

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

    // 🍪 Server-side Supabase client with proper cookie adapter
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    });

    // 🔐 Load authenticated user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session read error:", sessionError);
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const owner_id = session.user.id;

    // 📝 Insert new listing (RLS will check owner_id)
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
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Listing added successfully", data },
      { status: 201 }
    );
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
