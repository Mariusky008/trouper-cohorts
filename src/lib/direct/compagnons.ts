/**
 * 🐾 LE COMPAGNON — un animal qui vit dans l'univers (`docs/univers/compagnon.md`, lot C, 15 novembre 2026). Ce qui se
 * partage entre le serveur et l'écran : les espèces, et les boucles animées de chacune.
 *
 * Les compagnons sont les mêmes pour tous : un catalogue fabriqué une fois (`compagnon-essai-serveur.ts`), servi à
 * chacun, rien à payer par personne. D'abord l'essai C0 : le chat, ses sept boucles et celle du jeu, à juger par le
 * propriétaire sur son téléphone, à côté de sa figurine. Rien d'autre ne commence avant son verdict.
 */

export const ESPECES = [
  { cle: "chat", nom: "Le chat", en: "a CAT with soft orange and cream fur", nomParDefaut: "Moustache" },
  { cle: "chien", nom: "Le chien", en: "a small DOG (a puppy) with golden fur and floppy ears", nomParDefaut: "Pirate" },
  { cle: "perroquet", nom: "Le perroquet", en: "a small PARROT with bright green, yellow and red feathers", nomParDefaut: "Coco" },
] as const;
export type Espece = (typeof ESPECES)[number]["cle"];
export const especeValide = (x: unknown): x is Espece => ESPECES.some((e) => e.cle === x);

/**
 * Ses boucles : une POSE (une image, faite d'après son image de référence), puis le MOUVEMENT (quelques secondes de
 * vidéo qui partent de la pose et y reviennent : une boucle sans couture). `ou` : où elle se joue dans la scène.
 */
export const BOUCLES = [
  { cle: "assis", nom: "Assis (la queue, un clin d'œil)", ou: "sol", pose: "sitting upright, facing us, its tail curled around its paws", mouvement: "it sits calmly: its tail sways slowly, it blinks once, its ears twitch a little" },
  { cle: "marche", nom: "Il marche", ou: "sol", pose: "walking, seen from the side and facing left, in mid-stride", mouvement: "it walks in place: a smooth walking cycle seen from the side, without moving forward; its legs, head and tail move naturally" },
  { cle: "dort", nom: "Couché, il dort", ou: "sol", pose: "curled up in a ball, fast asleep, eyes closed", mouvement: "it sleeps: its belly rises and falls slowly as it breathes, one ear twitches once" },
  { cle: "genoux", nom: "Sur les genoux, il ronronne", ou: "genoux", pose: "lying in a loaf position (paws tucked under), eyes half closed, content", mouvement: "it purrs, very content: slow blinks, its body vibrates very gently, the tip of its tail curls" },
  { cle: "alerte", nom: "Alerte (les oreilles)", ou: "sol", pose: "sitting, ears straight up, head turned to its left, alert", mouvement: "it hears something: its ears prick up, it turns its head to look to the side, then looks back at us" },
  { cle: "saut", nom: "Un saut de joie", ou: "sol", pose: "sitting, happy, eyes bright", mouvement: "it jumps up joyfully, straight up in place, and lands back exactly where it was, then sits again" },
  { cle: "renifle", nom: "Il renifle", ou: "sol", pose: "standing on its four paws, neck stretched forward, nose sniffing", mouvement: "it sniffs the air curiously: its nose twitches, its head moves a little forward and back, its whiskers quiver" },
  { cle: "joue", nom: "Il joue (une pelote)", ou: "sol", pose: "crouching playfully, a small red yarn ball on the ground in front of it", mouvement: "it plays with the red yarn ball in front of it: it pats it with a paw, the ball rolls a little and comes back to the same place" },
] as const;
export type Boucle = (typeof BOUCLES)[number]["cle"];
export const boucleValide = (x: unknown): x is Boucle => BOUCLES.some((b) => b.cle === x);

/** L'état de l'essai, pour la page d'essais. */
export type BoucleVue = { cle: Boucle; nom: string; pose?: string; video?: string; enCours?: { depuis: string; progres?: number } };
export type EtatCompagnonEssai = {
  espece: Espece;
  /** son image de référence (détourée, signée) */
  reference?: string;
  boucles: BoucleVue[];
  /** pour l'aperçu « chez toi » : ton décor et ta figurine assise (signés), ta place */
  decor?: string;
  figurine?: string;
  place?: { x: number; y: number; echelle: number };
  /** les moteurs branchés : l'image (OpenAI), la vidéo (Google) */
  moteurs: { image: boolean; video: boolean };
};

/** 💶 Le coût, environ (novembre 2026) : l'image de référence, chaque pose, chaque boucle de quatre secondes. */
export const COUT = { reference: 0.2, pose: 0.1, boucle: 0.4 } as const;
