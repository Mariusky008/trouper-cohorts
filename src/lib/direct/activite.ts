/**
 * 🛎️ ACTIVITÉ (`docs/univers/discussions-video.md`, le lot A4) : la boîte qu'ouvre la cloche, en haut. Une ligne par
 * discussion (une vidéo × un cercle), la couleur du cercle, les réponses directes en haut ; « Nouveau » puis « Déjà vu » ;
 * « Tout marquer lu ». Un toucher ouvre la discussion.
 *
 * Partagé par le serveur et le téléphone.
 */
import type { CercleDiscussion } from "./discussion-video";

export const ACTIVITE = {
  /** un événement est gardé trente jours */
  gardeJours: 30,
  /** au plus cent suiveurs reçoivent la nouveauté d'une discussion (les autres la voient en l'ouvrant) */
  suiveursMax: 100,
  /** les lignes montrées */
  lignesMax: 40,
  /** les événements lus d'un coup (les plus récents) */
  evenementsMax: 400,
} as const;

/** Une sorte d'événement : ↩ une réponse à ce que j'ai dit, 💬 du nouveau dans une discussion que je suis. */
export type SorteEvenement = "r" | "n";

/** Une ligne d'Activité. */
export type LigneActivite = {
  cle: string;
  cercle: CercleDiscussion | "groupe";
  /** 👥 (lot A6) le groupe de cette discussion */
  groupe?: { id: string; nom: string };
  video: string;
  titre: string;
  /** le plus récent (ms) */
  le: number;
  /** du nouveau depuis que je l'ai lue */
  neuf: boolean;
  /** combien d'interventions nouvelles (de vrais fichiers, jamais un chiffre gardé à part) */
  nouveaux: number;
  /** les prénoms de ceux qui y ont parlé (les plus récents d'abord, trois au plus) */
  prenoms: string[];
  /** ↩ quelqu'un m'a répondu (le plus récent) */
  reponse?: { prenom: string; texte?: string };
  /** la dernière intervention */
  dernier?: { prenom: string; texte?: string };
};

export type ActiviteVue = { lignes: LigneActivite[]; nouveau: number };

export const PHRASES_ACTIVITE = {
  titre: "Activité",
  cloche: (n: number) => (n > 0 ? `Activité : du nouveau dans ${n} discussion${n > 1 ? "s" : ""}` : "Activité"),
  toutLu: "Tout marquer lu",
  nouveau: "Nouveau",
  dejaVu: "Déjà vu",
  filtres: { tout: "Tout", reponses: "↩ Réponses", proches: "👯 Proches", groupe: "👥 Groupes", tous: "🌍 Tous" },
  aRepondu: (p: string) => `↩ ${p} t’a répondu`,
  ontReagi: (l: string[]) => `${listePrenoms(l)} ${l.length > 1 ? "ont" : "a"} réagi`,
  ontEcrit: (l: string[]) => `${listePrenoms(l)} ${l.length > 1 ? "ont" : "a"} écrit`,
  nouveaux: (n: number) => `${n} nouveau${n > 1 ? "x" : ""}`,
  vocal: "🎙️ un mot dit",
  /** 📱 (lot A5) la vague sur le téléphone */
  vagueGroupe: (nom: string, n: number) => `👥 ${nom} · ${n} nouveau${n > 1 ? "x" : ""} mot${n > 1 ? "s" : ""}`,
  vague: (n: number, titre: string) => `💬 ${n} nouveau${n > 1 ? "x" : ""} mot${n > 1 ? "s" : ""} sur « ${titre} »`,
  cercle: { proches: "👯 Proches", tous: "🌍 Tous", groupe: "👥" } as Record<CercleDiscussion | "groupe", string>,
  vide: "Rien de neuf pour l’instant. Quand on te répond, ou qu’on parle d’une vidéo que tu suis, c’est ici.",
  videFiltre: "Rien ici pour l’instant.",
  chezToi: "🏠 Pendant ton absence, chez toi",
  chezToiSous: "Qui a frappé, ce qu’on t’a laissé",
  erreur: "Ton activité n’a pas pu s’ouvrir. Réessaie dans un instant.",
};

function listePrenoms(l: string[]): string {
  if (l.length <= 1) return l[0] ?? "Quelqu’un";
  return `${l.slice(0, -1).join(", ")} et ${l[l.length - 1]}`;
}

/** L'heure d'une ligne : « 14 h 20 » aujourd'hui, « Hier », sinon le jour. */
export function quandActivite(le: number, maintenant = Date.now()): string {
  const d = new Date(le);
  const jour = (x: Date) => x.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const auj = new Date(maintenant);
  if (jour(d) === jour(auj)) return d.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
  if (jour(d) === jour(new Date(maintenant - 24 * 3600_000))) return "Hier";
  return d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short" });
}
