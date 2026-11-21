// 📺 MA TÉLÉ DU JOUR (`lib/direct/tele-du-jour.ts`, `tele-du-jour-serveur.ts` ; `docs/univers/decouvrir.md`, section 4.2 ;
// le lot D1) : la sienne seulement (le cookie d'habitant).
//
// GET                                         → { tele } : ses passions, les vidéos qui l'attendent (mêlées selon ses
//                                               poids, sans ce qu'il a vu), sa pièce et sa figurine
// POST { action: "vue", id, fin?, secondes?, illisible? } → { ok } : vue jusqu'au bout (son thème monte), passée avant
//                                               15 s (il descend) ; elle ne revient plus
// POST { action: "garder", id }               → { ok, deja? } : 📌 à la télé de sa maison
// POST { action: "envoyer", id, a }           → { ok } : 📤 à un proche (sa clé) : un message dans leur conversation, sur
//                                               la télé de leur duo ; la notification part après la réponse
// ⭐ JAMAIS SEUL DEVANT UNE VIDÉO (le lot D2b, première partie ; `decouvrir.md` sections 4.5 et 21) :
// GET ?reactions=<id>                         → { proches } : ceux de ses proches (ajoutés des deux côtés) qui l'ont vue,
//                                               leurs réactions à la seconde, quand ils l'ont vue, la figurine des trois
//                                               qui s'assoient à côté de lui
// POST { action: "reagir", id, t, sorte, source? } → { ok, reaction?, ignoree? } : 😂 ❤️ 😮 😱 😴 à cette seconde (la
//                                               rangée, un geste sans viser, ou ce que l'appli comprend seule ; 📷
//                                               `source: "visage"`, `visage`, `d` : une expression vue sur mon visage)
// GET ?vivante=1                              → { vivante } : 📷 ma figurine vivante (le lot V2), ou `null`
// Une vidéo vue (« vue ») : ses proches le verront assis à côté d'eux, même sans réaction (après la réponse).
// (deuxième partie, `decouvrir.md` section 22)
// GET ?reactions=<id>                         → { proches, miennes, vue } : aussi les siennes, et s'il l'a déjà vue
// GET ?historique=1                           → { historique } : 📼 ses vidéos déjà vues, et les amis qui y ont réagi depuis
//                                               (« Revoir », `decouvrir.md` section 31)
// GET ?video=<id>                             → { video } : une vidéo de sa télé, même déjà vue (la notification
//                                               « revois-la avec ses réactions », « Léa t'a répondu »)
// POST { action: "ecrire", id, t, texte }     → { ok, reaction?, ignoree? } : ce qu'il écrit à cette seconde (90
//                                               caractères ; sa sorte se déduit des mots)
// POST { action: "repondre", id, a, repond, texte, sorte? } → { ok, reaction?, ignoree? } : ↩ à la réaction d'un proche
//                                               (sa clé, sa seconde), juste après ; « Léa t'a répondu » (après la réponse)
// POST { action: "vocal", id, t, son, duree } → { ok, reaction?, ignoree? } : 🎙️ sa vraie voix à cette seconde (une minute
//                                               au plus ; `son` : le fichier en data: URL) ; ses proches l'écoutent
// Une vidéo vue, s'il a réagi : ceux de ses proches qui l'avaient vue reçoivent « 🎬 Léa a regardé « … » : revois-la
// avec ses réactions » (après la réponse ; une fois par proche et par vidéo).
// 404 : une vidéo qui n'est pas à sa télé (on n'envoie, ne garde ni ne réagit à autre chose).
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { apresEcrit } from "@/lib/direct/ecrit-serveur";
import { envoyerVideo, garderVideo, maTeleDuJour, maVideo, noterVue } from "@/lib/direct/tele-du-jour-serveur";
import { apresLaVue, noterReaction, noterVocal, prevenir, reactionsDesProches } from "@/lib/direct/reactions-video-serveur";
import { monHistorique } from "@/lib/direct/revoir-serveur";
import { figurineVivante } from "@/lib/direct/expressions-figurine-serveur";

export const dynamic = "force-dynamic";

const sansCache = { "cache-control": "private, no-store" };
const SANS_COMPTE = { error: "Crée d’abord ta figurine sur ce téléphone." };

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const q = new URL(request.url).searchParams;
  const video = q.get("reactions");
  if (video !== null) {
    const r = await reactionsDesProches(supabase, moi, video);
    return NextResponse.json(r.error ? { error: r.error } : { ok: true, proches: r.proches, miennes: r.miennes, vue: r.vue }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  }
  // (📷 le lot V2 : ma figurine vivante — ses calques et ses cinq expressions, s'ils sont prêts)
  if (q.get("vivante") !== null) return NextResponse.json({ ok: true, vivante: await figurineVivante(supabase, moi.id) }, { headers: sansCache });
  if (q.get("historique") !== null) return NextResponse.json({ ok: true, historique: await monHistorique(supabase, moi.id) }, { headers: sansCache });
  if (q.get("video") !== null) {
    const v = await maVideo(supabase, moi.id, q.get("video"));
    return NextResponse.json(v ? { ok: true, video: v } : { error: "Cette vidéo n’est plus à ta télé." }, { status: v ? 200 : 404, headers: sansCache });
  }
  return NextResponse.json({ ok: true, tele: await maTeleDuJour(supabase, moi.id) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json(SANS_COMPTE, { status: 401, headers: sansCache });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const repondre = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });
  if (p?.action === "vue") {
    const r = await noterVue(supabase, moi.id, p.id, { fin: p.fin, secondes: p.secondes, illisible: p.illisible });
    if (!r.error && p.illisible !== true) after(() => apresLaVue(supabase, moi, String(p.id)).catch(() => undefined));
    return repondre(r);
  }
  if (p?.action === "reagir" || p?.action === "ecrire" || p?.action === "repondre") {
    const x: Record<string, unknown> =
      p.action === "reagir" ? { t: p.t, sorte: p.sorte, source: p.source, visage: p.visage, d: p.d } : p.action === "ecrire" ? { t: p.t, texte: p.texte ?? "" } : { a: p.a ?? "", repond: p.repond, texte: p.texte ?? "", sorte: p.sorte };
    const r = await noterReaction(supabase, moi, p.id, x);
    const pr = r.prevenir;
    if (pr) after(() => prevenir(supabase, pr).catch(() => undefined));
    return repondre(r, r.ignoree ? { ignoree: true } : r.reaction ? { reaction: r.reaction } : {});
  }
  if (p?.action === "vocal") {
    const r = await noterVocal(supabase, moi, p.id, { t: p.t, son: p.son, duree: p.duree });
    return repondre(r, r.ignoree ? { ignoree: true } : r.reaction ? { reaction: r.reaction } : {});
  }
  if (p?.action === "garder") {
    const r = await garderVideo(supabase, moi, p.id);
    return repondre(r, r.deja ? { deja: true } : {});
  }
  if (p?.action === "envoyer") {
    const r = await envoyerVideo(supabase, moi, p.id, p.a);
    const a = r.apres;
    if (a) after(() => apresEcrit(supabase, moi, a).catch(() => undefined));
    return repondre(r);
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400, headers: sansCache });
}
