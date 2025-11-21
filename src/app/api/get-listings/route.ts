// @ts-nocheck
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
