import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, location, basePrice, type, state, city, zip } = body;

    // ✅ Insert a new row into the listings table
    const { data, error } = await supabase.from("listings").insert([
      {
        title,
        description,
        location,
        basePrice: Number(basePrice),
        type,
        state,
        city,
        zip,
      },
    ]);

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Listing added successfully", data }, { status: 201 });
  } catch (err: any) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
