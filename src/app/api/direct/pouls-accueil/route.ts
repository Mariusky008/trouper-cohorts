// CE QUI SE PASSE DANS UNE VILLE — lu depuis la page d'accueil, pendant que le
// commerçant tape le nom de la sienne.
//
// PUBLIC ET EN LECTURE SEULE : tout ce qui sort d'ici est déjà affiché sur
// /ville/<slug>, en accès libre. Aucun jeton, donc, et rien de plus que ce que
// n'importe qui voit en ouvrant Le Direct de sa ville.
//
// ELLE NE DOIT JAMAIS FAIRE ÉCHOUER LA PAGE. L'accueil a un seul travail :
// faire remplir le formulaire. Cette route est une décoration honnête — panne,
// table absente, ville inconnue : elle rend une ville éteinte, en HTTP 200, et
// l'écran continue sans rien dire.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { poulsAccueil, POULS_VIDE } from "@/lib/direct/pouls-accueil";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const ville = new URL(request.url).searchParams.get("ville") || "";
  // Borné : le paramètre vient d'un champ libre, et un slug de dix mille
  // signes n'apporterait qu'une requête inutile.
  if (!ville.trim() || ville.length > 80) return NextResponse.json(POULS_VIDE);
  try {
    const pouls = await poulsAccueil(createAdminClient(), ville);
    return NextResponse.json(pouls, {
      // Une minute de cache partagé : à midi, cent commerçants tapant « Dax »
      // ne doivent pas produire cent lectures. Une minute est assez court pour
      // que « en ce moment » reste vrai.
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json(POULS_VIDE);
  }
}
