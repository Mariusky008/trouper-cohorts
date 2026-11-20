/**
 * ⭐ JAMAIS SEUL DEVANT UNE VIDÉO, CÔTÉ SERVEUR (`reactions-video.ts` ; `docs/univers/decouvrir.md`, sections 4.5 et 21 ;
 * le lot D2b, première partie).
 *
 *   - noter une réaction : une vidéo de ma télé du jour, à sa seconde ; une rafale compte une fois, 80 au plus ;
 *   - noter que je l'ai vue (même sans réagir : je serai assis, silencieux, à côté de mes proches) ;
 *   - les réactions de mes proches pour une vidéo : ceux qui se sont ajoutés des deux côtés, et qui l'ont vue.
 *
 * `decouvrir/reactions/<vidéo>/<q>.json` = { vu, reactions } — `<q>` : l'identifiant court de chacun ; chacun n'écrit
 * que son fichier. Seuls ses proches le lisent (le serveur, jamais le téléphone).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson, prenomDe, prochesDe } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { cleProfil } from "./autour-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { maVideo } from "./tele-du-jour-serveur";
import { REACTIONS_VIDEO, ajouterReaction, placerLesProches, reactionValide, type ProcheDevantVideo, type ReactionVideo } from "./reactions-video";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
type FicheReactions = { vu?: number; reactions?: unknown[] };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
export const cheminReactions = (video: string, h: string) => `decouvrir/reactions/${video}/${qui8(h)}.json`;
const lesReactions = (f: Partial<FicheReactions>): ReactionVideo[] =>
  (Array.isArray(f.reactions) ? f.reactions : [])
    .map((x) => reactionValide(x as Record<string, unknown>))
    .filter((x): x is ReactionVideo => Boolean(x))
    .sort((a, b) => a.t - b.t)
    .slice(0, REACTIONS_VIDEO.max);

/** 😂 Une réaction à une vidéo de ma télé du jour, à sa seconde. `ignoree` : une rafale de la même sorte, ou déjà 80. */
export async function noterReaction(supabase: Supabase, moi: Habitant, id: unknown, x: Record<string, unknown>): Promise<Resultat<{ ok?: true; reaction?: ReactionVideo; ignoree?: true }>> {
  const v = await maVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const r = reactionValide({ t: x.t, sorte: x.sorte, source: x.source });
  if (!r || (v.duree > 0 && r.t > v.duree + 2)) return { error: "Cette réaction n’existe pas.", statut: 400 };
  const chemin = cheminReactions(v.id, moi.id);
  const f = await lireJson<FicheReactions>(supabase, chemin).catch(() => ({}) as Partial<FicheReactions>);
  const liste = ajouterReaction(lesReactions(f), r);
  if (!liste) return { ok: true, ignoree: true };
  if (!(await ecrireJson(supabase, chemin, { vu: Date.now(), reactions: liste } satisfies FicheReactions))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  return { ok: true, reaction: r };
}

/** 👀 Je l'ai vue (jusqu'au bout, ou passée) : mes proches me verront assis à côté d'eux, même sans réaction. */
export async function noterVuePourMesProches(supabase: Supabase, h: string, video: string): Promise<void> {
  const chemin = cheminReactions(video, h);
  const f = await lireJson<FicheReactions>(supabase, chemin).catch(() => ({}) as Partial<FicheReactions>);
  await ecrireJson(supabase, chemin, { vu: Date.now(), reactions: lesReactions(f) } satisfies FicheReactions);
}

/** Le prénom d'un proche (son compte, sinon sa fiche de figurine). */
async function prenomDuProche(supabase: Supabase, h: string): Promise<string> {
  const { data } = await supabase.from("human_habitants").select("prenom").eq("id", h).maybeSingle();
  return s((data as { prenom?: string } | null)?.prenom) || s(await prenomDe(supabase, { id: h } as Habitant).catch(() => "")) || "Ton proche";
}

/**
 * 👥 Les proches qui ont vu cette vidéo (ajoutés des deux côtés) : leurs réactions à la seconde, quand ils l'ont vue ;
 * la figurine assise des trois qui s'assoient à côté de moi (les autres passent au bord de la télé).
 */
export async function reactionsDesProches(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ proches?: ProcheDevantVideo[] }>> {
  const v = await maVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const miens = [...(await prochesDe(supabase, moi.id))].filter((h) => h && h !== moi.id).slice(0, 60);
  const lus = await Promise.all(
    miens.map(async (h) => {
      const f = await lireJson<FicheReactions>(supabase, cheminReactions(v.id, h)).catch(() => ({}) as Partial<FicheReactions>);
      const vu = Number(f.vu) || 0;
      return vu > 0 ? { h, vu, reactions: lesReactions(f) } : null;
    }),
  );
  const vus = lus.filter((x): x is { h: string; vu: number; reactions: ReactionVideo[] } => Boolean(x));
  // (des deux côtés : celui qui ne m'a pas ajouté ne s'assoit pas chez moi)
  const mutuels = (await Promise.all(vus.map(async (x) => ((await prochesDe(supabase, x.h)).has(moi.id) ? x : null)))).filter((x): x is (typeof vus)[number] => Boolean(x));
  const sans = await Promise.all(mutuels.map(async (x): Promise<ProcheDevantVideo> => ({ cle: cleProfil(x.h), prenom: await prenomDuProche(supabase, x.h), figurine: null, vu: x.vu, reactions: x.reactions })));
  const { assis, bord } = placerLesProches(sans);
  const deQui = new Map(mutuels.map((x) => [cleProfil(x.h), x.h]));
  const avecFigurines = await Promise.all(assis.map(async (p) => ({ ...p, figurine: await figurineDeLaMaison(supabase, deQui.get(p.cle) ?? "").catch(() => null) })));
  return { proches: [...avecFigurines, ...bord] };
}
