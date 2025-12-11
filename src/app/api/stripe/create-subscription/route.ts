// @ts-nocheck

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    // 🍪 Correct server-side Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    });

    // 🔐 Load authenticated user
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

    // Create Stripe subscription checkout session
    const sessionStripe = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1SSBDNBa56XBDKPxw7GtbCjM", // Your live $9.99 plan
          quantity: 1,
        },
      ],

      metadata: {
        user_id: userId, // 🔐 Secure — cannot be spoofed
      },

      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/success`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://prosperityhub.app"
      }/canceled`,
    });

    if (!sessionStripe?.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: sessionStripe.url });
  } catch (error) {
    console.error("Subscription session error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
