// 🌙 L'ENVOI DU MATIN, VERS 8 H 40 À PARIS (le rituel du jour, lot R2) : `lib/direct/rituel-serveur.ts`.
//
// Pour chaque abonné aux notifications, ses mots de la fin de cette nuit (ce que sa figurine et celle d'un proche se
// sont dit, d'après leur conversation d'hier) sont préparés ; s'il en a : « 🌙 Cette nuit, vos figurines se sont
// parlé » (une par jour au plus). Les autres les trouvent en ouvrant ClikMe.
//
// DEUX TÂCHES PLANIFIÉES POUR UNE SEULE HEURE, comme le mème du jour : Vercel compte en UTC. `vercel.json` appelle ce
// fichier à 7 h 40 UTC (l'hiver) et `rituel-matin-ete` à 6 h 40 UTC (l'été) ; celle qui ne tombe pas dans l'heure de
// 8 h à Paris ne fait rien. Une fois par jour (`notif/matins/<jour>.json`).
//
// `?force=1` (les essais) : n'importe quelle heure, et même deux fois — seulement avec `CRON_SECRET` donné, ou pour le
// faux service de notifications des essais (`PUSH_ESSAI_ORIGINE`).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { heureParis } from "@/lib/direct/appli-collection-serveur";
import { envoyerLesMatins } from "@/lib/direct/rituel-serveur";
import { notifDesRappels } from "@/lib/direct/etagere-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const force = new URL(request.url).searchParams.get("force") === "1" && Boolean(process.env.CRON_SECRET || process.env.PUSH_ESSAI_ORIGINE);
  const { h } = heureParis();
  const supabase = createAdminClient();
  if (!force && h !== 8) return NextResponse.json({ ok: true, rien: `il est ${h} h à Paris : l'envoi du matin part entre 8 h et 9 h` });
  return NextResponse.json({ ok: true, ...(await envoyerLesMatins(supabase, { force, rappelsDe: (h) => notifDesRappels(supabase, h) })) });
}
