import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      to,
      body,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID!,
    });

    console.log("📱 SMS sent:", message.sid);

    return {
      success: true,
      sid: message.sid,
    };
  } catch (error) {
    console.error("❌ SMS failed:", error);

    return {
      success: false,
      error,
    };
  }
}