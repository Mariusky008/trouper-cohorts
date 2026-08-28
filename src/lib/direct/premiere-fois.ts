// CE QU'ON N'EXPLIQUE QU'UNE FOIS.
//
// LE DÉFAUT QUE CE MODULE RÈGLE, RELEVÉ AU TEST : « quand on balaie à droite,
// les gens ne comprennent pas vraiment où ils arrivent ». C'est le geste
// central du produit — celui qui fait passer d'une annonce à une conversation
// — et il était deviné plutôt que compris. Un doigt animé sur la carte disait
// « ça se balaie » ; il ne disait pas ce que chaque côté fait.
//
// POURQUOI UNE SEULE FOIS, ET PAS UN RÉGLAGE. Une aide qu'on revoit à chaque
// ouverture devient un obstacle entre la personne et ce qu'elle est venue
// chercher ; une aide qu'on ne voit jamais ne sert à rien. On la montre au
// premier passage, et elle ne revient plus.
//
// CE N'EST PAS UN COMPTEUR D'USAGE. On n'enregistre pas ce que la personne
// fait : on note seulement qu'une explication a déjà été donnée, ce qui est la
// stricte information nécessaire pour ne pas la redonner.

const CLE = "clikme-vu-v1";
const abonnes = new Set<() => void>();
/**
 * LA MÊME RÉFÉRENCE TANT QUE RIEN NE CHANGE.
 *
 * `useSyncExternalStore` compare les instantanés par identité : rendre un
 * tableau neuf à chaque lecture ferait boucler le rendu à l'infini. Défaut déjà
 * payé sur ce projet, on ne le repaie pas.
 */
export const RIEN_VU: string[] = [];
let cache: string[] | null = null;

export function chargerVus(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return RIEN_VU;
  try {
    const brut = window.localStorage.getItem(CLE);
    cache = brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

export function abonnerVus(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/**
 * Vrai si cette explication n'a jamais été donnée.
 *
 * À N'APPELER QUE HORS RENDU — dans un gestionnaire, jamais dans le corps d'un
 * composant. Sur le serveur il n'y a pas de stockage : cette fonction répond
 * donc « jamais vu » pendant le pré-rendu, et l'inverse sur le téléphone de
 * quelqu'un qui a déjà fermé l'aide. Deux HTML différents pour la même page —
 * React error #418, mesurée. Dans un rendu, on passe par l'instantané que
 * `useSyncExternalStore` fournit à partir de `chargerVus`.
 */
export function jamaisVu(quoi: string): boolean {
  return !chargerVus().includes(quoi);
}

/** On l'a montrée : elle ne reviendra pas. */
export function marquerVu(quoi: string) {
  const v = chargerVus();
  if (v.includes(quoi)) return;
  cache = [...v, quoi];
  try {
    window.localStorage.setItem(CLE, JSON.stringify(cache));
  } catch {
    /* Stockage refusé : elle reviendra à la prochaine visite, tant pis. */
  }
  abonnes.forEach((f) => f());
}
