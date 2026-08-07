// Le FILET des alertes de dernière minute.
//
// L'alerte part normalement au moment de la publication (voir
// `src/lib/direct/envoi-alertes.ts`) : une alerte est une réaction à un
// événement, pas un balayage périodique. Ce cron ne fait que rattraper ce qu'un
// envoi raté aurait laissé passer — un appel Resend en échec, une publication
// créée hors du chemin normal.
//
// Une fois par jour : c'est ce que le plan du projet autorise, c'est ce que font
// tous les autres crons du dépôt, et c'est suffisant pour un filet. Ce n'est pas
// lui qui porte l'immédiateté.
//
// Aucun risque de doublon : `last_alerte_at` est la même borne pour les deux
// chemins, et `alerteAEnvoyer` ne retient que ce qui a paru depuis.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { envoyerAlertes } from "@/lib/direct/envoi-alertes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const bilan = await envoyerAlertes(createAdminClient());
  return NextResponse.json({ ok: true, ...bilan });
}
