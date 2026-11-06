/**
 * 🎁 LES CADEAUX DE CLIKME, UN À CHAQUE ÉTAPE — 5 novembre 2026, le patron : « chaque achat chez un commerce fait
 * monter… je ne suis pas certain que ce soit la bonne manière de les faire progresser, ça ressemble trop à de l'achat
 * forcé ; je préférerais que ce soit des cadeaux » ; son choix : « ClikMe offre à chaque étape ».
 *
 * CE QUI PROGRESSE AVEC LES CADEAUX : les options de sa figurine (`OPTIONS_FIGURINE` : la n-ième s'ouvre au n-ième
 * cadeau), le niveau et le cadre de sa carte de personnage, et ses caractéristiques (chaque étape fait monter la
 * sienne). Aucun achat : les étapes se franchissent dans l'app (sa figurine, sa carte, un mème, une rencontre, une
 * réponse en duo…).
 *
 * CE QUI ÉTAIT DÉJÀ OUVERT LE RESTE : ses cadeaux comptent au moins ce que ses figurines lui avaient ouvert avant
 * (`acquis`, noté une fois — `etapes-serveur.ts`).
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */

export const ETAPES = [
  { cle: "figurine", emoji: "📸", titre: "Créer ta figurine", onglet: "figurine" },
  { cle: "carte", emoji: "🃏", titre: "Faire ta carte de personnage", onglet: "personnage" },
  { cle: "message", emoji: "🎭", titre: "Créer ton premier mème", onglet: "figurine" },
  { cle: "rencontre", emoji: "💬", titre: "Ta première rencontre", onglet: "rencontre" },
  // (6 novembre 2026 : « Dire 3 fois si c'est bien toi » laissait croire qu'il fallait refaire sa figurine)
  { cle: "questions", emoji: "❓", titre: "Répondre à 3 questions du jour", onglet: "personnage" },
  { cle: "ami", emoji: "👯", titre: "Un ami qui te rejoint", onglet: "rencontre" },
  { cle: "membre", emoji: "🎲", titre: "Rencontrer un membre", onglet: "rencontre" },
  { cle: "fidele", emoji: "📅", titre: "Revenir 3 jours différents", onglet: "figurine" },
  { cle: "souvenirs", emoji: "🎞️", titre: "5 épisodes", onglet: "rencontre" },
  // (7 novembre 2026, on resserre sur le mème : « Passer chez un commerçant partenaire » n'est plus une étape)
  { cle: "duo", emoji: "↩️", titre: "Répondre en duo à un mème", onglet: "memes" },
] as const;
export type CleEtape = (typeof ETAPES)[number]["cle"];
export const etapeValide = (x: unknown): x is CleEtape => ETAPES.some((e) => e.cle === x);

/** Ses cadeaux : les étapes franchies, et ce que ses figurines lui avaient déjà ouvert (le plus grand des deux). */
export type Cadeaux = { cadeaux: number; etapes: CleEtape[] };
export const CADEAUX_VIDES: Cadeaux = { cadeaux: 0, etapes: [] };

/** Sa prochaine étape (`null` : toutes franchies). */
export const prochaineEtape = (faites: readonly string[]) => ETAPES.find((e) => !faites.includes(e.cle)) ?? null;
