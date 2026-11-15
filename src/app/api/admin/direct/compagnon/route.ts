// 🐾 LE COMPAGNON — L'ESSAI DE FABRICATION, LOT C0 (`lib/direct/compagnon-essai-serveur.ts`, `docs/univers/compagnon.md`) :
// le catalogue d'une espèce (son image de référence, ses poses, ses boucles), fabriqué une fois. Réservé à
// l'administrateur ; sa figurine assise donne le style, son décor sert à l'aperçu.
//
// GET ?espece=chat                                         → { etat }
// POST { action: "fabriquer", espece, cible }              → { fait?, progres?, etat } : un passage — `cible` :
//                                                            « reference », ou une boucle (sa pose, puis sa vidéo)
// POST { action: "refaire", espece, cible, etape? }        → { etat } : `reference` efface tout ; une boucle, sa vidéo
//                                                            (`etape: "video"`) ou sa pose et sa vidéo
// POST { action: "son", espece, cible, type, donnees }     → { etat } : 🔊 le vrai son d'une boucle (un enregistrement, en
//                                                            base64 ; vide : l'enlever)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { boucleValide, especeValide } from "@/lib/direct/compagnons";
import { deposerSonCompagnon, etatCompagnonEssai, fabriquerCompagnon, refaireCompagnon } from "@/lib/direct/compagnon-essai-serveur";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const SANS_FIGURINE = { error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." };

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const espece = new URL(request.url).searchParams.get("espece") ?? "chat";
  if (!especeValide(espece)) return NextResponse.json({ error: "Espèce inconnue." }, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatCompagnonEssai(supabase, moi.id, espece) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const espece = p?.espece ?? "chat";
  const cible = p?.cible;
  if (!especeValide(espece)) return NextResponse.json({ error: "Espèce inconnue." }, { status: 400, headers: sansCache });
  if (cible !== "reference" && !boucleValide(cible)) return NextResponse.json({ error: "Que faire ? (« reference », ou une boucle)" }, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  if (p?.action === "fabriquer") {
    const r = await fabriquerCompagnon(supabase, moi.id, espece, cible, avant);
    const etat = await etatCompagnonEssai(supabase, moi.id, espece);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), ...(typeof r.progres === "number" ? { progres: r.progres } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    await refaireCompagnon(supabase, espece, cible, p.etape === "video" ? "video" : "pose");
    return NextResponse.json({ ok: true, etat: await etatCompagnonEssai(supabase, moi.id, espece) }, { headers: sansCache });
  }
  if (p?.action === "son") {
    if (cible === "reference") return NextResponse.json({ error: "Un son va avec une boucle." }, { status: 400, headers: sansCache });
    const r = await deposerSonCompagnon(supabase, espece, cible, p.type, p.donnees);
    const etat = await etatCompagnonEssai(supabase, moi.id, espece);
    return NextResponse.json(r.erreur ? { error: r.erreur, etat } : { ok: true, etat }, { status: r.erreur ? 400 : 200, headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
