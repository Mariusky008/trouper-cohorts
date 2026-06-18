import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164 } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// POST { phone, name, ville?, placeIds:[], consent } — capture du lead côté catalogue (après 3 « Je veux »).
// Identifie le membre (numéro) et, avec consentement IN-APP (= l'opt-in, pas de double opt-in WhatsApp),
// l'abonne aux alertes « Coup de feu » des commerçants qu'il a voulus. Crée aussi la relation (niveau 0).
// Tout résilient : tables absentes → ne casse pas.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { phone?: string; name?: string; ville?: string; placeIds?: string[]; consent?: boolean }
      | null;
    const phone = toE164(String(body?.phone || ""));
    const name = String(body?.name || "").trim().slice(0, 40);
    const consent = body?.consent !== false;
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
    const placeIds = Array.from(new Set((Array.isArray(body?.placeIds) ? body!.placeIds : []).map((x) => String(x || "").trim()).filter(isUuid))).slice(0, 30);

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // Villes des commerçants (pour les lignes d'abonnement).
    const cityById = new Map<string, { city: string | null; citySlug: string | null }>();
    if (placeIds.length) {
      try {
        const { data: places } = await supabase.from("human_marketplace_places").select("id,city,city_slug").in("id", placeIds);
        ((places as Array<{ id: string; city: string | null; city_slug: string | null }> | null) || []).forEach((p) =>
          cityById.set(p.id, { city: p.city, citySlug: p.city_slug }),
        );
      } catch {
        /* résilient */
      }
    }
    const fallbackCity = String(body?.ville || "").trim() || null;

    // Membre (identité légère par numéro).
    try {
      await supabase
        .from("human_privilege_members")
        .upsert({ phone_e164: phone, first_name: name || null, city: fallbackCity, updated_at: nowIso }, { onConflict: "phone_e164" });
    } catch {
      /* résilient */
    }

    let followed = 0;
    for (const placeId of placeIds) {
      const loc = cityById.get(placeId) || { city: fallbackCity, citySlug: null };
      // Relation (niveau 0 si absente).
      try {
        const { data: rel } = await supabase
          .from("human_privilege_relationships")
          .select("id")
          .eq("place_id", placeId)
          .eq("member_phone", phone)
          .maybeSingle();
        if (!rel) await supabase.from("human_privilege_relationships").insert({ place_id: placeId, member_phone: phone, level: 0 });
      } catch {
        /* résilient */
      }
      // Abonnement « Coup de feu » — consentement IN-APP = l'opt-in (pas de double opt-in WhatsApp).
      if (consent) {
        try {
          await supabase.from("human_privilege_alert_subscribers").upsert(
            {
              place_id: placeId,
              city: loc.city,
              city_slug: loc.citySlug,
              phone,
              status: "confirmed",
              consent_text: "Veut être prévenu·e en premier des Coups de feu de ce commerçant (opt-in in-app via « Je veux »). STOP à tout moment.",
              consent_at: nowIso,
              confirmed_at: nowIso,
              source: "want",
              updated_at: nowIso,
            },
            { onConflict: "place_id,phone" },
          );
          followed += 1;
        } catch {
          /* table absente → résilient */
        }
      }
    }

    return NextResponse.json({ ok: true, followed });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
