// scripts/sync-all-stripe.ts

console.log("🔥 Running Stripe bulk sync script...");

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SERVICE KEY STARTS WITH:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 15));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncAllStripeAccounts() {
  console.log("🔄 Starting bulk Stripe sync...\n");

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, stripe_account_id")
    .not("stripe_account_id", "is", null);

  if (error) {
    console.error("❌ Failed to fetch profiles:", error);
    return;
  }

  for (const user of users ?? []) {
    try {
      console.log(`🔎 Syncing user ${user.id}`);

      const account = await stripe.accounts.retrieve(
        user.stripe_account_id as string
      );

      // Stripe capability flags
      const charges_enabled = account.charges_enabled === true;
      const payouts_enabled = account.payouts_enabled === true;

      const requirements = (account.requirements ?? {}) as any;

      // Safely access Stripe requirement arrays
      const requirements_due = (requirements.currently_due ?? []) as string[];
      const requirements_eventually_due = (requirements.eventually_due ?? []) as string[];
      const requirements_past_due = (requirements.past_due ?? []) as string[];

      const hasRequirements =
        requirements_due.length > 0 ||
        requirements_eventually_due.length > 0 ||
        requirements_past_due.length > 0;

      const hasRestriction =
        (requirements as any).disabled_reason != null ||
        (account as any).restrictions?.disabled_reason != null;

      const details_submitted = account.details_submitted === true;

      let stripeStatus = "pending";

      if (
        charges_enabled &&
        payouts_enabled &&
        details_submitted &&
        !hasRequirements &&
        !hasRestriction
      ) {
        stripeStatus = "active";
      } else if (hasRestriction) {
        stripeStatus = "restricted";
      } else if (!details_submitted || requirements_due.length > 0) {
        stripeStatus = "incomplete";
      } else {
        stripeStatus = "reviewing";
      }

      await supabase
        .from("profiles")
        .update({
          stripe_charges_enabled: charges_enabled,
          stripe_payouts_enabled: payouts_enabled,
          stripe_account_status: stripeStatus,
          stripe_requirements_currently_due: requirements_due,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      console.log(`✅ Synced ${user.id} → ${stripeStatus}\n`);
    } catch (err) {
      console.error(`❌ Error syncing user ${user.id}:`, err);
    }
  }

  console.log("🎉 Bulk Stripe sync complete.");
}

syncAllStripeAccounts();
