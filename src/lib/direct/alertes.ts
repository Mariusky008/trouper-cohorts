// LES ALERTES DE DERNIÈRE MINUTE — quand ça vaut la peine d'interrompre.
//
// C'est le canal le plus dangereux du produit. Le résumé du jour arrive à heure
// fixe : on l'ouvre ou pas. Une alerte prétend mériter qu'on s'arrête. Si elle
// se trompe deux fois, elle est coupée pour toujours — et on ne récupère pas un
// canal coupé.
//
// D'où quatre règles, toutes DANS LE CODE et pas dans la promesse :
//
//   1. Seulement ce qui se rate. Une place qui se libère, une offre qui finit
//      dans l'heure. Une nouveauté qui court trois jours n'est pas une alerte,
//      c'est le résumé de demain.
//   2. Jamais deux fois la même chose. On n'alerte que sur ce qui est apparu
//      depuis la dernière alerte.
//   3. Un rythme tenu, quoi qu'il arrive. Une journée chargée ne doit pas
//      produire six messages.
//   4. Le silence est respecté. Aucune alerte en dehors des heures choisies —
//      « dernière minute » ne justifie pas 7 h du matin.
//
// Fonctions pures : elles se testent sans base, sans réseau et sans horloge
// réelle, et ce sont elles qu'on relit le jour où quelqu'un se plaint d'en
// recevoir trop.
import type { Publication } from "./publications";

/** Une offre qui finit dans plus de trois heures n'est pas « de dernière
 *  minute » : elle sera encore là ce soir, et le résumé suffira. */
export const URGENCE_MS = 3 * 3600 * 1000;

/** Deux alertes rapprochées se lisent comme du harcèlement, même si chacune est
 *  justifiée. Quatre heures est le pas le plus court qu'on puisse tenir sans
 *  que la journée devienne une file de notifications. */
export const RYTHME_MIN_MS = 4 * 3600 * 1000;

/** Au-delà, l'alerte devient une liste — et une liste n'a plus d'urgence. */
export const MAX_PAR_ALERTE = 3;

/**
 * Est-ce l'heure d'écrire à cette personne ?
 *
 * `heureLocale` est l'heure CHEZ ELLE. Le serveur peut tourner en UTC : comparer
 * son heure à un réglage exprimé en heure locale enverrait les alertes avec deux
 * heures de décalage l'été, ce qui est précisément l'erreur qui réveille les
 * gens.
 */
export function dansLesHeures(heureLocale: number, avant: number, apres: number): boolean {
  return heureLocale >= avant && heureLocale < apres;
}

/**
 * L'heure qu'il est dans une zone donnée, sans dépendance.
 *
 * Par `formatToParts`, pas en analysant une chaîne formatée : en locale fr-FR,
 * `format()` rend « 23 h » — avec l'unité — et un `Number()` dessus donne NaN.
 * Le repli silencieux qui suivait renvoyait l'heure DU SERVEUR, c'est-à-dire
 * exactement l'erreur que cette fonction existe pour empêcher : des alertes
 * envoyées à 1 h du matin parce que le serveur, lui, est en UTC.
 */
export function heureDans(zone: string, quand: Date = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: zone,
    }).formatToParts(quand);
    const h = parts.find((p) => p.type === "hour")?.value;
    const n = Number(h);
    return Number.isFinite(n) ? n % 24 : quand.getUTCHours();
  } catch {
    // Zone inconnue : l'heure UTC plutôt que l'heure locale du serveur, qui
    // dépend de l'hébergeur et peut changer sans qu'on s'en aperçoive.
    return quand.getUTCHours();
  }
}

/** Ce qui, dans un lot, mérite une alerte. Trié du plus urgent au moins urgent. */
export function meritentUneAlerte(publications: Publication[], maintenant = Date.now()): Publication[] {
  return publications
    .filter((p) => {
      const fin = p.expireLe ? Date.parse(p.expireLe) : NaN;
      const finit = Number.isFinite(fin) && fin > maintenant && fin - maintenant <= URGENCE_MS;
      // Une place libre est une alerte par nature : elle se prend ou elle est
      // prise. Une offre ne l'est que si elle se termine.
      return p.famille === "place" || finit;
    })
    .sort((a, b) => {
      const ea = a.expireLe ? Date.parse(a.expireLe) : Number.MAX_SAFE_INTEGER;
      const eb = b.expireLe ? Date.parse(b.expireLe) : Number.MAX_SAFE_INTEGER;
      return ea - eb;
    });
}

export type EtatAlerte = {
  /** Dernière alerte envoyée à cette personne, ISO ou null. */
  derniereAlerteAt: string | null;
  heureLocale: number;
  silenceAvant: number;
  silenceApres: number;
};

/**
 * L'alerte à envoyer, ou null. **Le seul point de décision** — le cron ne fait
 * qu'appliquer ce qu'elle renvoie.
 *
 * Renvoie null plutôt qu'une liste vide : « rien à envoyer » et « envoyer rien »
 * ne doivent pas pouvoir se confondre à l'appel.
 */
export function alerteAEnvoyer(
  publications: Publication[],
  etat: EtatAlerte,
  maintenant = Date.now()
): Publication[] | null {
  if (!dansLesHeures(etat.heureLocale, etat.silenceAvant, etat.silenceApres)) return null;

  const derniere = etat.derniereAlerteAt ? Date.parse(etat.derniereAlerteAt) : NaN;
  if (Number.isFinite(derniere) && maintenant - derniere < RYTHME_MIN_MS) return null;

  const urgentes = meritentUneAlerte(publications, maintenant);

  // Rien d'antérieur à la dernière alerte : on ne represente pas ce qui a déjà
  // été signalé. Sans cette borne, la même place libre partirait toutes les
  // quatre heures jusqu'à son expiration.
  //
  // Première alerte (aucune date) : on se limite à ce qui a paru dans l'heure,
  // au lieu de déverser tout ce qui traîne. Un premier contact qui arrive avec
  // trois annonces d'hier donne le ton de tout le reste.
  const borne = Number.isFinite(derniere) ? derniere : maintenant - 3600 * 1000;
  const neuves = urgentes.filter((p) => {
    const t = Date.parse(p.publieLe);
    return Number.isFinite(t) && t > borne;
  });

  return neuves.length ? neuves.slice(0, MAX_PAR_ALERTE) : null;
}
