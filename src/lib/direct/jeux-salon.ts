/**
 * 🙋🎯 LES JEUX DU SALON (26 novembre 2026, demandés par le propriétaire ; `docs/univers/decouvrir.md`, section 41 ;
 * maquette validée https://claude.ai/artifact/ABjUPW9VGQVqzdDDmPLFea).
 *
 * - **🙋 « Qui est d'accord ? »** (lot 2) : quelqu'un lance une phrase sur la vidéo ; tout le salon vote 👍 / 👎 pendant
 *   30 secondes, lui aussi ; une pancarte au-dessus de chaque figurine qui vote ; le résultat : les têtes de chaque camp,
 *   **sans chiffre ni pourcentage**.
 * - **🎯 « Je te mets au défi »** (lot 3).
 *
 * Les limites : un seul jeu à la fois dans un salon ; un jeu lancé par personne et par vidéo. Ce qui est écrit est relu
 * comme le reste du salon (pas dans une séance entre proches).
 *
 * Ce fichier : les règles, ce que le téléphone voit, les phrases. Le serveur : `jeux-salon-serveur.ts`.
 */
import { TEXTE_SALON_MAX } from "./salons-ouverts";

export const JEUX_SALON = {
  /** 🙋 Le temps de voter. */
  voteMs: 30_000,
  /** Le résultat reste à l'écran, puis la carte s'en va seule. */
  resultatMs: 12_000,
  /** La phrase : comme un message du salon. */
  texteMax: TEXTE_SALON_MAX,
} as const;

export type SorteJeu = "accord";
export type VoteJeu = "oui" | "non";
export const voteValide = (x: unknown): x is VoteJeu => x === "oui" || x === "non";

/** Un jeu du salon, tel que chacun le voit (jamais un compte : les `q`). */
export type JeuVu = {
  id: string;
  sorte: SorteJeu;
  /** Qui l'a lancé. */
  de: string;
  prenom: string;
  texte: string;
  debut: number;
  /** Les votes ferment à cette heure (ms, l'heure du serveur). */
  fin: number;
  /** Le vote de chacun (son `q`). */
  votes: Record<string, VoteJeu>;
};

/** Le camp le plus fourni (`egalite` : autant des deux côtés ; `null` : personne n'a voté). */
export function campGagnant(votes: Record<string, VoteJeu>): VoteJeu | "egalite" | null {
  const l = Object.values(votes);
  if (!l.length) return null;
  const oui = l.filter((v) => v === "oui").length;
  const non = l.length - oui;
  return oui === non ? "egalite" : oui > non ? "oui" : "non";
}

/** Où en est le jeu à `ms` : on vote, on voit le résultat, ou c'est fini (la carte s'en va). */
export function etapeDuJeu(j: Pick<JeuVu, "fin">, ms: number): "vote" | "resultat" | "fini" {
  return ms < j.fin ? "vote" : ms < j.fin + JEUX_SALON.resultatMs ? "resultat" : "fini";
}

/** Trois débuts de phrase, pour aller vite (on peut toujours écrire la sienne). */
export const DEBUTS_ACCORD = ["C’est impossible à refaire", "Je n’aurais jamais osé", "C’est truqué"] as const;

export const PHRASES_JEUX = {
  accord: "🙋 Qui est d’accord ?",
  accordChapo: "Lance une phrase sur la vidéo. Tout le salon vote, toi aussi.",
  accordPlace: "Ta phrase sur la vidéo",
  relue: "Relue avant de partir, comme ce qu’on écrit au salon.",
  relueSeance: "Entre proches : rien n’est relu.",
  lancer: "Lancer la question",
  demande: (prenom: string) => `${prenom} demande`,
  tuDemandes: "Tu demandes",
  daccord: "👍 D’accord",
  pasDaccord: "👎 Pas d’accord",
  aVote: "✓ C’est noté",
  resultat: "Le salon a parlé",
  personne: "Personne n’a voté cette fois.",
  egalite: "Le salon est partagé.",
  campOui: "👍 D’accord",
  campNon: "👎 Pas d’accord",
  unJeuDeja: "Un jeu est déjà en cours dans ce salon : attends qu’il se termine.",
  dejaLance: "Tu as déjà lancé un jeu sur cette vidéo. Attends la suivante.",
  fini: "Ce jeu est terminé.",
  annuler: "Annuler",
  pasDeVideo: "Il faut une vidéo à la télé pour lancer un jeu.",
} as const;
