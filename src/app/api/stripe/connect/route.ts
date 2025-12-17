// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST() {
  try {
    // 🍪 Create server-side Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 🔐 Require authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = session.user;

    // 🔎 Fetch user profile (DO NOT hard-fail if missing)
    let { data: profile } = await supabase
      .from("profiles")
      .select("id, stripe_account_id")
      .eq("id", user.id)
      .maybeSingle();

    // 🆕 Auto-create profile if missing
    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Profile insert error:", insertError);
        return NextResponse.json(
          {
            error: "Profile insert failed",
            supabaseError: insertError,
          },
          { status: 500 }
        );
      }

      profile = newProfile;
    }

    let stripeAccountId = profile.stripe_account_id;

    // 🆕 Create Stripe Express account if one does not exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });

      stripeAccountId = account.id;

      // 💾 Save Stripe account to profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_status: "pending",
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return NextResponse.json(
          { error: "Failed to save Stripe account", supabaseError: updateError },
          { status: 500 }
        );
      }
    }

    // 🔗 Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    return NextResponse.json(
      { error: "Stripe Connect setup failed", details: String(err) },
      { status: 500 }
    );
  }
}
