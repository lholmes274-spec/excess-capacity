// @ts-nocheck
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json({ error: "Missing listing_id" }, { status: 400 });
    }

    // Supabase server client
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );

    // Fetch listing details
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check login status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Logged-in or Guest
    const userId = user?.id || null;
    const userEmail = user?.email || null;

    // ------------------------------
    // Create Stripe Checkout Session
    // ------------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: listing.title },
            unit_amount: Math.round(Number(listing.baseprice) * 100),
          },
          quantity: 1,
        },
      ],

      // Send metadata used by webhook
      metadata: {
        listing_id: listing.id,
        user_id: userId,
        user_email: userEmail,
      },

      // Logged in → prefill email
      // Guest → Stripe will ask for email
      customer_email: userEmail || undefined,

      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/canceled`,
    });

    if (!session?.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
