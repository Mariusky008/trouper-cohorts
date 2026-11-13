// 📚 L'ÉTAGÈRE — ce que leurs figurines ont noté entre deux proches (lot E1, `lib/direct/etagere.ts`,
// `etagere-serveur.ts` ; le cahier : `docs/univers/etagere.md`).
//
// GET ?avec=<clé>                              → { etagere } : la page « Votre étagère » (les titres déjà tournés pour
//                                                lui, les rayons, les promesses tenues, la pause)
// POST { action: "retirer", avec, id }         → { ok } : il retire un souvenir, pour les deux (il ne sera plus noté)
// POST { action: "date", avec, id, quand }     → { ok } : il change le jour d'une date (« jeudi prochain » mal compris)
// POST { action: "vu", avec, ids }             → { ok } : il les a vus se poser (l'envol ne se rejoue pas)
// POST { action: "pause", avec, oui }          → { ok } : plus rien n'est noté entre eux (seul celui qui l'a mise la relance)
// Les règles du talkie : la session vérifiée, deux proches qui se sont ajoutés, sinon 403 ; jamais l'identifiant d'un
// habitant, seulement sa clé. Le frein : `CLIKME_ETAGERE=0` (rien de noté, rien d'affiché : 404).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { agirSurEtagere, etagereAvec } from "@/lib/direct/etagere-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const r = await etagereAvec(supabase, moi, new URL(request.url).searchParams.get("avec"));
  if (!r.etagere) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, etagere: r.etagere }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  if (!p || !["retirer", "date", "vu", "pause"].includes(String(p.action))) return NextResponse.json({ error: "Demande incomplète." }, { status: 400, headers: sansCache });
  const r = await agirSurEtagere(supabase, moi, p);
  return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
}
