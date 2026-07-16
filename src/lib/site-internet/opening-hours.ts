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
  const enName = DAYS_EN[dayIdx];
  const frName = DAYS_FR[dayIdx];

  // Retrouve l'entrée du jour (jours stockés en anglais OU en français).
  const today = horaires.find((h) => {
    const j = norm(h.jours || "");
    return j.startsWith(enName) || j.startsWith(frName) || j === enName || j === frName;
  });
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
