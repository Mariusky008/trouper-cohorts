// 👕 CE QU'ON MET EN AVANT AUJOURD'HUI — le seul geste quotidien d'une boutique.
//
// ═══ DEUX GESTES, ET UN SEUL EST QUOTIDIEN ═══════════════════════════════════
//
// « Le commerçant peut importer toute sa collection active, idéalement sans
// devoir la saisir manuellement. Puis chaque matin : qu'est-ce qu'on met en
// avant aujourd'hui ? »
//
// C'est la bonne répartition, et elle décide de tout le reste. La collection se
// saisit UNE FOIS — vingt à cinquante pièces pour une petite boutique, parfois
// deux cents — et ne bouge qu'aux arrivages. La mise en avant se décide CHAQUE
// MATIN, et elle doit tenir en un appui, sans quoi elle ne se fait pas : c'est
// exactement le raisonnement de « Remettre celle-là aujourd'hui » chez le
// boulanger, voir `historique.ts`.
//
// ═══ LE PRODUIT DU JOUR N'EST PAS LA PROMOTION DU JOUR ══════════════════════
//
// « Sinon, si chaque produit du jour doit être soldé, les utilisateurs vont très
// vite comprendre ClikMe comme une application de promotions. Et les commerçants
// vont hésiter à publier parce qu'ils auront l'impression qu'ils doivent
// sacrifier leur marge. »
//
// LA RAISON EST DONC LE CHAMP OBLIGATOIRE, ET LA REMISE LE CHAMP FACULTATIF.
// « Elle vient d'arriver », « il n'en reste que trois », « parfaite pour la
// météo », « je l'adore » : ce sont des raisons de montrer, et elles ne coûtent
// rien à celui qui les donne. La remise devient l'une d'elles, et redevient
// spéciale parce qu'elle n'est plus permanente.
//
// ═══ CE QUE CE FICHIER N'EST PAS ════════════════════════════════════════════
//
// Pas de serveur, pas de compte : la mise en avant vit dans le stockage local
// du navigateur, exactement comme les remises du boulanger. C'est une maquette
// qui sert à montrer le geste et à le mesurer, pas à publier. Le jour où il y a
// un dos, c'est la forme de `MiseEnAvant` qui part au dos — rien d'autre.

import type { Piece } from "@/lib/direct/fantomes";

/**
 * LES RAISONS DE MONTRER, ET LA REMISE EST LA DERNIÈRE.
 *
 * ELLES SONT UNE LISTE FERMÉE, ET C'EST VOLONTAIRE. Un champ libre aurait donné
 * « SUPER PROMO !!! » en trois jours — c'est-à-dire la seule chose que ce
 * produit ne doit pas devenir. Six pastilles se choisissent au pouce, tiennent
 * dans la grille du client, et gardent le même ton d'une boutique à l'autre.
 *
 * L'ORDRE EST CELUI DE LA FRÉQUENCE RÉELLE : ce qui arrive arrive tous les
 * jours, ce qui manque presque autant, la météo souvent, le coup de cœur
 * parfois, et la remise rarement. C'est aussi, exactement, l'ordre dans lequel
 * on veut qu'elles soient choisies.
 */
export const RAISONS: { cle: string; etiquette: string; aide: string; remise?: true }[] = [
  { cle: "nouveau", etiquette: "NOUVEAU AUJOURD’HUI", aide: "Elle vient d’arriver" },
  { cle: "dernieres", etiquette: "IL N’EN RESTE QUE 3", aide: "Il n’en reste presque plus" },
  { cle: "meteo", etiquette: "PARFAIT POUR AUJOURD’HUI", aide: "Le temps qu’il fait" },
  { cle: "coup", etiquette: "MON COUP DE CŒUR", aide: "Vous l’adorez, et ça se dit" },
  { cle: "tendance", etiquette: "LA PIÈCE DE LA SAISON", aide: "Ce qu’on vous demande" },
  { cle: "remise", etiquette: "AUJOURD’HUI SEULEMENT", aide: "Et seulement aujourd’hui", remise: true },
];

export function raisonDe(cle: string) {
  return RAISONS.find((r) => r.cle === cle) ?? RAISONS[0];
}

export type MiseEnAvant = {
  /** Le commerce concerné. */
  carte: string;
  /** L'identifiant de la pièce, dans sa collection. */
  piece: string;
  /** La clé de la raison. Voir `RAISONS`. */
  raison: string;
  /** Une phrase de sa main, facultative : pourquoi celle-là, aujourd'hui. */
  mot?: string;
  /** L'ancien prix, et seulement s'il y a vraiment une remise. */
  prixAvant?: string;
  /** Le jour où il l'a choisie, pour qu'elle tombe à minuit. */
  jour: string;
};

const CLE = "clikme-mise-en-avant-v1";
const abonnes = new Set<() => void>();
let cache: MiseEnAvant[] | null = null;

export const AUCUNE: MiseEnAvant[] = [];

/**
 * LE JOUR, EN CLAIR, DANS LE FUSEAU DU TÉLÉPHONE.
 *
 * MÊME RAISON QUE LES REMISES : ce qu'on met en avant aujourd'hui tombe à
 * minuit. Sans date, une pièce choisie mardi resterait « d'aujourd'hui » le
 * jeudi — et la première fois que ça arrive, le commerçant cesse de croire au
 * mot « aujourd'hui », qui est pourtant tout ce que ClikMe vend.
 */
function ceJour(): string {
  return new Date().toLocaleDateString("fr-CA");
}

export function chargerMisesEnAvant(): MiseEnAvant[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNE;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    const dujour = Array.isArray(l) ? (l as MiseEnAvant[]).filter((m) => m.jour === ceJour()) : [];
    cache = dujour.length ? dujour : AUCUNE;
  } catch {
    cache = AUCUNE;
  }
  return cache;
}

export function misesEnAvantVides(): MiseEnAvant[] {
  return AUCUNE;
}

export function abonnerMisesEnAvant(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

function ecrire(l: MiseEnAvant[]) {
  cache = l.length ? l : AUCUNE;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(l));
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

/**
 * METTRE CETTE PIÈCE EN AVANT AUJOURD'HUI.
 *
 * UNE SEULE PAR COMMERCE, ET C'EST LA RÈGLE QUI FAIT TOUT LE TRAVAIL. Deux
 * pièces « du jour » ne sont plus une mise en avant, c'est une sélection ; six,
 * c'est un rayon. En choisir une nouvelle remplace donc la précédente, sans
 * demander de retirer d'abord — le geste du matin doit tenir en un appui.
 */
export function mettreEnAvant(m: Omit<MiseEnAvant, "jour">) {
  const autres = chargerMisesEnAvant().filter((x) => x.carte !== m.carte);
  ecrire([...autres, { ...m, jour: ceJour() }]);
}

export function retirerLaMiseEnAvant(carte: string) {
  ecrire(chargerMisesEnAvant().filter((x) => x.carte !== carte));
}

export function miseEnAvantDe(carte: string): MiseEnAvant | undefined {
  return chargerMisesEnAvant().find((x) => x.carte === carte);
}

/**
 * ═══ « ON LA MONTRE AUJOURD'HUI ? » ═════════════════════════════════════════
 *
 * « ClikMe peut même lui proposer automatiquement : cette veste n'a pas encore
 * été mise en avant et vous en avez 6. On la montre aujourd'hui ? Et un clic
 * suffit. »
 *
 * C'EST CE QUI TRANSFORME UNE CORVÉE EN UN OUI. Devant vingt-cinq pièces, la
 * question « laquelle aujourd'hui ? » est un travail ; devant UNE pièce nommée,
 * c'est un accord ou un refus — et les deux prennent une seconde.
 *
 * ELLE TOURNE PLUTÔT QUE DE PRÉFÉRER. Le rang de la pièce suit le jour de
 * l'année : la suggestion change tous les matins et fait le tour de la
 * collection, au lieu de proposer éternellement la même veste parce qu'elle est
 * la première de la liste. C'est aussi ce qui la rend prévisible — on ne
 * découvre pas un jour que la moitié du stock n'a jamais été proposée.
 *
 * ELLE NE PROPOSE QUE CE QUI EST ESSAYABLE. Suggérer une pièce « bientôt
 * essayable » enverrait le client sur un bouton qui ne fait rien, ce qui est
 * plus cher qu'une journée sans mise en avant.
 */
export function suggestionDuJour(pieces: Piece[], sauf?: string): Piece | null {
  const dispo = pieces.filter((p) => !p.bientot && p.photo && p.id !== sauf);
  if (dispo.length === 0) return null;
  const debut = new Date(new Date().getFullYear(), 0, 0);
  const jour = Math.floor((Date.now() - debut.getTime()) / 86_400_000);
  return dispo[jour % dispo.length];
}
