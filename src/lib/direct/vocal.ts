/**
 * 🎙️ LE TALKIE-WALKIE DU SALON (`docs/univers/salon-du-duo.md`, section 4.6 ; le lot S4) — LES RÈGLES, sans serveur.
 *
 * On garde 🎙️ appuyé et on parle (une minute au plus) ; au relâché, le vocal part tel quel : sa voix, sa durée, et SES
 * NIVEAUX — le volume du micro, mesuré toutes les 60 ms pendant l'enregistrement (de 0 à 1), gardés en une ligne de
 * signes (un signe hexadécimal par mesure, de « 0 » à « f » : moins d'1 Ko pour une minute). Ils dessinent la forme de
 * la voix dans la bulle et font parler la tête de la figurine à la lecture, sans décoder le son.
 *
 * Ce qu'il a dit est écrit après coup par le serveur (la transcription, sous la bulle), et sert au 📌 et à « Je le
 * range ? ». Chez l'autre : s'il est dans le salon, le vocal joue tout de suite (« elle m'entend en direct ») ; sinon,
 * le talkie se pose sur la table et clignote jusqu'à ce qu'il soit écouté (`ecoute`).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */

export const VOCAL = {
  /** Une minute au plus (secondes). */
  max: 60,
  /** Un toucher plus court n'est pas un vocal (secondes) : « Garde le micro appuyé… ». */
  min: 0.7,
  /** Une mesure du niveau toutes les 60 ms. */
  pasMs: 60,
  /** Glisser de tant de pixels vers la gauche efface le vocal. */
  glisse: 90,
  /** Le débit de l'enregistrement (une voix : léger). */
  debit: 48_000,
} as const;

/** Les niveaux, au plus (une minute, et un peu d'air). */
export const NIVEAUX_MAX = Math.ceil((VOCAL.max * 1000) / VOCAL.pasMs) + 30;

/** Des niveaux (0 à 1) en une ligne de signes (un par mesure, « 0 » à « f »). */
export function niveauxEnTexte(l: readonly number[]): string {
  return l
    .slice(0, NIVEAUX_MAX)
    .map((n) => Math.round(Math.min(1, Math.max(0, Number(n) || 0)) * 15).toString(16))
    .join("");
}

/** La ligne de signes, relue en niveaux (0 à 1). */
export function niveauxDe(t: string | undefined): number[] {
  return [...(t ?? "")].map((c) => (parseInt(c, 16) || 0) / 15);
}

/** Les niveaux envoyés, relus : une ligne de signes hexadécimaux, pas plus longue que la voix. `null` : rien d'utilisable. */
export function niveauxValides(x: unknown, duree: number): string | null {
  if (typeof x !== "string" || !x || !/^[0-9a-f]+$/.test(x)) return null;
  const n = Math.min(NIVEAUX_MAX, Math.ceil(((Number(duree) || 0) * 1000) / VOCAL.pasMs) + 30);
  return x.slice(0, n);
}

/** La durée d'un vocal du salon, relue : une minute au plus. `null` : trop court ou illisible. */
export function dureeVocal(x: unknown): number | null {
  const d = Number(x);
  return Number.isFinite(d) && d >= VOCAL.min && d <= VOCAL.max + 1.5 ? Math.round(Math.min(VOCAL.max, d) * 100) / 100 : null;
}

/**
 * Un débit qui ressemble à une voix (des syllabes, de petites pauses), toujours le même pour une même `graine` : pour un
 * vocal sans niveaux (fait depuis l'écran d'avant), ou pendant que l'autre parle dans son talkie.
 */
export function niveauFaux(t: number, graine = 1): number {
  const syll = Math.abs(Math.sin(t * 7.3 + graine) * Math.sin(t * 2.1 + graine * 1.7));
  const pause = Math.sin(t * 0.9 + graine) > 0.82 ? 0.15 : 1;
  const grain = 0.85 + 0.3 * Math.abs(Math.sin(t * 31.7 + graine * 3.1));
  return Math.min(1, (0.18 + 0.75 * syll) * pause * grain);
}
/** Les niveaux d'un vocal : les siens, sinon un débit de voix tiré de son identifiant. */
export function niveauxDuVocal(m: { id: string; duree: number; niveaux?: string }): number[] {
  const l = niveauxDe(m.niveaux);
  if (l.length) return l;
  const graine = [...m.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 97;
  const n = Math.max(1, Math.ceil((Math.max(VOCAL.min, Number(m.duree) || 0) * 1000) / VOCAL.pasMs));
  return Array.from({ length: n }, (_, i) => niveauFaux((i * VOCAL.pasMs) / 1000, graine));
}

/** La forme de la voix en `n` barres (la plus forte de chaque tranche), de 0 à 1. */
export function formeDeVoix(niveaux: readonly number[], n = 24): number[] {
  if (!niveaux.length) return Array.from({ length: n }, () => 0.2);
  return Array.from({ length: n }, (_, i) => {
    const a = Math.floor((i * niveaux.length) / n);
    const z = Math.max(a + 1, Math.floor(((i + 1) * niveaux.length) / n));
    let m = 0;
    for (let j = a; j < z; j++) m = Math.max(m, niveaux[j] ?? 0);
    return m;
  });
}

/** Le niveau à l'instant `t` (secondes) de la voix. */
export const niveauA = (niveaux: readonly number[], t: number) => niveaux[Math.min(niveaux.length - 1, Math.max(0, Math.floor((t * 1000) / VOCAL.pasMs)))] ?? 0;

/** « 0:04 », « 1:00 ». */
export function tempsDit(sec: number): string {
  const n = Math.max(0, Math.floor(sec));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

/** Les phrases de l'écran (on tutoie ; jamais le genre deviné). */
export const PHRASES_VOCAL = {
  astuce: "📻 Garde le micro appuyé et parle, comme un talkie-walkie. Glisse vers la gauche pour l’effacer.",
  glisse: "‹ glisse pour effacer",
  efface: "🗑️ Vocal effacé",
  micro: (prenom: string) => `Autorise le micro pour parler à ${prenom || "ton proche"}.`,
  pasDeMicro: "Ce téléphone ne sait pas enregistrer ici. Essaie avec un autre navigateur.",
  attend: (prenom: string) => `📻 Ton vocal attend ${prenom || "ton proche"} sur la table`,
  laisse: (prenom: string) => `📻 ${prenom || "Ton proche"} t’a laissé un vocal : touche le talkie sur la table`,
  ecoute: (prenom: string) => `📻 ${prenom || "Ton proche"} a écouté ton vocal`,
  parle: (prenom: string) => `📻 ${prenom || "Ton proche"} te parle…`,
  ecouterSien: (prenom: string) => `Écouter le vocal de ${prenom || "ton proche"}`,
  ecouterMien: "Écouter ton vocal",
  pasParti: "Ton vocal n’est pas parti : réessaie.",
  bouton: "Garder appuyé pour parler",
} as const;
