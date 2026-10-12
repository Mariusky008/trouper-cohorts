/**
 * DANS QUEL PAYS EST CE COMMERCE ? — client-safe, sans dépendance serveur.
 *
 * La recherche de sa fiche Google en a besoin (« Lausanne, Suisse » se cherche
 * en Suisse), et son numéro aussi : « 079 123 45 67 » est un mobile suisse à
 * Vevey, mais se lisait « +33 7 91 23 45 67 » — un inconnu en France, à qui
 * ses réservations seraient parties. Voir `toE164` et `pro-phone.ts`.
 */
const PAYS: [RegExp, string][] = [
  [/\b(suisse|switzerland|schweiz|svizzera)\b|\(ch\)|,\s*ch\s*$/i, "ch"],
  [/\b(belgique|belgium|belgi[eë])\b|\(be\)|,\s*be\s*$/i, "be"],
  [/\bluxembourg\b|\(lu\)/i, "lu"],
  [/\bmonaco\b/i, "mc"],
  [/\b(canada|qu[ée]bec)\b/i, "ca"],
  [/\b(espagne|españa|spain)\b/i, "es"],
  [/\b(italie|italia|italy)\b/i, "it"],
  [/\b(allemagne|deutschland|germany)\b/i, "de"],
  [/\b(portugal)\b/i, "pt"],
  [/\b(maroc|morocco)\b/i, "ma"],
  [/\b(tunisie|tunisia)\b/i, "tn"],
  [/\b(r[ée]union|martinique|guadeloupe|guyane|mayotte)\b/i, "fr"],
];

/** Le pays que la ville tapée nomme, s'il en nomme un. */
export function paysDeLaVille(ville: string): string | null {
  return PAYS.find(([re]) => re.test(ville))?.[1] ?? null;
}

/**
 * Le pays d'un commerce : celui que Google a donné (`diagnostic.pays`), sinon
 * celui que nomme la FIN de son adresse (« …, 1800 Vevey, Suisse » — Google
 * n'écrit le pays que hors de France), sinon sa ville. Rien de tout ça : la
 * France, comme presque tous.
 *
 * LA FIN DE L'ADRESSE SEULEMENT : « 5 rue de Belgique, 75000 Paris » n'est pas
 * en Belgique.
 */
export function paysDuCommerce(row: { diagnostic?: unknown; address?: unknown; city?: unknown } | null | undefined): string {
  const d = (row?.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const google = String(d.pays ?? "").trim().toLowerCase();
  if (/^[a-z]{2}$/.test(google)) return google;
  const fin = String(row?.address ?? "").split(",").pop()?.trim() ?? "";
  return (fin && paysDeLaVille(fin)) || paysDeLaVille(String(row?.city ?? "")) || "fr";
}
