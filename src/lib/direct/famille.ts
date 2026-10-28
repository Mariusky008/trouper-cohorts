/**
 * 👻 LA FAMILLE D'UN COMMERCE — ceux qui ont libéré leur fantôme à sa porte.
 *
 * C'est la démo du parcours (« De la vidéo à la porte ») devenue une règle. Chaque
 * jour, la vidéo du commerce invite : « Rejoins ma famille de fantômes ! Tu m'aides
 * à me faire connaître, je te gâte ! ». Celui qui ouvre une cage, sur sa page
 * publique (`/f/<lien>`), entre dans la famille :
 *   · IL A UN NUMÉRO, celui de son arrivée (« fantôme n°48 de Chez Bergine ») :
 *     il n'y a qu'une n°48, et être parmi les premiers, ça compte ;
 *   · LA FOULE DU JOUR : ceux qui ont ouvert une cage aujourd'hui. On repart de zéro
 *     chaque matin, et le record à battre est le plus grand nombre d'un seul jour ;
 *   · SON ÉCUSSON MONTE, du bronze à l'argent puis à l'or, selon ce qu'il fait pour
 *     le commerce : venir pour de vrai, revenir ouvrir la cage, amener des amis.
 *     Plus il monte, plus tôt il reçoit les bons plans du commerce.
 *
 * LES PALIERS SONT ICI, ET SEULEMENT ICI : « on commence par ça, mais il faudra que
 * ce soit facilement changeable ». Changer un chiffre de `PALIERS` change la page,
 * la route et le comptoir à la fois.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { Cage } from "@/lib/direct/cages";
import { deNom } from "@/lib/echanges/echanges";

export type Grade = "bronze" | "argent" | "or";

/** Ce qu'un fantôme a fait pour ce commerce : ses passages notés, ses jours de cage, ses amis amenés. */
export type Parcours = { visites: number; jours: number; amis: number };

/**
 * POUR MONTER D'UN PALIER, UNE CONDITION SUFFIT (l'une OU l'autre).
 *   · argent : 1 visite, ou la cage ouverte 7 jours ;
 *   · or : 5 visites, ou 3 amis amenés.
 * Une condition à 0 ne compte pas (« pas par ce chemin-là »).
 */
export const PALIERS: Record<Exclude<Grade, "bronze">, Partial<Parcours>> = {
  argent: { visites: 1, jours: 7 },
  or: { visites: 5, amis: 3 },
};

export const GRADES: Grade[] = ["bronze", "argent", "or"];
export const EMOJI_GRADE: Record<Grade, string> = { bronze: "🥉", argent: "🥈", or: "🥇" };
export const NOM_GRADE: Record<Grade, string> = { bronze: "Bronze", argent: "Argent", or: "Or" };
/** Ce que chaque palier lui apporte, dit en trois mots (le chemin de son écusson). */
export const AVANTAGE_GRADE: Record<Grade, string> = { bronze: "les bons plans", argent: "plus tôt", or: "en premier" };

const atteint = (p: Parcours, c: Partial<Parcours>) =>
  (Object.keys(c) as (keyof Parcours)[]).some((k) => (c[k] ?? 0) > 0 && p[k] >= (c[k] ?? 0));

export function gradeDe(p: Parcours): Grade {
  if (atteint(p, PALIERS.or)) return "or";
  if (atteint(p, PALIERS.argent)) return "argent";
  return "bronze";
}

/** Le palier suivant, et ce qui y mène, dans l'ordre des conditions (`null` : il est en or). */
export function prochainPalier(p: Parcours): { grade: Exclude<Grade, "bronze">; chemins: { quoi: keyof Parcours; fait: number; faut: number }[] } | null {
  const g = gradeDe(p);
  if (g === "or") return null;
  const suivant = g === "bronze" ? "argent" : "or";
  const c = PALIERS[suivant];
  const chemins = (Object.keys(c) as (keyof Parcours)[])
    .filter((k) => (c[k] ?? 0) > 0)
    .map((k) => ({ quoi: k, fait: Math.min(p[k], c[k] ?? 0), faut: c[k] ?? 0 }));
  return { grade: suivant, chemins };
}

/** « chez Bergine », « au Comptoir », « à la Cave », « aux Délices », « à l’Atelier » — jamais « chez Le Comptoir ». */
export function aNom(nom: string): string {
  const n = nom.trim();
  if (/^chez\s/i.test(n)) return n.charAt(0).toLowerCase() + n.slice(1);
  if (/^le\s/i.test(n)) return `au ${n.slice(3)}`;
  if (/^les\s/i.test(n)) return `aux ${n.slice(4)}`;
  if (/^la\s/i.test(n)) return `à la ${n.slice(3)}`;
  if (/^l['’]/i.test(n)) return `à l’${n.slice(2)}`;
  return `chez ${n}`;
}

/** La règle d'un palier, dite simplement : « 1 visite ou 7 jours de cage ». */
export function regleEnMots(g: Exclude<Grade, "bronze">): string {
  const c = PALIERS[g];
  return (Object.keys(c) as (keyof Parcours)[])
    .filter((k) => (c[k] ?? 0) > 0)
    .map((k) => {
      const n = c[k] ?? 0;
      return k === "visites" ? `${n} ${n > 1 ? "visites" : "visite"}` : k === "jours" ? `${n} jours de cage` : `${n} ${n > 1 ? "amis amenés" : "ami amené"}`;
    })
    .join(" ou ");
}

/** « Viens une fois chez Bergine, ou ouvre la cage 7 jours. » */
export function cheminEnMots(chemins: { quoi: keyof Parcours; faut: number }[], nom: string): string {
  const phrases = chemins.map(({ quoi, faut }) =>
    quoi === "visites"
      ? faut === 1
        ? `viens une fois ${aNom(nom)}`
        : `viens ${faut} fois ${aNom(nom)}`
      : quoi === "jours"
        ? `ouvre la cage ${faut} jours`
        : faut === 1
          ? "amène un ami"
          : `amène ${faut} amis`,
  );
  const t = phrases.join(", ou ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) + "." : "";
}

/** Ce que la route rend pour un commerce : la foule, le record, et lui s'il est de la famille. */
export type EtatFamille = {
  /** Ceux qui ont ouvert une cage aujourd'hui (heure de Paris). */
  aujourdhui: number;
  hier: number;
  /**
   * LE RECORD À BATTRE : le plus grand nombre d'un seul jour AVANT aujourd'hui (0 le premier jour) ;
   * `null` tant que la présence n'est pas activée.
   */
  record: number | null;
  /** Tous ceux qui ont déjà libéré leur fantôme ici. */
  membres: number;
  moi: null | {
    numero: number;
    /** Le prénom et la cage de sa dernière cage ici (il revient : rien à retaper). */
    prenom: string;
    cage: Cage | null;
    grade: Grade;
    parcours: Parcours;
    /** Déjà dans la foule aujourd'hui. */
    present: boolean;
    /** Son code d'invitation (`?de=`) : le même numéro d'écran que dans la vitrine. */
    code: string;
  };
  /** 📌 Le mot du jour, épinglé par le commerçant (la route publique l'ajoute). */
  motDuJour?: MotDuJour | null;
};

/** 🏠 Une de ses familles, dans Ma Maison. */
export type MaFamille = { slug: string; nom: string; numero: number; membres: number; grade: Grade; parcours: Parcours };

/** 📌 Le mot du jour : le petit mot que le commerçant a épinglé, en haut de sa page. */
export type MotDuJour = { texte: string; prenom: string; numero: number; grade: Grade | null };

/** Une personne de la famille, telle que le comptoir la montre. */
export type MembreAuComptoir = { prenom: string; numero: number; grade: Grade; look: string };

/** 👻 CE QUE LE COMPTOIR MONTRE DE SA FAMILLE (l'écran « Ma famille »). */
export type FamilleAuComptoir = {
  aujourdhui: number;
  hier: number;
  /** Le record à battre (les jours d'avant) ; `null` tant que la présence n'est pas activée. */
  record: number | null;
  membres: number;
  /** Arrivés aujourd'hui : leur toute première cage chez lui. */
  nouveaux: number;
  paliers: Record<Grade, number>;
  /** Ses fidèles, l'or puis l'argent (douze au plus). */
  fideles: MembreAuComptoir[];
  /**
   * SON PARCOURS, LES SEPT DERNIERS JOURS : sa page ouverte → une cage ouverte → venus pour de vrai.
   * `pages` : `null` tant que l'ouverture de sa page n'est pas comptée (la migration du comptoir).
   */
  parcours: { pages: number | null; cages: number; venues: number };
  /** Les petits mots d'aujourd'hui et d'hier, pour choisir le mot du jour. */
  mots: { id: string; texte: string; prenom: string; numero: number; epingle: boolean }[];
  motDuJour: MotDuJour | null;
  /** « Épingler » marche (la migration du comptoir est passée). */
  epinglable: boolean;
};

/** « 42 % » d'une marche à la suivante (`null` quand la marche d'avant est vide, ou pas mesurée). */
export function tauxDe(apres: number, avant: number | null): number | null {
  if (avant === null || avant <= 0) return null;
  return Math.min(100, Math.round((apres / avant) * 100));
}

/**
 * LA FAMILLE D'UN COMMERCE DE LA DÉMONSTRATION (le comptoir sans commerçant réel) : inventée, stable
 * pour la journée, et jamais pour un vrai commerçant — son comptoir lit la sienne en base.
 */
export function familleAuComptoirDemo(cle: string, maintenant: number): FamilleAuComptoir {
  let h = 2166136261;
  for (const c of `${cle}|${new Date(maintenant).toISOString().slice(0, 10)}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const tirer = (n: number) => (h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0) % n;
  const record = 24 + tirer(12);
  const aujourdhui = 9 + tirer(12);
  const membres = 140 + tirer(90);
  const fideles: MembreAuComptoir[] = [
    { prenom: "Léa", numero: 12, grade: "or", look: "cosy" },
    { prenom: "Hugo", numero: 7, grade: "or", look: "denim" },
    { prenom: "Inès", numero: 31, grade: "argent", look: "artiste" },
    { prenom: "Karim", numero: 45, grade: "argent", look: "voyageur" },
    { prenom: "Sonia", numero: 58, grade: "argent", look: "fleuri" },
  ];
  return {
    aujourdhui,
    hier: record - 3 - tirer(6),
    record,
    membres,
    nouveaux: 2 + tirer(5),
    paliers: { or: 6 + tirer(4), argent: 21 + tirer(9), bronze: membres - 40 },
    fideles,
    parcours: { pages: 610 + tirer(200), cages: 160 + tirer(60), venues: 31 + tirer(12) },
    mots: [
      { id: "demo-1", texte: "Merci pour l’accueil de samedi !", prenom: "Hugo", numero: 7, epingle: false },
      { id: "demo-2", texte: "Ma nouvelle adresse préférée 💛", prenom: "Léa", numero: 12, epingle: false },
      { id: "demo-3", texte: "Toujours de bons conseils", prenom: "Inès", numero: 31, epingle: false },
    ],
    motDuJour: null,
    epinglable: true,
  };
}

/** Il en manque combien pour battre le record (au moins 1 : égaler n'est pas battre). */
export const manquePourRecord = (e: Pick<EtatFamille, "aujourdhui" | "record">) => Math.max(1, (e.record ?? 0) + 1 - e.aujourdhui);

/** Aujourd'hui fait mieux que tous les jours d'avant. */
export const recordBattu = (e: Pick<EtatFamille, "aujourdhui" | "record">) => e.record !== null && e.record > 0 && e.aujourdhui > e.record;

/** Le film de la page publique, quand le commerce n'a pas encore de vidéo : la page elle-même. */
export const FILM_PAGE = "page";

/** Le message déjà écrit pour Mike, au numéro WhatsApp de ClikMe (l'étape 4 le lira). */
export function messagePourMike(prenom: string, numero: number, nom: string, code: string): string {
  const qui = prenom ? `c’est ${prenom}, ` : "";
  return `Bonjour Mike, ${qui}fantôme n°${numero} ${deNom(nom)} 👻 Je veux les bons plans ! (${code})`;
}
