// LES CHIFFRES DU COMPTOIR D'UN VRAI COMMERÇANT — ses sept derniers jours.
//
// POST { slug, token } (le jeton de son lien pro) → { ok, mesure, jours }.
// `mesure: false` tant que la migration des compteurs n'est pas appliquée : le
// comptoir le dit au lieu d'afficher des zéros qui auraient l'air d'un échec.
// Voir `lib/site-internet/compteurs-jour.ts`.
import { NextResponse } from "next/server";
import { ligneDuCommercant } from "@/lib/site-internet/experience-scenes";
import { semaineDuCommerce } from "@/lib/site-internet/compteurs-jour";

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
    const { mesure, jours } = await semaineDuCommerce(ligne.id);
    return NextResponse.json({ ok: true, mesure, jours });
  } catch {
    return NextResponse.json({ ok: true, mesure: false, jours: [] });
  }
}
