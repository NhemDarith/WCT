import { Twilio } from "twilio";


const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req) {
  const { phone } = await req.json();

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phone,
        // to: "+85595678160",
        channel: "sms",
      });

    return new Response(
      JSON.stringify({ success: true, sid: verification.sid }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Twilio error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send OTP" }),
      { status: 500 }
    );
  }
}
