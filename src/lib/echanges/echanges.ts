// L'ÉCHANGE ENTRE COMMERÇANTS — ce que le serveur et l'écran partagent.
// Voir `supabase/migrations/20261017120000_echanges_commercants.sql` pour les
// règles, et `src/app/api/site-internet/pro/echanges/route.ts` pour la route.

/** Ce téléphone est celui de ce commerçant : la page d'un bon scanné (`/bon/<code>`) peut le valider. */
export const CLE_ACCES_COMPTOIR = "clikme-comptoir-acces";

/** Le découvert de départ ne dépasse pas ce montant, quelle que soit la capacité. */
export const DECOUVERT_MAX_DEPART = 300;
/** Les euros, en dernier recours, au bout de ce délai après le premier produit pris. */
export const MOIS_AVANT_EUROS = 12;
/** Combien il peut en offrir par mois : c'est sa capacité à fournir. */
export const PAR_MOIS = [1, 2, 4, 8];

/** Son découvert : un mois de ce qu'il peut offrir, plafonné au départ. */
export const decouvertDe = (prix: number, parMois: number) => Math.min(DECOUVERT_MAX_DEPART, Math.max(0, prix) * Math.max(0, parMois));

/** « CLK-7KQ2MX » : sans 0/O, 1/I/L, pour se dicter sans erreur. */
export const ALPHABET_CODE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Ce qu'on tape, dit ou scanne → la forme rangée en base, ou "" si ça ne peut pas être un code. */
export function codeNormalise(brut: string): string {
  const s = String(brut ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const corps = s.startsWith("CLK") ? s.slice(3) : s;
  if (corps.length !== 6) return "";
  for (const ch of corps) if (!ALPHABET_CODE.includes(ch)) return "";
  return `CLK-${corps}`;
}

/** Une offre d'un autre commerçant, telle que l'écran la montre. */
export type OffreReelle = {
  id: string;
  commerce: string;
  metier: string;
  branche: string;
  ville: string;
  villeSlug: string;
  titre: string;
  prix: number;
  photo: string;
  parMois: number;
  /** Combien on peut encore lui en prendre ce mois-ci. */
  restant: number;
  /** Il doit au réseau : son offre passe en tête. */
  doit: boolean;
};

/** Un bon, vu par celui qui l'a pris ou par celui qui le fournit. */
export type BonReel = {
  id: string;
  code: string;
  titre: string;
  prix: number;
  photo: string;
  statut: "reserve" | "utilise" | "annule";
  /** L'autre commerce : celui qui fournit (pour un bon pris) ou celui qui a pris (pour un bon reçu). */
  autre: string;
  autreVille: string;
  cree: string;
  utilise?: string;
};

export type MonOffre = { titre: string; prix: number; parMois: number; duJour: boolean; photo: string; actif: boolean };

export type EtatEchanges = {
  /** Faux tant que la migration n'est pas appliquée. */
  pret: boolean;
  mien: MonOffre | null;
  compte: { decouvert: number; gagne: number; pris: number; aDepenser: number; du: number; echeance: string | null };
  maVille: { nom: string; slug: string };
  offres: OffreReelle[];
  /** Ce qu'il a pris chez les autres. */
  pris: BonReel[];
  /** Ce que les autres lui ont pris : à valider quand ils viennent, ou déjà validés. */
  recus: BonReel[];
};
