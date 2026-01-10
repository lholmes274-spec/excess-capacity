// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST() {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 1️⃣ Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 2️⃣ Fetch user's Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    // 3️⃣ Retrieve Stripe account
    const account = await stripe.accounts.retrieve(
      profile.stripe_account_id
    );

    const charges_enabled = account.charges_enabled === true;
    const payouts_enabled = account.payouts_enabled === true;

    const requirements = account.requirements || {};

    const requirements_due = requirements.currently_due ?? [];
    const requirements_eventually_due = requirements.eventually_due ?? [];
    const requirements_past_due = requirements.past_due ?? [];

    const hasRequirements =
      requirements_due.length > 0 ||
      requirements_eventually_due.length > 0 ||
      requirements_past_due.length > 0;

    const hasRestriction =
      requirements.disabled_reason != null ||
      account.restrictions?.disabled_reason != null;

    const details_submitted = account.details_submitted === true;

    // 🔍 DEBUG — STRIPE TRUTH SNAPSHOT
    console.log("🔍 STRIPE ACCOUNT STATE", {
      stripe_account_id: profile.stripe_account_id,
      charges_enabled,
      payouts_enabled,
      details_submitted,
      requirements_due,
      requirements_eventually_due,
      requirements_past_due,
      hasRequirements,
      hasRestriction,
      disabled_reason: requirements.disabled_reason,
      restrictions_disabled_reason:
        account.restrictions?.disabled_reason ?? null,
    });

    // ✅ FINAL, CORRECT STRIPE RULE
    const isFullyActive =
      charges_enabled &&
      payouts_enabled &&
      details_submitted &&
      !hasRequirements &&
      !hasRestriction;

    // 4️⃣ Sync Supabase with Stripe truth
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        stripe_charges_enabled: charges_enabled,
        stripe_payouts_enabled: payouts_enabled,
        stripe_account_status: isFullyActive ? "active" : "pending",
        stripe_requirements_currently_due: requirements_due,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    // 5️⃣ Return synced state
    return NextResponse.json({
      success: true,
      stripe_charges_enabled: charges_enabled,
      stripe_payouts_enabled: payouts_enabled,
      stripe_account_status: isFullyActive ? "active" : "pending",
    });
  } catch (err: any) {
    console.error("Stripe sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync Stripe account" },
      { status: 500 }
    );
  }
}
