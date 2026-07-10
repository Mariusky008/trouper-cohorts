// ─────────────────────────────────────────────────────────────────────────────
// CONFIG MÉTIERS — DONNÉES DE DÉPART (pas du code en dur).
//
// Ce fichier est une CONFIGURATION éditable, séparée de la logique de rendu de
// la lettre. Pour ajouter/modifier un métier : ajoute/édite UNE ligne dans
// METIERS. Pour ajuster un profil (vocabulaire, contacts, avis, bénéfices) :
// édite l'objet correspondant dans PROFILES. Aucune logique à toucher — le
// composeur (letter-html.ts) lit ces données et remplit les {{tokens}}.
//
// Pourquoi des PROFILS et pas 10 configs : certains de ces métiers sont des
// professions de santé encadrées (psychologue, kiné…). Leur appliquer le
// playbook « commerce » (récolter des avis, WhatsApp, « capter des clients »)
// est déontologiquement risqué et fait paraître l'expéditeur amateur. Le profil
// protège de ça.
//   A = bien-être libre (marketing libre, « clients », avis en avant)
//   B = santé « praticité » (réglementé mais digital, « patients », avis DOUX)
//   C = santé encadrée (déontologie stricte, « patients », AUCUN avis, sobre)
//
// Règle pour un métier non listé : profession réglementée/ordre → C ; bien-être
// libre → A ; dans le doute, le plus sobre. Par défaut (secteur inconnu, ex.
// commerce classique) on retombe sur A (comportement générique existant).
// ─────────────────────────────────────────────────────────────────────────────

export type BlocAvis = "on" | "doux" | "off";
export type Profil = "A" | "B" | "C";

export type ProfileDef = {
  /** Terme désignant la clientèle : "clients" (A) ou "patients" (B, C). */
  terme_public: string;
  /** Boutons de la carte DEMAIN (max 3). Pas de WhatsApp en B/C. */
  contacts: string[];
  /** on = avis en avant ; doux = valoriser l'existant sans « faire monter » ;
   *  off = aucun volet avis/note (déontologie). */
  bloc_avis: BlocAvis;
  /** Sujet + verbe de l'accroche hero : « {sujet} {verbe} un {métier} à … ». */
  heroSujet: string; // "personnes" | "patients"
  heroVerbe: string; // "recherchent" | "cherchent"
  /** Sous-ligne sobre facultative (profil C : recentrer sur la findabilité). */
  heroSub?: string;
  /** Les 3 bénéfices (bullets). Rédigés au bon vocabulaire par profil. */
  benefices: [string, string, string];
  /** Carte « Demain » du recto : mini-aperçu de l'accueil intelligent. */
  accueilBubble: string; // 1re bulle de l'assistant
  accueilLine: string; // ligne aspirationnelle sous la conversation
  accueilSlot: string; // créneau illustratif « Réservé — … »
};

export const PROFILES: Record<Profil, ProfileDef> = {
  A: {
    terme_public: "clients",
    contacts: ["Prendre RDV", "Appeler", "WhatsApp"],
    bloc_avis: "on",
    heroSujet: "personnes",
    heroVerbe: "recherchent",
    benefices: [
      "La prise de rendez-vous en ligne — vos clients réservent quand ils y pensent, même le soir.",
      "Vos avis Google mis en avant — pour rassurer avant le premier contact.",
      "Une présentation claire de votre approche — pour attirer les personnes que vous aidez le mieux.",
    ],
    accueilBubble: "Bonjour ! Je réponds à vos questions et je prends votre rendez-vous.",
    accueilLine: "Accueille et réserve vos clients 24 h/24, même quand vous êtes occupé.",
    accueilSlot: "Sam. 15h30",
  },
  B: {
    terme_public: "patients",
    contacts: ["Prendre RDV", "Appeler", "Site web"],
    bloc_avis: "doux",
    heroSujet: "patients",
    heroVerbe: "cherchent",
    benefices: [
      "Une prise de rendez-vous simple, reliée à votre agenda (ou à Doctolib).",
      "Une présentation professionnelle de votre pratique — pour rassurer avant la première consultation.",
      "Des informations pratiques claires — accès, horaires, motifs de consultation.",
    ],
    accueilBubble: "Bonjour, je prends votre rendez-vous.",
    accueilLine: "Accueille et réserve vos patients, même quand vous êtes en séance.",
    accueilSlot: "Jeu. 9h00",
  },
  C: {
    terme_public: "patients",
    contacts: ["Prendre RDV", "Appeler", "Site web"],
    bloc_avis: "off",
    heroSujet: "patients",
    heroVerbe: "cherchent",
    heroSub: "Sans site, vous êtes difficile à identifier et à joindre.",
    benefices: [
      "Vos coordonnées et la prise de rendez-vous accessibles en un geste.",
      "Une présentation sobre et professionnelle de votre pratique, conforme à votre cadre.",
      "Des informations pratiques pour vos patients — accès, horaires, prise en charge.",
    ],
    accueilBubble: "Bonjour, je prends votre rendez-vous.",
    accueilLine: "Accueille et réserve vos patients, même quand vous êtes en séance.",
    accueilSlot: "Mar. 18h30",
  },
};

export type MetierEntry = {
  /** Racines (sans accents) pour reconnaître le métier depuis l'activité saisie. */
  match: string[];
  /** Libellé affiché (au singulier). Le genre est corrigeable par prospect. */
  label: string;
  /** Article par défaut ; corrigeable par prospect (un/une selon la personne). */
  article: string;
  profil: Profil;
};

// Les 10 métiers cibles (données — édite/ajoute librement).
export const METIERS: MetierEntry[] = [
  { match: ["sophrolog"], label: "sophrologue", article: "un", profil: "A" },
  { match: ["hypno"], label: "hypnothérapeute", article: "un", profil: "A" },
  { match: ["energetic"], label: "énergéticien", article: "un", profil: "A" },
  { match: ["naturopath"], label: "naturopathe", article: "un", profil: "A" },
  { match: ["reflexolog"], label: "réflexologue", article: "un", profil: "A" },
  { match: ["coach"], label: "coach", article: "un", profil: "A" },
  { match: ["dietetic"], label: "diététicien", article: "un", profil: "B" },
  { match: ["osteopath"], label: "ostéopathe", article: "un", profil: "B" },
  { match: ["psycholog"], label: "psychologue", article: "un", profil: "C" },
  { match: ["kinesither", "kine"], label: "kinésithérapeute", article: "un", profil: "C" },
];

// Secteur inconnu (ex. commerce classique) → A : on garde le comportement
// générique existant, on ne force pas un vocabulaire « patients » à tort.
export const DEFAULT_PROFIL: Profil = "A";

const norm = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function resolveMetier(activite: string): {
  entry: MetierEntry | null;
  profil: Profil;
  def: ProfileDef;
} {
  const a = norm(activite);
  const entry = METIERS.find((m) => m.match.some((k) => a.includes(k))) ?? null;
  const profil = entry?.profil ?? DEFAULT_PROFIL;
  return { entry, profil, def: PROFILES[profil] };
}
