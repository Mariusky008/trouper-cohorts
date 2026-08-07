// LA COMPOSITION DU RÉSUMÉ QUOTIDIEN.
//
// Pourquoi « les commerces que je suis » n'est PAS un troisième e-mail.
//
// Une publication d'un commerce suivi est déjà dans le résumé : le résumé, c'est
// le fil de toute la ville. Un envoi séparé n'ajouterait aucune information — il
// dépenserait de l'attention. Or l'attention e-mail est un budget fixe : un
// troisième canal ne s'additionne pas aux deux autres, il les cannibalise. Le
// jour où quelqu'un en reçoit trois par jour, il coupe les trois.
//
// Ce que la personne veut n'est pas « plus de messages », c'est « ne pas rater
// MES commerces ». Le suivi change donc la COMPOSITION et l'ORDRE du résumé,
// jamais sa fréquence. Les deux bascules se composent en quatre états, avec un
// seul envoi et un seul rythme :
//
//   résumé ✓ · suivis ✓ → tout, commerces suivis en tête
//   résumé ✗ · suivis ✓ → uniquement ses commerces
//   résumé ✓ · suivis ✗ → tout, sans section particulière
//   résumé ✗ · suivis ✗ → rien
//
// L'urgence réelle est ailleurs : une place libérée par un commerce suivi part
// par les alertes, et « À saisir » le fait déjà remonter.
import type { Publication } from "./publications";

/** Un envoi qui ne dépasse jamais la longueur d'un écran. Au-delà, on ne lit
 *  plus, on fait défiler — et faire défiler, c'est ne pas lire. */
export const MAX_SUIVIS = 4;
export const MAX_VILLE = 6;

const JOUR_MS = 24 * 3600 * 1000;
/** Premier envoi : on regarde une semaine en arrière plutôt que d'envoyer un
 *  e-mail vide à quelqu'un qui vient de confirmer. */
const PREMIER_ENVOI_MS = 7 * JOUR_MS;

export type PrefsResume = {
  recoitResume: boolean;
  recoitSuivis: boolean;
  /** Identifiants des commerces suivis. */
  suivis: Set<string>;
  lastSentAt: string | null;
};

export type Resume = {
  /** Ce qui vient de ses commerces. Toujours en tête de l'e-mail. */
  desSuivis: Publication[];
  /** Le reste de la ville. Vide si la personne a coupé le résumé général. */
  deLaVille: Publication[];
};

/**
 * Le résumé à envoyer, ou null.
 *
 * Null plutôt qu'un objet vide : « rien à envoyer » et « envoyer un e-mail
 * vide » ne doivent pas pouvoir se confondre à l'appel. C'est la règle qui
 * protège le plus la confiance — un abonné qui reçoit un e-mail vide se
 * désinscrit, et il a raison.
 */
export function composerResume(
  publications: Publication[],
  prefs: PrefsResume,
  maintenant = Date.now()
): Resume | null {
  if (!prefs.recoitResume && !prefs.recoitSuivis) return null;

  // Un envoi par jour au maximum, quelle que soit la composition.
  const dernier = prefs.lastSentAt ? Date.parse(prefs.lastSentAt) : NaN;
  if (Number.isFinite(dernier) && maintenant - dernier < JOUR_MS) return null;

  // « Du neuf » se mesure sur la date de publication réelle : une annonce déjà
  // envoyée hier et toujours en cours ne redéclenche pas un envoi.
  const depuis = Number.isFinite(dernier) ? dernier : maintenant - PREMIER_ENVOI_MS;
  const neuves = publications.filter((p) => {
    const t = Date.parse(p.publieLe);
    return Number.isFinite(t) && t > depuis;
  });
  if (!neuves.length) return null;

  const suit = (p: Publication) => Boolean(p.siteId && prefs.suivis.has(p.siteId));

  const desSuivis = prefs.recoitSuivis ? neuves.filter(suit).slice(0, MAX_SUIVIS) : [];
  // Jamais deux fois la même annonce dans un même e-mail : ce qui est déjà en
  // tête ne se répète pas dans le corps.
  const dejaLa = new Set(desSuivis.map((p) => p.id));
  const deLaVille = prefs.recoitResume
    ? neuves.filter((p) => !dejaLa.has(p.id)).slice(0, MAX_VILLE)
    : [];

  if (!desSuivis.length && !deLaVille.length) return null;
  return { desSuivis, deLaVille };
}
