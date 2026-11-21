/**
 * ⭐ JAMAIS SEUL DEVANT UNE VIDÉO — ce qui ne dépend pas de l'écran (`docs/univers/decouvrir.md`, sections 4.5, 13, 21
 * et 22 ; le lot D2b) : les réactions à une vidéo de ma télé du jour, notées à la seconde ; celles de mes proches,
 * rejouées à la même seconde par leurs figurines assises à côté de moi ; « 🫶 Au même moment ». Deuxième partie : ce
 * qu'on écrit à la seconde, la réponse à un proche au moment même, « 💬 Ce qui s'est dit ».
 *
 * Partagé (l'écran, le serveur, les essais).
 */
import type { ImageSalon } from "./salon";
import { expressionValide, type ExpressionVisage } from "./visage-essai";
import type { FigurineVivante } from "./expressions-figurine";

/** La rangée sous la télé (la maquette, section 12) : un toucher, une réaction à cette seconde. */
export const SORTES_VIDEO = [
  { cle: "rire", e: "😂", nom: "Rire" },
  { cle: "coeur", e: "❤️", nom: "J’adore" },
  { cle: "oh", e: "😮", nom: "Oh !" },
  { cle: "peur", e: "😱", nom: "Oh non !" },
  { cle: "bof", e: "😴", nom: "Bof" },
] as const;
export type SorteVideo = (typeof SORTES_VIDEO)[number]["cle"];
/**
 * D'où elle vient : la rangée, un geste sans viser sur la pièce, ce que l'appli comprend seule (passer, revoir, finir),
 * ou 📷 mon visage (le lot V2, `decouvrir.md` section 28.7 : la caméra, lue sur le téléphone — ma figurine fait ma tête).
 */
export const SOURCES_VIDEO = ["rangee", "geste", "implicite", "visage"] as const;
export type SourceVideo = (typeof SOURCES_VIDEO)[number];
/**
 * Une réaction : sa seconde dans la vidéo (au dixième), sa sorte, d'où elle vient, quand. Écrite (deuxième partie) :
 * `texte` (sa sorte se déduit des mots) ; une réponse à un proche : `a` (sa clé) et `repond` (la seconde de sa
 * réaction ; la réponse se place juste après).
 */
export type ReactionVideo = { t: number; sorte: SorteVideo; source: SourceVideo; le: number; texte?: string; a?: string; repond?: number; voix?: VoixVideo; visage?: ExpressionVisage; d?: number };
/**
 * 📷 (le lot V2) une expression vue sur mon visage compte comme une réaction (source « visage », avec `visage` et sa
 * durée `d`) : un rire, c'est 😂 ; un sourire, ❤️ ; la surprise, 😮 ; le bof, 😴 ; la grimace, 😱 (« Oh non ! »).
 */
export const SORTE_DU_VISAGE: Record<ExpressionVisage, SorteVideo> = { rire: "rire", sourire: "coeur", surprise: "oh", bof: "bof", grimace: "peur" };
/**
 * 🎙️ Un vocal laissé à cette seconde (sa vraie voix, jamais une voix de synthèse) : son identifiant, sa durée, le type
 * du fichier ; `url` (lien signé, une heure) seulement dans ce que le serveur rend.
 */
export type VoixVideo = { id: string; duree: number; ext: string; url?: string };
/** Un proche qui a vu cette vidéo : sa clé, son prénom, sa figurine assise (les trois premiers), quand il l'a vue, ses réactions. */
export type ProcheDevantVideo = { cle: string; prenom: string; figurine: ImageSalon | null; vu: number; reactions: ReactionVideo[]; vivante?: FigurineVivante };

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
  /** ce qu'on écrit à la seconde : 90 caractères au plus */
  texte: 90,
  /** une réponse se place 0,6 s après la réaction à laquelle elle répond */
  apres: 0.6,
  /** 🎙️ des vocaux : 20 au plus par vidéo et par personne */
  vocaux: 20,
  /** 📷 (le lot V2) des expressions vues sur mon visage : 40 au plus par vidéo et par personne, de 0,5 à 6 s chacune */
  visages: 40,
  visageMin: 0.5,
  visageMax: 6,
} as const;

/** ↩ Les trois réponses toutes prêtes (section 13), ou trois mots. */
export const REPONSES_RAPIDES = [
  { e: "😂", texte: "Trop drôle", sorte: "rire" },
  { e: "😱", texte: "Grave !", sorte: "peur" },
  { e: "🙌", texte: "Pareil", sorte: "coeur" },
] as const satisfies readonly { e: string; texte: string; sorte: SorteVideo }[];

/** Ce qu'on écrit : sans espaces en trop, 90 caractères au plus ; vide → `null`. */
export function texteValide(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const t = x.replace(/\s+/g, " ").trim();
  return t ? [...t].slice(0, REACTIONS_VIDEO.texte).join("") : null;
}

/** La sorte d'une bulle écrite, déduite des mots (comme `reactionAuTexte` du salon) : « haha » → 😂, « c'est nul » → 😴… */
export function sorteDuTexte(t: string): SorteVideo {
  if (/😂|🤣|haha|hihi|mdr|ptdr|lol|drôle|drole/i.test(t)) return "rire";
  if (/❤|😍|🥰|😘|j.adore|trop beau|magnifique|aime/i.test(t)) return "coeur";
  if (/😱|😨|peur|no+n+ ?!|oh non|flipp/i.test(t)) return "peur";
  if (/😴|🥱|\bnul\b|bof|ennui|chiant|trop long|c.est long/i.test(t)) return "bof";
  return "oh";
}

const CLE_PROFIL = /^[0-9a-f]{16}$/;

export const sorteVideo = (x: unknown) => SORTES_VIDEO.find((s) => s.cle === x);

/** Une réaction reçue (du téléphone) ou relue (d'un fichier) : sa seconde, sa sorte ; sinon `null`. */
export function reactionValide(
  x: { t?: unknown; sorte?: unknown; source?: unknown; le?: unknown; texte?: unknown; a?: unknown; repond?: unknown; voix?: unknown; visage?: unknown; d?: unknown } | null | undefined,
  le = Date.now(),
): ReactionVideo | null {
  if (!x) return null;
  const t = Number(x.t);
  if (!Number.isFinite(t) || t < 0 || t > REACTIONS_VIDEO.dureeMax) return null;
  const source = (SOURCES_VIDEO as readonly string[]).includes(String(x.source)) ? (x.source as SourceVideo) : "rangee";
  // (📷 une expression de mon visage : sa sorte se déduit de l'expression ; sans expression, ce n'en est pas une)
  const visage = source === "visage" && expressionValide(x.visage) ? x.visage : null;
  if (source === "visage" && !visage) return null;
  const s = visage ? sorteVideo(SORTE_DU_VISAGE[visage]) : sorteVideo(x.sorte);
  if (!s) return null;
  const quand = Number(x.le);
  const r: ReactionVideo = { t: Math.round(t * 10) / 10, sorte: s.cle, source, le: Number.isFinite(quand) && quand > 0 ? quand : le };
  if (visage) {
    r.visage = visage;
    const d = Number(x.d);
    r.d = Math.round(Math.min(REACTIONS_VIDEO.visageMax, Math.max(REACTIONS_VIDEO.visageMin, Number.isFinite(d) ? d : 1.5)) * 10) / 10;
    return r;
  }
  const texte = texteValide(x.texte);
  if (texte) r.texte = texte;
  const repond = Number(x.repond);
  if (texte && typeof x.a === "string" && CLE_PROFIL.test(x.a) && Number.isFinite(repond) && repond >= 0) {
    r.a = x.a;
    r.repond = Math.round(repond * 10) / 10;
  }
  const vx = x.voix as Partial<VoixVideo> | null | undefined;
  const duree = Number(vx?.duree);
  if (vx && typeof vx.id === "string" && /^[a-z0-9]{12}$/.test(vx.id) && Number.isFinite(duree) && duree > 0 && duree <= 61 && /^(webm|ogg|mp4|mp3|m4a|wav)$/.test(String(vx.ext))) r.voix = { id: vx.id, duree: Math.round(duree * 10) / 10, ext: String(vx.ext) };
  return r;
}

/**
 * Ajoute une réaction (rangées par seconde) ; `null` : une rafale de la même sorte (un doigt qui insiste), les mêmes
 * mots envoyés deux fois, ou déjà 80. Des mots différents à la même seconde comptent chacun.
 */
export function ajouterReaction(liste: readonly ReactionVideo[], r: ReactionVideo): ReactionVideo[] | null {
  if (liste.length >= REACTIONS_VIDEO.max) return null;
  const proche = (x: ReactionVideo) => Math.abs(x.t - r.t) < REACTIONS_VIDEO.rafale;
  if (r.voix) return liste.filter((x) => x.voix).length >= REACTIONS_VIDEO.vocaux ? null : [...liste, r].sort((a, b) => a.t - b.t);
  // (📷 mon visage : 40 au plus ; la même expression à moins de 1,2 s, une seule)
  if (r.visage) return liste.filter((x) => x.visage).length >= REACTIONS_VIDEO.visages || liste.some((x) => x.visage === r.visage && proche(x)) ? null : [...liste, r].sort((a, b) => a.t - b.t);
  if (r.texte ? liste.some((x) => x.texte === r.texte && proche(x)) : liste.some((x) => !x.texte && !x.voix && !x.visage && x.sorte === r.sorte && proche(x))) return null;
  return [...liste, r].sort((a, b) => a.t - b.t);
}

/**
 * 💬 Ce qui s'est dit sur cette vidéo (section 13) : les réactions de mes proches et les miennes, à leurs secondes (ce
 * que l'appli a compris seule n'y est pas). Une réponse n'est montrée qu'à celui à qui elle répond (le serveur ne rend
 * que celles qui sont pour moi) : celle d'un proche est donc « à toi ». Ce qui vient après `jusqua` reste caché
 * (« 🔒 3 réactions plus loin dans la vidéo ») ; `null` : tout (une vidéo que j'ai déjà vue).
 */
export type LigneDite = { t: number; cle: string; prenom: string; e: string; texte?: string; aQui?: string; pourMoi?: boolean; voix?: VoixVideo };
export function ceQuiSestDit(proches: readonly ProcheDevantVideo[], miennes: readonly ReactionVideo[], o: { moi: string; jusqua: number | null }): { lignes: LigneDite[]; cachees: number } {
  const noms = new Map(proches.map((p) => [p.cle, p.prenom]));
  const ligne = (cle: string, prenom: string, r: ReactionVideo): LigneDite => ({
    t: r.t,
    cle,
    prenom,
    e: r.voix ? "🎙️" : (sorteVideo(r.sorte)?.e ?? ""),
    ...(r.texte ? { texte: r.texte } : {}),
    ...(r.voix ? { voix: r.voix } : {}),
    ...(r.a ? (cle === "moi" ? { aQui: noms.get(r.a) ?? "" } : { aQui: o.moi, pourMoi: true }) : {}),
  });
  const toutes = [
    ...proches.flatMap((p) => p.reactions.filter((r) => r.source !== "implicite").map((r) => ligne(p.cle, p.prenom, r))),
    ...miennes.filter((r) => r.source !== "implicite").map((r) => ligne("moi", o.moi, r)),
  ].sort((a, b) => a.t - b.t);
  if (o.jusqua === null) return { lignes: toutes, cachees: 0 };
  const lim = o.jusqua;
  return { lignes: toutes.filter((l) => l.t <= lim), cachees: toutes.filter((l) => l.t > lim).length };
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
  // (deuxième partie : écrire, répondre, ce qui s'est dit, les notifications)
  ecrire: "Écris à cette seconde…",
  envoyer: "Envoyer",
  ecrit: (t: number, qui: string[]) => `✍️ Écrit à ${seconde(t)} : ${qui.length === 1 ? `${qui[0]} le lira` : qui.length ? `${qui.slice(0, 2).join(" et ")} le liront` : "tes proches le liront"} à cette seconde`,
  repondreA: (prenom: string, t: number) => `↩ Répondre à ${prenom}, à ${seconde(t)}`,
  ilADit: (e: string, texte?: string) => (texte ? `« ${texte} »` : e),
  ouTroisMots: "ou trois mots…",
  repondu: (prenom: string) => `↩ ${prenom} verra ta réponse à cette seconde`,
  toucheUnProche: "Touche un proche quand il réagit : tu lui réponds",
  sansReagir: (prenom: string) => `${prenom} l’a vue sans réagir`,
  dit: "💬 Ce qui s’est dit",
  ditN: (n: number) => (n ? `💬 Ce qui s’est dit · ${n}` : "💬 Ce qui s’est dit"),
  plusLoin: (n: number) => `🔒 ${n} réaction${n > 1 ? "s" : ""} plus loin dans la vidéo`,
  rienDit: "Rien encore : tes réactions attendront tes proches.",
  revoir: "Touche une ligne : tu revois le moment.",
  toi: "Toi",
  // (🎙️ les vocaux)
  micro: "Garde le doigt appuyé et parle",
  tuParles: "🎙️ Tu parles",
  laVideoTAttend: "la vidéo t’attend",
  vocalNote: (t: number, qui: string[]) => `🎙️ Ta voix, à ${seconde(t)} : ${qui.length === 1 ? `${qui[0]} l’écoutera` : qui.length ? `${qui.slice(0, 2).join(" et ")} l’écouteront` : "tes proches l’écouteront"} à cette seconde`,
  unVocal: "🎙️ un vocal",
  vocalDispo: (prenom: string) => `🎙️ ${prenom} t’a laissé un vocal`,
  ecouter: "▶ Écouter",
  reprendApres: "la vidéo reprend après",
  court: "Garde le micro appuyé pendant que tu parles.",
  // (l'écran comme la maquette)
  maTele: "🏠 Ma télé",
  surN: (k: number, n: number) => `${k} sur ${n}`,
  inviter: "👥 Inviter",
  ouTouche: "ou touche la pièce",
  suivante: "Suivante ›",
  garder: "📌 Garder",
  envoyer2: "📤 Envoyer",
  enParle: (salon: string, n: number) => `💬 ${salon} en parle${n > 1 ? ` · ${n} personnes` : n === 1 ? " · 1 personne" : ""}`,
  seul: "Tu l’ouvres en premier : tes réactions attendront tes proches.",
  arriere: "Revenir 5 secondes en arrière",
  pause: "Pause",
  lecture: "Lecture",
  voirPiece: "🛋️ Voir la pièce",
  grandEcran: "⛶ Grand écran",
  aToi: "à toi",
  fermer: "Fermer",
  // (les notifications)
  tARepondu: (prenom: string) => `↩ ${prenom} t’a répondu`,
  reponseCorps: (t: number, titre: string, texte: string) => `À ${seconde(t)} de « ${titre} » : « ${texte} »`,
  aRegarde: (prenom: string, titre: string) => `🎬 ${prenom} a regardé « ${titre} »`,
  revoisLa: "Revois-la avec ses réactions, à la seconde.",
};

/** Un titre de vidéo raccourci pour une notification (40 caractères). */
export const titreCourt = (t: string) => {
  const l = [...t.trim()];
  return l.length > 40 ? `${l.slice(0, 39).join("").trimEnd()}…` : l.join("");
};
