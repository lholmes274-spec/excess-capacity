// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Use the REAL Supabase URL for server routes
const admin = createClient(
  process.env.SUPABASE_URL!,                // ✔ Correct non-public URL
  process.env.SUPABASE_SERVICE_ROLE_KEY!    // ✔ Full RLS bypass
);

export async function GET() {
  try {
    const { data, error } = await admin
      .from("payments")
      .insert({
        stripe_session_id: "test_session_" + Date.now(),
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
      console.error("test-payment-insert error:", error.message);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data }, { status: 200 });
  } catch (e: any) {
    console.error("test-payment-insert fatal:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "fatal" },
      { status: 500 }
    );
  }
}
