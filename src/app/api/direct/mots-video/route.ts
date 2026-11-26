// 🎙️ « LAISSER UN MOT AVEC MA FIGURINE » : LA SUITE DE LA VIDÉO (`lib/direct/mots-video.ts`, `mots-video-serveur.ts` ;
// `docs/univers/decouvrir.md`, section 38). Seulement pour quelqu'un de ClikMe (le cookie d'habitant), sur une vidéo de
// sa télé du jour (même déjà vue) ; (lot 2) celle de sa séance (`seance`), ou de la sélection d'un salon de sa tranche.
//
// GET ?video=<id>                               → { suite } : les mots de sa tranche (adultes, ou 15-17 ans), ses proches
//                                                 d'abord ; 403 `age` : il n'a pas encore dit s'il a 18 ans
// GET ?de=<q>                                   → { mots } : (les jeux du salon) ses derniers mots publiés, pour sa fiche
// POST { action: "publier", id, son, duree, tetes?, repond?, accord: true } → { ok } : sa voix (une à dix secondes), ses
//                                                 têtes ; un seul mot par vidéo (le nouveau remplace l'ancien)
// POST { action: "effacer", id }                → { ok } : son mot disparaît partout
// POST { action: "signaler", id, q }            → { ok, cache } : ce mot ne passe plus chez lui ; trois : chez personne
// POST { action: "age", adulte }                → { ok, adulte } : « As-tu 18 ans ou plus ? »
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { effacerMot, publierMot, sesMots, signalerMot, suiteDeLaVideo } from "@/lib/direct/mots-video-serveur";
import { direSesDixHuitAns } from "@/lib/direct/majorite-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };
const repondre = (r: { error?: string; statut?: number; age?: true }, ok: Record<string, unknown> = {}) =>
  NextResponse.json(r.error ? { error: r.error, ...(r.age ? { age: true } : {}) } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const q = new URL(request.url).searchParams;
  if (q.get("de")) {
    const d = await sesMots(supabase, moi, q.get("de"));
    return repondre(d, { mots: d.mots ?? [] });
  }
  const r = await suiteDeLaVideo(supabase, moi, q.get("video"), q.get("seance"));
  return repondre(r, { suite: r.suite });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const p = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (p.action === "publier") return repondre(await publierMot(supabase, moi, p));
  if (p.action === "effacer") return repondre(await effacerMot(supabase, moi, p.id, p.seance));
  if (p.action === "signaler") {
    const r = await signalerMot(supabase, moi, p.id, p.q, p.seance);
    return repondre(r, { cache: r.cache === true });
  }
  if (p.action === "age") {
    const r = await direSesDixHuitAns(supabase, moi.id, p.adulte);
    return repondre(r, { adulte: r.adulte });
  }
  return NextResponse.json({ error: "Demande inconnue." }, { status: 400, headers: sansCache });
}
