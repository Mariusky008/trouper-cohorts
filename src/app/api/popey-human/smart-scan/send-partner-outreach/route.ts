import { NextRequest, NextResponse } from "next/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";
import { prepareSmartScanWhatsAppPayload } from "@/lib/actions/human-smart-scan";
import { sendPartnerOutreach } from "@/lib/actions/whatsapp-twilio";
import { smartScanFeatureFlags } from "@/lib/popey-human/smart-scan-config";
import { isWhatsAppTwilioConfigured, whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";
import { smartScanSendPartnerOutreachSchema } from "@/lib/popey-human/whatsapp-twilio-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function extractPhoneFromWaUrl(url: string) {
  const match = String(url || "").match(/wa\.me\/(\d+)/i);
  return match?.[1] ? `+${match[1]}` : "";
}

function firstNameFromFullName(fullName: string | undefined) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts[0] || "Bonjour";
}

export async function POST(request: NextRequest) {
  if (!smartScanFeatureFlags.enabled) {
    return NextResponse.json({ error: "Smart Scan desactive." }, { status: 503 });
  }

  const parsed = smartScanSendPartnerOutreachSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload Twilio invalide pour l'envoi partenaire." }, { status: 400 });
  }
  const body = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Session requise." }, { status: 401 });
  }

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured?.id) {
    return NextResponse.json({ error: "Profil Popey Human introuvable." }, { status: 400 });
  }

  const prepared = await prepareSmartScanWhatsAppPayload({
    contactId: body.contactId,
    externalContactRef: body.externalContactRef,
    fullName: body.fullName,
    city: body.city,
    companyHint: body.companyHint,
    actionType: body.actionType,
    messageDraft: body.messageDraft,
    phoneE164: body.phoneE164 || null,
  });
  if ("error" in prepared) {
    return NextResponse.json({ error: prepared.error }, { status: 400 });
  }

  const phone = String(body.phoneE164 || extractPhoneFromWaUrl(prepared.whatsappUrl || "")).trim();
  if (!phone) {
    return NextResponse.json({ error: "Numero WhatsApp introuvable pour ce contact." }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();
  const { data: memberProfile } = await supabaseAdmin
    .from("human_members")
    .select("first_name")
    .eq("id", ensured.id)
    .maybeSingle();
  const senderFirstName = String(memberProfile?.first_name || "").trim() || "Popey";
  const prospectFirstName = firstNameFromFullName(body.fullName);
  const cityOrContext = String(body.city || body.companyHint || "").trim() || "votre ville";
  const targetJob = String(body.variables?.[4] || body.companyHint || "").trim();
  if (!targetJob) {
    return NextResponse.json(
      { error: "Le métier prospect (variable {{4}}) est obligatoire pour envoyer le template Twilio." },
      { status: 400 },
    );
  }

  if (!isWhatsAppTwilioConfigured()) {
    return NextResponse.json(
      {
        error: "Twilio WhatsApp non configuré (Sandbox).",
        fallback: { whatsappUrl: prepared.whatsappUrl },
      },
      { status: 400 },
    );
  }

  const result = await sendPartnerOutreach(
    phone,
    {
      1: body.variables?.[1] || prospectFirstName,
      2: body.variables?.[2] || senderFirstName,
      3: body.variables?.[3] || cityOrContext,
      4: body.variables?.[4] || targetJob,
    },
    {
      ownerMemberId: ensured.id,
      source: "smart_scan_daily_scan",
      metadata: {
        smart_scan_contact_id: prepared.contactId,
        external_contact_ref: body.externalContactRef || null,
        action_type: body.actionType,
        message_draft: body.messageDraft,
        quick_reply_expected: ["Oui, avec plaisir", "Pas pour le moment"],
      },
    },
  );

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        fallback: { whatsappUrl: prepared.whatsappUrl },
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    provider: "twilio",
    sid: result.sid,
    status: result.status,
    sandbox: {
      active: whatsappTwilioConfig.isSandbox,
      from: whatsappTwilioConfig.whatsappFrom,
      joinCode: whatsappTwilioConfig.sandboxJoinCode || null,
    },
    callback: {
      inboundWebhookUrl: whatsappTwilioConfig.inboundWebhookUrl || null,
      statusCallbackUrl: whatsappTwilioConfig.statusCallbackUrl || null,
    },
  });
}
