import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164, statusForLevel, nextReward, generateVisitCode, DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// POST { placeId, phone, name, ville?, refId?, consent?, offerId? }
// Le cœur du parcours client : identifie le membre (numéro), crée/garde la relation, enregistre
// la réservation, l'ABONNE aux alertes du commerçant (sa base de fans pour le Coup de feu, si
// consentement), et génère un CODE de visite à 4 chiffres (montré en boutique pour validation).
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { placeId?: string; phone?: string; name?: string; ville?: string; refId?: string; consent?: boolean; offerId?: string }
      | null;
    const placeId = String(body?.placeId || "").trim();
    const phone = toE164(String(body?.phone || ""));
    const name = String(body?.name || "").trim().slice(0, 40);
    const consent = body?.consent === true;
    const offerId = isUuid(String(body?.offerId || "")) ? String(body?.offerId).trim() : null;

    if (!isUuid(placeId)) return NextResponse.json({ error: "Commerçant invalide." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("id,city,city_slug,company_name")
      .eq("id", placeId)
      .maybeSingle();
    if (!place) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });
    const city = (place as { city?: string }).city || null;
    const citySlug = (place as { city_slug?: string }).city_slug || null;

    // 1) Membre (identité légère par numéro).
    try {
      await supabase
        .from("human_privilege_members")
        .upsert({ phone_e164: phone, first_name: name || null, city: city, updated_at: nowIso }, { onConflict: "phone_e164" });
    } catch {
      /* table absente → résilient */
    }

    // 2) Relation (créée au niveau 0 si absente ; le niveau ne monte qu'à la visite validée).
    let level = 0;
    try {
      const { data: rel } = await supabase
        .from("human_privilege_relationships")
        .select("level")
        .eq("place_id", placeId)
        .eq("member_phone", phone)
        .maybeSingle();
      if (rel && typeof (rel as { level?: number }).level === "number") level = Number((rel as { level: number }).level) || 0;
      else await supabase.from("human_privilege_relationships").insert({ place_id: placeId, member_phone: phone, level: 0 });
    } catch {
      /* résilient */
    }

    // 3) Réservation (funnel pro).
    try {
      await supabase.from("human_privilege_reservations").insert({
        place_id: placeId,
        member_phone: phone,
        offer_id: offerId,
        ref_id: String(body?.refId || "").trim().slice(0, 80) || null,
      });
    } catch {
      /* résilient */
    }

    // 4) Opt-in alertes (la base de fans joignable par Coup de feu). Consentement explicite in-app.
    if (consent) {
      try {
        await supabase.from("human_privilege_alert_subscribers").upsert(
          {
            place_id: placeId,
            city,
            city_slug: citySlug,
            phone,
            status: "confirmed",
            consent_text: "Abonné aux alertes du commerçant via une réservation Popey. STOP pour se désinscrire.",
            consent_at: nowIso,
            confirmed_at: nowIso,
            source: "reservation",
            updated_at: nowIso,
          },
          { onConflict: "place_id,phone" },
        );
      } catch {
        /* table absente → résilient */
      }
    }

    // 5) Code de visite à 4 chiffres (unique parmi les pending non expirés de CE commerçant).
    let code = generateVisitCode();
    try {
      const { data: actives } = await supabase
        .from("human_privilege_visits")
        .select("code")
        .eq("place_id", placeId)
        .eq("status", "pending")
        .gte("expires_at", nowIso);
      const used = new Set(((actives as Array<{ code: string }> | null) || []).map((r) => String(r.code)));
      for (let i = 0; i < 8 && used.has(code); i += 1) code = generateVisitCode();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // valide 24 h
      await supabase.from("human_privilege_visits").insert({
        place_id: placeId,
        member_phone: phone,
        offer_id: offerId,
        code,
        status: "pending",
        expires_at: expires,
      });
    } catch {
      /* table absente → on renvoie quand même un code (non persisté) pour ne pas bloquer l'UI */
    }

    // Paliers (pour la prochaine récompense affichée côté client).
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

    return NextResponse.json({
      ok: true,
      code,
      level,
      status: statusForLevel(level),
      next: nextReward(level, tiers),
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
