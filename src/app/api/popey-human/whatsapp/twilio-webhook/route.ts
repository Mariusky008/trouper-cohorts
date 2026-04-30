import { NextResponse } from "next/server";
import twilio from "twilio";
import { processTwilioWhatsAppWebhook } from "@/lib/actions/whatsapp-twilio";
import { whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";

export const dynamic = "force-dynamic";

function normalizeParams(formData: FormData) {
  const entries = Array.from(formData.entries());
  return Object.fromEntries(entries.map(([key, value]) => [key, String(value || "")]));
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Webhook Twilio WhatsApp prêt.",
  });
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ success: false, error: "Payload webhook Twilio invalide." }, { status: 400 });
  }
  const params = normalizeParams(formData);

  if (whatsappTwilioConfig.validateWebhookSignature && whatsappTwilioConfig.authToken) {
    const signature = request.headers.get("x-twilio-signature") || "";
    const expectedUrl = whatsappTwilioConfig.inboundWebhookUrl || request.url;
    const isValid = twilio.validateRequest(whatsappTwilioConfig.authToken, signature, expectedUrl, params);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Signature Twilio invalide." }, { status: 403 });
    }
  }

  const result = await processTwilioWhatsAppWebhook(params);
  if (!result.success) {
    return NextResponse.json({ success: false, error: "Traitement webhook Twilio en erreur." }, { status: 400 });
  }
  return NextResponse.json(result);
}
