// 🛋️ LA PIÈCE VIVANTE — la maquette de la conversation dans la pièce du duo (`docs/univers/piece-du-duo.md`, section 12).
// Réservé à l'administrateur. Les pièces (leurs trois lumières, leurs emplacements), le duo choisi dans l'essai du
// collage et ses images faites, le moment de l'heure à Paris ; l'image du duo se fait à la première visite d'une pièce dans
// une lumière (`lib/direct/pieces-duo-collage-serveur.ts`).
//
// GET                                         → { etat }
// POST { action: "duo", piece, moment }       → { fait?, etat } : un passage (les deux poses, puis le duo)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { momentDuoDe, type EtatPieceVivante } from "@/lib/direct/pieces-duo";
import { etatPiecesDuo } from "@/lib/direct/pieces-duo-serveur";
import { duoVivant, fabriquerDuoVivant } from "@/lib/direct/pieces-duo-collage-serveur";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const heureDeParis = () => Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date())) % 24;

async function etat(supabase: ReturnType<typeof createAdminClient>, moi: string | null): Promise<EtatPieceVivante> {
  const [pieces, duo] = await Promise.all([etatPiecesDuo(supabase), duoVivant(supabase, moi)]);
  return { pieces: pieces.pieces, duo, maintenant: momentDuoDe(heureDeParis()), moteur: pieces.moteurs.image };
}

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = (await habitantCourant(supabase))?.id ?? null;
  return NextResponse.json({ ok: true, etat: await etat(supabase, moi) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (p?.action !== "duo") return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  const moi = (await habitantCourant(supabase))?.id ?? null;
  const r = await fabriquerDuoVivant(supabase, moi, p.piece, p.moment, avant);
  const e = await etat(supabase, moi);
  if (r.erreur) return NextResponse.json({ error: r.erreur, etat: e }, { status: 502, headers: sansCache });
  return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat: e }, { headers: sansCache });
}
