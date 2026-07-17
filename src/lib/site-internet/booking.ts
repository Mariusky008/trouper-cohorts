// Génération des créneaux libres du mini-agenda. Tout est en HEURE LOCALE
// (Europe/Paris) représentée par des clés « YYYY-MM-DDTHH:MM » : les chaînes ISO
// se comparent lexicographiquement (donc chronologiquement), ce qui évite toute
// conversion UTC/DST. La réservation stocke exactement la même clé.

export type AvailWindow = { weekday: number; start_min: number; end_min: number };
export type DaySlots = { date: string; label: string; slots: Array<{ key: string; hhmm: string }> };

const pad = (n: number) => String(n).padStart(2, "0");
const MOIS = ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Parts « heure locale Paris » de l'instant donné.
function parisParts(now: Date): { y: number; mo: number; d: number; hh: number; mi: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value || "0");
  let hh = get("hour");
  if (hh === 24) hh = 0;
  return { y: get("year"), mo: get("month"), d: get("day"), hh, mi: get("minute") };
}

// Décale une clé locale de N minutes (arithmétique pure de mur d'horloge).
function shiftKey(y: number, mo: number, d: number, hh: number, mi: number, addMin: number): string {
  const x = new Date(Date.UTC(y, mo - 1, d, hh, mi) + addMin * 60000);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}T${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`;
}

// bufferMin : délai minimum avant un créneau réservable (défaut 120 min).
export function generateSlots(
  windows: AvailWindow[],
  slotMinutes: number,
  activeSlots: Set<string>,
  now: Date = new Date(),
  days = 14,
  bufferMin = 120
): DaySlots[] {
  const step = Math.max(5, Math.min(240, slotMinutes || 30));
  const byDay = new Map<number, AvailWindow>();
  for (const w of windows) {
    if (w && Number.isFinite(w.weekday) && w.end_min > w.start_min) byDay.set(w.weekday, w);
  }
  if (byDay.size === 0) return [];

  const { y, mo, d, hh, mi } = parisParts(now);
  const cutoff = shiftKey(y, mo, d, hh, mi, bufferMin); // rien avant maintenant + buffer
  const base = Date.UTC(y, mo - 1, d, 12); // ancre à midi UTC → date/jour stable malgré DST

  const out: DaySlots[] = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(base + i * 86400000);
    const wd = dt.getUTCDay();
    const w = byDay.get(wd);
    if (!w) continue;
    const Y = dt.getUTCFullYear();
    const M = dt.getUTCMonth() + 1;
    const D = dt.getUTCDate();
    const dateStr = `${Y}-${pad(M)}-${pad(D)}`;
    const slots: Array<{ key: string; hhmm: string }> = [];
    for (let m = w.start_min; m + step <= w.end_min; m += step) {
      const H = Math.floor(m / 60);
      const Mi = m % 60;
      const key = `${dateStr}T${pad(H)}:${pad(Mi)}`;
      if (key <= cutoff) continue;
      if (activeSlots.has(key)) continue;
      slots.push({ key, hhmm: Mi === 0 ? `${H} h` : `${H} h ${pad(Mi)}` });
    }
    if (slots.length) out.push({ date: dateStr, label: `${JOURS[wd]} ${D} ${MOIS[M - 1]}`, slots });
  }
  return out;
}

// Valide qu'une clé de créneau est bien du format attendu (défense côté serveur).
export function isValidSlotKey(k: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(k || ""));
}

// Libellé lisible d'un créneau (pour confirmations / listes pro).
export function slotLabel(key: string): string {
  if (!isValidSlotKey(key)) return key;
  const [date, time] = key.split("T");
  const [Y, M, D] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(Y, M - 1, D, 12)).getUTCDay();
  const [H, Mi] = time.split(":").map(Number);
  return `${JOURS[wd]} ${D} ${MOIS[M - 1]} à ${Mi === 0 ? `${H} h` : `${H} h ${pad(Mi)}`}`;
}
