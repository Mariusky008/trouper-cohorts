// 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`lib/direct/ma-maison-serveur.ts`, `docs/univers/ma-maison.md` ; le lot M1) :
// la sienne seulement (le cookie d'habitant). Derrière l'interrupteur `MA_MAISON_CATALOGUE` (éteint) : en attendant,
// l'administrateur seul (l'adresse d'essai `/univers/maison`).
//
// GET                       → { maison: { piece, scene, figurine } } : sa pièce, à cette heure, et sa figurine
// GET ?catalogue=1          → { catalogue: { pieces, piece } } : les neuf, dans l'ordre de son âge, et leurs vignettes
// POST { action: "choisir", piece } → { maison } : sa pièce (une pièce prête), ou en changer
// POST { action: "vu" }     → { ok } : ✨ (lot M2) il est venu chez lui — ce qu'il a gardé jusqu'ici ne s'annonce plus
// (GET : `maison.contenu`, ce qu'il a gardé à ses emplacements — les cadres, la platine, la télé, l'étagère ; `maison.vuLe`)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { MA_MAISON_CATALOGUE } from "@/lib/direct/ma-maison";
import { catalogueDeLaMaison, choisirSaPiece, maMaison, maMaisonVue } from "@/lib/direct/ma-maison-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const permise = async () => MA_MAISON_CATALOGUE || (await isCurrentUserAdmin());

async function habitant() {
  const supabase = createAdminClient();
  return { supabase, moi: await habitantCourant(supabase) };
}

export async function GET(request: Request) {
  if (!(await permise())) return NextResponse.json({ error: "Bientôt 🙂" }, { status: 403, headers: sansCache });
  const { supabase, moi } = await habitant();
  if (!moi) return NextResponse.json({ error: "Ta figurine n’est pas sur ce téléphone." }, { status: 401, headers: sansCache });
  if (new URL(request.url).searchParams.get("catalogue") === "1") return NextResponse.json({ ok: true, catalogue: await catalogueDeLaMaison(supabase, moi.id) }, { headers: sansCache });
  return NextResponse.json({ ok: true, maison: await maMaison(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await permise())) return NextResponse.json({ error: "Bientôt 🙂" }, { status: 403, headers: sansCache });
  const { supabase, moi } = await habitant();
  if (!moi) return NextResponse.json({ error: "Ta figurine n’est pas sur ce téléphone." }, { status: 401, headers: sansCache });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (p?.action === "vu") {
    await maMaisonVue(supabase, moi.id);
    return NextResponse.json({ ok: true }, { headers: sansCache });
  }
  if (p?.action !== "choisir") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const r = await choisirSaPiece(supabase, moi.id, p.piece);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, maison: await maMaison(supabase, moi.id) }, { headers: sansCache });
}
