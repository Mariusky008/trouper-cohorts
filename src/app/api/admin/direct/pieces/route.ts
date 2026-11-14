// 🏠 LES PIÈCES EN PANORAMA, L'ESSAI DE SA MAISON (`lib/direct/pieces-serveur.ts`) — le salon, la pièce télé, la
// terrasse. Réservé à l'administrateur, sur SON univers (le cookie d'habitant de ce téléphone).
//
// GET ?piece=<salon|tele|terrasse>                → { etat } : ce qui est fait (signé), ce qui reste, sa figurine assise,
//                                                   où en est chaque pièce (le salon, sans `piece`)
// POST { action: "fabriquer", piece }             → { fait?, etat } : un passage — la prochaine étape (le centre, la
//                                                   gauche, la droite : une image du moteur ; le panorama : l'assemblage)
// POST { action: "refaire", piece, etape }        → { etat } : l'étape et ce qui en dépend s'effacent
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import { etatDeLaPiece, fabriquerLaPiece, pieceValide, refaireDeLaPiece } from "@/lib/direct/pieces-serveur";

export const dynamic = "force-dynamic";
// (un passage : une image du moteur)
export const maxDuration = 300;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Accès refusé." };
const SANS_FIGURINE = { error: "Ce téléphone n’a pas de figurine : ouvre d’abord /univers/figurine." };
const QUELLE_PIECE = { error: "Quelle pièce ?" };

export async function GET(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const piece = pieceValide(new URL(request.url).searchParams.get("piece") ?? "salon");
  if (!piece) return NextResponse.json(QUELLE_PIECE, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  return NextResponse.json({ ok: true, etat: await etatDeLaPiece(supabase, moi.id, piece) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const avant = Date.now() + (maxDuration - 20) * 1000;
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const piece = pieceValide(p?.piece ?? "salon");
  if (!piece) return NextResponse.json(QUELLE_PIECE, { status: 400, headers: sansCache });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_FIGURINE, { status: 400, headers: sansCache });
  if (p?.action === "fabriquer") {
    const r = await fabriquerLaPiece(supabase, moi.id, piece, avant);
    const etat = await etatDeLaPiece(supabase, moi.id, piece);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    const r = await refaireDeLaPiece(supabase, moi.id, piece, p.etape);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400, headers: sansCache });
    return NextResponse.json({ ok: true, etat: await etatDeLaPiece(supabase, moi.id, piece) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
