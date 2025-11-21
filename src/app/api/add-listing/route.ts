// @ts-nocheck
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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
      private_instructions,   // ⭐ NEW FIELD
      demo_mode,
      image_url,
      image_urls,
      owner_id,
    } = body;

    // Insert into Supabase
    const { data, error } = await supabase.from("listings").insert([
      {
        owner_id,
        title,
        description,
        baseprice: Number(baseprice),
        type: type.toLowerCase(),
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
        private_instructions,   // ⭐ NEW FIELD
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
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
