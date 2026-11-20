// 🎭 LES GRADINS DES SALONS OUVERTS (`lib/direct/salons-gradins-serveur.ts`, `docs/univers/decouvrir.md`, section 27 ;
// la page `/admin/humain/salons`) — onze décors, fabriqués une fois, validés par le propriétaire. L'administrateur seulement.
//
// GET                                            → { etat } : chaque gradin, son image, ses huit places, s'il est validé
// POST { action: "fabriquer", gradin }           → { fait?, etat } : un passage — le décor (d'après le plan), puis son relevé
// POST { action: "refaire", gradin, quoi }       → { etat } : `decor` (et son relevé) ou `releve` ; il quitte les salons
// POST { action: "plan", gradin }                → { etat } : 📐 ses places sont celles du plan ; il quitte les salons
// POST { action: "valider", gradin, oui }        → { etat } : ✓ dans les salons de ses passions, ou retiré
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { gradinValide } from "@/lib/direct/salons-gradins";
import { etatGradins, fabriquerGradin, planPourGradin, refaireGradin, validerGradin } from "@/lib/direct/salons-gradins-serveur";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatGradins(createAdminClient()) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403, headers: sansCache });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const gradin = p.gradin;
  if (!gradinValide(gradin)) return NextResponse.json({ error: "Quel gradin ?" }, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  if (p.action === "fabriquer") {
    const r = await fabriquerGradin(supabase, gradin, avant);
    const etat = await etatGradins(supabase);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  }
  if (p.action === "refaire") {
    if (p.quoi !== "decor" && p.quoi !== "releve") return NextResponse.json({ error: "Refaire quoi ?" }, { status: 400, headers: sansCache });
    await refaireGradin(supabase, gradin, p.quoi);
    return NextResponse.json({ ok: true, etat: await etatGradins(supabase) }, { headers: sansCache });
  }
  if (p.action === "plan" || p.action === "valider") {
    const r = p.action === "plan" ? await planPourGradin(supabase, gradin) : await validerGradin(supabase, gradin, p.oui !== false);
    const etat = await etatGradins(supabase);
    return NextResponse.json(r.erreur ? { error: r.erreur, etat } : { ok: true, etat }, { status: r.erreur ? 400 : 200, headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
