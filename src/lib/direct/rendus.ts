/**
 * 🎬 TROIS FAÇONS DE LE DIRE — 8 novembre 2026, l'avis d'un ami du propriétaire (« je te fais confiance, tu peux
 * directement coder ») : les mèmes se ressemblaient tous (le rose, la figurine, ses sous-titres). On ne choisit plus
 * une situation (un décor) : on écrit sa phrase, et ClikMe en propose TROIS INTERPRÉTATIONS, qui changent vraiment —
 *
 *   · LE VISAGE de la figurine, d'abord (c'est elle, la star) : parmi ses sept expressions et ses six attitudes
 *     (`SENTIMENTS` : tout son corps parle — l'étape 2, le même jour), celle qui raconte l'interprétation — « J'avais
 *     dit que je ne sortirais pas ce soir… » : elle rit en douce, la main devant la bouche (humour), se tient la tête
 *     (dramatique), grimace (décalé) ;
 *   · LE CADRAGE : en entier, ou le visage en gros plan ;
 *   · LE GRAPHISME : 😂 HUMOUR, la BD (une case, une bulle, une onomatopée, la trame) ; 🎭 DRAMATIQUE, le cinéma
 *     (le gros plan dans la pénombre, les bandes noires, un mot en géant, la phrase en sous-titre) ; 🌀 DÉCALÉ,
 *     l'affiche (deux couleurs vives, la phrase en lettres énormes, la figurine collée comme une photo).
 *
 * Les intentions (faire rire, une émotion, réagir, affirmer, sous-entendre, célébrer) sont une AIDE, jamais une
 * obligation : sans idée, elles en proposent une ; avec une phrase, elles orientent les visages.
 *
 * QUI CHOISIT : un petit modèle de texte lit la phrase (`rendus-serveur.ts`, le même branchement que « Surprends-moi ») ;
 * sans lui (pas de clé, une réponse qui dérape, ses appels du jour passés), les règles ci-dessous — d'ailleurs
 * affichées tout de suite, le modèle les remplace quand il répond. Rien n'est fabriqué : la vidéo se fait dans le
 * téléphone (`meme.ts`), avec les visages qu'il a déjà.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
import { SENTIMENTS, sentimentValide, type Sentiment } from "./ma-figurine";

export type StyleRendu = "bd" | "cinema" | "affiche";
export type Cadrage = "entier" | "gros-plan";
/** Une interprétation : son graphisme, le visage de la figurine (`null` : son visage de tous les jours), son cadrage,
 *  l'onomatopée de la BD, le mot qu'on écrit en géant, et sa palette (trois par graphisme). */
export type Rendu = { style: StyleRendu; visage: Sentiment | null; cadrage: Cadrage; onomatopee: string; mot: string; teinte: number };

export const STYLES_RENDU: readonly { cle: StyleRendu; nom: string; emoji: string; dit: string }[] = [
  { cle: "bd", nom: "Humour", emoji: "😂", dit: "la BD" },
  { cle: "cinema", nom: "Dramatique", emoji: "🎭", dit: "le cinéma" },
  { cle: "affiche", nom: "Décalé", emoji: "🌀", dit: "l’affiche" },
];
export const styleValide = (x: unknown): StyleRendu | null => (STYLES_RENDU.some((v) => v.cle === x) ? (x as StyleRendu) : null);
export const styleDe = (x: unknown) => STYLES_RENDU.find((v) => v.cle === x) ?? null;

export type CleIntention = "rire" | "emotion" | "reagir" | "affirmer" | "sous-entendre" | "celebrer";
/**
 * 🧭 CE QU'IL VEUT EXPRIMER — une aide : ses idées (sans genre, rien sur le corps, la santé, l'alcool : les règles de
 * « Surprends-moi »), et les trois visages qui vont avec (humour, dramatique, décalé), puis l'onomatopée de la BD. Les
 * attitudes où les bras parlent (bras croisés, victoire, cœur) vont à la BD et à l'affiche, qui la montrent en entier ;
 * le cinéma, en gros plan, garde le visage (et les mains près de la tête).
 */
export const INTENTIONS: readonly { cle: CleIntention; emoji: string; nom: string; idees: readonly string[]; visages: readonly [Sentiment, Sentiment, Sentiment]; onomatopee: string }[] = [
  { cle: "rire", emoji: "😂", nom: "Faire rire", idees: ["J’avais dit que je ne sortirais pas ce soir…", "Je devais me coucher tôt. Il est 2 h.", "Moi devant le frigo à minuit"], visages: ["endouce", "tete", "grimace"], onomatopee: "HAHA !" },
  { cle: "emotion", emoji: "😍", nom: "Émotion", idees: ["Vous m’avez trop manqué", "Merci d’être là, vraiment", "Ce moment, je le garde"], visages: ["joie", "amour", "coeur"], onomatopee: "OOOH !" },
  { cle: "reagir", emoji: "🙄", nom: "Réagir", idees: ["Encore une réunion qui aurait pu être un mail", "Il est 8 h et il pleut déjà", "Qui a fini le café ?"], visages: ["bras", "tete", "grimace"], onomatopee: "PFF…" },
  { cle: "affirmer", emoji: "💪", nom: "Affirmer", idees: ["Lundi, je commence le sport. Pour de vrai.", "Cette année, c’est mon année", "Et je l’ai fait sans aide !"], visages: ["victoire", "colere", "euphorie"], onomatopee: "BAM !" },
  { cle: "sous-entendre", emoji: "🤫", nom: "Sous-entendre", idees: ["Je dis ça, je dis rien…", "Certains se reconnaîtront", "Suivez mon regard…"], visages: ["chut", "colere", "bras"], onomatopee: "HUM HUM…" },
  { cle: "celebrer", emoji: "🎉", nom: "Célébrer", idees: ["J’ai eu mon permis !!!", "Joyeux anniversaire maman", "On a gagné !"], visages: ["euphorie", "amour", "victoire"], onomatopee: "YES !" },
];
export const intentionValide = (x: unknown): CleIntention | null => (INTENTIONS.some((v) => v.cle === x) ? (x as CleIntention) : null);

/** Ses mots qui disent l'intention (sans les accents, en minuscules), quand il n'en a pas choisi. */
const INDICES: readonly [CleIntention, RegExp][] = [
  ["celebrer", /!!|\b(gagne|reussi|enfin|bravo|anniversaire|felicitations|yes|youpi|victoire|on l'a fait|j'ai eu)\b/],
  ["emotion", /\b(manque|manques|merci|aime|adore|coeur|bisous|ensemble|famille|souvenir|je le garde)\b|❤|😍|🥹/],
  ["reagir", /\b(encore|marre|serieux|pff|lundi|pluie|pleut|reunion|qui a|toujours pas|pas possible|non mais)\b|🙄|\?!/],
  ["affirmer", /\b(je vais|cette annee|pour de vrai|promis|je commence|c'est decide|je l'ai fait|mon annee)\b|💪/],
  ["rire", /\b(haha|mdr|lol|j'avais dit|je devais|frigo|minuit|2 h|oups|encore rate)\b|😂/],
  ["sous-entendre", /\b(je dis ca|je dis rien|certains|suivez mon regard|se reconnaitront|suffit de)\b|🤫/],
];
const sansAccents = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'");
/** L'intention que disent ses mots (sinon, faire rire : c'est un mème). */
export function intentionDuTexte(texte: string): CleIntention {
  const t = sansAccents(texte);
  return INDICES.find(([, re]) => re.test(t))?.[0] ?? "rire";
}

/** Le mot à écrire en géant : le dernier mot qui compte (sans sa ponctuation), en majuscules. */
export function motFort(texte: string): string {
  const mots = texte
    .replace(/[«»"“”]/g, " ")
    .split(/\s+/)
    .map((m) => m.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}!?…]+$/gu, ""))
    .filter((m) => m.replace(/[!?…]/g, "").length >= 2);
  return (mots[mots.length - 1] ?? texte.trim()).slice(0, 18).toUpperCase();
}

/** Le mot fort d'une interprétation, encore dans sa phrase ? Sinon (il l'a changée depuis), celui de sa phrase. */
export function motPour(texte: string, mot: string): string {
  const p = (x: string) => sansAccents(x).replace(/[^a-z0-9]/g, "");
  return mot && p(texte).includes(p(mot)) ? mot : motFort(texte);
}

/** Le visage le plus proche parmi ceux qu'il a déjà (sinon, `voulu` lui-même : il se fera au toucher). */
const PROCHES: Record<Sentiment, readonly Sentiment[]> = {
  joie: ["joie", "euphorie", "rire"],
  colere: ["colere", "grimace", "tristesse"],
  tristesse: ["tristesse", "colere"],
  euphorie: ["euphorie", "joie", "rire"],
  rire: ["rire", "joie", "euphorie"],
  grimace: ["grimace", "rire", "euphorie"],
  amour: ["amour", "joie"],
  tete: ["tete", "tristesse", "colere"],
  endouce: ["endouce", "rire", "joie"],
  bras: ["bras", "colere", "grimace"],
  victoire: ["victoire", "euphorie", "joie"],
  chut: ["chut", "grimace", "rire"],
  coeur: ["coeur", "amour", "joie"],
};

/** Un petit nombre tiré de la phrase : la même phrase garde les mêmes couleurs (rien ne saute entre deux affichages). */
function empreinte(t: string): number {
  let h = 7;
  for (let k = 0; k < t.length; k++) h = (h * 31 + t.charCodeAt(k)) >>> 0;
  return h;
}

/**
 * 📐 LES TROIS INTERPRÉTATIONS, PAR LES RÈGLES : l'intention (choisie, sinon lue dans ses mots) donne les trois visages ;
 * `tour` (« 🎲 Trois autres ») change les couleurs et fait tourner les visages.
 */
export function rendusLocaux(texte: string, intention?: CleIntention | null, tour = 0): Rendu[] {
  const i = INTENTIONS.find((x) => x.cle === (intention ?? intentionDuTexte(texte))) ?? INTENTIONS[0];
  const base = empreinte(texte.trim());
  const visages = [0, 1, 2].map((k) => i.visages[(k + tour) % 3]);
  const mot = motFort(texte);
  return STYLES_RENDU.map((st, k) => ({
    style: st.cle,
    visage: visages[k],
    cadrage: st.cle === "cinema" ? "gros-plan" : "entier",
    onomatopee: i.onomatopee,
    mot,
    teinte: (base + k + tour) % 3,
  }));
}

/** Le visage qu'il a déjà, le plus proche de `voulu` (`dispo` : ses visages faits). `null` s'il n'en a aucun d'approchant. */
export function visageDisponible(voulu: Sentiment | null, dispo: readonly Sentiment[]): Sentiment | null {
  if (!voulu) return null;
  return PROCHES[voulu].find((x) => dispo.includes(x)) ?? null;
}

/** Ce que le modèle rend, relu : trois interprétations (une par graphisme, dans l'ordre), des visages qui existent, des
 *  mots courts et sans lien. Sinon `null` (les règles reprennent la main). */
export function rendusRelus(x: unknown, texte: string, tour = 0): Rendu[] | null {
  const liste = x && typeof x === "object" && Array.isArray((x as { rendus?: unknown }).rendus) ? ((x as { rendus: unknown[] }).rendus as unknown[]) : null;
  if (!liste) return null;
  const locaux = rendusLocaux(texte, null, tour);
  const propres = STYLES_RENDU.map((st, k) => {
    const o = liste.find((r) => r && typeof r === "object" && (r as { style?: unknown }).style === st.cle) as Record<string, unknown> | undefined;
    if (!o) return null;
    const v = o.visage === "neutre" ? null : sentimentValide(o.visage);
    if (o.visage !== "neutre" && !v) return null;
    const ono = String(o.onomatopee ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase()
      .slice(0, 14);
    const mot = String(o.mot ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase()
      .slice(0, 18);
    const propre = (t: string) => !/https?:|www\.|@|#|[<>]/.test(t);
    return {
      ...locaux[k],
      visage: v,
      ...(ono && propre(ono) ? { onomatopee: ono } : {}),
      ...(mot && propre(mot) && sansAccents(texte).toUpperCase().includes(sansAccents(mot).toUpperCase()) ? { mot } : {}),
    };
  });
  return propres.every(Boolean) ? (propres as Rendu[]) : null;
}

/** Ce qui se garde à côté du message (la mesure : quels graphismes plaisent). */
export const renduGarde = (r: unknown): StyleRendu | null => styleValide(r);
export const VISAGES_RENDU = SENTIMENTS.map((x) => x.cle);
