/**
 * 🎬 CLIKME STUDIO, DANS LE COMPTOIR — « simplifier la tâche du commerçant qui enregistre une vidéo d'un produit ou
 * d'un service, qu'on va sublimer avec notre montage ClikMe, avec ou sans figurine. »
 *
 * Le film de l'atelier (`outils/clikme-studio/`, le premier : Lili Ross, « Le look du jour ») devient un geste du
 * comptoir. Il filme une quinzaine de secondes (ou choisit une vidéo de son téléphone), l'appli lui propose cinq
 * moments, il dit en quelques mots ce qu'on y voit, il choisit avec ou sans sa figurine — et son téléphone monte le
 * film sous ses yeux (`studio-montage.ts`), sur une musique composée pour lui (`studio-musique.ts`).
 *
 * ─── LE MÊME FILM QUE CELUI DE L'ATELIER, SANS LA MAIN DE L'ATELIER ─────────
 *
 * Les temps sont ceux de `scene.html` (21 s, une mesure de musique par chapitre) : l'accroche sur la fin de sa vidéo
 * au ralenti, le retour en arrière, cinq chapitres de deux secondes, « Et voilà. », le déclic et le polaroïd, la carte
 * de fin. Ce que l'atelier choisissait à l'œil — les meilleurs moments, le point qu'on zoome, les pièces qu'on désigne
 * sur le polaroïd — se décide ici sans regarder : cinq moments répartis sur sa vidéo (il peut les déplacer), des
 * zooms qui gardent le centre de l'image, et sur le polaroïd la liste de SES mots au lieu de points posés sur l'image.
 *
 * ─── RIEN D'INVENTÉ ───────────────────────────────────────────────────────
 *
 * Les noms des chapitres sont les siens (« Le pull rose ») ; sans nom, un chapitre n'a que son numéro. Les quelques
 * mots écrits d'avance (le titre « Le look du jour », « Et voilà. », les bulles de la figurine) ne disent rien de son
 * produit, et il peut les changer. Jamais de prix, de matière, de marque qu'il n'a pas écrits.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès au navigateur ni à la base ici.
 */
import type { FamilleDouble } from "./double-metiers";

/** Cinq chapitres, comme le film de Lili Ross : cinq mesures de deux secondes. */
export const NB_MOMENTS = 5;
/** Sa vidéo : quatre secondes au moins (en dessous, les chapitres se répéteraient), une minute au plus. */
export const SOURCE_MIN_S = 4;
export const SOURCE_MAX_S = 60;

/**
 * LES TEMPS DU FILM, en secondes (sans figurine) — ceux de `scene.html`. Avec la figurine, tout est décalé de
 * `INTRO_FIGURINE` : elle tombe, dit bonjour, puis saute hors de l'écran et le film commence.
 */
export const TEMPS = {
  /** L'accroche : la fin de sa vidéo, au ralenti, et le titre. */
  accroche: 2.0,
  /** Le retour en arrière, jusqu'au premier moment. */
  retour: 2.5,
  /** Un chapitre : une mesure. */
  chapitre: 2.0,
  /** « Et voilà. » */
  voila: 12.5,
  /** Le déclic : l'image se fige et devient un polaroïd. */
  declic: 14.5,
  /** La carte de fin. */
  fin: 18.66,
  total: 21,
} as const;
export const INTRO_FIGURINE = 3.5;

export const dureeDuFilm = (figurine: boolean) => TEMPS.total + (figurine ? INTRO_FIGURINE : 0);
/** Le début du chapitre k (0 à 4), dans le temps du film sans figurine. */
export const debutChapitre = (k: number) => TEMPS.retour + k * TEMPS.chapitre;

/** Les temps des annotations du polaroïd : une par temps de musique, comme dans l'atelier. */
export const APPELS_T = [15.5, 16.0, 16.5, 17.0, 17.5] as const;

// ─── les plans : quel morceau de sa vidéo, à quelle vitesse ────────────────────────────────────

export type RolePlan = "accroche" | "chapitre" | "voila";
/** Un plan du film : de `de` à `a` (temps du film sans figurine), sa vidéo jouée depuis `s0` à `vitesse`. */
export type Plan = { role: RolePlan; k: number; de: number; a: number; s0: number; vitesse: number };

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La dernière image sûre de sa vidéo : un lecteur ne s'arrête pas toujours pile sur la dernière. */
export const finDeSource = (duree: number) => Math.max(0, duree - 0.08);

/**
 * LES CINQ MOMENTS PROPOSÉS : sa vidéo coupée en cinq parts égales, le début de chacune. Une vidéo de 15 s donne
 * 0,1 · 3,0 · 5,9 · 8,8 · 11,7 : chaque chapitre joue deux secondes de sa part, et tout y passe.
 */
export function momentsProposes(duree: number): number[] {
  const fin = Math.max(0.5, finDeSource(duree) - 0.6);
  const part = fin / NB_MOMENTS;
  return Array.from({ length: NB_MOMENTS }, (_, k) => Math.round((0.1 + k * part) * 100) / 100);
}

/**
 * LES PLANS DU FILM. L'accroche : la dernière seconde au ralenti (×0,5). Chaque chapitre part de SON moment : à
 * vitesse normale s'il y a deux secondes devant lui jusqu'au moment suivant, ralenti sinon (×0,5 au plus lent) — un
 * moment trop près de la fin recule juste ce qu'il faut. « Et voilà. » : la fin, à ×0,8.
 */
export function plansDuFilm(duree: number, moments: number[]): Plan[] {
  const sFin = finDeSource(duree);
  const tries = [...moments].slice(0, NB_MOMENTS).map((m) => borne(m, 0, sFin));
  while (tries.length < NB_MOMENTS) tries.push(momentsProposes(duree)[tries.length]);
  const plans: Plan[] = [{ role: "accroche", k: 0, de: 0, a: TEMPS.accroche, s0: Math.max(0, sFin - 1.0), vitesse: 0.5 }];
  tries.forEach((m, k) => {
    const suivant = tries.filter((x) => x > m + 0.05).sort((a, b) => a - b)[0] ?? sFin;
    const vitesse = borne((suivant - m) / TEMPS.chapitre, 0.5, 1);
    const s0 = Math.max(0, Math.min(m, sFin - TEMPS.chapitre * vitesse));
    plans.push({ role: "chapitre", k, de: debutChapitre(k), a: debutChapitre(k) + TEMPS.chapitre, s0, vitesse });
  });
  const vVoila = 0.8;
  plans.push({ role: "voila", k: 0, de: TEMPS.voila, a: TEMPS.declic, s0: Math.max(0, sFin - (TEMPS.declic - TEMPS.voila) * vVoila), vitesse: vVoila });
  return plans;
}

/** Où en est sa vidéo à l'instant `t` d'un plan. */
export const sourceA = (p: Plan, t: number) => p.s0 + (t - p.de) * p.vitesse;

// ─── les mots ───────────────────────────────────────────────────────────────────────────────────

export const MAX_NOM_MOMENT = 26;
export const MAX_TITRE = 24;
export const MAX_PHRASE = 110;

/** Un mot à lui, propre : sans retour à la ligne ni espaces doublés, coupé à la longueur permise. */
export const propre = (t: unknown, max: number) =>
  String(t ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();

/**
 * LES MOTS DU FILM. `titre` : l'accroche, en deux lignes (« Le look / du jour ») ; `sous` : sous le titre ;
 * `voila` : sous « Et voilà. » ; `complet` : le titre du polaroïd ; `phrase` : la sienne, sur la carte de fin (vide :
 * pas de phrase).
 */
export type TextesStudio = {
  commerce: string;
  titre: string;
  sous: string;
  voila: string;
  complet: string;
  phrase: string;
};

/** Le titre de l'accroche par métier : il dit ce que c'est, jamais ce que ça vaut. */
const PAR_METIER: Record<FamilleDouble, { titre: string; sous: string; voila: string; complet: string }> = {
  mode: { titre: "Le look du jour", sous: "pièce par pièce", voila: "tout ensemble", complet: "Le look complet" },
  table: { titre: "Le plat du jour", sous: "en cinq temps", voila: "bon appétit", complet: "L’assiette" },
  bar: { titre: "À découvrir aujourd’hui", sous: "en cinq temps", voila: "à tout à l’heure", complet: "En un coup d’œil" },
  coiffure: { titre: "La coupe du jour", sous: "en cinq temps", voila: "le résultat", complet: "Le résultat" },
  ongles: { titre: "La pose du jour", sous: "en cinq temps", voila: "le résultat", complet: "Le résultat" },
  fleurs: { titre: "Le bouquet du jour", sous: "fleur par fleur", voila: "tout ensemble", complet: "Le bouquet" },
  createur: { titre: "La création du jour", sous: "en cinq temps", voila: "terminé", complet: "La pièce" },
  lunettes: { titre: "La monture du jour", sous: "en cinq temps", voila: "le résultat", complet: "La monture" },
  seance: { titre: "La séance du jour", sous: "en cinq temps", voila: "à bientôt", complet: "En un coup d’œil" },
  librairie: { titre: "Le livre du jour", sous: "en cinq temps", voila: "bonne lecture", complet: "En un coup d’œil" },
};

export function textesParDefaut(famille: FamilleDouble, commerce: string): TextesStudio {
  const m = PAR_METIER[famille] ?? PAR_METIER.createur;
  return { commerce: propre(commerce, 40) || "Mon commerce", titre: m.titre, sous: m.sous, voila: m.voila, complet: m.complet, phrase: "" };
}

/** Le titre de l'accroche en deux lignes à peu près égales : « Le look / du jour ». Un seul mot reste seul. */
export function enDeuxLignes(titre: string): [string, string] {
  const mots = propre(titre, MAX_TITRE).split(" ").filter(Boolean);
  if (mots.length < 2) return [mots[0] ?? "", ""];
  let meilleur: [string, string] = [mots[0], mots.slice(1).join(" ")];
  let ecart = Infinity;
  for (let i = 1; i < mots.length; i++) {
    const a = mots.slice(0, i).join(" "), b = mots.slice(i).join(" ");
    const e = Math.max(a.length, b.length);
    if (e < ecart) [ecart, meilleur] = [e, [a, b]];
  }
  return meilleur;
}

/** Le numéro d'un chapitre, comme dans le film : « 01 ». */
export const numero = (k: number) => String(k + 1).padStart(2, "0");

/** Un nom de chapitre au milieu d'une phrase : « Le pull rose » → « le pull rose » (sauf un nom propre ou un sigle). */
export const enMinuscule = (t: string) => (/^[A-ZÀ-Ý][a-zà-ÿ’']/.test(t) && !/^[A-ZÀ-Ý][a-zà-ÿ]+\s[A-ZÀ-Ý]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);

/**
 * LES BULLES DE LA FIGURINE. Elle n'a pas de voix (jamais de voix fabriquée) : elle parle par bulles. Elle dit
 * bonjour, puis passe la tête pendant deux chapitres — le 2 et le 4, comme Lili pendant le foulard et le bonnet — en
 * reprenant SES mots (« Le pull rose ! 😍 ») ; un chapitre sans nom lui fait dire « Regardez ! 😍 ».
 */
export function bullesDeLaFigurine(t: TextesStudio, noms: string[]): { bonjour: string; bienvenue: string; passages: [string, string]; aBientot: string } {
  const n2 = propre(noms[1], MAX_NOM_MOMENT), n4 = propre(noms[3], MAX_NOM_MOMENT);
  return {
    bonjour: "Coucou ! 👋",
    bienvenue: `Bienvenue chez ${t.commerce} !`,
    passages: [n2 ? `${n2} ! 😍` : "Regardez ! 😍", n4 ? `Et ${enMinuscule(n4)} ! 💗` : "J’adore ! 💗"],
    aBientot: "À très vite ! 👋",
  };
}

/**
 * LE TEXTE DE L'ANNONCE, dans Le Direct et sur ses réseaux : son titre, puis ce qu'on voit dans le film — ses mots à
 * lui, rien d'autre. 140 signes au plus.
 */
export function texteDuStudio(t: TextesStudio, noms: string[]): string {
  const vus = noms.map((n) => propre(n, MAX_NOM_MOMENT)).filter(Boolean);
  return `${propre(t.titre, MAX_TITRE) || "Le film du jour"}${vus.length ? ` : ${vus.join(", ")}` : ""}`.slice(0, 140);
}
