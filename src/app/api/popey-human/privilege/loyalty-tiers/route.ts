import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";

export const dynamic = "force-dynamic";

// POST { token, tiers:[{idx,threshold,reward}] } — le commerçant édite les récompenses de ses paliers.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { token?: string; placeId?: string; tiers?: Array<{ idx?: number; threshold?: number; reward?: string }> }
      | null;
    const cred = String(body?.token || body?.placeId || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });

    const rows = (Array.isArray(body?.tiers) ? body!.tiers : [])
      .map((t, i) => ({
        place_id: placeId,
        idx: Number(t.idx) || i + 1,
        threshold_visits: Number(t.threshold) || i + 1,
        reward_text: String(t.reward || "").trim().slice(0, 160) || "Récompense",
        updated_at: new Date().toISOString(),
      }))
      .filter((r) => r.idx >= 1 && r.idx <= 5)
      .slice(0, 5);
    if (!rows.length) return NextResponse.json({ error: "Paliers manquants." }, { status: 400 });

    const { error } = await supabase_upsert(placeId, rows);
    if (error) {
      if (/human_privilege_loyalty_tiers/i.test(String(error))) {
        return NextResponse.json({ error: "Programme de fidélité pas encore activé (migration manquante)." }, { status: 503 });
      }
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}

async function supabase_upsert(
  _placeId: string,
  rows: Array<{ place_id: string; idx: number; threshold_visits: number; reward_text: string; updated_at: string }>,
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("human_privilege_loyalty_tiers").upsert(rows, { onConflict: "place_id,idx" });
    return { error: error ? error.message : null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "upsert failed" };
  }
}
