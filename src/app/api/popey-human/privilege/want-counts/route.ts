import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// GET ?ids=id1,id2,… → nombre de « Je veux » (sessions distinctes ayant fait priv_favorite ce mois)
// par commerçant : { counts: { placeId: n } }. Sert de preuve sociale « zéro-state » quand il n'y a pas
// encore d'avis. Résilient (table absente → {}).
export async function GET(request: NextRequest) {
  try {
    const idsRaw = String(request.nextUrl.searchParams.get("ids") || "");
    const ids = Array.from(new Set(idsRaw.split(",").map((s) => s.trim()).filter(isUuid))).slice(0, 300);
    if (!ids.length) return NextResponse.json({ counts: {} });

    const supabase = createAdminClient();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const { data, error } = await supabase
      .from("human_marketplace_events")
      .select("place_id,payload")
      .eq("event_type", "priv_favorite")
      .in("place_id", ids)
      .gte("created_at", monthStart)
      .limit(50000);
    if (error) return NextResponse.json({ counts: {} });

    // Sessions distinctes par commerçant (évite qu'une personne gonfle le compteur).
    const sessionsByPlace = new Map<string, Set<string>>();
    ((data as Array<{ place_id: string; payload: Record<string, unknown> | null }> | null) || []).forEach((r) => {
      const pid = String(r.place_id || "");
      if (!pid) return;
      const session = String((r.payload as { session?: unknown } | null)?.session || "").trim() || Math.random().toString(36);
      if (!sessionsByPlace.has(pid)) sessionsByPlace.set(pid, new Set());
      sessionsByPlace.get(pid)!.add(session);
    });
    const counts: Record<string, number> = {};
    sessionsByPlace.forEach((set, pid) => {
      counts[pid] = set.size;
    });
    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}
