// SUIVRE UN COMMERÇANT — « soyez prévenu avant les autres ».
//
// LA DIFFÉRENCE AVEC GARDER, ET ELLE EST TOUT LE SUJET. Garder range une
// annonce pour la retrouver : c'est un geste tourné vers SOI, et il ne demande
// rien à personne. Suivre est un geste tourné vers le COMMERÇANT : il crée une
// obligation — être prévenu — et donc une raison de revenir demain.
//
// POURQUOI « SUIVRE » SEUL NE SUFFIT PAS. Un bouton qui dit « suivre » promet
// un fil qu'on lira peut-être ; personne n'appuie pour ça. La promesse doit
// être une AVANCE : savoir avant les autres qu'il reste quatre parts, c'est ce
// qui décide de la journée de quelqu'un. C'est la même leçon que « faites-le
// revenir », qui n'a commencé à servir que le jour où la ligne a dit ce qui se
// passait ensuite.
//
// CE QUE ÇA CHANGE POUR LE COMMERÇANT : il ne repart pas de zéro chaque matin.
// Sa carte du jour ne cherche plus une audience, elle en a une.
//
// CE QUI N'EST PAS FAIT ICI, ET QU'IL FAUT SAVOIR. Cette maquette n'a pas de
// serveur : le suivi vit dans le navigateur, et les avis de publication sont
// joués localement. En vrai, il faudrait une table et un envoi ; la permission
// de notification, elle, est déjà demandée au bon endroit — voir
// `demanderAvertissement` dans la page.

const CLE = "clikme-suivis-v1";
const abonnes = new Set<() => void>();
export const AUCUN_SUIVI: string[] = [];
let cache: string[] | null = null;

/**
 * QUATRE COMMERCES DÉJÀ SUIVIS, AU PREMIER OUVRAGE — et c'est une décision.
 *
 * UNE FONCTION QUI NE SE VOIT QU'APRÈS COUP N'EXISTE PAS. La pastille du cœur
 * ne dit quelque chose que si l'on suit déjà quelqu'un : à zéro suivi, elle
 * affiche zéro, et celui qui essaie l'application n'a aucune raison de deviner
 * qu'il faut d'abord appuyer sur « Prévenez-moi » trois fois pour comprendre à
 * quoi elle sert. On démarre donc avec un voisinage, comme quelqu'un qui
 * utilise l'application depuis un mois.
 *
 * LE QUATRIÈME EST MUET, ET C'EST LE PLUS IMPORTANT DES QUATRE. Voir
 * `silencieux` dans les fiches : il n'a rien publié aujourd'hui, et sa ligne
 * dit « Rien aujourd'hui ». Sans lui, la liste ne montrerait que des jours
 * réussis, et on ne verrait jamais ce que ses clients lisent quand il ne fait
 * pas son planning du matin.
 *
 * CE N'EST PAS UN ABONNEMENT FORCÉ : on peut les retirer un par un, et le
 * retrait se garde. Le tableau ne sert qu'au tout premier passage, quand le
 * téléphone n'a encore rien mémorisé.
 */
const DEBUT = ["boulange", "boucher", "fleur-marche", "coif-nouveau"];

function garder(v: string[]) {
  cache = v;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v));
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

export function chargerSuivis(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUN_SUIVI;
  try {
    const brut = window.localStorage.getItem(CLE);
    // AUCUNE CLÉ = PREMIER PASSAGE, donc le voisinage de départ. Une clé
    // présente mais vide veut dire qu'on a tout retiré à la main : on la
    // respecte, et on ne réabonne personne dans son dos.
    cache = brut ? (JSON.parse(brut) as string[]) : [...DEBUT];
  } catch {
    cache = [...DEBUT];
  }
  return cache;
}

// ── LA PASTILLE DU CŒUR : LUE OU PAS LUE ────────────────────────────────────
//
// CE QU'ELLE COMPTE, ET CE QU'ELLE NE COMPTE PAS. Elle compte LES NOUVELLES DU
// JOUR des commerces suivis — un flux, quelque chose qui arrive le matin et qui
// se périme le soir. Elle ne compte pas les annonces gardées : celles-là sont
// un stock, elles ne bougent pas, et un stock qui s'allume en permanence
// apprend en trois jours à ne plus regarder la pastille.
//
// ELLE S'ÉTEINT QUAND ON A OUVERT, ET ELLE REVIENT LE LENDEMAIN. On garde donc
// la DATE de lecture, pas un booléen : un booléen resterait vrai demain matin,
// exactement au moment où le commerçant a besoin qu'elle se rallume.
//
// C'EST AUSSI LA PROMESSE FAITE AU COMMERÇANT, et il faut qu'elle soit
// vérifiable : « vos abonnés ont une pastille qui s'allume le matin quand vous
// publiez ; si vous ne publiez pas, elle ne s'allume pas ».
const CLE_LU = "clikme-nouvelles-lues-v1";
const lecteurs = new Set<() => void>();
let cacheLu: string | null = null;

/** Le jour courant, à la façon d'un journal : il change à minuit. */
function ceJour(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function nouvellesLues(): boolean {
  if (typeof window === "undefined") return false;
  if (cacheLu === null) {
    try {
      cacheLu = window.localStorage.getItem(CLE_LU) ?? "";
    } catch {
      cacheLu = "";
    }
  }
  return cacheLu === ceJour();
}

/** Sur le serveur, rien n'est lu : la pastille se peint au premier rendu. */
export function nouvellesLuesServeur(): boolean {
  return false;
}

export function marquerNouvellesLues() {
  cacheLu = ceJour();
  try {
    window.localStorage.setItem(CLE_LU, cacheLu);
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  lecteurs.forEach((f) => f());
}

export function abonnerLecture(f: () => void) {
  lecteurs.add(f);
  return () => {
    lecteurs.delete(f);
  };
}

// ── L'AVIS DU MATIN — UN SEUL, ET GROUPÉ ────────────────────────────────────
//
// POURQUOI IL FAUT UNE NOTIFICATION, ET PAS SEULEMENT UNE PASTILLE. Relevé à
// l'essai : « je n'ai aucune notification qui me permet de savoir ces news ».
// C'est le fond du problème : une pastille dans un coin n'est vue que par ceux
// qui ouvrent déjà l'application tous les jours — c'est-à-dire exactement les
// gens dont on n'a pas besoin de s'occuper.
//
// POURQUOI UNE SEULE, ET GROUPÉE. Une notification par commerce suivi, à cinq
// commerces, fait cinq sonneries entre 7 h et 9 h : on coupe les notifications
// au bout de trois jours, et on ne les rallume jamais. Une seule, qui dit
// combien et cite le plus intéressant, se lit en entier.
//
// ET UNE SEULE PAR JOUR : c'est la même date qui est gardée que pour la
// pastille, mais dans sa propre clé — ouvrir l'application à 7 h ne doit pas
// empêcher l'avis, et recevoir l'avis ne doit pas éteindre la pastille avant
// qu'on ait lu.
//
// CE QUI EST SIMULÉ ICI, ET IL FAUT LE SAVOIR : la maquette n'a pas de serveur.
// L'avis se déclenche à l'ouverture de l'application, pas à 7 h du matin sur un
// téléphone éteint. Le vrai produit a besoin d'un envoi côté serveur ; tout le
// reste — la permission, le groupement, le texte, la règle d'une fois par jour
// — est celui qu'on gardera.
const CLE_REVEIL = "clikme-avis-matin-v1";

export function avisDuMatinDejaEnvoye(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CLE_REVEIL) === ceJour();
  } catch {
    return true;
  }
}

export function marquerAvisDuMatin() {
  try {
    window.localStorage.setItem(CLE_REVEIL, ceJour());
  } catch {
    /* Stockage refusé : l'avis se rejouera, ce qui est le moindre mal. */
  }
}

export function abonnerSuivis(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/** Rend vrai si l'on vient de se mettre à suivre, faux si l'on a arrêté. */
export function basculerSuivi(id: string): boolean {
  const v = chargerSuivis();
  const suit = v.includes(id);
  garder(suit ? v.filter((x) => x !== id) : [...v, id]);
  return !suit;
}

export function jeSuis(id: string): boolean {
  return chargerSuivis().includes(id);
}
