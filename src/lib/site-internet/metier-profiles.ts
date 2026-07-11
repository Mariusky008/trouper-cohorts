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

export type Profil = "A" | "B" | "C";

export type ProfileDef = {
  /** Terme désignant la clientèle : "clients" (A) ou "patients" (B, C). */
  terme_public: string;
  /** Boutons de la carte DEMAIN (max 3). Pas de WhatsApp en B/C. */
  contacts: string[];
  // Deux notions DISTINCTES (constater ≠ quémander) — cf. déontologie santé :
  /** Afficher la note / les avis Google DÉJÀ existants (les constater). A, B. */
  avis_affichage: boolean;
  /** Proposer un système pour en RÉCOLTER davantage (les solliciter). A seul.
   *  En santé encadrée (B/C), terrain miné (secret pro, ordre) → jamais. */
  avis_sollicitation: boolean;
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
    avis_affichage: true,
    avis_sollicitation: true,
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
    avis_affichage: true,
    avis_sollicitation: false,
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
    avis_affichage: false,
    avis_sollicitation: false,
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

// Libellé de la pastille de confirmation de l'accueil (carte « Demain » + démo).
export type Confirmation = "reserve" | "rappel" | "devis" | "acompte";
// Cadre déontologique (au-delà du profil) : sobriété du ton / affichage.
export type Deontologie = "none" | "sante" | "droit";

export type MetierEntry = {
  /** Racines (sans accents) pour reconnaître le métier depuis l'activité saisie. */
  match: string[];
  /** Libellé affiché (au singulier). Le genre est corrigeable par prospect. */
  label: string;
  /** Article par défaut ; corrigeable par prospect (un/une selon la personne). */
  article: string;
  profil: Profil;
  /** Terme public : override du terme du profil (ex. conseiller B mais « clients »). */
  terme?: string;
  /** Type de confirmation de l'accueil (réserve / rappel / devis / acompte). */
  confirmation: Confirmation;
  /** Encart urgence 15/3114 — DÉCOUPLÉ du profil C : réservé au psychisme. */
  encartUrgence: boolean;
  /** Vraies urgences opérationnelles (fuite, panne…) → tri urgence/devis. */
  urgencesOps: boolean;
  /** Cadre déontologique : none / sante / droit. */
  deontologie: Deontologie;
};

// Les 38 métiers ciblés (données — édite/ajoute librement).
// Ordre : le PREMIER match gagne → mettre le plus spécifique avant le générique.
const M = (
  match: string[],
  label: string,
  profil: Profil,
  confirmation: Confirmation,
  opts?: { terme?: string; encartUrgence?: boolean; urgencesOps?: boolean; deontologie?: Deontologie; article?: string }
): MetierEntry => ({
  match,
  label,
  article: opts?.article ?? "un",
  profil,
  terme: opts?.terme,
  confirmation,
  encartUrgence: opts?.encartUrgence ?? false,
  urgencesOps: opts?.urgencesOps ?? false,
  deontologie: opts?.deontologie ?? "none",
});

export const METIERS: MetierEntry[] = [
  // ── Bien-être & soin non réglementé (profil A) ──
  M(["sophrolog"], "sophrologue", "A", "reserve"),
  M(["hypno"], "hypnothérapeute", "A", "reserve"),
  M(["energetic"], "énergéticien", "A", "reserve"),
  M(["naturopath"], "naturopathe", "A", "reserve"),
  M(["reflexolog"], "réflexologue", "A", "reserve"),
  M(["coach"], "coach", "A", "reserve"),
  M(["massage", "bien etre", "bien-etre", "praticien bien"], "praticien bien-être", "A", "reserve"),
  M(["institut de beaute", "institut beaute"], "institut de beauté", "A", "reserve"),
  M(["esthetic"], "esthéticienne", "A", "reserve", { article: "une" }),
  M(["ongulaire", "onglerie", "prothesiste ongul"], "prothésiste ongulaire", "A", "reserve"),
  M(["coiffeur", "coiffure", "coiffeuse"], "coiffeur", "A", "reserve"),
  M(["barbier", "barber"], "barbier", "A", "reserve"),
  M(["tatoueur", "tatouage", "tattoo"], "tatoueur", "A", "acompte"),
  M(["yoga", "pilates"], "professeur de yoga", "A", "reserve"),
  M(["danse", "cours de danse"], "professeur de danse", "A", "reserve"),
  // ── Santé « praticité » (profil B — Doctolib, avis doux) ──
  M(["osteopath"], "ostéopathe", "B", "reserve", { deontologie: "sante" }),
  M(["dietetic"], "diététicien", "B", "reserve", { deontologie: "sante" }),
  M(["podolog", "pedicure"], "pédicure-podologue", "B", "reserve", { deontologie: "sante" }),
  M(["acupunct"], "acupuncteur", "B", "reserve", { deontologie: "sante" }),
  M(["conseiller en gestion", "gestion de patrimoine", "conseiller patrimoine"], "conseiller en gestion", "B", "rappel", { terme: "clients" }),
  // ── Santé encadrée (profil C — sobre, pas d'avis, pas de WhatsApp) ──
  M(["psycholog"], "psychologue", "C", "reserve", { encartUrgence: true, deontologie: "sante" }),
  M(["kinesither", "kine"], "kinésithérapeute", "C", "reserve", { deontologie: "sante" }),
  M(["orthoptist"], "orthoptiste", "C", "reserve", { deontologie: "sante" }),
  // ── Artisans (profil A — mais rappel/devis, urgences pour certains) ──
  M(["plombier", "plomberie"], "plombier", "A", "rappel", { urgencesOps: true }),
  M(["electricien", "electricite"], "électricien", "A", "rappel", { urgencesOps: true }),
  M(["serrurier", "serrurerie"], "serrurier", "A", "rappel", { urgencesOps: true }),
  M(["chauffagiste", "chauffage"], "chauffagiste", "A", "devis", { urgencesOps: true }),
  M(["garagiste", "garage auto", "garage automobile"], "garagiste", "A", "rappel"),
  M(["carrossier", "carrosserie"], "carrossier", "A", "devis"),
  M(["paysagiste", "paysag"], "paysagiste", "A", "devis"),
  M(["ramoneur", "ramonage"], "ramoneur", "A", "rappel"),
  M(["macon", "carreleur", "platrier", "menuisier", "peintre en batiment", "artisan du batiment", "batiment"], "artisan du bâtiment", "A", "devis"),
  // ── Droit & chiffre (profil C — déontologie publicité stricte, pas d'avis) ──
  M(["avocat"], "avocat", "C", "rappel", { terme: "clients", deontologie: "droit" }),
  M(["notaire"], "notaire", "C", "rappel", { terme: "clients", deontologie: "droit" }),
  M(["huissier", "commissaire de justice"], "commissaire de justice", "C", "rappel", { terme: "clients", deontologie: "droit" }),
  M(["expert comptable", "expert-comptable", "comptable"], "expert-comptable", "C", "rappel", { terme: "clients", deontologie: "droit" }),
];

// Liste des libellés (pour la Découverte). Cochés par défaut = métiers « réserve »
// (bien-être, beauté, santé) dont l'accueil est prêt ; artisans/droit disponibles
// mais décochés (leur parcours accueil se peaufine).
export const METIER_LABELS: string[] = METIERS.map((m) => m.label);
export const METIER_DEFAULT_ON: string[] = METIERS.filter((m) => m.confirmation === "reserve").map((m) => m.label);

// Libellé de la pastille de confirmation (carte « Demain »).
export function confirmationBooked(confirmation: Confirmation, slot: string): string {
  switch (confirmation) {
    case "rappel":
      return "Rappel programmé";
    case "devis":
      return "Devis envoyé";
    case "acompte":
      return "Acompte reçu";
    default:
      return `Réservé — ${slot}`;
  }
}

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
