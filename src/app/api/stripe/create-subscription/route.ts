// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) console.error("Session Error:", sessionError);

    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = String(user.id);

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      customer_email: user.email, // ✅ REQUIRED

      line_items: [
        {
          price: "price_1SSBDNBa56XBDKPxw7GtbCjM",
          quantity: 1,
        },
      ],

      metadata: {
        user_id: userId,
      },

      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/success`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/canceled`,
    });

    if (!stripeSession?.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    // 🔴 DEBUG CHANGE — expose real Stripe error
    console.error("❌ Stripe subscription error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Stripe subscription error",
        raw: error,
      },
      { status: 500 }
    );
  }
}
