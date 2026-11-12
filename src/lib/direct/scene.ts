/**
 * 🎬 UNE SCÈNE — chantier « Univers », lot 1, le socle (`docs/univers/feuille-de-route.md`, section 4.4).
 *
 * Tout ce qui se joue dans ClikMe se décrit de la même façon : un décor (l'univers de quelqu'un, dans une version),
 * des acteurs (des figurines, chacune dans une version, à une place, dans une pose, avec un visage), et le moment de la
 * journée. Un message, une visite, un mème, un vœu, plus tard un appel : c'est toujours ça. Le téléphone dessine la
 * scène en direct ; le moteur vidéo (`meme.ts`) en fait une vidéo à envoyer.
 *
 * LA RENCONTRE DE DEUX FIGURINES (verdict du lot 0, 12 novembre 2026) : posées côte à côte dans le téléphone, elles
 * avaient l'air collées ; sa scène est donc GÉNÉRÉE UNE FOIS par le moteur (`rendu`, signé), gardée, puis animée
 * légèrement (les bulles, la voix, la lumière).
 *
 * Chacun se désigne par sa clé de profil (16 caractères), jamais par son identifiant.
 *
 * FICHIER PUR : il se vérifie sans téléphone (`scripts/verifier-fiches.mjs`).
 */
import { referenceValide, type Reference } from "./perso";

export const MOMENTS = ["matin", "midi", "soir", "nuit"] as const;
export type Moment = (typeof MOMENTS)[number];
export const POSES_SCENE = ["assise", "debout"] as const;
export type PoseScene = (typeof POSES_SCENE)[number];
/** Au plus quatre figurines dans une scène (deux, d'abord : une conversation). */
export const ACTEURS_MAX = 4;

export type ActeurScene = { de: string; version: number; place: string; pose: PoseScene; visage: string | null };
export type Scene = { decor: { de: string; version: number }; acteurs: ActeurScene[]; moment: Moment; rendu?: Reference };

const cle = (x: unknown) => (typeof x === "string" && /^[a-f0-9]{16}$/.test(x) ? x : "");
const version = (x: unknown) => (typeof x === "number" && Number.isInteger(x) && x >= 0 ? x : null);
const ident = (x: unknown) => (typeof x === "string" && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(x) ? x : "");

/** Le moment de la journée, à l'heure du téléphone (la lumière de la scène le suit). */
export function momentDe(heure: number): Moment {
  if (heure >= 6 && heure < 11) return "matin";
  if (heure >= 11 && heure < 17) return "midi";
  if (heure >= 17 && heure < 22) return "soir";
  return "nuit";
}

/** La scène vérifiée ; `null` si elle ne tient pas (pas de décor, aucun acteur, deux acteurs à la même place…). */
export function sceneValide(x: unknown): Scene | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const d = (o.decor ?? {}) as Record<string, unknown>;
  const decor = { de: cle(d.de), version: version(d.version) };
  if (!decor.de || decor.version === null) return null;
  const acteurs: ActeurScene[] = [];
  for (const a of Array.isArray(o.acteurs) ? o.acteurs : []) {
    const q = (a ?? {}) as Record<string, unknown>;
    const de = cle(q.de);
    const v = version(q.version);
    const place = ident(q.place);
    if (!de || v === null || !place) return null;
    // (une figurine ne joue pas deux fois ; deux figurines ne s'assoient pas au même endroit)
    if (acteurs.some((x) => x.de === de || x.place === place)) return null;
    acteurs.push({ de, version: v, place, pose: POSES_SCENE.find((p) => p === q.pose) ?? "assise", visage: ident(q.visage) || null });
  }
  if (!acteurs.length || acteurs.length > ACTEURS_MAX) return null;
  const rendu = referenceValide(o.rendu);
  return { decor: { de: decor.de, version: decor.version }, acteurs, moment: MOMENTS.find((m) => m === o.moment) ?? "midi", ...(rendu ? { rendu } : {}) };
}

/** Qui joue dans la scène (le décor compris) : pour savoir qui doit l'avoir permise. */
export const quiJoue = (sc: Scene) => [...new Set([sc.decor.de, ...sc.acteurs.map((a) => a.de)])];
