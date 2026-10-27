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
};

/** 🏠 Une de ses familles, dans Ma Maison. */
export type MaFamille = { slug: string; nom: string; numero: number; membres: number; grade: Grade; parcours: Parcours };

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
