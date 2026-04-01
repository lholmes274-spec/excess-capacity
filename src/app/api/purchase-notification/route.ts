import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const lister_id = session.metadata?.lister_id;

    if (!lister_id) {
      return NextResponse.json({ error: "Missing lister_id" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", lister_id)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // 🔥 NEW — create booking-style record for purchase
    const listing_id = session.metadata?.listing_id;
    const user_email = session.metadata?.user_email;

    if (!listing_id || !lister_id) {
      console.error("Missing required metadata:", {
        listing_id,
        lister_id,
      });
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    console.log("INSERTING PURCHASE:", {
      listing_id,
      owner_id: lister_id,
      user_email,
    });

    const { data: purchaseRecord, error: insertError } = await supabase
      .from("bookings")
      .insert({
        listing_id,
        owner_id: lister_id,
        user_email,
        guest_email: user_email,
        status: "paid",
        transaction_type: "sale",
      })
      .select("*") 
      .single();

      console.log("INSERT RESULT:", {
        purchaseRecord,
        insertError,
      });

    if (insertError) {
      console.error("Purchase insert failed:", insertError);
    }

    if (!purchaseRecord?.id) {
      console.error("Purchase record ID missing after insert");
      return NextResponse.json(
        { error: "Failed to create purchase record" },
        { status: 500 }
      );
    }

    // 🔥 UPDATED — redirect to provider booking details
    const redirectUrl = `/provider/bookings/details?id=${purchaseRecord?.id}`;
    const encodedRedirect = encodeURIComponent(redirectUrl);

    await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: profile.email,
      subject: "You have a new purchase on Prosperity Hub",
      html: `
        <p>You have received a new purchase for one of your listings.</p>

        <p style="margin:20px 0;">
          <a 
            href="${process.env.NEXT_PUBLIC_SITE_URL}/auth-redirect?to=${encodedRedirect}"
            style="display:inline-block;padding:12px 20px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
            View Purchase
          </a>
        </p>

        <p>Please log in to view details.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}