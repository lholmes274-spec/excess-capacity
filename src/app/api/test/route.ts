import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  try {
    const response = await resend.emails.send({
      from: "Prosperity Hub <no-reply@prosperityhub.app>",
      to: "textme53@yahoo.com", // 👈 YOUR email
      subject: "TEST EMAIL",
      html: "<p>This is a direct test email</p>",
    });

    console.log("📨 RESPONSE:", response);

    return NextResponse.json({ success: true, response });
  } catch (err) {
    console.error("❌ ERROR:", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}