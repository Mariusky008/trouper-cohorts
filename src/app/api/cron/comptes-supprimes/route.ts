// 🗑️ LE BALAYAGE DES COMPTES SUPPRIMÉS, CHAQUE NUIT (`lib/direct/supprimer-compte-serveur.ts`) : ce qu'un compte supprimé
// a laissé dans les espaces partagés (ses mots sous les vidéos, ses passages dans les salons, ses places dans les
// groupes, ses moments…), là où le premier passage, juste après la suppression, n'a pas eu le temps d'aller.
// `vercel.json` l'appelle à 3 h 20 UTC, 50 secondes au plus ; la suite, la nuit d'après.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { balayerLesComptesSupprimes } from "@/lib/direct/supprimer-compte-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await balayerLesComptesSupprimes(createAdminClient(), { fin: Date.now() + 50_000 })) });
}
