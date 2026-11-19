/**
 * 🌦️ LA MÉTÉO DU SALON (`docs/univers/salon-du-duo.md`, section 4.11 ; le lot S7) — LES RÈGLES, sans serveur.
 *
 * Le temps qu'il fait chez celui qui regarde (sa ville), à la fenêtre de la pièce seulement (dans les carreaux, jamais
 * sur les rideaux ni dedans) : ☀️ le soleil (un rayon qui entre, de la poussière qui danse dedans), ⛅ des nuages, 🌫️ du
 * brouillard, 🌧️ la pluie (fine, ou franche), ❄️ la neige, ⛈️ l'orage (un éclair, un grondement). La puce dit
 * « Pluie fine · 9° ». La source : Open-Meteo (`meteo-serveur.ts`), ses codes météo (WMO).
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */

/** Ce que la fenêtre sait montrer. */
export type CleMeteo = "soleil" | "nuages" | "brouillard" | "pluie" | "neige" | "orage";
/** Le temps qu'il fait : ce que la fenêtre montre, son nom, son emoji, la température (°C, arrondie), le jour ou la nuit. */
export type Meteo = { cle: CleMeteo; nom: string; emoji: string; t: number; jour: boolean; fine?: true };

/** Un code météo (WMO, celui d'Open-Meteo) : ce que la fenêtre montre, et son nom. */
export function meteoDuCode(code: number, t: number, jour: boolean): Meteo | null {
  if (!Number.isFinite(code) || !Number.isFinite(t)) return null;
  const deg = Math.round(t);
  const m = (cle: CleMeteo, nom: string, emoji: string, fine = false): Meteo => ({ cle, nom, emoji, t: deg, jour, ...(fine ? { fine: true as const } : {}) });
  if (code === 0) return jour ? m("soleil", "Grand soleil", "☀️") : m("nuages", "Nuit claire", "🌙");
  if (code === 1) return jour ? m("soleil", "Soleil", "🌤️") : m("nuages", "Nuit claire", "🌙");
  if (code === 2) return m("nuages", "Quelques nuages", "⛅");
  if (code === 3) return m("nuages", "Nuageux", "☁️");
  if (code === 45 || code === 48) return m("brouillard", "Brouillard", "🌫️");
  if (code >= 51 && code <= 57) return m("pluie", "Pluie fine", "🌧️", true);
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return m("pluie", "Pluie", "🌧️");
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return m("neige", "Neige", "❄️");
  if (code >= 95 && code <= 99) return m("orage", "Orage", "⛈️");
  return null;
}

/** La puce de la scène : « Pluie fine · 9° ». */
export const puceMeteo = (m: Pick<Meteo, "nom" | "t">) => `${m.nom} · ${m.t}°`;

/** Ce que dit la puce touchée (on tutoie). */
export const PHRASES_METEO: Record<CleMeteo, string> = {
  soleil: "Grand soleil chez toi : les rayons entrent dans la pièce",
  nuages: "Des nuages chez toi, rien de grave",
  brouillard: "Du brouillard chez toi : on ne voit plus le bout de la rue",
  pluie: "Il pleut chez toi : la pluie coule sur la vitre",
  neige: "Il neige chez toi",
  orage: "Orage chez toi : le chat n’aime pas trop ça",
};

/** Une ville (`ville_slug`) qu'on peut chercher. */
export const villeValide = (x: unknown): string | null => (typeof x === "string" && /^[a-z0-9][a-z0-9-]{1,59}$/.test(x) ? x : null);
/** La météo d'une ville se relit au plus une fois par heure. */
export const METEO_MS = 3600_000;
