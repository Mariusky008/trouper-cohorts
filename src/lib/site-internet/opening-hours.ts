// Calcule « Ouvert maintenant / Fermé » depuis les horaires Google réels.
// HONNÊTETÉ : conservateur par principe — on ne renvoie un état QUE si on a pu
// analyser l'entrée du jour sans ambiguïté. Au moindre doute → null (aucun badge),
// jamais un « ouvert » potentiellement faux. Heure de référence : Europe/Paris.

export type OpenState =
  | { open: true; until: string } // ouvert, ferme à …
  | { open: false; next: string | null } // fermé (next = prochaine ouverture aujourd'hui, sinon null)
  | null;

type Horaire = { jours?: string; horaires?: string };

const DAYS_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const norm = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// « 19:00 » / « 19 h » / « 19 h 30 » à partir de minutes.
function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

// Parse un token horaire en minutes depuis minuit. Gère « 9 », « 9:30 », « 9h30 »,
// « 9 AM », « 2 PM », « 14:00 ». Renvoie null si non interprétable.
function parseTime(raw: string): number | null {
  const t = norm(raw).replace(/\s+/g, "");
  const m = t.match(/^(\d{1,2})(?:[:h.](\d{2}))?(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3];
  if (h > 23 || min > 59) return null;
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}

// Analyse la chaîne d'un jour (« 9 AM to 7 PM », « 09:00–12:00, 14:00–19:00 »,
// « Fermé », « Ouvert 24 h/24 ») en intervalles [début,fin] (minutes).
// Renvoie null si non analysable, [] si explicitement fermé.
function parseRanges(raw: string): Array<[number, number]> | null {
  const s = norm(raw);
  if (!s) return null;
  if (/(ferme|closed)/.test(s)) return [];
  if (/(24\s*\/\s*24|24\s*h|open\s*24|ouvert\s*24)/.test(s)) return [[0, 1440]];
  const out: Array<[number, number]> = [];
  // Sépare les plages multiples (virgule, « et », « & »).
  for (const part of s.split(/,|;|\bet\b|&/)) {
    const seg = part.trim();
    if (!seg) continue;
    const m = seg.split(/\s*(?:-|–|—|to|a|à|jusqu'?a)\s*/).filter(Boolean);
    if (m.length < 2) return null; // une borne seule = ambigu → on abandonne
    const a = parseTime(m[0]);
    const b = parseTime(m[m.length - 1]);
    if (a == null || b == null) return null;
    out.push([a, b === 0 ? 1440 : b]);
  }
  return out.length ? out : null;
}

/**
 * ═══ L'ENTRÉE DU JOUR, Y COMPRIS QUAND ELLE EST GROUPÉE ═══════════════════
 *
 * `horairesLisibles` REGROUPE LES JOURS CONSÉCUTIFS IDENTIQUES — c'est sa
 * raison d'être : « Lundi – Vendredi : 9 h – 19 h » plutôt que cinq lignes qui
 * répètent la même chose. Et la recherche du jour, ici, ne connaissait que les
 * lignes d'un seul jour : elle testait `startsWith("mardi")` sur une ligne qui
 * commence par « lundi ». Résultat, chez tout commerçant ayant saisi ses
 * horaires dans son espace pro, le badge « Ouvert » n'apparaissait QUE le
 * lundi — et disparaissait du mardi au vendredi sans que rien ne le dise.
 *
 * ON LIT DONC LES DEUX BORNES. Une ligne « A – B » couvre A, B et tout ce qui
 * les sépare dans l'ordre de lecture (lundi d'abord, dimanche en dernier), ce
 * qui est exactement la façon dont elle a été fabriquée.
 *
 * LE DOUTE RESTE UN REFUS. Un intitulé qu'on n'arrive pas à rattacher à un jour
 * ne rend rien : mieux vaut pas de badge qu'un « ouvert » faux, et c'est la
 * règle d'honnêteté qui gouverne tout ce fichier.
 */
const ORDRE_SEMAINE = [1, 2, 3, 4, 5, 6, 0]; // lundi → dimanche, comme on lit

/** L'indice JS (0 = dimanche) désigné par un intitulé, ou −1. */
function jourNomme(mot: string): number {
  const m = norm(mot);
  if (!m) return -1;
  for (let i = 0; i < 7; i++) {
    if (m.startsWith(DAYS_FR[i]) || m.startsWith(DAYS_EN[i])) return i;
  }
  return -1;
}

export function entreeDuJour(horaires: Horaire[], dayIdx: number): Horaire | null {
  if (!Array.isArray(horaires) || dayIdx < 0 || dayIdx > 6) return null;
  const rang = (j: number) => ORDRE_SEMAINE.indexOf(j);
  const cible = rang(dayIdx);
  for (const h of horaires) {
    const brut = String(h.jours || "");
    // Les deux bornes d'un éventuel groupe. Une ligne simple n'en a qu'une, et
    // le test se réduit alors à l'égalité — le comportement d'avant.
    const bornes = brut.split(/\s*(?:-|–|—|to|a|à)\s*/).map(jourNomme).filter((j) => j >= 0);
    if (!bornes.length) continue;
    const debut = rang(bornes[0]);
    const fin = rang(bornes[bornes.length - 1]);
    if (debut < 0 || fin < 0) continue;
    if (cible >= Math.min(debut, fin) && cible <= Math.max(debut, fin)) return h;
  }
  return null;
}

/**
 * CE QUE LA PAGE D'UN COMMERCE ÉCRIT SOUS SON NOM : « Aujourd'hui, 9 h – 19 h ».
 *
 * LA BOUTIQUE NE MONTRE QU'UNE LIGNE D'HORAIRES, et c'est délibéré : on vient
 * chez un commerce pour savoir s'il est ouvert MAINTENANT, pas pour consulter
 * son tableau de la semaine — celui-ci reste plus bas, au chapitre « Y aller ».
 * Rendre la semaine entière dans cette ligne l'aurait rendue illisible sur un
 * téléphone, ce qui est le seul écran où elle compte.
 *
 * VIDE SI ON NE SAIT PAS. La ligne disparaît alors de la page, au lieu d'y
 * afficher une approximation.
 */
export function ligneDuJour(horaires: Horaire[], now: Date = new Date()): string {
  if (!Array.isArray(horaires) || horaires.length === 0) return "";
  const wd = norm(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "long" }).format(now),
  );
  const dayIdx = DAYS_EN.indexOf(wd);
  if (dayIdx < 0) return "";
  const today = entreeDuJour(horaires, dayIdx);
  const texte = String(today?.horaires || "").trim();
  if (!texte) return "";
  if (/(ferme|closed)/.test(norm(texte))) return "Fermé aujourd’hui";
  return `Aujourd’hui, ${texte}`;
}

export function computeOpenState(horaires: Horaire[], now: Date = new Date()): OpenState {
  if (!Array.isArray(horaires) || horaires.length === 0) return null;

  // Jour + minutes actuels à Paris (sans dépendance externe).
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const wd = norm(parts.find((p) => p.type === "weekday")?.value || "");
  let hh = Number(parts.find((p) => p.type === "hour")?.value || "0");
  if (hh === 24) hh = 0;
  const mm = Number(parts.find((p) => p.type === "minute")?.value || "0");
  const nowMin = hh * 60 + mm;

  const dayIdx = DAYS_EN.indexOf(wd);
  if (dayIdx < 0) return null;

  const today = entreeDuJour(horaires, dayIdx);
  if (!today) return null; // on ne connaît pas le jour → pas de badge

  const ranges = parseRanges(today.horaires || "");
  if (ranges == null) return null; // illisible → pas de badge
  if (ranges.length === 0) return { open: false, next: null }; // fermé aujourd'hui

  for (const [a, b] of ranges) {
    if (nowMin >= a && nowMin < b) return { open: true, until: fmtMin(b) };
  }
  // Fermé pour l'instant : prochaine ouverture aujourd'hui, s'il en reste une.
  const upcoming = ranges.map(([a]) => a).filter((a) => a > nowMin).sort((x, y) => x - y);
  return { open: false, next: upcoming.length ? fmtMin(upcoming[0]) : null };
}
