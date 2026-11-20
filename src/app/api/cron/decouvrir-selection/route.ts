// 🌙 LA SÉLECTION DE LA NUIT (`lib/direct/selection-serveur.ts` ; `docs/univers/decouvrir.md`, section 4.1 ; le lot D0) :
// pour chaque thème, les vidéos YouTube du jour (une sélection pour les adultes, une pour les 15-17 ans). `vercel.json`
// l'appelle à 2 h 7 UTC (3 h 7 ou 4 h 7 à Paris), 280 secondes au plus. Sans `YOUTUBE_API_KEY` : rien ne se fait (503).
// Puis (le lot D8, section 23.1) les dernières vidéos des chaînes suivies, avec le temps qui reste.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { faireLaSelection } from "@/lib/direct/selection-serveur";
import { rafraichirLesChaines } from "@/lib/direct/chaines-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const supabase = createAdminClient();
  const fin = Date.now() + 280_000;
  const r = await faireLaSelection(supabase, { fin });
  if (r.error) return NextResponse.json(r, { status: 503 });
  const chaines = await rafraichirLesChaines(supabase, { fin });
  return NextResponse.json({ ok: true, ...r, chaines });
}
