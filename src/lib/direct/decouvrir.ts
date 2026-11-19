/**
 * 🧭 DÉCOUVRIR — LE LOT D0 (`docs/univers/decouvrir.md`, sections 3, 4.1 et 9) : les passions de chacun, et la
 * sélection YouTube de chaque nuit, la même pour tout le monde par thème (une pour les 15-17 ans).
 *
 * - « Tes passions » : de 3 à 5 parmi les douze thèmes (`<habitant>/passions.json` = { passions, poids, le }) ; le salon
 *   des jeunes parents est réservé aux adultes. Les poids montent et baissent avec ce qu'on regarde (lot D1).
 * - La sélection du jour (`decouvrir/selection/<jour>/<thème>[-jeunes].json`) : chaque nuit, trois recherches par thème
 *   (`search.list` : en France, en français, lisibles ailleurs, publiées dans les sept derniers jours, `safeSearch=strict`
 *   pour les 15-17 ans), puis `videos.list` pour la durée et le droit d'être lue ailleurs ; une quinzaine de vidéos par
 *   thème, entre 30 secondes et 20 minutes ; rien d'alcoolisé.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */

export const IDS_THEMES = ["foot", "series", "musique", "jeux", "tele", "humour", "cuisine", "mode", "manga", "animaux", "revisions", "parents"] as const;
export type IdTheme = (typeof IDS_THEMES)[number];

export type ThemeDecouvrir = {
  id: IdTheme;
  e: string;
  nom: string;
  /** (dans une phrase : « foot · cuisine ») */
  court: string;
  /** réservé aux adultes (le salon des jeunes parents) */
  adultes?: true;
  /** les recherches de la nuit (YouTube, en français) */
  recherches: readonly string[];
};

/** Les douze thèmes (le propriétaire, 17 novembre 2026). */
export const THEMES_DECOUVRIR: readonly ThemeDecouvrir[] = [
  { id: "foot", e: "⚽", nom: "Foot et sport", court: "foot", recherches: ["but football", "résumé match ligue 1", "meilleurs moments sport"] },
  { id: "series", e: "🎬", nom: "Séries et films", court: "séries", recherches: ["bande annonce série vf", "bande annonce film vf", "critique série"] },
  { id: "musique", e: "🎵", nom: "Musique", court: "musique", recherches: ["clip officiel", "live session musique", "nouveau son français"] },
  { id: "jeux", e: "🎮", nom: "Jeux vidéo", court: "jeux vidéo", recherches: ["jeu vidéo gameplay", "speedrun", "actualité jeux vidéo"] },
  { id: "tele", e: "📺", nom: "Télé-réalité et people", court: "télé-réalité", recherches: ["télé réalité meilleurs moments", "actualité people", "émission télé moments cultes"] },
  { id: "humour", e: "😂", nom: "Humour", court: "humour", recherches: ["sketch humour", "stand up français", "caméra cachée"] },
  { id: "cuisine", e: "🍳", nom: "Cuisine", court: "cuisine", recherches: ["recette facile", "recette rapide", "pâtisserie maison"] },
  { id: "mode", e: "👗", nom: "Mode et beauté", court: "mode", recherches: ["tendances mode", "tuto maquillage", "idées tenues"] },
  { id: "manga", e: "🍥", nom: "Manga et anime", court: "manga", recherches: ["anime bande annonce vostfr", "actualité manga", "anime meilleurs moments"] },
  { id: "animaux", e: "🐾", nom: "Animaux", court: "animaux", recherches: ["chat drôle", "chien drôle", "animaux mignons"] },
  { id: "revisions", e: "📚", nom: "Révisions et études", court: "révisions", recherches: ["révision bac", "méthode de travail étudiant", "astuce mémoriser cours"] },
  { id: "parents", e: "👶", nom: "Jeunes parents", court: "jeunes parents", adultes: true, recherches: ["astuces jeunes parents", "conseils parentalité", "bébé drôle"] },
];

export const themeDe = (id: unknown): ThemeDecouvrir | undefined => THEMES_DECOUVRIR.find((t) => t.id === id);
/** Les thèmes qu'il peut choisir : sans le salon des jeunes parents tant qu'il n'a pas dit ses 18 ans. */
export const themesPour = (adulte: boolean | null): ThemeDecouvrir[] => THEMES_DECOUVRIR.filter((t) => !(t.adultes && adulte !== true));

export const PASSIONS_MIN = 3;
export const PASSIONS_MAX = 5;
export type Passions = { passions: IdTheme[]; poids: Record<string, number>; le: string };

/** Ses passions choisies (de 3 à 5, sans double, parmi celles qu'il peut choisir) — sinon ce qui ne va pas. */
export function passionsValides(ids: unknown, adulte: boolean | null): { passions: IdTheme[] } | { error: string } {
  if (!Array.isArray(ids)) return { error: "Choisis tes passions." };
  const permis = new Set(themesPour(adulte).map((t) => t.id));
  const l = [...new Set(ids.map(String))];
  if (l.some((id) => !themeDe(id))) return { error: "Cette passion n’existe pas." };
  if (l.some((id) => !permis.has(id as IdTheme))) return { error: "Le salon des jeunes parents est réservé aux adultes." };
  if (l.length < PASSIONS_MIN) return { error: `Choisis-en au moins ${PASSIONS_MIN}.` };
  if (l.length > PASSIONS_MAX) return { error: `${PASSIONS_MAX} au plus.` };
  return { passions: l as IdTheme[] };
}

// ─── la sélection du jour ──────────────────────────────────────────────────────────────────────────
export type VideoDuJour = {
  /** l'identifiant YouTube (11 signes) */
  id: string;
  titre: string;
  chaine: string;
  /** en secondes */
  duree: number;
  publiee: string;
  /** ajoutée à la main par l'administrateur */
  ajoutee?: true;
};
export type SelectionDuJour = { jour: string; theme: IdTheme; jeunes: boolean; videos: VideoDuJour[]; le: string; erreur?: string };

export const DUREE_MIN = 30;
export const DUREE_MAX = 20 * 60;
export const VIDEOS_PAR_THEME = 15;
/** (publiées dans les sept derniers jours) */
export const FRAICHEUR_JOURS = 7;

/** Rien d'alcoolisé, nulle part (`decouvrir.md`, section 2) : un titre qui en parle n'entre pas dans la sélection. */
export const MOTS_EXCLUS = /\b(alcool|alcoolis\w*|bi[èe]res?|vins?|cocktails?|whisky|vodka|rhum|ap[ée]ro|ivres?|cuite|open[- ]?bar|d[ée]gustation)\b/i;

/** Une durée YouTube (« PT1H2M30S ») en secondes ; 0 si elle ne se lit pas. */
export function dureeIso(d: unknown): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(String(d ?? ""));
  if (!m) return 0;
  return (Number(m[1]) || 0) * 86400 + (Number(m[2]) || 0) * 3600 + (Number(m[3]) || 0) * 60 + (Number(m[4]) || 0);
}

export const PHRASES_PASSIONS = {
  sur: "Découvrir",
  titre: "Tes passions",
  intro: "Choisis-en de 3 à 5. Elles font ta télé du jour, et les salons où l’on parle de ce que tu aimes.",
  compte: (n: number) => `${n} sur ${PASSIONS_MAX}`,
  go: "C’est parti",
  trop: `${PASSIONS_MAX} au plus : enlève-en une d’abord`,
  potins: "🗞️ Les potins de ta ville : pour tout le monde, en plus.",
  gardees: "C’est noté : ta télé du jour suivra tes passions.",
} as const;
