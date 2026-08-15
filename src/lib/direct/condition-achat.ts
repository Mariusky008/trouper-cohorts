// LA CONDITION D'ACHAT D'UN CADEAU — écrite une fois, lisible partout.
//
// Le commerçant tape ce qu'il veut. Il a tapé « 12 », et l'écran de
// confirmation a affiché « valable 12 » — qui ne veut rien dire, et qui arrive
// au pire moment : juste après que quelqu'un se soit engagé.
//
// DEUX FONCTIONS, ET LA PREMIÈRE EST LA PLUS IMPORTANTE. On NORMALISE à
// l'écriture, pas seulement à l'affichage : la base porte alors une phrase
// lisible, et les trois écrans qui la relisent n'ont plus à la deviner chacun
// à sa manière. Une seule vérité, écrite au moment où on la connaît.
//
// On ne devine JAMAIS un montant qui n'a pas été tapé. « 12 » devient « dès
// 12 € d'achat » parce qu'un nombre seul dans ce champ est un montant — mais
// une phrase qu'on ne sait pas lire est rendue telle quelle, jamais réécrite.

const str = (v: unknown) => String(v ?? "").trim();

/** Une phrase qui commence déjà comme une condition n'est pas retouchée. */
const DEJA_UNE_CONDITION = /^(d[eè]s|[àa] partir|pour|avec|sur|en cas|jusqu|hors|sauf|valable)/i;

/** « 12 », « 12€ », « 12,50 € » — un montant seul. */
const MONTANT_SEUL = /^(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)?$/i;

/**
 * Ce qu'on écrit en base : « dès 12 € d'achat ».
 *
 * Chaîne vide si le champ est vide — l'appelant décide si c'est une erreur.
 * Le cadeau, lui, l'exige : sans condition d'achat, on donne à des gens qui
 * n'achètent rien.
 */
export function conditionNormalisee(brut: unknown): string {
  const t = str(brut).replace(/\s+/g, " ");
  if (!t) return "";
  const m = t.match(MONTANT_SEUL);
  if (m) {
    // La virgule est la décimale française ; « 12.50 » saisi au pavé numérique
    // doit s'écrire « 12,50 ».
    const montant = m[1].replace(".", ",").replace(/,00?$/, "");
    return `dès ${montant} € d'achat`;
  }
  return t.slice(0, 120);
}

/**
 * Ce qu'on affiche sous un avantage : « Valable dès 12 € d'achat. »
 *
 * Le préfixe n'est posé que si la phrase se laisse préfixer. « Condition : … »
 * pour tout le reste — une phrase bancale sur l'écran de confirmation coûte
 * plus cher qu'une formulation plate.
 */
export function conditionPhrase(brut: unknown): string {
  const t = conditionNormalisee(brut);
  if (!t) return "";
  if (/^valable/i.test(t)) return finPoint(majuscule(t));
  if (DEJA_UNE_CONDITION.test(t)) return finPoint(`Valable ${t}`);
  return finPoint(`Condition : ${t}`);
}

/** La même chose en minuscules, pour une ligne déjà introduite par autre chose. */
export function conditionCourte(brut: unknown): string {
  const t = conditionNormalisee(brut);
  if (!t) return "";
  return DEJA_UNE_CONDITION.test(t) ? t : `condition : ${t}`;
}

const majuscule = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const finPoint = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
