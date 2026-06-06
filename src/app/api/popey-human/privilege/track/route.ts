import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Events d'engagement du catalogue swipe, écrits dans human_marketplace_events
// (table déjà existante). event_type préfixé "priv_" pour ne pas se mélanger
// avec les events internes (status_changed, etc.).
const ALLOWED_EVENTS = new Set(["view", "favorite", "pass", "reserve", "card_open", "mystery_reveal"]);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { placeId?: string; event?: string; sessionId?: string; ville?: string }
      | null;
    const placeId = String(body?.placeId || "").trim();
    const event = String(body?.event || "").trim();

    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "event invalide" }, { status: 400 });
    }
    // Les places "générées" (catalogue de secours) ont des ids non-UUID et
    // n'existent pas en base → on ignore silencieusement (pas d'erreur FK).
    if (!isUuid(placeId)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("human_marketplace_events").insert({
      place_id: placeId,
      event_type: "priv_" + event,
      payload: {
        session: String(body?.sessionId || "").slice(0, 64) || null,
        ville: String(body?.ville || "").slice(0, 80) || null,
      },
    });
    // On ne casse JAMAIS le catalogue : en cas d'erreur on répond 200.
    if (error) return NextResponse.json({ ok: false }, { status: 200 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
