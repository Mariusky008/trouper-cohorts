// 🧍 SON PERSONNAGE MAÎTRE — chantier « Univers », lot 1, le socle (`lib/direct/perso.ts`, `fiches-serveur.ts`).
//
// GET → { fiche, origine } : sa fiche telle qu'il la voit (sa version, son style, ses images en adresses signées, son
//        historique ; ni chemins ni consignes). `origine` : « rangee » (une figurine du nouveau style) ou « aujourd-hui »
//        (sa figurine d'aujourd'hui, la version 0). `fiche: null` : pas encore de figurine.
// Rien ne s'écrit ici : la nouvelle figurine (lot 2) écrira ses versions.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { fichePersoVue, lireFichePerso } from "@/lib/direct/fiches-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403 });
  const { fiche, origine } = await lireFichePerso(supabase, moi.id);
  return NextResponse.json({ ok: true, fiche: fiche ? await fichePersoVue(supabase, fiche) : null, origine }, { headers: sansCache });
}
