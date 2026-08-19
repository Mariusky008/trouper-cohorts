// LE PRIX, LU ET ÉCRIT AU MÊME ENDROIT.
//
// Trois codes différents manipulent le prix d'une carte du jour : la saisie du
// restaurateur, la lecture depuis la base, et l'affichage sur la carte du fil.
// Écrits séparément, ils divergent — c'est toujours le même scénario : la base
// rend « 18.00 », un écran affiche « 18.00 € », l'autre « 18 € », et le
// troisième laisse passer « 18,5 » saisi à la virgule. Une seule vérité, ici.

/**
 * Le prix tel que PostgREST le rend.
 *
 * ATTENTION : une colonne `numeric` ne revient PAS en nombre. PostgREST la
 * sérialise en chaîne (« 18.00 ») pour ne pas perdre de précision — un
 * `typeof r.prix === "number"` échoue donc toujours, en silence, et le prix
 * n'apparaît jamais. C'est la raison d'être de cette fonction.
 */
export function lirePrix(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n >= 1000) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Le prix saisi par le commerçant, au clavier d'un téléphone.
 *
 * Il tape « 18 », « 18,50 », « 18.5 », « 18 € » ou « 18,50€ » — tout ça veut
 * dire la même chose, et refuser l'un des cinq serait lui donner tort à sa
 * place. On accepte donc la virgule française, le point, et le symbole.
 */
export function saisirPrix(v: unknown): number | null {
  const brut = String(v ?? "").trim().replace(/[€\s]/g, "");
  if (!brut) return null;
  return lirePrix(brut);
}

/**
 * Le prix à l'écran, à la française.
 *
 * Les centimes ne s'affichent QUE s'il y en a : « 18 € » se lit d'un coup d'œil,
 * « 18,00 € » demande de vérifier qu'il n'y a rien après la virgule. Sur une
 * page où l'on compare six menus en dix secondes, c'est la différence entre
 * comparer et lire.
 */
export function prixCourt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  const centimes = Math.round(n * 100) % 100;
  return centimes === 0
    ? `${Math.round(n)} €`
    : `${n.toFixed(2).replace(".", ",")} €`;
}
