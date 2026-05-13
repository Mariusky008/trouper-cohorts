import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type CampaignProspect = {
  phoneE164: string;
  metier: string;
  fullName?: string | null;
  requestedMetier?: string | null;
};

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id,is_admin")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.id) return { error: "Profil human_member introuvable." as const };
  if (!data.is_admin) return { error: "Accès admin requis." as const };
  return { ownerMemberId: String(data.id) };
}

function normalizePhone(rawValue?: string | null): string {
  const raw = String(rawValue || "").trim();
  if (!raw) return "";
  const clean = raw.replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean.slice(0, 24);
  if (clean.startsWith("00")) return `+${clean.slice(2, 24)}`;
  if (clean.startsWith("0")) return `+33${clean.slice(1, 24)}`;
  return `+${clean.slice(0, 24)}`;
}

function randomInt(min: number, max: number): number {
  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if ("error" in admin) return NextResponse.json({ success: false, error: admin.error }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const city = String(payload?.city || "Dax").trim() || "Dax";
  const audience = Math.max(1000, Math.min(50000, Math.round(Number(payload?.audience || 12500))));
  const greeting = String(payload?.greeting || "Madame, Monsieur").trim() || "Madame, Monsieur";
  const minDelayMinutes = Math.max(1, Math.min(60, Math.round(Number(payload?.minDelayMinutes || 3))));
  const maxDelayMinutes = Math.max(minDelayMinutes, Math.min(90, Math.round(Number(payload?.maxDelayMinutes || 8))));
  const maxToQueue = Math.max(1, Math.min(120, Math.round(Number(payload?.maxToQueue || 50))));
  const contentSid = String(payload?.contentSid || process.env.TWILIO_WHATSAPP_CONTENT_SID || "").trim();
  if (!contentSid) return NextResponse.json({ success: false, error: "Content SID manquant." }, { status: 400 });

  const prospectsRaw = Array.isArray(payload?.prospects) ? (payload?.prospects as unknown[]) : [];
  const prospects = prospectsRaw
    .map((row) => (row && typeof row === "object" ? (row as Record<string, unknown>) : null))
    .filter(Boolean)
    .map((row) => ({
      phoneE164: normalizePhone(String(row!.phoneE164 || "")),
      metier: String(row!.metier || "").trim(),
      fullName: String(row!.fullName || "").trim() || null,
      requestedMetier: String(row!.requestedMetier || "").trim() || null,
    }))
    .filter((row) => Boolean(row.phoneE164 && row.metier))
    .slice(0, 800);

  if (prospects.length === 0) return NextResponse.json({ success: false, error: "Aucun prospect valide." }, { status: 400 });

  const supabaseAdmin = createAdminClient();
  const campaignId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `campaign_${Date.now()}`;
  const phones = Array.from(new Set(prospects.map((p) => p.phoneE164)));

  const { data: blacklistRows } = await supabaseAdmin
    .from("human_whatsapp_blacklist")
    .select("phone_e164")
    .eq("owner_member_id", admin.ownerMemberId)
    .in("phone_e164", phones);
  const blacklistedSet = new Set(((blacklistRows as Array<{ phone_e164: string | null }> | null) || []).map((r) => String(r.phone_e164 || "")));

  const sinceIso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sentRows } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .select("phone_e164")
    .eq("owner_member_id", admin.ownerMemberId)
    .eq("source", "admin_campaign")
    .gte("created_at", sinceIso)
    .in("phone_e164", phones);
  const alreadyContactedSet = new Set(((sentRows as Array<{ phone_e164: string | null }> | null) || []).map((r) => String(r.phone_e164 || "")));

  const candidates = prospects.filter((p) => !blacklistedSet.has(p.phoneE164) && !alreadyContactedSet.has(p.phoneE164)).slice(0, maxToQueue);
  const skippedBlacklisted = prospects.filter((p) => blacklistedSet.has(p.phoneE164)).length;
  const skippedAlreadyContacted = prospects.filter((p) => alreadyContactedSet.has(p.phoneE164)).length;

  let cumulativeDelayMs = 0;
  const now = Date.now();
  const queueRows = candidates.map((p) => {
    const stepMinutes = randomInt(minDelayMinutes, maxDelayMinutes);
    cumulativeDelayMs += stepMinutes * 60_000;
    const notBeforeAt = new Date(now + cumulativeDelayMs).toISOString();
    return {
      owner_member_id: admin.ownerMemberId,
      phone_e164: p.phoneE164,
      template_name: contentSid,
      language_code: "fr",
      vars: [greeting, p.metier],
      quick_reply_payload: [],
      source: "admin_campaign",
      metadata: {
        provider: "twilio_campaign",
        campaign_id: campaignId,
        city,
        audience,
        diffusion_free: true,
        prospect_name: p.fullName,
        requested_metier: p.requestedMetier,
        content_sid: contentSid,
      },
      status: "scheduled",
      attempt_count: 0,
      max_attempts: 2,
      random_delay_ms: cumulativeDelayMs,
      not_before_at: notBeforeAt,
      updated_at: new Date().toISOString(),
    };
  });

  if (queueRows.length > 0) {
    const { error } = await supabaseAdmin.from("human_whatsapp_outbound_queue").insert(queueRows);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    campaignId,
    queued: queueRows.length,
    skippedBlacklisted,
    skippedAlreadyContacted,
    totalInput: prospects.length,
  });
}

