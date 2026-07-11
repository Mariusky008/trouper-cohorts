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

// Nom lisible de la plateforme détectée (pour l'angle « vous êtes sur Doctolib
// mais vous n'avez pas de site à vous »). Renvoie "" si non reconnu.
const PLATFORM_NAMES: Array<[string, string]> = [
  ["doctolib", "Doctolib"],
  ["maiia", "Maiia"],
  ["keldoc", "Keldoc"],
  ["resalib", "Resalib"],
  ["planity", "Planity"],
  ["treatwell", "Treatwell"],
  ["thefork", "TheFork"],
  ["lafourchette", "LaFourchette"],
  ["pagesjaunes", "les Pages Jaunes"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["tripadvisor", "TripAdvisor"],
  ["yelp", "Yelp"],
  ["ubereats", "Uber Eats"],
  ["deliveroo", "Deliveroo"],
  ["just-eat", "Just Eat"],
  ["justacote", "Justacote"],
  ["mappy", "Mappy"],
  ["leboncoin", "Leboncoin"],
  ["google", "Google Maps"],
  ["g.page", "Google Maps"],
  ["business.site", "Google Business"],
  ["linktr.ee", "Linktree"],
];

export function directoryPlatformName(raw: string | null | undefined): string {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "";
  const hit = PLATFORM_NAMES.find(([k]) => s.includes(k));
  return hit ? hit[1] : "";
}

// Plateformes de RÉSERVATION EN LIGNE fonctionnelles (≠ simple annuaire) : leur
// présence signifie que le praticien a déjà un accueil/agenda qui tourne. Pour
// un profil C (santé encadrée), c'est un critère d'EXCLUSION : on ne résout pas
// un problème qu'il n'a pas. Sous-ensemble volontairement restreint aux vraies
// prises de RDV santé/bien-être (pas Facebook/PagesJaunes, qui ne réservent rien).
const BOOKING_PLATFORMS: Array<[string, string]> = [
  ["doctolib", "Doctolib"],
  ["maiia", "Maiia"],
  ["keldoc", "Keldoc"],
  ["resalib", "Resalib"],
  ["planity", "Planity"],
  ["treatwell", "Treatwell"],
];

export function bookingPlatformName(raw: string | null | undefined): string {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "";
  const hit = BOOKING_PLATFORMS.find(([k]) => s.includes(k));
  return hit ? hit[1] : "";
}
