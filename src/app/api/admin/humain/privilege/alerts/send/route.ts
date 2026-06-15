import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { whatsappTwilioConfig } from "@/lib/popey-human/whatsapp-twilio-config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function withStatus(base: string, status: "success" | "error", message: string) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}marketStatus=${encodeURIComponent(status)}&marketMessage=${encodeURIComponent(message)}`;
}

function toAbsolute(requestUrl: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, requestUrl);
  } catch {
    return new URL("/admin/humain/catalogue", requestUrl);
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Diffuse l'offre d'un commerçant à ses abonnés CONFIRMÉS via la file WhatsApp Twilio
// (sweep cron `twilio-whatsapp-queue`). owner_member_id = l'admin connecté (comme la campagne).
export async function POST(request: Request) {
  const formData = await request.formData();
  const placeId = String(formData.get("place_id") || "").trim();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/catalogue");

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });
  const ok = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", message)), { status: 303 });

  // Auth admin → on a besoin d'un human_members.id valide (owner_member_id NOT NULL dans la file).
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");
  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Accès admin requis.");
  const { data: memberRow } = await supabaseAdmin.from("human_members").select("id").eq("user_id", userId).maybeSingle();
  const ownerMemberId = String(memberRow?.id || "").trim();
  if (!ownerMemberId) return fail("Profil human_member admin introuvable.");

  if (!placeId) return fail("Commerçant manquant.");
  const contentSid = whatsappTwilioConfig.alertBroadcastContentSid;
  if (!contentSid) {
    return fail("Template d'alerte non configuré (env TWILIO_WHATSAPP_CONTENT_SID_ALERT_BROADCAST).");
  }

  // Le commerçant + son offre actuelle (les variables du template de diffusion).
  const { data: place } = await supabaseAdmin
    .from("human_marketplace_places")
    .select("id,company_name,owner_display_name,privilege_badge,offer_description,pro_slug,city")
    .eq("id", placeId)
    .maybeSingle();
  if (!place) return fail("Commerçant introuvable.");
  const p = place as {
    company_name?: string;
    owner_display_name?: string;
    privilege_badge?: string;
    offer_description?: string;
    pro_slug?: string;
    city?: string;
  };
  const merchantName = String(p.company_name || p.owner_display_name || "").trim() || "ce commerçant";
  const offerText = (String(p.privilege_badge || p.offer_description || "").trim() || "une offre exclusive").slice(0, 160);
  const origin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return "https://www.popey.academy";
    }
  })();
  const link = `${origin}/c/${String(p.pro_slug || placeId).trim()}`;

  // Abonnés CONFIRMÉS (double opt-in) uniquement.
  const { data: subs, error: subsError } = await supabaseAdmin
    .from("human_privilege_alert_subscribers")
    .select("phone")
    .eq("place_id", placeId)
    .eq("status", "confirmed")
    .limit(2000);
  if (subsError) {
    if (/human_privilege_alert_subscribers/i.test(String(subsError.message || ""))) {
      return fail("Service d'alertes pas encore activé (migration manquante).");
    }
    return fail(subsError.message || "Lecture des abonnés impossible.");
  }
  const phones = Array.from(
    new Set(((subs as Array<{ phone: string | null }> | null) || []).map((r) => String(r.phone || "").trim()).filter(Boolean)),
  );
  if (phones.length === 0) return fail("Aucun abonné confirmé pour ce commerçant.");

  // Anti-doublon : on ne re-programme pas un numéro déjà en file pour CE commerçant
  // dans les 10 dernières minutes (protège du double-clic).
  const sinceIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("human_whatsapp_outbound_queue")
    .select("phone_e164")
    .eq("source", "privilege_alert_broadcast")
    .gte("created_at", sinceIso)
    .in("phone_e164", phones);
  const recentSet = new Set(((recent as Array<{ phone_e164: string | null }> | null) || []).map((r) => String(r.phone_e164 || "")));
  const targets = phones.filter((ph) => !recentSet.has(ph));
  if (targets.length === 0) return fail("Alerte déjà envoyée à ces abonnés il y a moins de 10 min.");

  const now = Date.now();
  let cumulativeMs = 0;
  const rows = targets.map((phone) => {
    cumulativeMs += randomInt(15_000, 45_000); // étalement doux (~1/min géré aussi par le sweep)
    return {
      owner_member_id: ownerMemberId,
      phone_e164: phone,
      template_name: contentSid,
      language_code: "fr",
      vars: [merchantName, offerText, link],
      quick_reply_payload: [],
      source: "privilege_alert_broadcast",
      metadata: {
        provider: "twilio_campaign",
        content_sid: contentSid,
        kind: "privilege_alert_broadcast",
        place_id: placeId,
        city: p.city || null,
      },
      status: "scheduled",
      attempt_count: 0,
      max_attempts: 3,
      not_before_at: new Date(now + cumulativeMs).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const { error: insertError } = await supabaseAdmin.from("human_whatsapp_outbound_queue").insert(rows);
  if (insertError) return fail(insertError.message || "Mise en file impossible.");

  return ok(`Alerte programmée pour ${rows.length} abonné${rows.length > 1 ? "s" : ""} de ${merchantName}.`);
}
