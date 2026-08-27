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
    cache = brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
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
