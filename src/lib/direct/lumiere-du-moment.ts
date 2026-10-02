/**
 * 🌅 LA LUMIÈRE SUIT L'HEURE — et l'enseigne s'allume le soir, s'il est ouvert.
 *
 * « La lumière suit l'heure : dorée en fin d'après-midi, enseigne allumée le
 * soir. La page a l'air vivante, pas figée. »
 *
 * QUATRE MOMENTS, À L'HEURE DU COMMERCE ET À LA SAISON :
 *   · « matin »  — du lever du soleil à 11 h : une lumière claire ;
 *   · « jour »   — jusqu'à une heure trois quarts avant le coucher ;
 *   · « dore »   — la fin de journée : un soleil bas, doré, qui rase la façade ;
 *   · « soir »   — après le coucher, et la nuit : l'ambiance qu'on connaît,
 *     façade dans l'ombre, ciel violine.
 * L'heure est celle de Paris, pas celle du téléphone : c'est la lumière DEVANT
 * SA PORTE qu'on montre, même à quelqu'un qui regarde depuis Montréal.
 *
 * LE SOLEIL NE SE COUCHE PAS À LA MÊME HEURE EN JUIN ET EN DÉCEMBRE. Une heure
 * fixe (« doré à 17 h ») aurait posé une lumière de fin de journée en plein
 * soleil de juin, et une nuit noire à 17 h en été. Les tables ci-dessous sont
 * les heures moyennes du lever et du coucher dans le sud-ouest, mois par mois,
 * en heure légale française. À un quart d'heure près — c'est une ambiance,
 * pas un éphéméride.
 *
 * L'ENSEIGNE NE MENT PAS. Une enseigne allumée dit « ouvert ». Elle ne
 * s'allume donc que si ses horaires disent qu'il l'est — ou, quand on ne les
 * connaît pas, en début de soirée seulement. Fermé, elle reste éteinte, et son
 * double le dit (voir `phraseDuSeuil`).
 *
 * FICHIER PARTAGÉ (serveur et navigateur) : aucune dépendance au DOM.
 */
import { computeOpenState, type OpenState } from "@/lib/site-internet/opening-hours";

export type Moment = "matin" | "jour" | "dore" | "soir";
export const MOMENTS: Moment[] = ["matin", "jour", "dore", "soir"];

/** Lever et coucher moyens, mois par mois (janvier d'abord), en heures décimales. */
export const LEVER = [8.6, 8.1, 7.4, 7.4, 6.7, 6.3, 6.5, 7.0, 7.6, 8.2, 7.9, 8.4];
export const COUCHER = [17.6, 18.3, 19.4, 20.6, 21.2, 21.6, 21.6, 21.0, 20.1, 19.0, 17.5, 17.2];

/** Le mois (0–11) et l'heure décimale à Paris. */
export function heureDeParis(now: Date = new Date()): { mois: number; h: number } {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const val = (t: string) => Number(p.find((x) => x.type === t)?.value || "0");
  const hh = val("hour") % 24;
  return { mois: Math.max(0, Math.min(11, val("month") - 1)), h: hh + val("minute") / 60 };
}

export function momentDe(mois: number, h: number): Moment {
  const lever = LEVER[mois];
  const coucher = COUCHER[mois];
  if (h < lever || h >= coucher + 0.4) return "soir";
  if (h < 11) return "matin";
  if (h >= coucher - 1.75) return "dore";
  return "jour";
}

/**
 * LE MÊME CALCUL, EN SCRIPT EN LIGNE — joué AVANT que la page s'affiche.
 *
 * Sans lui, la page arrive du serveur dans la lumière du soir, puis bascule
 * au matin une à deux secondes plus tard, quand React se réveille : un saut
 * de lumière à chaque visite de jour. Ce script pose `data-heure` sur
 * `<html>` pendant la lecture même du document. Il ne touche à rien de ce que
 * React gère : aucun désaccord à l'hydratation.
 *
 * `?heure=matin|jour|dore|soir` force un moment — pour regarder chacun sans
 * attendre qu'il arrive.
 */
export const SCRIPT_HEURE = `(function(){try{
var f=(location.search.match(/[?&]heure=(matin|jour|dore|soir)/)||[])[1];
if(!f){var p=new Intl.DateTimeFormat("en-US",{timeZone:"Europe/Paris",month:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
var v=function(t){for(var i=0;i<p.length;i++)if(p[i].type===t)return Number(p[i].value);return 0;};
var m=Math.max(0,Math.min(11,v("month")-1)),h=(v("hour")%24)+v("minute")/60,L=${JSON.stringify(LEVER)}[m],C=${JSON.stringify(COUCHER)}[m];
f=(h<L||h>=C+0.4)?"soir":h<11?"matin":h>=C-1.75?"dore":"jour";}
document.documentElement.setAttribute("data-heure",f);}catch(e){}})();`;

const JOURS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/**
 * OUVERT À CETTE HEURE-CI ? `null` quand on ne sait pas — jamais un « ouvert »
 * deviné.
 *
 * Les commerces de démonstration n'ont que leur ligne du jour (« Aujourd'hui,
 * 12 h – 14 h et 19 h – 22 h ») : elle est relue comme l'entrée du jour, ce
 * qu'elle est.
 */
export function ouvertMaintenant(
  semaine: { jours?: string; horaires?: string }[] | undefined,
  ligneDuJour: string | undefined,
  now: Date = new Date(),
): OpenState {
  if (semaine?.length) return computeOpenState(semaine, now);
  const m = String(ligneDuJour || "").match(/^aujourd[’']hui,\s*(.+)$/i);
  if (!m) return null;
  const jour = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long" }).format(now).toLowerCase();
  return JOURS_FR.includes(jour) ? computeOpenState([{ jours: jour, horaires: m[1] }], now) : null;
}

/** L'enseigne s'allume-t-elle ? Le soir, s'il est ouvert ; sans horaires, jusqu'à 23 h. */
export function enseigneAllumee(moment: Moment, ouvert: OpenState, h: number): boolean {
  if (moment !== "soir") return false;
  if (ouvert) return ouvert.open;
  return h >= 17 && h < 23;
}

/**
 * CE QUE DIT SON DOUBLE SOUS LE TITRE, selon l'heure et la porte.
 * Fermé, il le dit — et invite quand même à visiter : la page, elle, est
 * toujours ouverte.
 */
export function phraseDuSeuil(ouvert: OpenState, allumee: boolean, invitation = "Entre, je te fais découvrir."): string {
  if (ouvert && !ouvert.open) {
    // COURTE, ET SANS DEUX-POINTS : la ligne tient sous le titre, et rien ne
    // s'y coupe avant une ponctuation.
    return ouvert.next ? `On ouvre à ${ouvert.next.replace(/ /g, "\u00a0")}. Entre, je te fais visiter.` : "C'est fermé. Entre, je te fais visiter.";
  }
  // « LA SALLE EST ALLUMÉE » SEULEMENT QUAND L'ENSEIGNE L'EST : c'est la même
  // promesse, dite deux fois.
  return allumee ? "Entre, la salle est allumée." : invitation;
}
