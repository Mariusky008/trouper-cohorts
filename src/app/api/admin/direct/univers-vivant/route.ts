// 🌟 SON UNIVERS, VIVANT — L'ESSAI (`lib/direct/univers-vivant-serveur.ts`) : son décor du moment devient une photo
// vivante (Google Veo). Réservé à l'administrateur, sur SON univers (le cookie d'habitant de ce téléphone).
//
// GET                              → { etat } : son décor (signé), la vidéo si elle est faite d'après lui, la commande
//                                    en cours, une vidéo d'un autre décor (`perimee`), le moteur branché
// POST { action: "fabriquer" }     → { fait?, progres?, etat } : un passage — la commander, puis la suivre, la ranger
// POST { action: "refaire" }       → { etat } : elle s'efface
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { etatUniversVivant, fabriquerUniversVivant, refaireUniversVivant } from "@/lib/direct/univers-vivant-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const SANS_FIGURINE = { error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatUniversVivant(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  if (p?.action === "fabriquer") {
    const r = await fabriquerUniversVivant(supabase, moi.id);
    const etat = await etatUniversVivant(supabase, moi.id);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: true } : {}), ...(typeof r.progres === "number" ? { progres: r.progres } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    await refaireUniversVivant(supabase, moi.id);
    return NextResponse.json({ ok: true, etat: await etatUniversVivant(supabase, moi.id) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
