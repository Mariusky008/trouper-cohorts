// 🔔 LE MÈME DU JOUR, VERS 11 H 30 À PARIS (le lot 3, 7 novembre 2026) : `lib/direct/appli-collection-serveur.ts`.
//
// DEUX TÂCHES PLANIFIÉES POUR UNE SEULE HEURE. Vercel compte en UTC, Paris non : 11 h 30 à Paris, c'est 10 h 30 UTC l'hiver
// et 9 h 30 UTC l'été. `vercel.json` appelle donc ce fichier à 10 h 30 UTC, et `meme-du-jour-ete` à 9 h 30 UTC ; celle
// qui ne tombe pas dans l'heure de 11 h à Paris ne fait rien. Une fois par jour, jamais deux (`notif/envois/<jour>.json`).
//
// `?force=1` (les essais) : n'importe quelle heure, et même deux fois. Seulement si `CRON_SECRET` existe, et qu'il a été
// donné, ou pour le faux service de notifications des essais : sans secret, la route reste ouverte (`cron-auth.ts`), et
// personne ne doit pouvoir relancer l'envoi à volonté.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { envoyerLeMemeDuJour, heureParis } from "@/lib/direct/appli-collection-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const force = new URL(request.url).searchParams.get("force") === "1" && Boolean(process.env.CRON_SECRET || process.env.PUSH_ESSAI_ORIGINE);
  const { h } = heureParis();
  if (!force && h !== 11) return NextResponse.json({ ok: true, rien: `il est ${h} h à Paris : le mème du jour part entre 11 h et midi` });
  return NextResponse.json({ ok: true, ...(await envoyerLeMemeDuJour(createAdminClient(), { force })) });
}
