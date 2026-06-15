import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toE164(raw: string): string | null {
  let s = String(raw || "").trim().replace(/[\s.\-()]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0[1-9]\d{8}$/.test(s)) return "+33" + s.slice(1);
  if (/^33[1-9]\d{8}$/.test(s)) return "+" + s;
  if (/^\+33[1-9]\d{8}$/.test(s)) return s;
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
  return null;
}

type ReviewRow = { place_id: string; rating: number | null; author_name: string | null; comment: string | null; created_at: string };

function summarize(rows: Array<{ rating: number | null }>): { count: number; avg: number } {
  const rated = rows.map((r) => Number(r.rating || 0)).filter((n) => n >= 1 && n <= 5);
  const count = rows.length;
  const avg = rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : 0;
  return { count, avg };
}

// POST : un visiteur laisse un avis (note + commentaire) → enregistré 'pending' (modération admin).
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { placeId?: string; name?: string; phone?: string; rating?: number; comment?: string; ville?: string; refId?: string }
      | null;
    const placeId = String(body?.placeId || "").trim();
    const eventId = String((body as { eventId?: string })?.eventId || "").trim();
    const name = String(body?.name || "").trim().slice(0, 40);
    const phone = toE164(String(body?.phone || ""));
    const rating = Math.round(Number(body?.rating || 0));
    const comment = String(body?.comment || "").trim().slice(0, 600);

    const isEvent = !placeId && isUuid(eventId);
    if (!isEvent && !isUuid(placeId)) return NextResponse.json({ error: "Cible invalide." }, { status: 400 });
    if (name.length < 2) return NextResponse.json({ error: "Prénom requis." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
    if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Note (1 à 5 étoiles) requise." }, { status: 400 });
    if (comment.length < 3) return NextResponse.json({ error: "Commentaire requis." }, { status: 400 });

    const supabase = createAdminClient();
    const base = {
      author_name: name,
      author_phone: phone,
      rating,
      comment,
      status: "pending" as const,
      source: "catalogue",
      ref_id: String(body?.refId || "").trim().slice(0, 80) || null,
    };
    let insertRow: Record<string, unknown>;
    if (isEvent) {
      const { data: ev } = await supabase
        .from("human_privilege_local_events")
        .select("id,city")
        .eq("id", eventId)
        .maybeSingle();
      if (!ev) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
      insertRow = { ...base, event_id: eventId, city: (ev as { city?: string }).city || null };
    } else {
      const { data: place } = await supabase
        .from("human_marketplace_places")
        .select("id,city,city_slug")
        .eq("id", placeId)
        .maybeSingle();
      if (!place) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });
      insertRow = {
        ...base,
        place_id: placeId,
        city: (place as { city?: string }).city || null,
        city_slug: (place as { city_slug?: string }).city_slug || null,
      };
    }

    const { error } = await supabase.from("human_marketplace_place_comments").insert(insertRow);
    if (error) {
      if (/human_marketplace_place_comments/i.test(String(error.message || ""))) {
        return NextResponse.json({ error: "Avis pas encore activés." }, { status: 503 });
      }
      return NextResponse.json({ error: "Publication impossible pour le moment." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, pending: true });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}

// GET ?placeId=X       → avis APPROUVÉS d'un commerçant + { count, avg }
// GET ?ids=a,b,c       → résumé { [placeId]: { count, avg } } (pour les pastilles ⭐ des cartes)
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const placeId = String(params.get("placeId") || "").trim();
    const eventId = String(params.get("eventId") || "").trim();
    const idsRaw = String(params.get("ids") || "").trim();
    const supabase = createAdminClient();

    const targetCol = eventId ? "event_id" : "place_id";
    const targetId = eventId || placeId;
    if (targetId) {
      if (!isUuid(targetId)) return NextResponse.json({ reviews: [], count: 0, avg: 0 });
      const { data, error } = await supabase
        .from("human_marketplace_place_comments")
        .select("rating,author_name,comment,created_at")
        .eq(targetCol, targetId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return NextResponse.json({ reviews: [], count: 0, avg: 0 });
      const rows = (data as ReviewRow[] | null) || [];
      return NextResponse.json({
        reviews: rows.map((r) => ({
          name: String(r.author_name || "Client"),
          rating: Number(r.rating || 0),
          comment: String(r.comment || ""),
          createdAt: r.created_at,
        })),
        ...summarize(rows),
      });
    }

    if (idsRaw) {
      const ids = Array.from(new Set(idsRaw.split(",").map((s) => s.trim()).filter(isUuid))).slice(0, 300);
      if (!ids.length) return NextResponse.json({ summary: {} });
      const { data, error } = await supabase
        .from("human_marketplace_place_comments")
        .select("place_id,rating")
        .in("place_id", ids)
        .eq("status", "approved")
        .limit(5000);
      if (error) return NextResponse.json({ summary: {} });
      const byPlace = new Map<string, Array<{ rating: number | null }>>();
      ((data as Array<{ place_id: string; rating: number | null }> | null) || []).forEach((r) => {
        const arr = byPlace.get(r.place_id) || [];
        arr.push({ rating: r.rating });
        byPlace.set(r.place_id, arr);
      });
      const summary: Record<string, { count: number; avg: number }> = {};
      byPlace.forEach((rows, pid) => {
        summary[pid] = summarize(rows);
      });
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: "placeId ou ids requis." }, { status: 400 });
  } catch {
    return NextResponse.json({ summary: {} });
  }
}
