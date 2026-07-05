// Détection des URL d'annuaires / plateformes / réseaux sociaux qui ne sont PAS
// le site propre du commerçant (fiche Doctolib, page Facebook, PagesJaunes…).
// Règle d'honnêteté : on ne peut pas critiquer « votre site actuel » si ce n'en
// est pas un. Ces cas basculent en SANS_SITE (le commerçant n'a pas de site à lui).
//
// À NE PAS inclure : les créateurs de sites gratuits (wixsite.com, wordpress.com,
// *.webadorsite.com, e-monsite…) — ce sont de vrais sites du commerçant, juste
// basiques/datés → ils restent éligibles aux modules VETUSTE, NON_SECURISE, etc.

const DIRECTORY_PATTERNS = [
  "doctolib.",
  "maiia.com",
  "keldoc.",
  "resalib.",
  "planity.",
  "treatwell.",
  "thefork.",
  "lafourchette.",
  "pagesjaunes.",
  "facebook.com",
  "fb.com",
  "fb.me",
  "instagram.com",
  "linkedin.com",
  "tripadvisor.",
  "yelp.",
  "ubereats.",
  "deliveroo.",
  "just-eat.",
  "google.com/maps",
  "google.fr/maps",
  "g.page",
  "goo.gl",
  "maps.app.goo",
  "business.site",
  "justacote.",
  "mappy.",
  "leboncoin.",
  "allovoisins.",
  "starofservice.",
  "malt.fr",
  "yellowpages.",
  "societe.com",
  "verif.com",
  "linktr.ee",
];

export function isDirectoryUrl(raw: string | null | undefined): boolean {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return false;
  return DIRECTORY_PATTERNS.some((p) => s.includes(p));
}
