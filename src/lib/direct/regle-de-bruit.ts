/**
 * 🤫 LA RÈGLE DE BRUIT, COMMUNE (`docs/univers/discussions-video.md`, le lot A5 ; sortie de `groupes-vie-serveur.ts`,
 * #303) : rien sur le téléphone de 22 h à 9 h (heure de Paris) ; une vague par discussion toutes les deux heures au plus ;
 * la notification suivante remplace la précédente (le même `tag`). Les groupes et les discussions des vidéos la suivent.
 *
 * Partagé par le serveur et les essais.
 */

/** Une vague de notifications par discussion toutes les deux heures au plus. */
export const NOTIF_DISCUSSION_MS = 2 * 3600_000;
const HEURE_PARIS = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", hourCycle: "h23", hour: "2-digit" });
/** (Paris) de 22 h à 9 h : on ne réveille personne pour une discussion. */
export const heureCalme = (ms: number) => {
  const h = Number(HEURE_PARIS.format(ms));
  return h >= 22 || h < 9;
};
