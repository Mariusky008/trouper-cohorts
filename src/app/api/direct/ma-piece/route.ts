// 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`lib/direct/ma-maison-serveur.ts`, `docs/univers/ma-maison.md` ; le lot M1) :
// la sienne seulement (le cookie d'habitant). Derrière l'interrupteur `MA_MAISON_CATALOGUE` (éteint) : en attendant,
// l'administrateur seul (l'adresse d'essai `/univers/maison`).
//
// GET                       → { maison: { piece, scene, figurine } } : sa pièce, à cette heure, et sa figurine
// GET ?catalogue=1          → { catalogue: { pieces, piece } } : les neuf, dans l'ordre de son âge, et leurs vignettes
// GET ?chez=<clé>           → { visite } : 🚪 (lot M4) sa maison, en visite (`MaisonVisitee`) — selon qui peut entrer ;
//                              ouverte à tout visiteur (sans l'interrupteur : seuls ceux qui ont choisi une pièce en ont une)
// POST { action: "visibilite", v, adulte? } → { maison } : 🚪 (lot M4) qui peut entrer chez lui
// POST { action: "repondre", chez, texte } → { visite } : 💬 (lot M5) sa réponse à la question du jour d'un proche
// POST { action: "choisir", piece } → { maison } : sa pièce (une pièce prête), ou en changer
// POST { action: "vu" }     → { ok } : ✨ (lot M2) il est venu chez lui — ce qu'il a gardé jusqu'ici ne s'annonce plus
// POST { action: "ajouter", quoi, titre?, lien?, mot?, image? } → { maison, id } : ＋ (lot M2) « Ajouter chez moi »
// POST { action: "enlever", id } → { maison } : 🗑️ (lot M2) l'enlever de chez lui
// (GET : `maison.contenu`, ce qu'il a gardé à ses emplacements — les cadres, la platine, la télé, l'étagère ; `maison.vuLe`)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { MA_MAISON_CATALOGUE } from "@/lib/direct/ma-maison";
import { catalogueDeLaMaison, choisirSaPiece, maMaison, maMaisonVue } from "@/lib/direct/ma-maison-serveur";
import { ajouterChezMoi, enleverDeChezMoi } from "@/lib/direct/etagere-serveur";
import { choisirVisibiliteMaison, maisonVisitee } from "@/lib/direct/visites-serveur";
import { repondreChezLui } from "@/lib/direct/question-maison-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const permise = async () => MA_MAISON_CATALOGUE || (await isCurrentUserAdmin());

async function habitant() {
  const supabase = createAdminClient();
  return { supabase, moi: await habitantCourant(supabase) };
}

export async function GET(request: Request) {
  // 🚪 (lot M4) une maison en visite : selon ce que son habitant a choisi (un visiteur sans figurine peut entrer chez qui l'ouvre à tous)
  const chez = new URL(request.url).searchParams.get("chez");
  if (chez) {
    const { supabase, moi } = await habitant();
    return NextResponse.json({ ok: true, visite: await maisonVisitee(supabase, moi, chez) }, { headers: sansCache });
  }
  if (!(await permise())) return NextResponse.json({ error: "Bientôt 🙂" }, { status: 403, headers: sansCache });
  const { supabase, moi } = await habitant();
  if (!moi) return NextResponse.json({ error: "Ta figurine n’est pas sur ce téléphone." }, { status: 401, headers: sansCache });
  if (new URL(request.url).searchParams.get("catalogue") === "1") return NextResponse.json({ ok: true, catalogue: await catalogueDeLaMaison(supabase, moi.id) }, { headers: sansCache });
  return NextResponse.json({ ok: true, maison: await maMaison(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  // 💬 (lot M5) en visite chez un proche : sa réponse à la question du jour (comme la visite, sans l'interrupteur)
  if (p?.action === "repondre") {
    const { supabase, moi } = await habitant();
    if (!moi) return NextResponse.json({ error: "Ta figurine n’est pas sur ce téléphone." }, { status: 401, headers: sansCache });
    const r = await repondreChezLui(supabase, moi, p.chez, p.texte);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, visite: await maisonVisitee(supabase, moi, p.chez) }, { headers: sansCache });
  }
  if (!(await permise())) return NextResponse.json({ error: "Bientôt 🙂" }, { status: 403, headers: sansCache });
  const { supabase, moi } = await habitant();
  if (!moi) return NextResponse.json({ error: "Ta figurine n’est pas sur ce téléphone." }, { status: 401, headers: sansCache });
  if (p?.action === "vu") {
    await maMaisonVue(supabase, moi.id);
    return NextResponse.json({ ok: true }, { headers: sansCache });
  }
  if (p?.action === "visibilite") {
    const r = await choisirVisibiliteMaison(supabase, moi.id, p.v, p.adulte);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, maison: await maMaison(supabase, moi.id) }, { headers: sansCache });
  }
  if (p?.action === "ajouter" || p?.action === "enlever") {
    const r = p.action === "ajouter" ? await ajouterChezMoi(supabase, moi, p) : await enleverDeChezMoi(supabase, moi, p.id);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, ...("id" in r && r.id ? { id: r.id } : {}), maison: await maMaison(supabase, moi.id) }, { headers: sansCache });
  }
  if (p?.action !== "choisir") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const r = await choisirSaPiece(supabase, moi.id, p.piece);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, maison: await maMaison(supabase, moi.id) }, { headers: sansCache });
}
