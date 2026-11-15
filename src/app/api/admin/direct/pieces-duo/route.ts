// 🛋️ LA PIÈCE DU DUO — L'ESSAI DES CINQ PIÈCES (`lib/direct/pieces-duo-serveur.ts`, `docs/univers/piece-du-duo.md`) : le
// catalogue des pièces (salon, cuisine, terrasse, chambre vue mer, café), fabriqué une fois. Réservé à l'administrateur.
//
// GET                                         → { etat } : chaque pièce, son image, ses emplacements
// POST { action: "fabriquer", piece }         → { fait?, etat } : un passage — la pièce, puis son relevé
// POST { action: "refaire", piece, quoi? }    → { etat } : la pièce et son relevé, ou son relevé seul (`quoi: "releve"`)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { pieceDuoValide } from "@/lib/direct/pieces-duo";
import { etatPiecesDuo, fabriquerPieceDuo, refairePieceDuo } from "@/lib/direct/pieces-duo-serveur";

export const dynamic = "force-dynamic";
// (une image : une minute environ)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  return NextResponse.json({ ok: true, etat: await etatPiecesDuo(createAdminClient()) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + maxDuration * 1000 - 20_000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const piece = p?.piece;
  if (!pieceDuoValide(piece)) return NextResponse.json({ error: "Quelle pièce ?" }, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  if (p?.action === "fabriquer") {
    const r = await fabriquerPieceDuo(supabase, piece, avant);
    const etat = await etatPiecesDuo(supabase);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    await refairePieceDuo(supabase, piece, p.quoi === "releve" ? "releve" : "piece");
    return NextResponse.json({ ok: true, etat: await etatPiecesDuo(supabase) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
