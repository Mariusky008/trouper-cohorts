/**
 * ⭐ JAMAIS SEUL DEVANT UNE VIDÉO, CÔTÉ SERVEUR (`reactions-video.ts` ; `docs/univers/decouvrir.md`, sections 4.5, 21 et
 * 22 ; le lot D2b).
 *
 *   - noter une réaction : une vidéo de ma télé du jour, à sa seconde ; une rafale compte une fois, 80 au plus ;
 *   - (deuxième partie) ce que j'écris à la seconde (sa sorte se déduit des mots) ; ↩ une réponse à un proche, juste
 *     après sa réaction — il reçoit « Léa t'a répondu » (une fois par vidéo) ;
 *   - noter que je l'ai vue (même sans réagir : je serai assis, silencieux, à côté de mes proches) ; ceux de mes proches
 *     qui l'avaient vue avant moi reçoivent « 🎬 Léa a regardé « … » : revois-la avec ses réactions » (si j'ai réagi ;
 *     une fois par proche et par vidéo) ;
 *   - les réactions de mes proches pour une vidéo : ceux qui se sont ajoutés des deux côtés, et qui l'ont vue ; une
 *     réponse n'est rendue qu'à celui à qui elle répond.
 *
 * `decouvrir/reactions/<vidéo>/<q>.json` = { vu, reactions, prevenus?, repondus? } — `<q>` : l'identifiant court de
 * chacun ; chacun n'écrit que son fichier. Seuls ses proches le lisent (le serveur, jamais le téléphone). `prevenus` /
 * `repondus` : les clés des proches déjà prévenus (« revois-la », « t'a répondu »).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson, prenomDe, prochesDe } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { cleProfil } from "./autour-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { dejaVue, maVideo } from "./tele-du-jour-serveur";
import { prevenirUnHabitantAppli } from "./appli-collection-serveur";
import {
  PHRASES_REACTIONS,
  REACTIONS_VIDEO,
  ajouterReaction,
  placerLesProches,
  reactionValide,
  sorteDuTexte,
  texteValide,
  titreCourt,
  type ProcheDevantVideo,
  type ReactionVideo,
} from "./reactions-video";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
type FicheReactions = { vu?: number; reactions?: unknown[]; prevenus?: string[]; repondus?: string[] };
type Notif = { titre: string; corps: string; url: string; tag: string };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
export const cheminReactions = (video: string, h: string) => `decouvrir/reactions/${video}/${qui8(h)}.json`;
const lesReactions = (f: Partial<FicheReactions>): ReactionVideo[] =>
  (Array.isArray(f.reactions) ? f.reactions : [])
    .map((x) => reactionValide(x as Record<string, unknown>))
    .filter((x): x is ReactionVideo => Boolean(x))
    .sort((a, b) => a.t - b.t)
    .slice(0, REACTIONS_VIDEO.max);
const lesCles = (l: unknown) => (Array.isArray(l) ? l.filter((x): x is string => typeof x === "string") : []);
const lireFiche = (supabase: Supabase, chemin: string) => lireJson<FicheReactions>(supabase, chemin).catch(() => ({}) as Partial<FicheReactions>);
/** L'adresse qui ouvre cette vidéo dans ma télé du jour (même déjà vue), à une seconde si l'on veut. */
const adresseVideo = (id: string, t?: number) => `/collection?tele=${id}${t !== undefined ? `&t=${Math.max(0, Math.floor(t))}` : ""}#decouvrir`;

/** Le prénom d'un proche (son compte, sinon sa fiche de figurine). */
async function prenomDuProche(supabase: Supabase, h: string): Promise<string> {
  const { data } = await supabase.from("human_habitants").select("prenom").eq("id", h).maybeSingle();
  return s((data as { prenom?: string } | null)?.prenom) || s(await prenomDe(supabase, { id: h } as Habitant).catch(() => "")) || "Ton proche";
}

/** Mes proches (ajoutés des deux côtés) qui ont vu cette vidéo : leur compte, quand, leurs réactions. */
async function prochesQuiLontVue(supabase: Supabase, moi: string, video: string): Promise<{ h: string; vu: number; reactions: ReactionVideo[] }[]> {
  const miens = [...(await prochesDe(supabase, moi))].filter((h) => h && h !== moi).slice(0, 60);
  const lus = await Promise.all(
    miens.map(async (h) => {
      const f = await lireFiche(supabase, cheminReactions(video, h));
      const vu = Number(f.vu) || 0;
      return vu > 0 ? { h, vu, reactions: lesReactions(f) } : null;
    }),
  );
  const vus = lus.filter((x): x is { h: string; vu: number; reactions: ReactionVideo[] } => Boolean(x));
  // (des deux côtés : celui qui ne m'a pas ajouté ne s'assoit pas chez moi)
  return (await Promise.all(vus.map(async (x) => ((await prochesDe(supabase, x.h)).has(moi) ? x : null)))).filter((x): x is (typeof vus)[number] => Boolean(x));
}

/**
 * 😂 Une réaction à une vidéo de ma télé du jour, à sa seconde. `ignoree` : une rafale de la même sorte, les mêmes mots
 * deux fois, ou déjà 80. Avec `texte` (deuxième partie) : ce que j'écris à cette seconde (sa sorte se déduit des mots,
 * si elle n'est pas donnée). Avec `a` (la clé d'un proche) et `repond` (la seconde de sa réaction) : ↩ ma réponse, placée
 * juste après ; `prevenir` : la notification à lui envoyer (après la réponse ; une fois par proche et par vidéo).
 */
export async function noterReaction(
  supabase: Supabase,
  moi: Habitant,
  id: unknown,
  x: Record<string, unknown>,
): Promise<Resultat<{ ok?: true; reaction?: ReactionVideo; ignoree?: true; prevenir?: { h: string; notif: Notif } }>> {
  const v = await maVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const texte = x.texte === undefined ? null : texteValide(x.texte);
  if (x.texte !== undefined && !texte) return { error: "Écris quelques mots.", statut: 400 };
  const reponse = x.a !== undefined;
  if (reponse && !texte) return { error: "Écris quelques mots.", statut: 400 };
  // (↩ une réponse : le proche existe, il est des deux côtés, il a réagi à cette seconde)
  let pour: { h: string; cle: string; repond: number } | null = null;
  if (reponse) {
    const cle = s(x.a);
    const repond = Math.round(Number(x.repond) * 10) / 10;
    const lui = Number.isFinite(repond) ? (await prochesQuiLontVue(supabase, moi.id, v.id)).find((p) => cleProfil(p.h) === cle) : undefined;
    // (on répond à une réaction, ou à sa réponse à soi : la conversation continue)
    const maCle = cleProfil(moi.id);
    if (!lui || !lui.reactions.some((r) => (!r.a || r.a === maCle) && Math.abs(r.t - repond) < 0.05)) return { error: "Cette réaction n’est plus là.", statut: 404 };
    pour = { h: lui.h, cle, repond };
  }
  const t = pour ? Math.min(pour.repond + REACTIONS_VIDEO.apres, v.duree > 0 ? v.duree : Infinity) : x.t;
  const r = reactionValide({ t, sorte: x.sorte ?? (texte ? sorteDuTexte(texte) : undefined), source: texte ? "rangee" : x.source, texte, ...(pour ? { a: pour.cle, repond: pour.repond } : {}) });
  if (!r || (v.duree > 0 && r.t > v.duree + 2)) return { error: "Cette réaction n’existe pas.", statut: 400 };
  const chemin = cheminReactions(v.id, moi.id);
  const f = await lireFiche(supabase, chemin);
  const liste = ajouterReaction(lesReactions(f), r);
  if (!liste) return { ok: true, ignoree: true };
  const repondus = lesCles(f.repondus);
  const prevenirLui = pour && !repondus.includes(pour.cle);
  const fiche: FicheReactions = { ...f, vu: Date.now(), reactions: liste, ...(prevenirLui && pour ? { repondus: [...repondus, pour.cle].slice(-60) } : {}) };
  if (!(await ecrireJson(supabase, chemin, fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  if (!prevenirLui || !pour || !r.texte) return { ok: true, reaction: r };
  const prenom = await prenomDuProche(supabase, moi.id);
  return {
    ok: true,
    reaction: r,
    prevenir: { h: pour.h, notif: { titre: PHRASES_REACTIONS.tARepondu(prenom), corps: PHRASES_REACTIONS.reponseCorps(pour.repond, titreCourt(v.titre), r.texte), url: adresseVideo(v.id, Math.max(0, pour.repond - 3)), tag: `tele-reponse-${v.id}` } },
  };
}

/** 🔔 Envoyer une notification préparée (après la réponse). */
export async function prevenir(supabase: Supabase, p: { h: string; notif: Notif }): Promise<void> {
  await prevenirUnHabitantAppli(supabase, p.h, p.notif).catch(() => "rien");
}

/**
 * 👀 Je l'ai vue (jusqu'au bout, ou passée) : mes proches me verront assis à côté d'eux, même sans réaction. Si j'ai
 * réagi (pas seulement ce que l'appli a compris seule), ceux de mes proches qui l'avaient déjà vue reçoivent « 🎬 Léa a
 * regardé « … » : revois-la avec ses réactions » (sinon mes réactions ne leur parviendraient jamais ; une fois par
 * proche et par vidéo ; pas à celui à qui je viens de répondre : il a déjà eu « t'a répondu »).
 */
export async function apresLaVue(supabase: Supabase, moi: Habitant, video: string): Promise<void> {
  const chemin = cheminReactions(video, moi.id);
  const f = await lireFiche(supabase, chemin);
  const reactions = lesReactions(f);
  const fiche: FicheReactions = { ...f, vu: Date.now(), reactions };
  if (!reactions.some((r) => r.source !== "implicite")) {
    await ecrireJson(supabase, chemin, fiche);
    return;
  }
  const v = await maVideo(supabase, moi.id, video);
  const deja = new Set([...lesCles(f.prevenus), ...lesCles(f.repondus)]);
  const eux = v ? (await prochesQuiLontVue(supabase, moi.id, v.id)).filter((p) => !deja.has(cleProfil(p.h))) : [];
  const prevenus = [...lesCles(f.prevenus), ...eux.map((p) => cleProfil(p.h))].slice(-60);
  await ecrireJson(supabase, chemin, { ...fiche, ...(eux.length ? { prevenus } : {}) } satisfies FicheReactions);
  if (!v || !eux.length) return;
  const prenom = await prenomDuProche(supabase, moi.id);
  const notif: Notif = { titre: PHRASES_REACTIONS.aRegarde(prenom, titreCourt(v.titre)), corps: PHRASES_REACTIONS.revoisLa, url: adresseVideo(v.id), tag: `tele-${v.id}` };
  await Promise.all(eux.map((p) => prevenirUnHabitantAppli(supabase, p.h, notif).catch(() => "rien")));
}

/**
 * 👥 Les proches qui ont vu cette vidéo (ajoutés des deux côtés) : leurs réactions à la seconde (leurs réponses : celles
 * qui sont pour moi seulement), quand ils l'ont vue ; la figurine assise des trois qui s'assoient à côté de moi (les
 * autres passent au bord de la télé). Et les miennes ; `vue` : je l'ai déjà vue (« 💬 Ce qui s'est dit » montre tout).
 */
export async function reactionsDesProches(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ proches?: ProcheDevantVideo[]; miennes?: ReactionVideo[]; vue?: boolean }>> {
  const v = await maVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const maCle = cleProfil(moi.id);
  const [mutuels, mienne, vue] = await Promise.all([prochesQuiLontVue(supabase, moi.id, v.id), lireFiche(supabase, cheminReactions(v.id, moi.id)), dejaVue(supabase, moi.id, v.id)]);
  const sans = await Promise.all(
    mutuels.map(async (x): Promise<ProcheDevantVideo> => ({ cle: cleProfil(x.h), prenom: await prenomDuProche(supabase, x.h), figurine: null, vu: x.vu, reactions: x.reactions.filter((r) => !r.a || r.a === maCle) })),
  );
  const { assis, bord } = placerLesProches(sans);
  const deQui = new Map(mutuels.map((x) => [cleProfil(x.h), x.h]));
  const avecFigurines = await Promise.all(assis.map(async (p) => ({ ...p, figurine: await figurineDeLaMaison(supabase, deQui.get(p.cle) ?? "").catch(() => null) })));
  return { proches: [...avecFigurines, ...bord], miennes: lesReactions(mienne), vue };
}
