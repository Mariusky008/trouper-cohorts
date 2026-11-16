// 🛋️ LA PIÈCE DU DUO — L'ESSAI DES PIÈCES (`lib/direct/pieces-duo-serveur.ts`, `docs/univers/piece-du-duo.md`, et
// `docs/univers/ma-maison.md` pour le lot M0) : le catalogue des neuf pièces, chacune en hauteur (le salon du duo) et en
// largeur (la maison de chacun), fabriqué une fois. Réservé à l'administrateur.
//
// GET                                         → { etat } : chaque pièce, ses images, ses emplacements, sa largeur
// POST { action: "fabriquer", piece }         → { fait?, etat } : un passage en hauteur — la pièce, son relevé, ses lumières
// POST { action: "refaire", piece, quoi? }    → { etat } : tout (sa largeur aussi), ou son relevé seul (`quoi: "releve"`),
//                                               ou ses deux autres lumières (`quoi: "lumieres"`)
// POST { action: "ajuster", piece, emplacements } → { etat } : ✋ ses zones posées à la main (elles remplacent le relevé)
// POST { action: "fabriquerLargeur", piece }  → { fait?, etat } : 🌅 un passage en largeur — le centre, la gauche, la
//                                               droite, le panorama, puis ses deux autres lumières
// POST { action: "refaireLargeur", piece, quoi } → { etat } : `tout`, une étape (et ce qui en dépend), `lumieres`, `releve`
// POST { action: "ajusterLargeur", piece, emplacements } → { etat } : ✋ ses zones sur le panorama (la place : le centre)
// POST { action: "deposerSource", piece, image } → { etat } : 🖼️ l'image de la chambre musicale (une adresse `data:`)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { pieceDuoValide } from "@/lib/direct/pieces-duo";
import {
  QUOI_LARGE,
  ajusterLargeur,
  ajusterPieceDuo,
  deposerSource,
  etatPiecesDuo,
  fabriquerLargeur,
  fabriquerPieceDuo,
  refaireLargeur,
  refairePieceDuo,
} from "@/lib/direct/pieces-duo-serveur";

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
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), ...(r.moment ? { moment: r.moment } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaire") {
    await refairePieceDuo(supabase, piece, p.quoi === "releve" || p.quoi === "lumieres" ? p.quoi : "piece");
    return NextResponse.json({ ok: true, etat: await etatPiecesDuo(supabase) }, { headers: sansCache });
  }
  if (p?.action === "ajuster" || p?.action === "ajusterLargeur") {
    const r = await (p.action === "ajuster" ? ajusterPieceDuo : ajusterLargeur)(supabase, piece, p.emplacements);
    const etat = await etatPiecesDuo(supabase);
    return NextResponse.json(r.erreur ? { error: r.erreur, etat } : { ok: true, etat }, { status: r.erreur ? 400 : 200, headers: sansCache });
  }
  if (p?.action === "fabriquerLargeur") {
    const r = await fabriquerLargeur(supabase, piece, avant);
    const etat = await etatPiecesDuo(supabase);
    if (r.erreur) return NextResponse.json({ error: r.erreur, etat }, { status: 502, headers: sansCache });
    return NextResponse.json({ ok: true, ...(r.fait ? { fait: r.fait } : {}), etat }, { headers: sansCache });
  }
  if (p?.action === "refaireLargeur") {
    const quoi = QUOI_LARGE.find((x) => x === p.quoi);
    if (!quoi) return NextResponse.json({ error: "Refaire quoi ?" }, { status: 400, headers: sansCache });
    await refaireLargeur(supabase, piece, quoi);
    return NextResponse.json({ ok: true, etat: await etatPiecesDuo(supabase) }, { headers: sansCache });
  }
  if (p?.action === "deposerSource") {
    const r = await deposerSource(supabase, piece, p.image);
    const etat = await etatPiecesDuo(supabase);
    return NextResponse.json(r.erreur ? { error: r.erreur, etat } : { ok: true, etat }, { status: r.erreur ? 400 : 200, headers: sansCache });
  }
  return NextResponse.json({ error: "Action inconnue." }, { status: 400, headers: sansCache });
}
