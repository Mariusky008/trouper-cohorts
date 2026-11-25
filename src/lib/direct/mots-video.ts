/**
 * 🎙️ « LAISSER UN MOT AVEC MA FIGURINE » : LA SUITE DE LA VIDÉO (`docs/univers/decouvrir.md`, section 38 ; le serveur :
 * `mots-video-serveur.ts` ; la route : `/api/direct/mots-video` ; l'écran : `app/collection/suite-de-la-video.tsx`).
 *
 * À la fin d'une vidéo, on peut laisser un mot : sa vraie voix (dix secondes au plus) et, si on le veut, ses têtes lues
 * par la caméra sur le téléphone (rien n'est filmé). Sa figurine le dit, à la suite de la vidéo, pour **tous ceux qui
 * regardent cette vidéo** (décision du propriétaire, 25 novembre 2026) — les 15-17 ans ont leur suite à eux. Un mot par
 * personne et par vidéo ; on peut répondre à un mot ; « Signaler » ; « Effacer mon mot ». Jamais de voix de synthèse.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import { expressionValide, type ExpressionVisage } from "./visage-essai";
import type { FigurineVivante } from "./expressions-figurine";

/**
 * Les réglages (à confirmer par le propriétaire, section 38.5 : faciles à changer, ici seulement).
 */
export const MOTS_VIDEO = {
  /** Dix secondes au plus. */
  max: 10,
  /** Un toucher plus court n'est pas un mot. */
  min: 1,
  /** Combien de temps un mot reste attaché à la vidéo. */
  conserveJours: 30,
  /** Signalé par autant de personnes différentes : caché pour tous, en attendant l'administrateur. */
  seuilSignalements: 3,
  /** Combien de mots on montre avant « Tous ». */
  montres: 6,
  /** Les mots lus pour une vidéo (les plus récents). */
  lusMax: 60,
  /** Les figurines préparées (les premières de la liste) ; les autres : leur prénom. */
  figurinesMax: 12,
  /** Les têtes notées pendant un mot. */
  tetesMax: 60,
  /** La fin d'une vidéo sans geste : la suivante arrive après ce temps (sans mot à écouter). */
  suivanteSeuleS: 8,
} as const;

/** Une tête notée pendant le mot, à sa seconde (`r` : la tête penchée, `l` : tournée ; rien : son visage habituel). */
export type TeteMot = { t: number; e: ExpressionVisage | null; r?: number; l?: number };

/** Un mot, tel que les autres le voient (jamais un compte : sa clé courte). */
export type MotVu = {
  /** L'identifiant court de celui qui l'a laissé. */
  q: string;
  prenom: string;
  duree: number;
  /** L'adresse du son (signée, une heure). */
  src: string;
  le: number;
  tetes: TeteMot[];
  /** À qui il répond (son `q`) et son prénom. */
  repond?: { q: string; prenom: string };
  /** Un de mes proches. */
  proche: boolean;
  /** Le mien. */
  moi: boolean;
  figurine: { src: string } | null;
  vivante?: FigurineVivante | null;
};

export type SuiteVue = { mots: MotVu[]; montres: number; tranche: "adultes" | "jeunes" };

const borne = (v: number, a: number) => Math.max(-a, Math.min(a, v));
const dixieme = (v: number) => Math.round(v * 10) / 10;

/** Les têtes d'un mot, nettoyées : à leur seconde (dans le mot), une expression connue ou rien, 60 au plus. */
export function tetesValides(x: unknown, duree: number): TeteMot[] {
  if (!Array.isArray(x)) return [];
  const l: TeteMot[] = [];
  for (const y of x.slice(0, MOTS_VIDEO.tetesMax * 2)) {
    if (!y || typeof y !== "object") continue;
    const o = y as Record<string, unknown>;
    const t = Number(o.t);
    if (!Number.isFinite(t) || t < 0 || t > duree + 0.5) continue;
    const e = o.e == null ? null : expressionValide(o.e) ? o.e : undefined;
    if (e === undefined) continue;
    const r = Number(o.r);
    const lc = Number(o.l);
    l.push({ t: dixieme(t), e, ...(Number.isFinite(r) && r ? { r: Math.round(borne(r, 0.5) * 100) / 100 } : {}), ...(Number.isFinite(lc) && lc ? { l: Math.round(borne(lc, 0.8) * 100) / 100 } : {}) });
  }
  return l.sort((a, b) => a.t - b.t).slice(0, MOTS_VIDEO.tetesMax);
}

/** La tête du moment, pendant qu'un mot passe (la dernière notée avant `t`). */
export function teteA(tetes: TeteMot[], t: number): TeteMot | null {
  let vue: TeteMot | null = null;
  for (const x of tetes) {
    if (x.t > t) break;
    vue = x;
  }
  return vue;
}

/**
 * L'ordre de la suite : mes proches d'abord, puis les autres, chacun dans l'ordre où il a parlé ; une réponse vient
 * juste après le mot auquel elle répond (et après les réponses déjà là).
 */
export function ordonnerMots<T extends { q: string; le: number; proche: boolean; repond?: { q: string } }>(mots: T[]): T[] {
  const parQ = new Map(mots.map((m) => [m.q, m]));
  const racines = mots.filter((m) => !m.repond || !parQ.has(m.repond.q) || m.repond.q === m.q).sort((a, b) => Number(b.proche) - Number(a.proche) || a.le - b.le);
  const reponses = mots.filter((m) => !racines.includes(m)).sort((a, b) => a.le - b.le);
  const l = [...racines];
  for (const r of reponses) {
    // (après le mot qu'il répond, et après ce qui y répond déjà)
    let i = l.findIndex((m) => m.q === r.repond?.q);
    if (i < 0) {
      l.push(r);
      continue;
    }
    while (i + 1 < l.length && l[i + 1].repond?.q === r.repond?.q) i++;
    l.splice(i + 1, 0, r);
  }
  return l;
}

const secondes = (d: number) => `${Math.max(1, Math.round(d))} s`;

export const PHRASES_MOTS = {
  laisser: "Laisser un mot avec ma figurine",
  laisserSous: "Il passera à la suite de la vidéo",
  titre: "La suite de la vidéo",
  sansMot: "Personne n’a encore laissé de mot. Le tien serait le premier.",
  leurs: "Leurs mots, dits par leur figurine",
  toutEcouter: "▶ Tout écouter",
  tous: (n: number) => `Tous (${n})`,
  suivante: "Suivante ⏭",
  suivanteDans: (n: number) => `Suivante dans ${n} s`,
  ecouter: (prenom: string) => `Écouter ${prenom}`,
  duree: (d: number) => secondes(d),
  proche: "ton proche",
  aVu: "a vu la vidéo",
  toi: "Toi",
  repondA: (prenom: string) => `Répondre à ${prenom}`,
  repondAPrenom: (prenom: string) => `répond à ${prenom}`,
  turepondsA: (prenom: string) => `Tu réponds à ${prenom}`,
  signaler: "Signaler",
  signale: "Merci : ce mot ne passera plus chez toi, et on va le regarder.",
  effacer: "Effacer mon mot",
  efface: "✓ Ton mot est effacé, partout.",
  // l'enregistrement
  parle: "Parle : ta figurine dira ton mot",
  reste: (n: number) => `${n} s`,
  cestDit: "■ C’est dit",
  avecTetes: "📷 Avec mes têtes",
  avecTetesSous: "Ton téléphone lit ton visage, rien n’est filmé.",
  sansTetes: "Ta voix seulement",
  reecouter: "▶ Réécouter",
  arreter: "■ Arrêter",
  recommencer: "Recommencer",
  publier: "Publier",
  accord: "Tout le monde qui regarde cette vidéo verra ta figurine et entendra ta voix. Tu pourras l’effacer quand tu veux.",
  publie: "✓ Ton mot passe à la suite de la vidéo.",
  remplace: "Tu as déjà laissé un mot ici : le nouveau le remplacera.",
  annuler: "Annuler",
  court: "Parle un peu plus longtemps (une seconde au moins).",
  refus: "Le micro n’a pas pu s’allumer : autorise-le dans les réglages de ton téléphone.",
  rate: "Ton mot n’est pas parti : réessaie.",
  age: "Avant ton premier mot : as-tu 18 ans ou plus ? Les 15-17 ans ont leur suite à eux.",
  adulte: "J’ai 18 ans ou plus",
  jeune: "J’ai entre 15 et 17 ans",
} as const;
