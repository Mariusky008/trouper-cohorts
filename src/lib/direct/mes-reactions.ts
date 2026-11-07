/**
 * ⚡ SES RÉACTIONS — 7 novembre 2026 (le patron : « la figurine pourrait remplacer les emojis et les GIF classiques : sa
 * propre bibliothèque de réactions — sa figurine qui explose de rire, qui dit “Sérieusement ?”, qui applaudit, qui est
 * choquée, qui envoie un bisou, qui fait une grimace ; une rangée “💥 Gags” : le prout avec une barre d'intensité,
 * l'éternuement, elle s'endort, le hoquet. Au lieu de chercher un GIF générique, il utilise sa propre tête »).
 *
 *   · LES RÉACTIONS sont des stickers : une image carrée, SA figurine détourée (sans le fond) dans la pose, et un mot
 *     façon BD pour certaines. Un toucher : la feuille de partage du téléphone (WhatsApp…). Rien de ClikMe dessus.
 *   · LES GAGS sont de petites vidéos (2 à 5 secondes) avec des bruitages fabriqués dans le téléphone (jamais une voix),
 *     et « clikme.fr », discret, dans un coin.
 *   · Chaque pose est faite UNE fois par le moteur d'image, la première fois qu'il la touche (environ une minute), à
 *     partir de sa figurine : même visage, même cadre, fond transparent (`mes-reactions-serveur.ts`). En attendant, ou si le
 *     moteur n'est pas là : sa figurine de tous les jours, avec l'emoji.
 *
 * Osé, jamais vulgaire : le prout est suggéré (un bruit, un nuage, la gêne) — rien de sexuel, rien de dégoûtant à l'image.
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */

/** Une réaction (un sticker) : sa clé, son emoji, son nom, le mot écrit dessus (facultatif). */
export const REACTIONS = [
  { cle: "mdr", emoji: "😂", nom: "Mort de rire", mot: "MDR" },
  { cle: "serieux", emoji: "🤨", nom: "Sérieusement ?", mot: "Sérieusement ?" },
  { cle: "bravo", emoji: "👏", nom: "Bravo", mot: "Bravo !" },
  { cle: "choque", emoji: "😱", nom: "Choqué", mot: "Quoi ?!" },
  { cle: "bisou", emoji: "😘", nom: "Bisou", mot: "Bisous" },
  { cle: "grimace", emoji: "😜", nom: "Grimace", mot: "" },
  { cle: "amour", emoji: "😍", nom: "Amour", mot: "" },
  { cle: "pouce", emoji: "👍", nom: "Top", mot: "Top !" },
] as const;
export type CleReaction = (typeof REACTIONS)[number]["cle"];

/** Les gags : leur clé, leur emoji, leur nom, et le visage qu'il leur faut (fait par le moteur, comme une réaction). */
export const GAGS = [
  { cle: "prout", emoji: "💨", nom: "Le prout", visage: "gene" },
  { cle: "eternue", emoji: "🤧", nom: "L’éternuement", visage: "eternue" },
  { cle: "dort", emoji: "😴", nom: "Elle s’endort", visage: "dort" },
  { cle: "hoquet", emoji: "🫢", nom: "Le hoquet", visage: "hoquet" },
] as const;
export type CleGag = (typeof GAGS)[number]["cle"];

/** Les poses que le moteur fait : les réactions, les visages des gags, et sa figurine seule (détourée, pour les gags). */
export const POSES = [...REACTIONS.map((r) => r.cle), "gene", "eternue", "dort", "hoquet", "seule"] as const;
export type ClePose = (typeof POSES)[number];
export const poseValide = (x: unknown): ClePose | null => (POSES.includes(x as ClePose) ? (x as ClePose) : null);
export const gagValide = (x: unknown): CleGag | null => (GAGS.some((g) => g.cle === x) ? (x as CleGag) : null);

/** Le prout : son intensité, de 1 (« pfft ») à 5 (interminable) — elle fait sa durée, son nuage et la gêne. */
export const INTENSITES = ["Pfft", "Discret", "Franc", "Sonore", "Interminable"] as const;
export const dureeProut = (i: number) => 0.3 + 0.55 * (Math.min(5, Math.max(1, Math.round(i))) - 1);

/** Ce qu'il a, ce que le moteur sait faire : ses poses faites (adresses signées). */
export type MesReactions = { poses: Partial<Record<ClePose, string>>; moteur: boolean; neutre: string; enCours: ClePose[] };
