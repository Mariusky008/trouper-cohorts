import { NextResponse } from "next/server";
import { runTwilioWhatsAppOutboundQueueSweep } from "@/lib/actions/whatsapp-twilio";
import { raisonWhatsAppTwilioIndisponible, whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const { searchParams } = new URL(request.url);
  return searchParams.get("secret") === secret;
}

async function handleQueueCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  // WHATSAPP PAR TWILIO COUPÉ : la file attend, sans compter comme un échec — voir `whatsapp-twilio-config.ts`.
  if (!whatsappTwilioConfig.actif) return NextResponse.json({ skipped: true, reason: raisonWhatsAppTwilioIndisponible() });
  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") || "0");
  const result = await runTwilioWhatsAppOutboundQueueSweep(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function GET(request: Request) {
  return handleQueueCron(request);
}

export async function POST(request: Request) {
  return handleQueueCron(request);
}

