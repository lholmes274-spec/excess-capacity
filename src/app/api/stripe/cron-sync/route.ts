// @ts-nocheck
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

// Service role — server only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // 🔐 Simple protection
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, stripe_account_id")
    .eq("stripe_account_status", "pending")
    .not("stripe_account_id", "is", null);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: "No pending accounts" });
  }

  for (const profile of profiles) {
    const account = await stripe.accounts.retrieve(
      profile.stripe_account_id
    );

    const charges_enabled = account.charges_enabled === true;
    const payouts_enabled = account.payouts_enabled === true;
    const requirements_due =
      account.requirements?.currently_due ?? [];

    const isFullyActive = charges_enabled && payouts_enabled;

    await supabase
      .from("profiles")
      .update({
        stripe_charges_enabled: charges_enabled,
        stripe_payouts_enabled: payouts_enabled,
        stripe_account_status: isFullyActive ? "active" : "pending",
        stripe_requirements_currently_due: requirements_due,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }

  return NextResponse.json({
    success: true,
    processed: profiles.length,
  });
}
