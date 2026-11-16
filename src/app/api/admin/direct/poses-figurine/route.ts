// 🧍 LES POSES DE LA FIGURINE — L'ESSAI P0 (`lib/direct/poses-figurine-serveur.ts`, `docs/univers/poses-figurine.md`) :
// les poses de la figurine de ce téléphone (debout, qui marche, assise sans fauteuil, de dos, qui danse, qui fait coucou,
// une tasse, les bras ouverts), faites une fois ; les pièces du duo faites, pour la scène ; son avis. Réservé à
// l'administrateur.
//
// GET                                        → { etat }
// POST { action: "fabriquer", pose? }        → { fait?, etat } : un passage, une image — la pose demandée, sinon la
//                                              prochaine qui manque (« debout » d'abord)
// POST { action: "refaire", pose }           → { etat } : elle seule s'efface
// POST { action: "avis", avis, note? }       → { etat } : « oui », « presque » ou « non », et un mot
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { poseFigurineValide } from "@/lib/direct/poses-figurine";
import { avisPosesFigurine, etatPosesFigurine, fabriquerPoseFigurine, refairePoseFigurine } from "@/lib/direct/poses-figurine-serveur";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const SANS_HABITANT = { error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_HABITANT, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatPosesFigurine(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = p?.action;
  if (action !== "fabriquer" && action !== "refaire" && action !== "avis") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const pose = p?.pose ?? null;
  if ((action === "refaire" || pose !== null) && action !== "avis" && !poseFigurineValide(pose)) return NextResponse.json({ error: "Pose inconnue." }, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_HABITANT, { status: 400, headers: sansCache });
  if (action === "fabriquer") {
    const r = await fabriquerPoseFigurine(supabase, moi.id, poseFigurineValide(pose) ? pose : null, avant);
    const etat = await etatPosesFigurine(supabase, moi.id);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  }
  if (action === "refaire") {
    if (poseFigurineValide(pose)) await refairePoseFigurine(supabase, moi.id, pose);
    return NextResponse.json({ ok: true, etat: await etatPosesFigurine(supabase, moi.id) }, { headers: sansCache });
  }
  const r = await avisPosesFigurine(supabase, moi.id, p?.avis, p?.note);
  const etat = await etatPosesFigurine(supabase, moi.id);
  return NextResponse.json(r.erreur ? { error: r.erreur, etat } : { ok: true, etat }, { status: r.erreur ? 400 : 200, headers: sansCache });
}
