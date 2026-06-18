import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { statusForLevel, DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";
import { sendPrivilegeMatchNotif } from "@/lib/actions/whatsapp-twilio";

export const dynamic = "force-dynamic";

// POST { token, code, amount? } — LE moment-clé. Le pro saisit le code à 4 chiffres du client.
// SEUL événement qui : +1 niveau, débloque la récompense du palier, débloque l'avis vérifié,
// compte le revenu. Anti-triche : impossible de monter de niveau sans cette action en boutique.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { token?: string; placeId?: string; code?: string; amount?: number }
      | null;
    const cred = String(body?.token || body?.placeId || "").trim();
    const code = String(body?.code || "").trim();
    if (!/^\d{4}$/.test(code)) return NextResponse.json({ error: "Code à 4 chiffres requis." }, { status: 400 });

    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // Visite en attente correspondant à CE commerçant + ce code, non expirée.
    const { data: visit, error: visitErr } = await supabase
      .from("human_privilege_visits")
      .select("id,member_phone,offer_id,expires_at,status")
      .eq("place_id", placeId)
      .eq("code", code)
      .eq("status", "pending")
      .gte("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (visitErr && /human_privilege_visits/i.test(String(visitErr.message || ""))) {
      return NextResponse.json({ error: "Service de visites pas encore activé (migration manquante)." }, { status: 503 });
    }
    if (!visit) return NextResponse.json({ error: "Code invalide ou expiré." }, { status: 404 });
    const memberPhone = String((visit as { member_phone: string }).member_phone);
    const amount = body?.amount != null && Number.isFinite(Number(body.amount)) ? Number(body.amount) : null;

    // Marque la visite validée.
    await supabase
      .from("human_privilege_visits")
      .update({ status: "validated", validated_at: nowIso, validated_by: cred.slice(0, 80), amount_eur: amount })
      .eq("id", (visit as { id: string }).id);

    // Relation : +1 niveau.
    let newLevel = 1;
    const { data: rel } = await supabase
      .from("human_privilege_relationships")
      .select("id,level,first_visit_at")
      .eq("place_id", placeId)
      .eq("member_phone", memberPhone)
      .maybeSingle();
    if (rel) {
      newLevel = (Number((rel as { level: number }).level) || 0) + 1;
      await supabase
        .from("human_privilege_relationships")
        .update({
          level: newLevel,
          last_visit_at: nowIso,
          first_visit_at: (rel as { first_visit_at?: string }).first_visit_at || nowIso,
          updated_at: nowIso,
        })
        .eq("id", (rel as { id: string }).id);
    } else {
      newLevel = 1;
      await supabase
        .from("human_privilege_relationships")
        .insert({ place_id: placeId, member_phone: memberPhone, level: 1, first_visit_at: nowIso, last_visit_at: nowIso });
    }

    // Récompense débloquée = palier dont le seuil == niveau atteint (sinon aucun nouveau palier).
    let tiers: LoyaltyTier[] = DEFAULT_TIERS;
    try {
      const { data: tierRows } = await supabase
        .from("human_privilege_loyalty_tiers")
        .select("idx,threshold_visits,reward_text")
        .eq("place_id", placeId)
        .order("idx", { ascending: true });
      if (Array.isArray(tierRows) && tierRows.length) tiers = tierRows as LoyaltyTier[];
    } catch {
      /* résilient */
    }
    const reachedTier = tiers.find((t) => t.threshold_visits === newLevel);

    // Prénom du membre (affichage) + nom/ville du commerçant (pour la notif match).
    let name = "Client";
    let merchantName = "ton commerçant";
    let citySlug = "";
    try {
      const { data: mem } = await supabase
        .from("human_privilege_members")
        .select("first_name")
        .eq("phone_e164", memberPhone)
        .maybeSingle();
      const fn = String((mem as { first_name?: string } | null)?.first_name || "").trim();
      if (fn) name = fn;
    } catch {
      /* résilient */
    }
    try {
      const { data: place } = await supabase
        .from("human_marketplace_places")
        .select("company_name,owner_display_name,city_slug")
        .eq("id", placeId)
        .maybeSingle();
      const pl = (place as Record<string, unknown>) || {};
      merchantName = String(pl.company_name || pl.owner_display_name || "").trim() || merchantName;
      citySlug = String(pl.city_slug || "").trim();
    } catch {
      /* résilient */
    }

    // « C'est un match » : notif WhatsApp directe → l'animation match + l'avis vérifié (no-op si
    // le template n'est pas encore configuré ; ne bloque jamais la validation).
    try {
      const origin = (() => {
        try {
          return new URL(request.url).origin;
        } catch {
          return "https://www.popey.academy";
        }
      })();
      const link = citySlug ? `${origin}/m/${citySlug}?match=${placeId}` : origin;
      await sendPrivilegeMatchNotif(memberPhone, {
        merchantName,
        reward: reachedTier ? reachedTier.reward_text : "une nouvelle étape de ta relation",
        link,
      });
    } catch {
      /* résilient */
    }

    return NextResponse.json({
      ok: true,
      visitId: (visit as { id: string }).id,
      name,
      level: newLevel,
      status: statusForLevel(newLevel),
      reward: reachedTier ? reachedTier.reward_text : null,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
