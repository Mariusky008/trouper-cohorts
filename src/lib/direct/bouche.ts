/**
 * 🗣️ LA BOUCHE SUIT LA VOIX (25 novembre 2026, le propriétaire : « fais le » ; `docs/univers/decouvrir.md`, section 38.8) :
 * quand une figurine vivante dit un mot enregistré, sa tête « bouche ouverte » (`FigurineVivante.parle`) remplace sa tête
 * tant que la voix est forte. Le son est lu une fois en entier (décodé dans le téléphone) : son volume, vingt fois par
 * seconde, de 0 à 1 (1 : le plus fort du mot). Si le téléphone ne sait pas le lire, la bouche bat en rythme.
 *
 * Jamais de voix de synthèse : seulement la voix enregistrée, mesurée.
 *
 * FICHIER DE L'ÉCRAN (il se sert du son du navigateur ; `boucheOuverte` se teste partout).
 */

/** Vingt mesures par seconde. */
export const PAS_BOUCHE = 0.05;
/** Au-dessus de ce volume (le plus fort du mot : 1), la bouche s'ouvre. */
export const SEUIL_BOUCHE = 0.28;
/** Sans mesure : la bouche bat, autant de fois par seconde. */
const RYTHME = 6.5;

/** La bouche, à l'instant `t` (en secondes) : ouverte si la voix est forte ; sans mesure (`null`), en rythme. */
export function boucheOuverte(enveloppe: readonly number[] | null, t: number): boolean {
  if (!(t >= 0)) return false;
  if (!enveloppe) return Math.floor(t * RYTHME) % 2 === 0;
  const i = Math.floor(t / PAS_BOUCHE);
  // (deux mesures : la bouche ne clignote pas sur un souffle)
  const v = Math.max(enveloppe[i] ?? 0, ((enveloppe[i - 1] ?? 0) + (enveloppe[i] ?? 0)) / 2);
  return v >= SEUIL_BOUCHE;
}

/** Le volume d'un son décodé, vingt fois par seconde, de 0 à 1. */
export function enveloppeDe(donnees: Float32Array, frequence: number): number[] {
  const n = Math.max(1, Math.round(frequence * PAS_BOUCHE));
  const l: number[] = [];
  for (let i = 0; i < donnees.length; i += n) {
    let somme = 0;
    const fin = Math.min(donnees.length, i + n);
    for (let j = i; j < fin; j++) somme += donnees[j] * donnees[j];
    l.push(Math.sqrt(somme / Math.max(1, fin - i)));
  }
  const max = Math.max(...l, 1e-4);
  // (le silence reste fermé : un mot tout bas ne devient pas « fort »)
  return max < 0.01 ? l.map(() => 0) : l.map((v) => Math.round((v / max) * 100) / 100);
}

type Fenetre = Window & { webkitAudioContext?: typeof AudioContext };
const deja = new Map<string, Promise<number[] | null>>();

/**
 * Le volume d'un mot (son adresse, ou l'enregistrement lui-même), lu une fois : `null` si le téléphone ne sait pas le
 * lire (la bouche battra en rythme). `cle` : ce qui le désigne (sinon son adresse) — un mot n'est lu qu'une fois.
 */
export function enveloppeDuSon(son: string | Blob, cle?: string): Promise<number[] | null> {
  const k = cle ?? (typeof son === "string" ? son : "");
  const avant = k ? deja.get(k) : undefined;
  if (avant) return avant;
  const p = (async () => {
    try {
      const C = window.AudioContext ?? (window as Fenetre).webkitAudioContext;
      if (!C) return null;
      const octets = typeof son === "string" ? await fetch(son).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("son")))) : await son.arrayBuffer();
      const ctx = new C();
      try {
        const b = await ctx.decodeAudioData(octets);
        return enveloppeDe(b.getChannelData(0), b.sampleRate);
      } finally {
        void ctx.close().catch(() => undefined);
      }
    } catch {
      return null;
    }
  })();
  if (k) {
    deja.set(k, p);
    if (deja.size > 80) deja.delete(deja.keys().next().value as string);
  }
  return p;
}
