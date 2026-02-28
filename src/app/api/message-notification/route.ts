import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must exist
);

export async function POST(req: Request) {
  try {
    const { receiver_id } = await req.json();

    if (!receiver_id) {
      return NextResponse.json({ error: "Missing receiver_id" }, { status: 400 });
    }

    // Get receiver email
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", receiver_id)
      .single();

    if (error || !profile?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: profile.email,
      subject: "You have a new message on Prosperity Hub",
      html: `
        <p>You received a new message regarding one of your listings.</p>

        <p style="margin:20px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login?redirect=/inbox"
             style="display:inline-block;padding:12px 20px;background:#ea580c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
             Go to Inbox
          </a>
        </p>

        <p>For security, message content is only visible inside your account.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}