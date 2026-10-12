// LES CHIFFRES DU COMPTOIR D'UN VRAI COMMERÇANT — ses sept derniers jours.
//
// POST { slug, token } (le jeton de son lien pro) → { ok, mesure, jours }.
// `mesure: false` tant que la migration des compteurs n'est pas appliquée : le
// comptoir le dit au lieu d'afficher des zéros qui auraient l'air d'un échec.
// Voir `lib/site-internet/compteurs-jour.ts`.
import { NextResponse } from "next/server";
import { ligneDuCommercant } from "@/lib/site-internet/experience-scenes";
import { semaineDuCommerce, semaineEnClients } from "@/lib/site-internet/compteurs-jour";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const ligne = await ligneDuCommercant(String(p?.slug ?? "").trim(), String(p?.token ?? "").trim()).catch(() => null);
  if (!ligne) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  try {
    const [{ mesure, jours }, clients] = await Promise.all([semaineDuCommerce(ligne.id), semaineEnClients(ligne.id)]);
    // SA SEMAINE EN CLIENTS — essais, mises de côté, amis, voisins. Voir `semaine-en-clients.ts`.
    return NextResponse.json({ ok: true, mesure, jours, clients });
  } catch {
    return NextResponse.json({ ok: true, mesure: false, jours: [] });
  }
}
