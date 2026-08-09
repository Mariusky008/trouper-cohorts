// LA PORTE D'ENTRÉE DU CENTRE-VILLE.
//
// L'idée tient en une phrase : les gens vont en zone commerciale parce qu'ils
// croient qu'on y trouve tout et que le centre-ville n'a plus rien. C'est faux,
// et c'est démontrable — 400 commerces à Dax contre 110 en zone commerciale.
// Personne ne le sait parce qu'un centre-ville n'a pas de porte d'entrée où
// afficher sa taille. C'est cette porte.
//
// TROIS RÈGLES, et elles sont là pour que l'affirmation résiste à quelqu'un qui
// cherche à la démonter — un directeur général des services, un journaliste, le
// gérant de la zone commerciale :
//
//   1. On ne montre QUE les comparaisons qu'on gagne. Une comparaison perdue
//      n'est pas cachée par malhonnêteté : c'est qu'on n'a alors rien à
//      affirmer, et un centre-ville qui se compare et perd s'enfonce lui-même.
//   2. Sans chiffre, l'écran SE TAIT. Pas de « bientôt », pas d'estimation, pas
//      de repli sur le nombre de fiches Clikme — ce dernier serait le mensonge
//      le plus tentant et le plus destructeur : il transformerait un fait sur la
//      ville en publicité pour nous.
//   3. La source voyage avec le nombre. « 400 » est un slogan, « 400, source
//      Ville de Dax » est un fait opposable.
const str = (v: unknown) => (v == null ? "" : String(v));

const entier = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

export type Comparaison = { nom: string; commerces: number };

export type Porte = {
  /** Nombre de commerces du centre-ville. Fait sur la VILLE, jamais notre couverture. */
  total: number;
  /** Qui l'affirme. Vide = on n'affiche pas de source, mais le nombre reste. */
  source: string;
  /** Uniquement celles qu'on gagne, de la plus grande à la plus petite : la plus
   *  grande est l'adversaire le plus crédible, elle doit être lue en premier. */
  comparaisons: Comparaison[];
  /** « 2,7 fois » — face à la plus grande comparaison, pour l'accroche. */
  facteur: string;
};

/** Lit ce qui vient de `human_villes_config`. Rend `null` dès qu'il n'y a rien
 *  d'honnête à affirmer : pas de chiffre, ou aucune comparaison gagnée. */
export function porteDuCentre(input: {
  commercesTotal?: unknown;
  commercesSource?: unknown;
  comparaisons?: unknown;
}): Porte | null {
  const total = entier(input.commercesTotal);
  if (!total) return null;

  const brutes = Array.isArray(input.comparaisons) ? input.comparaisons : [];
  const comparaisons: Comparaison[] = [];
  for (const c of brutes) {
    if (!c || typeof c !== "object") continue;
    const nom = str((c as Record<string, unknown>).nom).trim();
    const commerces = entier((c as Record<string, unknown>).commerces);
    // `< total` et non `<= total` : à égalité il n'y a pas d'argument, et
    // afficher « 400 contre 400 » donnerait raison à l'adversaire.
    if (!nom || !commerces || commerces >= total) continue;
    comparaisons.push({ nom, commerces });
  }
  if (!comparaisons.length) return null;

  comparaisons.sort((a, b) => b.commerces - a.commerces);

  // Le facteur se calcule sur la PLUS GRANDE comparaison, jamais sur la plus
  // petite : choisir son adversaire le plus faible pour annoncer le plus gros
  // multiple est exactement ce qui fait perdre la confiance d'un élu.
  const brut = total / comparaisons[0].commerces;
  const facteur = (Math.round(brut * 10) / 10).toLocaleString("fr-FR");

  return { total, source: str(input.commercesSource).trim(), comparaisons, facteur };
}

/** « 400 » → « 400 », « 1400 » → « 1 400 ». Espace insécable : un nombre coupé
 *  en fin de ligne perd sa force. */
export function nombreFr(n: number): string {
  return n.toLocaleString("fr-FR").replace(/ |\s/g, " ");
}
