import { NextResponse } from "next/server";
import { processWhatsAppMetaWebhook } from "@/lib/actions/whatsapp-meta";
import { whatsappMetaConfig } from "@/lib/popey-human/whatsapp-meta-config";
import { whatsappWebhookSchema } from "@/lib/popey-human/whatsapp-meta-validation";

export const dynamic = "force-dynamic";

function verifyWebhook(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (!mode || !token || !challenge) return null;
  const expected = String(whatsappMetaConfig.webhookVerifyToken || "").trim();
  if (!expected || mode !== "subscribe" || token !== expected) return null;
  return challenge;
}

export async function GET(request: Request) {
  const challenge = verifyWebhook(request);
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ success: true, message: "Webhook WhatsApp Meta Cloud API prêt." });
}

export async function POST(request: Request) {
  const payloadRaw = await request.json().catch(() => null);
  const parsed = whatsappWebhookSchema.safeParse(payloadRaw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Payload webhook invalide." }, { status: 400 });
  }
  const result = await processWhatsAppMetaWebhook(parsed.data);
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
