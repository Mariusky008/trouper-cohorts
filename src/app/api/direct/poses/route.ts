// 🎭 LES POSES VALIDÉES DU DOUBLE, pour les pages — et elles seules.
// Une proposition non validée n'en sort jamais. Voir `lib/direct/poses-double.ts`.
import { NextResponse } from "next/server";
import { posesValidees } from "@/lib/direct/poses-double";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* LE NAVIGATEUR NE GARDE RIEN, LE RÉSEAU DE DIFFUSION GARDE CINQ MINUTES.
   Mesuré : avec `max-age=60`, Chromium resservait la réponse depuis son cache
   sans jamais en finir le corps — la page restait « en chargement » et une
   navigation suivante attendait trente secondes pour rien. La mémoire du
   serveur (une minute) et le réseau de diffusion suffisent à épargner le
   stockage. */
const ENTETES = {
  "cache-control": "no-store",
  "vercel-cdn-cache-control": "max-age=300, stale-while-revalidate=600",
};

export async function GET() {
  return NextResponse.json(await posesValidees(), { headers: ENTETES });
}
