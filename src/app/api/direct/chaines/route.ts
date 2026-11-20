// 📺 MES CHAÎNES YOUTUBE (`lib/direct/chaines.ts`, `chaines-serveur.ts` ; `docs/univers/decouvrir.md`, section 23.1 ; le
// lot D8) : les siennes seulement (le cookie d'habitant).
//
// GET                                          → { chaines } : celles qu'il suit (10 au plus)
// POST { action: "suivre", lien }              → { chaine, chaines, deja? } : son lien, son @nom, le lien d'une de ses
//                                                vidéos ; 400 : pas une chaîne, ou déjà 10 ; 404 : introuvable ; 403 :
//                                                retirée par l'administrateur
// POST { action: "suivre", video }             → pareil, depuis une vidéo de sa télé (« 📺 Suivre cette chaîne »)
// POST { action: "ne-plus-suivre", id }        → { chaines }
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { mesChaines, nePlusSuivre, suivreChaine } from "@/lib/direct/chaines-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };

export async function GET() {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  return NextResponse.json({ ok: true, chaines: await mesChaines(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  if (p?.action === "suivre") {
    const r = await suivreChaine(supabase, moi, { lien: p.lien, video: p.video });
    return repondre(r, { chaine: r.chaine, chaines: r.chaines, ...(r.deja ? { deja: true } : {}) });
  }
  if (p?.action === "ne-plus-suivre") {
    const r = await nePlusSuivre(supabase, moi, p.id);
    return repondre(r, { chaines: r.chaines });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400, headers: sansCache });
}
