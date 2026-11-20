/**
 * ⭐ JAMAIS SEUL DEVANT UNE VIDÉO — ce qui ne dépend pas de l'écran (`docs/univers/decouvrir.md`, sections 4.5 et 13 ; le
 * lot D2b, première partie) : les réactions à une vidéo de ma télé du jour, notées à la seconde ; celles de mes proches,
 * rejouées à la même seconde par leurs figurines assises à côté de moi ; « 🫶 Au même moment ».
 *
 * Partagé (l'écran, le serveur, les essais).
 */
import type { ImageSalon } from "./salon";

/** La rangée sous la télé (la maquette, section 12) : un toucher, une réaction à cette seconde. */
export const SORTES_VIDEO = [
  { cle: "rire", e: "😂", nom: "Rire" },
  { cle: "coeur", e: "❤️", nom: "J’adore" },
  { cle: "oh", e: "😮", nom: "Oh !" },
  { cle: "peur", e: "😱", nom: "Oh non !" },
  { cle: "bof", e: "😴", nom: "Bof" },
] as const;
export type SorteVideo = (typeof SORTES_VIDEO)[number]["cle"];
/** D'où elle vient : la rangée, un geste sans viser sur la pièce, ou ce que l'appli comprend seule (passer, revoir, finir). */
export const SOURCES_VIDEO = ["rangee", "geste", "implicite"] as const;
export type SourceVideo = (typeof SOURCES_VIDEO)[number];
/** Une réaction : sa seconde dans la vidéo (au dixième), sa sorte, d'où elle vient, quand. */
export type ReactionVideo = { t: number; sorte: SorteVideo; source: SourceVideo; le: number };
/** Un proche qui a vu cette vidéo : sa clé, son prénom, sa figurine assise (les trois premiers), quand il l'a vue, ses réactions. */
export type ProcheDevantVideo = { cle: string; prenom: string; figurine: ImageSalon | null; vu: number; reactions: ReactionVideo[] };

export const REACTIONS_VIDEO = {
  /** par vidéo et par personne */
  max: 80,
  /** la même sorte, à moins de 1,2 s de la précédente : une seule (un doigt qui insiste) */
  rafale: 1.2,
  /** « 🫶 Au même moment » : à 1,8 s près (section 13) */
  ensemble: 1.8,
  /** jusqu'à trois proches assis à côté de moi (les places de ma pièce, section 4.3) */
  assis: 3,
  /** les suivants, en petites têtes au bord de la télé */
  bord: 6,
  /** une vidéo de plus de quatre heures : non */
  dureeMax: 4 * 3600,
  /** passée avant 15 s : « bof » (comme les poids de ma télé du jour) */
  passeeAvant: 15,
  /** revenir en arrière de plus de 3 s : « oh ! » au début du passage revu, une fois toutes les 10 s au plus */
  retour: 3,
  retourEcart: 10,
} as const;

export const sorteVideo = (x: unknown) => SORTES_VIDEO.find((s) => s.cle === x);

/** Une réaction reçue (du téléphone) ou relue (d'un fichier) : sa seconde, sa sorte ; sinon `null`. */
export function reactionValide(x: { t?: unknown; sorte?: unknown; source?: unknown; le?: unknown } | null | undefined, le = Date.now()): ReactionVideo | null {
  if (!x) return null;
  const t = Number(x.t);
  if (!Number.isFinite(t) || t < 0 || t > REACTIONS_VIDEO.dureeMax) return null;
  const s = sorteVideo(x.sorte);
  if (!s) return null;
  const source = (SOURCES_VIDEO as readonly string[]).includes(String(x.source)) ? (x.source as SourceVideo) : "rangee";
  const quand = Number(x.le);
  return { t: Math.round(t * 10) / 10, sorte: s.cle, source, le: Number.isFinite(quand) && quand > 0 ? quand : le };
}

/** Ajoute une réaction (rangées par seconde) ; `null` : une rafale de la même sorte, ou déjà 80. */
export function ajouterReaction(liste: readonly ReactionVideo[], r: ReactionVideo): ReactionVideo[] | null {
  if (liste.length >= REACTIONS_VIDEO.max) return null;
  if (liste.some((x) => x.sorte === r.sorte && Math.abs(x.t - r.t) < REACTIONS_VIDEO.rafale)) return null;
  return [...liste, r].sort((a, b) => a.t - b.t);
}

/** 🫶 Au même moment : le proche qui a réagi le plus près de cette seconde (à 1,8 s près) ; sinon `null`. */
export function auMemeMoment(t: number, proches: readonly ProcheDevantVideo[]): ProcheDevantVideo | null {
  let mieux: ProcheDevantVideo | null = null;
  let ecart = Infinity;
  for (const p of proches)
    for (const r of p.reactions) {
      const e = Math.abs(r.t - t);
      if (e <= REACTIONS_VIDEO.ensemble && e < ecart) {
        mieux = p;
        ecart = e;
      }
    }
  return mieux;
}

/** Qui s'assoit : les trois qui ont le plus réagi (à égalité, celui qui l'a vue le plus récemment) ; les suivants au bord. */
export function placerLesProches(proches: readonly ProcheDevantVideo[]): { assis: ProcheDevantVideo[]; bord: ProcheDevantVideo[] } {
  const tries = [...proches].sort((a, b) => b.reactions.length - a.reactions.length || b.vu - a.vu);
  return { assis: tries.slice(0, REACTIONS_VIDEO.assis), bord: tries.slice(REACTIONS_VIDEO.assis, REACTIONS_VIDEO.assis + REACTIONS_VIDEO.bord) };
}

/**
 * Ce qui est à jouer maintenant : les réactions de mes proches entre la seconde d'avant et celle-ci. Un saut (en avant
 * de plus de 1,5 s, ou en arrière) ne rejoue rien : on attend la seconde suivante.
 */
export function aJouer(proches: readonly ProcheDevantVideo[], avant: number, maintenant: number): { cle: string; r: ReactionVideo }[] {
  if (!(maintenant > avant) || maintenant - avant > 1.5) return [];
  const l: { cle: string; r: ReactionVideo }[] = [];
  for (const p of proches) for (const r of p.reactions) if (r.t > avant && r.t <= maintenant) l.push({ cle: p.cle, r });
  return l;
}

/** L'animation de la figurine pour une réaction : rire → la tête qui sautille ; ❤️ → elle bat ; 😮 😱 → un sursaut ; 😴 → elle somnole. */
export const ANIMATION_VIDEO: Record<SorteVideo, "rit" | "pulse" | "saute" | "somnole"> = { rire: "rit", coeur: "pulse", oh: "saute", peur: "saute", bof: "somnole" };

const enParis = (ms: number) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", weekday: "long", hour12: false }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { jour: `${p.year}-${p.month}-${p.day}`, heure: Number(p.hour) % 24, semaine: String(p.weekday) };
};
/** « a vu à l'instant », « a vu ce matin », « … cet après-midi », « … ce soir », « … hier soir », « … hier », « … lundi » (l'heure de Paris). */
export function quandVu(le: number, maintenant = Date.now()): string {
  if (!Number.isFinite(le) || le <= 0) return "l’a vue";
  if (maintenant - le < 10 * 60_000) return "a vu à l’instant";
  const a = enParis(le);
  const auj = enParis(maintenant).jour;
  const hier = enParis(maintenant - 86_400_000).jour;
  const moment = a.heure < 12 ? "ce matin" : a.heure < 18 ? "cet après-midi" : "ce soir";
  if (a.jour === auj) return `a vu ${moment}`;
  if (a.jour === hier) return a.heure >= 18 ? "a vu hier soir" : "a vu hier";
  return `a vu ${a.semaine}`;
}

/** « 0:42 » (la seconde dans la vidéo). */
export const seconde = (t: number) => {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const PHRASES_REACTIONS = {
  reagis: "Réagis :",
  note: (e: string, t: number, qui: string[]) => `${e} noté à ${seconde(t)} : ${qui.length === 1 ? `${qui[0]} le verra` : qui.length ? `${qui.slice(0, 2).join(" et ")} le verront` : "tes proches le verront"} à cette seconde`,
  ensemble: (prenom: string) => `🫶 En même temps que ${prenom} !`,
  avecToi: (n: number) => (n === 1 ? "1 proche l’a vue : il regarde avec toi" : `${n} proches l’ont vue : ils regardent avec toi`),
  gestes: "Un toucher sur la pièce : tu ris · deux : ❤️ · appui long : 😮",
  pasIci: "Ici, ta télé ne sait pas à quelle seconde tu en es : réagis depuis le lecteur de YouTube.",
};
