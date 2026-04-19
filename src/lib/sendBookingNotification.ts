import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendBookingNotification({
  receiver_id,
  booking_id,
  booking_status,
}: {
  receiver_id: string;
  booking_id: string;
  booking_status: string;
}) {
  console.log("🔥 EMAIL FUNCTION CALLED");

  const { data: listings } = await supabase
    .from("listings")
    .select("contact_email")
    .eq("owner_id", receiver_id)
    .limit(1);

  const providerEmail = listings?.[0]?.contact_email;

  if (!providerEmail) {
    console.error("❌ No provider email found");
    return;
  }

  let subject = "Booking Update";
  let message = "There has been an update.";

  if (booking_status === "completed") {
    subject = "New Booking Confirmed";
    message = "A new booking has been confirmed.";
  }

  if (booking_status === "cancelled") {
    subject = "Booking Cancelled";
    message = "A booking has been cancelled.";
  }

  await resend.emails.send({
    from: "Prosperity Hub <no-reply@prosperityhub.app>",
    to: providerEmail,
    subject,
    html: `<p>${message}</p>`,
  });

  console.log("✅ EMAIL SENT");
}