// 🚫 UNE VIDÉO QUE YOUTUBE REFUSE DE LIRE ICI (27 novembre 2026 ; `selection-serveur.ts`, `videoRefusee`). Le lecteur de
// quelqu'un de ClikMe (le cookie d'habitant) a reçu l'erreur 101 ou 150 (« lecture désactivée sur d'autres sites par son
// propriétaire ») ou 100 (partie) : elle quitte toutes les télés du jour.
//
// POST { id } → { ok, retiree }
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { jourParis } from "@/lib/jour-paris";
import { videoRefusee } from "@/lib/direct/selection-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine sur ce téléphone." }, { status: 401, headers: sansCache });
  const p = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const r = await videoRefusee(supabase, jourParis(), p?.id);
  return NextResponse.json(r.error ? { error: r.error } : { ok: true, retiree: Boolean(r.retiree) }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
}
