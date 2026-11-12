// 🌙 « MON VŒU » : LES RÉPONSES DE LA JOURNÉE, VERS 19 H À PARIS (le lot 2, 12 novembre 2026) — `lib/direct/voeu-serveur.ts`,
// `envoyerLeSoirDuVoeu`.
//
// DEUX TÂCHES PLANIFIÉES POUR UNE SEULE HEURE, comme le mème du jour : 19 h à Paris, c'est 18 h UTC l'hiver et 17 h UTC
// l'été. `vercel.json` appelle ce fichier à 18 h 05 UTC, et `voeu-soir-ete` à 17 h 05 UTC ; celle qui ne tombe pas dans
// l'heure de 19 h à Paris ne fait rien. Une fois par jour et par personne (`notif/voeu-soir/<habitant>/<jour>.json`).
//
// `?force=1` (les essais) : n'importe quelle heure. Seulement si `CRON_SECRET` existe, ou pour le faux service de
// notifications des essais.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { heureParis } from "@/lib/direct/appli-collection-serveur";
import { envoyerLeSoirDuVoeu } from "@/lib/direct/voeu-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const force = new URL(request.url).searchParams.get("force") === "1" && Boolean(process.env.CRON_SECRET || process.env.PUSH_ESSAI_ORIGINE);
  const { h } = heureParis();
  if (!force && h !== 19) return NextResponse.json({ ok: true, rien: `il est ${h} h à Paris : les réponses du vœu partent entre 19 h et 20 h` });
  return NextResponse.json({ ok: true, ...(await envoyerLeSoirDuVoeu(createAdminClient())) });
}
