// 🛎️ ACTIVITÉ (`lib/direct/activite.ts`, `activite-serveur.ts` ; `docs/univers/discussions-video.md`, le lot A4).
// Seulement pour quelqu'un de ClikMe (le cookie d'habitant).
//
// GET                → { lignes, nouveau } : une ligne par discussion (les réponses directes en haut, puis le nouveau)
// GET ?compter=1     → { nouveau } : combien de discussions ont du nouveau (la cloche ; sans ouvrir un fichier)
// POST { action: "lu" } → { ok } : tout marquer lu
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { monActivite, toutMarquerLu } from "@/lib/direct/activite-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const compter = new URL(request.url).searchParams.get("compter") === "1";
  const a = await monActivite(supabase, moi.id, { compter });
  return NextResponse.json(compter ? { nouveau: a.nouveau } : a, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (p.action !== "lu") return NextResponse.json({ error: "Demande inconnue." }, { status: 400, headers: sansCache });
  await toutMarquerLu(supabase, moi.id);
  return NextResponse.json({ ok: true }, { headers: sansCache });
}
