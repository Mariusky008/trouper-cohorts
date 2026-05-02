import { NextResponse } from "next/server";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ActivationRow = {
  id: string;
  city: string | null;
  client_name: string | null;
  referrer_name: string | null;
  partner_name: string | null;
  partner_phone: string | null;
  partner_member_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const { searchParams } = new URL(request.url);
  return searchParams.get("secret") === secret;
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function txt(value: unknown) {
  return String(value || "").trim();
}

function normalizePhone(raw: string) {
  let digits = txt(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return "";
  return `+${digits}`;
}

function readTicketStatus(metadata: Record<string, unknown>) {
  const raw = txt(metadata.workflow_status || "pending").toLowerCase();
  if (raw === "new") return "pending";
  if (raw === "rdv") return "in_progress";
  if (raw === "signed") return "validated";
  if (raw === "closed") return "refused";
  if (!["pending", "contacted", "in_progress", "validated", "refused"].includes(raw)) return "pending";
  return raw;
}

function readTicketCode(metadata: Record<string, unknown>, activationId: string) {
  const code = txt(metadata.ticket_code);
  if (code) return code;
  return `POPEY-${activationId.slice(0, 6).toUpperCase()}`;
}

function buildReminderMessage(input: {
  partnerName: string;
  ticketCode: string;
  referrerName: string;
}) {
  return (
    `Salut ${input.partnerName} ! Hier, un client t'a contacté pour le privilège #${input.ticketCode} ` +
    `(via ${input.referrerName}). La vente a-t-elle été conclue ?\n` +
    "Réponds simplement : OUI VALIDE ou NON EN COURS."
  );
}

async function handleCron(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get("dryRun") === "1";
  const limitRaw = Number(searchParams.get("limit") || "80");
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? Math.round(limitRaw) : 80));
  const minAgeHoursRaw = Number(searchParams.get("minAgeHours") || "24");
  const minAgeHours = Math.max(1, Math.min(240, Number.isFinite(minAgeHoursRaw) ? Math.round(minAgeHoursRaw) : 24));
  const cutoffIso = new Date(Date.now() - minAgeHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("human_marketplace_landing_activations")
    .select("id,city,client_name,referrer_name,partner_name,partner_phone,partner_member_id,created_at,metadata")
    .lte("created_at", cutoffIso)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const rows = (data as ActivationRow[] | null) || [];
  let scanned = 0;
  let eligible = 0;
  let sent = 0;
  let skipped = 0;
  const failures: Array<{ activationId: string; reason: string }> = [];

  for (const row of rows) {
    scanned += 1;
    const metadata = asMetadata(row.metadata);
    const status = readTicketStatus(metadata);
    const alreadySentAt = txt(metadata.pro_followup_sent_at);
    const phone = normalizePhone(txt(row.partner_phone));
    const ownerMemberId = txt(row.partner_member_id);

    if (!phone || !ownerMemberId) {
      skipped += 1;
      continue;
    }
    if (alreadySentAt) {
      skipped += 1;
      continue;
    }
    if (status === "validated" || status === "refused") {
      skipped += 1;
      continue;
    }

    eligible += 1;
    const ticketCode = readTicketCode(metadata, row.id);
    const partnerName = txt(row.partner_name) || "Partenaire";
    const referrerName = txt(row.referrer_name) || "apporteur";
    const message = buildReminderMessage({ partnerName, ticketCode, referrerName });

    if (dryRun) continue;

    const sendResult = await sendWhatsAppTextMessage(phone, message, {
      ownerMemberId,
      source: "marketplace_ticket_followup_j1",
      metadata: {
        flow: "marketplace_ticket_followup_j1",
        marketplace_activation_id: row.id,
        ticket_code: ticketCode,
        city: txt(row.city),
        referrer_name: referrerName,
        client_name: txt(row.client_name),
      },
    });

    if (!sendResult.success) {
      failures.push({ activationId: row.id, reason: sendResult.error || "send_failed" });
      continue;
    }

    const nextMetadata = {
      ...metadata,
      pro_followup_sent_at: new Date().toISOString(),
      pro_followup_provider: "twilio",
      pro_followup_message_sid: sendResult.sid || null,
      pro_followup_status: "sent",
    };
    await supabaseAdmin
      .from("human_marketplace_landing_activations")
      .update({ metadata: nextMetadata })
      .eq("id", row.id);

    await supabaseAdmin.from("human_marketplace_landing_events").insert({
      event_type: "pro_followup_sent",
      city: txt(row.city) || null,
      category_key: null,
      place_id: null,
      client_id: null,
      referrer_id: null,
      partner_member_id: ownerMemberId,
      source: "marketplace_ticket_followup_j1",
      metadata: {
        activation_id: row.id,
        ticket_code: ticketCode,
        provider_message_sid: sendResult.sid || null,
      },
    });

    sent += 1;
  }

  return NextResponse.json({
    success: failures.length === 0,
    dryRun,
    minAgeHours,
    cutoffIso,
    scanned,
    eligible,
    sent,
    skipped,
    failures,
  });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
