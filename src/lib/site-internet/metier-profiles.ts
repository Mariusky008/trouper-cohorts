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

// MOTEUR : ce que le pro veut vraiment (l'ANGLE de la lettre). Indépendant de la
// déontologie (ce que le message a le DROIT de dire). Cf. MOTEURS_ET_DEONTOLOGIE.md.
//   M1 acquisition (plus de clients) · M2 temps (arrêter de répondre 10× aux
//   mêmes questions) · M3 cabinet (moins d'interruptions) · M4 confiance
//   (rassurer avant le 1er rendez-vous). Sur le papier c'est une HYPOTHÈSE ; le
//   configurateur la corrige après le scan.
export type Moteur = "M1_acquisition" | "M2_temps" | "M3_cabinet" | "M4_confiance";
// SECTEUR : ne change QUE le vocabulaire et la ligne de constat (pas la structure).
export type Secteur = "urgence" | "soin" | "emotion" | "flux";

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
  /** Moteur = l'angle de la lettre (hypothèse, corrigée par le configurateur). */
  moteur: Moteur;
  /** Secteur = le vocabulaire concret (n'affecte pas la structure du recto). */
  secteur: Secteur;
};

// Les métiers ciblés (données — édite/ajoute librement).
// Ordre : le PREMIER match gagne → mettre le plus spécifique avant le générique.
// Moteur par défaut = dérivé de la déontologie (hypothèse raisonnable sur le
// papier) : droit → confiance, santé → cabinet, sinon acquisition. Override
// explicite pour les artisans établis (M2) via opts.moteur.
const defaultMoteur = (deontologie: Deontologie): Moteur =>
  deontologie === "droit" ? "M4_confiance" : deontologie === "sante" ? "M3_cabinet" : "M1_acquisition";

const M = (
  match: string[],
  label: string,
  profil: Profil,
  confirmation: Confirmation,
  opts?: {
    terme?: string; encartUrgence?: boolean; urgencesOps?: boolean; deontologie?: Deontologie;
    article?: string; moteur?: Moteur; secteur?: Secteur;
  }
): MetierEntry => {
  const deontologie = opts?.deontologie ?? "none";
  return {
    match,
    label,
    article: opts?.article ?? "un",
    profil,
    terme: opts?.terme,
    confirmation,
    encartUrgence: opts?.encartUrgence ?? false,
    urgencesOps: opts?.urgencesOps ?? false,
    deontologie,
    moteur: opts?.moteur ?? defaultMoteur(deontologie),
    secteur: opts?.secteur ?? (deontologie === "none" ? "flux" : "soin"),
  };
};

export const METIERS: MetierEntry[] = [
  // ── Bien-être & soin non réglementé (profil A) — moteur M1, secteur « soin »
  //    (démarche intime) pour les thérapies, « flux » (preuve sociale) pour la beauté.
  M(["sophrolog"], "sophrologue", "A", "reserve", { secteur: "soin" }),
  M(["hypno"], "hypnothérapeute", "A", "reserve", { secteur: "soin" }),
  M(["energetic"], "énergéticien", "A", "reserve", { secteur: "soin" }),
  M(["naturopath"], "naturopathe", "A", "reserve", { secteur: "soin" }),
  M(["reflexolog"], "réflexologue", "A", "reserve", { secteur: "soin" }),
  // coach SPORTIF (flux, preuve sociale) AVANT le coach générique de vie (soin).
  M(["coach sportif", "coaching sportif", "personal trainer"], "coach sportif", "A", "reserve", { secteur: "flux" }),
  M(["coach"], "coach", "A", "reserve", { secteur: "soin" }),
  // ── Beauté, bien-être marchand & fitness (profil A, secteur « flux ») ──
  //    « salon de massage » (commerce) AVANT « praticien bien-être » (soin).
  M(["salon de massage", "spa massage"], "salon de massage", "A", "reserve", { secteur: "flux" }),
  M(["massage", "bien etre", "bien-etre", "praticien bien"], "praticien bien-être", "A", "reserve", { secteur: "soin" }),
  M(["spa", "hammam", "balneo"], "spa", "A", "reserve", { secteur: "flux" }),
  M(["institut de beaute", "institut beaute"], "institut de beauté", "A", "reserve", { secteur: "flux" }),
  // « centre esthétique auto » AVANT « esthéticienne » (les deux contiennent « esthetic »).
  M(["centre esthetique auto", "esthetique automobile", "detailing auto"], "centre esthétique automobile", "A", "reserve", { secteur: "flux" }),
  M(["esthetic"], "esthéticienne", "A", "reserve", { article: "une", secteur: "flux" }),
  M(["maquilleu", "make up", "make-up"], "maquilleuse", "A", "reserve", { article: "une", secteur: "flux" }),
  M(["salon de bronzage", "bronzage"], "salon de bronzage", "A", "reserve", { secteur: "flux" }),
  M(["ongulaire", "onglerie", "prothesiste ongul"], "prothésiste ongulaire", "A", "reserve", { secteur: "flux" }),
  // « coiffeur à domicile » AVANT « coiffeur » générique.
  M(["coiffeur a domicile", "coiffure a domicile"], "coiffeur à domicile", "A", "reserve", { secteur: "flux" }),
  M(["coiffeur", "coiffure", "coiffeuse"], "coiffeur", "A", "reserve", { secteur: "flux" }),
  M(["barbier", "barber"], "barbier", "A", "reserve", { secteur: "flux" }),
  M(["tatoueur", "tatouage", "tattoo"], "tatoueur", "A", "acompte", { secteur: "emotion" }),
  M(["yoga", "pilates"], "professeur de yoga", "A", "reserve", { secteur: "flux" }),
  M(["danse", "cours de danse"], "professeur de danse", "A", "reserve", { secteur: "flux" }),
  M(["salle de sport", "salle de fitness", "fitness", "musculation"], "salle de sport", "A", "reserve", { secteur: "flux" }),
  // ── Mariage & événementiel (profil A, secteur « emotion » : projet chargé d'affect) ──
  M(["robe de mariee", "robes de mariee", "mariee boutique"], "boutique de robes de mariée", "A", "acompte", { secteur: "emotion" }),
  M(["photographe de mariage", "photographe mariage", "photographe evenement"], "photographe de mariage", "A", "acompte", { secteur: "emotion" }),
  M(["organisateur de mariage", "wedding planner", "organisation mariage"], "organisateur de mariage", "A", "acompte", { secteur: "emotion" }),
  M(["traiteur"], "traiteur événementiel", "A", "devis", { secteur: "emotion" }),
  // ── Commerces de bouche & boutiques (profil A, secteur « flux ») ──
  M(["caviste", "cave a vin"], "caviste", "A", "reserve", { secteur: "flux" }),
  M(["chocolatier", "chocolaterie"], "chocolatier", "A", "reserve", { secteur: "flux" }),
  M(["epicerie fine", "epicerie"], "épicerie fine", "A", "reserve", { secteur: "flux" }),
  M(["magasin de decoration", "decoration interieur", "deco maison"], "magasin de décoration", "A", "reserve", { secteur: "flux" }),
  M(["bijouterie", "bijoutier", "joaillerie"], "bijouterie", "A", "reserve", { secteur: "flux" }),
  M(["fleuriste", "fleurs"], "fleuriste", "A", "reserve", { secteur: "flux" }),
  // ── Animaux (profil A) ──
  M(["toiletteur", "toilettage"], "toiletteur", "A", "reserve", { secteur: "flux" }),
  M(["pension canine", "pension pour chien", "pension animal"], "pension canine", "A", "reserve", { secteur: "flux" }),
  M(["educateur canin", "education canine", "dresseur"], "éducateur canin", "A", "reserve", { secteur: "soin" }),
  // ── Santé « praticité » (profil B — Doctolib, avis doux) ──
  M(["osteopath"], "ostéopathe", "B", "reserve", { deontologie: "sante" }),
  M(["dietetic"], "diététicien", "B", "reserve", { deontologie: "sante" }),
  M(["nutritionniste"], "nutritionniste", "B", "reserve", { deontologie: "sante" }),
  M(["podolog", "pedicure"], "pédicure-podologue", "B", "reserve", { deontologie: "sante" }),
  M(["acupunct"], "acupuncteur", "B", "reserve", { deontologie: "sante" }),
  M(["conseiller en gestion", "gestion de patrimoine", "conseiller patrimoine"], "conseiller en gestion", "B", "rappel", { terme: "clients" }),
  // ── Santé encadrée (profil C — sobre, pas d'avis, pas de WhatsApp) ──
  M(["psycholog"], "psychologue", "C", "reserve", { encartUrgence: true, deontologie: "sante" }),
  M(["kinesither", "kine"], "kinésithérapeute", "C", "reserve", { deontologie: "sante" }),
  M(["orthophonist"], "orthophoniste", "C", "reserve", { deontologie: "sante" }),
  M(["orthoptist"], "orthoptiste", "C", "reserve", { deontologie: "sante" }),
  // ── Artisans du bâtiment & dépannage (profil A) — moteur M2 (temps : filtrer les
  //    appels), secteur « urgence ». Entrées spécifiques AVANT « artisan du bâtiment ». ──
  M(["plombier", "plomberie"], "plombier", "A", "rappel", { urgencesOps: true, moteur: "M2_temps", secteur: "urgence" }),
  M(["electricien", "electricite"], "électricien", "A", "rappel", { urgencesOps: true, moteur: "M2_temps", secteur: "urgence" }),
  M(["serrurier", "serrurerie"], "serrurier", "A", "rappel", { urgencesOps: true, moteur: "M2_temps", secteur: "urgence" }),
  M(["chauffagiste", "chauffage"], "chauffagiste", "A", "devis", { urgencesOps: true, moteur: "M2_temps", secteur: "urgence" }),
  M(["climatisation", "climaticien", "clim reversible"], "climatisation", "A", "devis", { urgencesOps: true, moteur: "M2_temps", secteur: "urgence" }),
  M(["couvreur", "couverture toiture", "toiture"], "couvreur", "A", "devis", { urgencesOps: true, moteur: "M2_temps", secteur: "urgence" }),
  M(["ramoneur", "ramonage"], "ramoneur", "A", "rappel", { moteur: "M2_temps", secteur: "urgence" }),
  M(["menuisier", "menuiserie"], "menuisier", "A", "devis", { moteur: "M2_temps", secteur: "urgence" }),
  M(["peintre"], "peintre", "A", "devis", { moteur: "M2_temps", secteur: "urgence" }),
  M(["pisciniste", "piscine"], "pisciniste", "A", "devis", { moteur: "M2_temps", secteur: "urgence" }),
  M(["paysagiste", "paysag"], "paysagiste", "A", "devis", { moteur: "M2_temps", secteur: "urgence" }),
  M(["entreprise de renovation", "renovation"], "entreprise de rénovation", "A", "devis", { moteur: "M2_temps", secteur: "urgence" }),
  M(["macon", "carreleur", "platrier", "artisan du batiment", "batiment"], "artisan du bâtiment", "A", "devis", { moteur: "M2_temps", secteur: "urgence" }),
  // ── Automobile (profil A) ──
  M(["garagiste", "garage auto", "garage automobile"], "garagiste", "A", "rappel", { moteur: "M2_temps", secteur: "urgence" }),
  M(["carrossier", "carrosserie"], "carrossier", "A", "devis", { moteur: "M2_temps", secteur: "urgence" }),
  M(["controle technique"], "contrôle technique", "A", "rappel", { secteur: "flux" }),
  M(["lavage automobile", "lavage auto", "station de lavage"], "lavage automobile premium", "A", "reserve", { secteur: "flux" }),
  // ── Droit & chiffre (profil C — déontologie publicité stricte, pas d'avis) ──
  M(["avocat"], "avocat", "C", "rappel", { terme: "clients", deontologie: "droit" }),
  M(["notaire"], "notaire", "C", "rappel", { terme: "clients", deontologie: "droit" }),
  M(["huissier", "commissaire de justice"], "commissaire de justice", "C", "rappel", { terme: "clients", deontologie: "droit" }),
  M(["expert comptable", "expert-comptable", "comptable"], "expert-comptable", "C", "rappel", { terme: "clients", deontologie: "droit" }),
];

// Famille MÉTIER/DÉONTO telle que la pense Marius (ce que la lettre a le DROIT de
// dire), dérivée du couple (profil, déontologie) :
//   A = commerce libre · B = santé praticité · C = santé encadrée · D = droit & chiffre.
export type MetierFamily = "A" | "B" | "C" | "D";
export function metierFamily(entry: Pick<MetierEntry, "profil" | "deontologie"> | null): MetierFamily {
  if (!entry) return "A";
  if (entry.deontologie === "droit") return "D";
  if (entry.profil === "B") return "B";
  if (entry.profil === "C") return "C";
  return "A";
}
export const FAMILY_LABEL: Record<MetierFamily, string> = {
  A: "Commerce",
  B: "Santé praticité",
  C: "Santé encadrée",
  D: "Droit & chiffre",
};

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
