import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164, statusForLevel, nextReward, generateVisitCode, DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// POST { id, phone, name, consent? } — réserve UNE place du Coup de feu (deep-link /o/<id>) :
// décompte la place, identifie le membre, garde la relation, enregistre la réservation (liée à la
// campagne), (ré)abonne aux alertes, génère le code de visite. Renvoie code + niveau + places restantes.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { id?: string; phone?: string; name?: string; consent?: boolean; refId?: string }
      | null;
    const id = String(body?.id || "").trim();
    const phone = toE164(String(body?.phone || ""));
    const name = String(body?.name || "").trim().slice(0, 40);
    const consent = body?.consent !== false; // venu d'un canal opt-in (message WhatsApp) → abonné par défaut
    if (!isUuid(id)) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: campaign } = await supabase
      .from("human_privilege_coup_campaigns")
      .select("id,place_id,total_places,places_taken,status,expires_at")
      .eq("id", id)
      .maybeSingle();
    if (!campaign) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    const c = campaign as {
      place_id: string;
      total_places: number;
      places_taken: number;
      status: string;
      expires_at: string | null;
    };
    const expired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
    if (c.status !== "live" || expired) return NextResponse.json({ error: "Ce coup de feu est terminé." }, { status: 409 });
    const taken = Number(c.places_taken) || 0;
    if (c.total_places > 0 && taken >= c.total_places) return NextResponse.json({ error: "Plus de place disponible." }, { status: 409 });

    const placeId = c.place_id;

    // 1) Décompte la place (optimiste). Auto-clôture si la dernière place part.
    const newTaken = taken + 1;
    try {
      await supabase
        .from("human_privilege_coup_campaigns")
        .update({
          places_taken: newTaken,
          updated_at: nowIso,
          ...(c.total_places > 0 && newTaken >= c.total_places ? { status: "done" } : {}),
        })
        .eq("id", id)
        .eq("places_taken", taken);
    } catch {
      /* résilient */
    }

    // 2) Membre (identité légère par numéro).
    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("city,city_slug")
      .eq("id", placeId)
      .maybeSingle();
    const city = (place as { city?: string } | null)?.city || null;
    const citySlug = (place as { city_slug?: string } | null)?.city_slug || null;
    try {
      await supabase
        .from("human_privilege_members")
        .upsert({ phone_e164: phone, first_name: name || null, city, updated_at: nowIso }, { onConflict: "phone_e164" });
    } catch {
      /* résilient */
    }

    // 3) Relation (niveau 0 si absente ; le niveau ne monte qu'à la visite validée).
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

    // 4) Réservation liée à la campagne (funnel + décompte cohérent).
    try {
      await supabase.from("human_privilege_reservations").insert({
        place_id: placeId,
        member_phone: phone,
        campaign_id: id,
        ref_id: String(body?.refId || "").trim().slice(0, 80) || null,
      });
    } catch {
      /* résilient (colonne campaign_id absente → l'insert simple est retenté ci-dessous) */
      try {
        await supabase.from("human_privilege_reservations").insert({ place_id: placeId, member_phone: phone });
      } catch {
        /* résilient */
      }
    }

    // 5) Opt-in alertes (reste/devient un fan joignable).
    if (consent) {
      try {
        await supabase.from("human_privilege_alert_subscribers").upsert(
          {
            place_id: placeId,
            city,
            city_slug: citySlug,
            phone,
            status: "confirmed",
            consent_text: "Abonné aux alertes du commerçant via un Coup de feu Popey. STOP pour se désinscrire.",
            consent_at: nowIso,
            confirmed_at: nowIso,
            source: "coup_de_feu",
            updated_at: nowIso,
          },
          { onConflict: "place_id,phone" },
        );
      } catch {
        /* résilient */
      }
    }

    // 6) Code de visite à 4 chiffres.
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
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("human_privilege_visits").insert({
        place_id: placeId,
        member_phone: phone,
        code,
        status: "pending",
        expires_at: expires,
      });
    } catch {
      /* résilient → code non persisté mais renvoyé */
    }

    // Paliers (prochaine récompense).
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

    const placesLeft = c.total_places > 0 ? Math.max(0, c.total_places - newTaken) : null;
    return NextResponse.json({
      ok: true,
      code,
      level,
      status: statusForLevel(level),
      next: nextReward(level, tiers),
      placesLeft,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
