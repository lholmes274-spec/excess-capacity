// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // ⛔ Prevent prerender at build
export const runtime = "nodejs";

// ⚠️ Lazily create admin client only at runtime — NOT during build!
function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !role) {
    console.error("❌ Missing envs", { url_present: !!url, role_present: !!role });
    return null;
  }

  return createClient(url, role);
}

export async function GET() {
  try {
    const admin = getAdminClient();

    // If env vars missing, return safe JSON instead of throwing
    if (!admin) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing SUPABASE_URL or SERVICE_ROLE (runtime only)",
        },
        { status: 200 } // keep build from failing
      );
    }

    const { data, error } = await admin
      .from("payments")
      .insert({
        stripe_session_id: "test_" + Date.now(),
        listing_id: "00000000-0000-0000-0000-000000000000",
        amount: 12.34,
        currency: "usd",
        payment_intent_id: "pi_test_" + Date.now(),
        customer_email: "test@example.com",
        status: "paid",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "fatal" },
      { status: 500 }
    );
  }
}
