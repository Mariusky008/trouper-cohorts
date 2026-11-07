/**
 * 😂 ❤️ 🔥 LES RÉACTIONS SUR LES MÈMES — 7 novembre 2026 (le lot 2 : « aujourd'hui on voit seulement “vu combien de
 * fois”. C'est le retour qui donne envie de reposter »). Dans « Découvrir », sur le mème d'un habitant ou d'un
 * commerçant : une réaction par personne et par mème (il peut la changer, ou la retirer), avec un compte seulement — on
 * ne gonfle rien. Dans « Mes mèmes », il voit celles qu'ont reçues les siens.
 *
 * Rangées sans table (`reactions-memes-serveur.ts`) : un fichier vide par personne, dont le nom dit la réaction.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
export const REACS = [
  { cle: "rire", emoji: "😂", nom: "Mort de rire" },
  { cle: "coeur", emoji: "❤️", nom: "J’adore" },
  { cle: "feu", emoji: "🔥", nom: "Trop fort" },
] as const;
export type CleReac = (typeof REACS)[number]["cle"];
export const reacValide = (x: unknown): CleReac | null => (REACS.some((r) => r.cle === x) ? (x as CleReac) : null);

/** Les réactions d'un mème : combien de chaque, et la sienne. */
export type ReacMeme = { n: Record<CleReac, number>; moi?: CleReac };
export const REAC_VIDE: ReacMeme = { n: { rire: 0, coeur: 0, feu: 0 } };

/** Un mème qu'on peut faire réagir : celui d'un habitant (`<id>`), ou d'un commerçant (`c-<id>`). */
export const cleMemeValide = (x: unknown): string | null => (typeof x === "string" && /^(c-)?[a-z0-9]{12}$/.test(x) ? x : null);
