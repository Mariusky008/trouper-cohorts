// LA CLÔTURE DES CAMPAGNES ÉCHUES.
//
// Sans ce passage, une campagne dont l'heure est passée gardait ses
// participations en « engagé » pour toujours : l'habitant voyait s'empiler dans
// « Mes Clics » des réservations d'hier, et le commerçant lisait dans « Mes
// réservations » des gens qui ne viendront plus.
//
// POURQUOI UN CRON ET PAS UN CALCUL À LA LECTURE. Le prix obtenu doit être
// ÉCRIT : c'est le filet de sécurité — un groupe qui n'aboutit pas laisse la
// place valable au prix habituel. Le recalculer à chaque affichage voudrait dire
// que personne ne l'a jamais arrêté, et deux écrans pourraient l'arrondir
// différemment. Une fois clôturée, une campagne ne bouge plus.
//
// Idempotent : il ne prend que ce qui est encore `active` ou `debloquee`. Deux
// passages de suite ne font rien la seconde fois.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { cloturerEchues } from "@/lib/direct/cloture";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const bilan = await cloturerEchues(createAdminClient());
  return NextResponse.json({ ok: true, ...bilan });
}
