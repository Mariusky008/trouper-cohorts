import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Events d'engagement du catalogue swipe, écrits dans human_marketplace_events
// (table déjà existante). event_type préfixé "priv_" pour ne pas se mélanger
// avec les events internes (status_changed, etc.).
// "open" = ouverture du catalogue via le lien d'un membre (clic sur le lien partagé).
const ALLOWED_EVENTS = new Set([
  "open", "view", "favorite", "pass", "reserve", "card_open", "mystery_reveal",
  // Cartes "Profil Tinder" commerçant (place_id null, profil dans le payload)
  "tinder_shown", "tinder_match", "tinder_wa",
]);
// Events non liés à une place précise → insérés avec place_id null.
const PLACELESS_EVENTS = new Set(["open", "tinder_shown", "tinder_match", "tinder_wa"]);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { placeId?: string; event?: string; sessionId?: string; ville?: string; ref?: string; refName?: string; profileId?: string }
      | null;
    const placeId = String(body?.placeId || "").trim();
    const event = String(body?.event || "").trim();

    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "event invalide" }, { status: 400 });
    }

    const payload = {
      session: String(body?.sessionId || "").slice(0, 64) || null,
      ville: String(body?.ville || "").slice(0, 80) || null,
      // Référent (membre qui a partagé le lien) → base du leaderboard.
      ref: String(body?.ref || "").slice(0, 120) || null,
      ref_name: String(body?.refName || "").slice(0, 120) || null,
      // Profil Tinder concerné (pour le tracking shown/match/wa par commerçant).
      profile_id: String(body?.profileId || "").slice(0, 64) || null,
    };

    const supabase = createAdminClient();

    // Events sans place précise (ouverture, profils Tinder) → place_id null autorisé.
    if (PLACELESS_EVENTS.has(event)) {
      const { error } = await supabase
        .from("human_marketplace_events")
        .insert({ place_id: null, event_type: "priv_" + event, payload });
      if (error) {
        console.error("[privilege/track] insert error", error.message);
        return NextResponse.json({ ok: false }, { status: 200 });
      }
      return NextResponse.json({ ok: true });
    }

    // Les places "générées" (catalogue de secours) ont des ids non-UUID et
    // n'existent pas en base → on ignore silencieusement (pas d'erreur FK).
    if (!isUuid(placeId)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const { error } = await supabase.from("human_marketplace_events").insert({
      place_id: placeId,
      event_type: "priv_" + event,
      payload,
    });
    // On ne casse JAMAIS le catalogue : en cas d'erreur on répond 200.
    if (error) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
