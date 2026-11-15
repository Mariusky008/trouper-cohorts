// 🧹 LE NETTOYAGE DU STOCKAGE, CHAQUE NUIT (`lib/direct/nettoyage-serveur.ts`) : les photos et les vidéos déposées mais
// jamais envoyées, et les fichiers qu'aucun message ne cite plus, de plus de 24 heures. `vercel.json` l'appelle à
// 3 h 40 UTC (4 h 40 ou 5 h 40 à Paris : personne n'envoie rien), 50 secondes au plus ; la suite, la nuit d'après.
//
// `?dans=<heures>` (les essais) : comme si ces heures étaient passées. Seulement si `CRON_SECRET` existe, ou pour le
// faux service de notifications des essais.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { nettoyerLeStockage } from "@/lib/direct/nettoyage-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const essai = Boolean(process.env.CRON_SECRET || process.env.PUSH_ESSAI_ORIGINE);
  const dans = essai ? Math.max(0, Number(new URL(request.url).searchParams.get("dans")) || 0) : 0;
  const debut = Date.now();
  return NextResponse.json({ ok: true, ...(await nettoyerLeStockage(createAdminClient(), { maintenant: debut + dans * 3600_000, fin: debut + 50_000 })) });
}
