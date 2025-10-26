import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // Never return actual secrets. Just basic metadata to prove they exist.
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL_present: !!url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_len: anon.length,
    SUPABASE_SERVICE_ROLE_KEY_len: role.length,
    NODE_ENV: process.env.NODE_ENV,
  });
}
