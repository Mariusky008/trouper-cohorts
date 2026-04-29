import { NextResponse } from "next/server";
import { processWhatsApp360DialogWebhook } from "@/lib/actions/whatsapp-360dialog";
import { whatsapp360Config } from "@/lib/popey-human/whatsapp-360dialog-config";
import { whatsappWebhookSchema } from "@/lib/popey-human/whatsapp-360dialog-validation";

export const dynamic = "force-dynamic";

function verifyWebhook(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (!mode || !token || !challenge) return null;
  const expected = String(whatsapp360Config.webhookVerifyToken || "").trim();
  if (!expected || mode !== "subscribe" || token !== expected) return null;
  return challenge;
}

export async function GET(request: Request) {
  const challenge = verifyWebhook(request);
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ success: true, message: "Webhook WhatsApp 360dialog prêt." });
}

export async function POST(request: Request) {
  const payloadRaw = await request.json().catch(() => null);
  const parsed = whatsappWebhookSchema.safeParse(payloadRaw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Payload webhook invalide." }, { status: 400 });
  }
  const result = await processWhatsApp360DialogWebhook(parsed.data);
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
