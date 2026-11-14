// 📚 L'ÉTAGÈRE — ce que leurs figurines ont noté entre deux proches (lot E1, `lib/direct/etagere.ts`,
// `etagere-serveur.ts` ; le cahier : `docs/univers/etagere.md`).
//
// GET ?avec=<clé>                              → { etagere } : la page « Votre étagère » (les titres déjà tournés pour
//                                                lui, les rayons, les promesses tenues, la pause)
// POST { action: "retirer", avec, id }         → { ok } : il retire un souvenir, pour les deux (il ne sera plus noté)
// POST { action: "date", avec, id, quand }     → { ok } : il change le jour d'une date (« jeudi prochain » mal compris)
// POST { action: "vu", avec, ids }             → { ok } : il les a vus se poser (l'envol ne se rejoue pas)
// POST { action: "pause", avec, oui }          → { ok } : plus rien n'est noté entre eux (seul celui qui l'a mise la relance)
// 📅 LOT E2 :
// GET ?rappels=1                               → { rappels } : ses rappels du matin (deux au plus), sur « Chez moi »
// POST { action: "reussi", avec, id }          → { ok } : 🏆 « C'est réussi » (celui que l'épreuve concerne, son jour arrivé)
// POST { action: "tenue", avec, id }           → { ok } : ✅ une promesse tenue (l'un ou l'autre)
// POST { action: "annuler-tenue", avec, id }   → { ok } : pendant 24 h
// 🕸️ LOT E3 :
// GET ?gouts=<clé>                             → { gouts } : ce qu'il ou elle aime (deux au plus), pour « Offrir »
// 🏡 LOT E4 « MON ÉTAGÈRE » :
// GET ?moi=1                                   → { etagere } : ce qui me concerne sur toutes mes étagères (d'où ça vient),
//                                                ce que j'ai déposé, ce que je montre à mes visiteurs
// POST { action: "deposer", genre, titre, emoji, quand?, sorte?, montre? }      → { ok, id } : sur mon étagère
// POST { action: "deposer", avec, pour, genre, titre, emoji, quand?, sorte? }   → { ok, id } : sur la nôtre (pour moi,
//                                                lui, ou nous deux ; il le verra se poser)
// POST { action: "montrer", id, oui, avec? }   → { ok } : mes visiteurs le voient (ce qui ne concerne que moi)
// POST { action: "cacher", id, avec }          → { ok } : je ne le garde plus chez moi (il reste sur la nôtre)
// POST { action: "retirer" | "date" | "tenue" | "annuler-tenue" | "reussi", mien: true, id }  → { ok } : ce que j'ai
//                                                déposé sur la mienne
// Les règles du talkie : la session vérifiée, deux proches qui se sont ajoutés, sinon 403 ; jamais l'identifiant d'un
// habitant, seulement sa clé. Le frein : `CLIKME_ETAGERE=0` (rien de noté, rien d'affiché : 404).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { agirSurEtagere, agirSurMonEtagere, deposerSurEtagere, etagereAvec, goutsDe, mesRappels, monEtagere } from "@/lib/direct/etagere-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const q = new URL(request.url).searchParams;
  if (q.get("rappels")) return NextResponse.json({ ok: true, rappels: await mesRappels(supabase, moi).catch(() => []) }, { headers: sansCache });
  if (q.get("gouts")) return NextResponse.json({ ok: true, gouts: await goutsDe(supabase, moi, q.get("gouts")).catch(() => []) }, { headers: sansCache });
  if (q.get("moi")) {
    const m = await monEtagere(supabase, moi);
    if (!m.etagere) return NextResponse.json({ error: m.error }, { status: m.statut ?? 400, headers: sansCache });
    return NextResponse.json({ ok: true, etagere: m.etagere }, { headers: sansCache });
  }
  const r = await etagereAvec(supabase, moi, q.get("avec"));
  if (!r.etagere) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400, headers: sansCache });
  return NextResponse.json({ ok: true, etagere: r.etagere }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  if (!p || !["retirer", "date", "vu", "pause", "reussi", "tenue", "annuler-tenue", "deposer", "montrer", "cacher"].includes(String(p.action))) return NextResponse.json({ error: "Demande incomplète." }, { status: 400, headers: sansCache });
  // 🏡 (lot E4) déposer ; mon étagère
  if (p.action === "deposer") {
    const d = await deposerSurEtagere(supabase, moi, p);
    return NextResponse.json(d.ok ? { ok: true, id: d.id } : { error: d.error }, { status: d.ok ? 200 : (d.statut ?? 400), headers: sansCache });
  }
  const r = p.action === "montrer" || p.action === "cacher" || p.mien === true ? await agirSurMonEtagere(supabase, moi, p) : await agirSurEtagere(supabase, moi, p);
  return NextResponse.json(r.ok ? { ok: true } : { error: r.error }, { status: r.ok ? 200 : (r.statut ?? 400), headers: sansCache });
}
