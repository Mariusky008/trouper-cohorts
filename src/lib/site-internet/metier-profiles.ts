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

// ── « Suivre ce commerce » : la promesse faite au visiteur ────────────────────
// Personne ne « donne son numéro » : on active un service précis. Une promesse
// vague (« inscrivez-vous à notre liste ») ne vaut rien ; la promesse doit dire
// ce qu'on recevra, dans les mots du métier. `topics` = ce que la personne
// choisit de recevoir, pour ne pas tout envoyer à tout le monde.
export type FollowTopic = { id: string; label: string };
export type FollowCopy = { promesse: string; topics: FollowTopic[] };

const T = (id: string, label: string): FollowTopic => ({ id, label });

export function followCopy(secteur: Secteur, isResto = false): FollowCopy {
  if (isResto) {
    return {
      promesse: "Être prévenu·e des prochains menus, événements et tables disponibles.",
      topics: [T("dispo", "Tables disponibles"), T("menu", "Menus du moment"), T("event", "Événements"), T("offre", "Offres spéciales")],
    };
  }
  if (secteur === "urgence") {
    return {
      promesse: "Être prévenu·e des prochaines disponibilités et des interventions possibles près de chez vous.",
      topics: [T("dispo", "Disponibilités"), T("conseil", "Conseils & nouveautés"), T("offre", "Offres spéciales")],
    };
  }
  if (secteur === "emotion") {
    return {
      promesse: "Être prévenu·e des prochaines dates disponibles et des nouveautés.",
      topics: [T("dispo", "Dates disponibles"), T("nouveau", "Nouveautés"), T("event", "Événements"), T("offre", "Offres spéciales")],
    };
  }
  if (secteur === "soin") {
    return {
      promesse: "Être prévenu·e lorsqu'une place se libère, et des prochains rendez-vous proposés.",
      topics: [T("dispo", "Places qui se libèrent"), T("event", "Ateliers & événements"), T("offre", "Offres spéciales")],
    };
  }
  // « flux » : salons, instituts, commerces — le cas le plus courant.
  return {
    promesse: "Être prévenu·e lorsqu'une place se libère, et des offres du moment.",
    topics: [T("dispo", "Places qui se libèrent"), T("offre", "Offres spéciales"), T("nouveau", "Nouveautés"), T("event", "Événements")],
  };
}

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
  // ── Restauration, cafés & bars (profil A, secteur « flux ») — moteur M1 (remplir) ──
  M(["restaurant", "resto", "bistrot", "brasserie", "pizzeria", "creperie", "crêperie", "gastronomi"], "restaurant", "A", "reserve", { secteur: "flux" }),
  M(["cafe", "café", "salon de the", "salon de thé", "coffee", "brunch"], "café / salon de thé", "A", "reserve", { secteur: "flux" }),
  M(["bar a", "bar à", "pub", "brasserie artisanale", "cave a biere", "wine bar"], "bar", "A", "reserve", { secteur: "flux" }),
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
  // ── Professions médicales & pharmaceutiques (profil C — publicité interdite) ──
  // Elles tombaient dans le repli « commerce » : un cabinet dentaire aurait pu
  // solliciter des avis et relancer ses patients. Le filet ci-dessous (RÉGLEMENTÉ)
  // rattrape les libellés non listés, mais mieux vaut les nommer explicitement.
  M(["chirurgien dentiste", "chirurgien-dentiste", "dentiste", "dentaire", "orthodontist", "stomatolog"], "chirurgien-dentiste", "C", "reserve", { deontologie: "sante" }),
  M(["medecin", "docteur en medecine", "cabinet medical", "generaliste"], "médecin", "C", "reserve", { deontologie: "sante" }),
  M(["pediatre"], "pédiatre", "C", "reserve", { deontologie: "sante" }),
  M(["dermatolog"], "dermatologue", "C", "reserve", { deontologie: "sante" }),
  M(["ophtalmolog"], "ophtalmologue", "C", "reserve", { deontologie: "sante" }),
  M(["cardiolog"], "cardiologue", "C", "reserve", { deontologie: "sante" }),
  M(["gynecolog"], "gynécologue", "C", "reserve", { deontologie: "sante" }),
  M(["rhumatolog"], "rhumatologue", "C", "reserve", { deontologie: "sante" }),
  M(["radiolog", "imagerie medicale"], "radiologue", "C", "reserve", { deontologie: "sante" }),
  M(["chirurgien"], "chirurgien", "C", "reserve", { deontologie: "sante" }),
  M(["psychiatre"], "psychiatre", "C", "reserve", { encartUrgence: true, deontologie: "sante" }),
  M(["sage femme", "sage-femme", "maieuticien"], "sage-femme", "C", "reserve", { article: "une", deontologie: "sante" }),
  M(["infirmier", "infirmiere", "cabinet infirmier", "soins a domicile"], "infirmier", "C", "reserve", { deontologie: "sante" }),
  M(["pharmaci"], "pharmacien", "C", "rappel", { deontologie: "sante" }),
  M(["laboratoire d analyses", "laboratoire de biologie", "analyses medicales", "biologiste medical"], "laboratoire d'analyses", "C", "rappel", { deontologie: "sante" }),
  M(["veterinaire"], "vétérinaire", "C", "reserve", { terme: "clients", deontologie: "sante" }),
  // Santé praticité (profil B) : appareillage et dispositifs, publicité encadrée
  // mais moins stricte — les avis restent affichables, jamais sollicités.
  M(["audioprothesist", "audition", "correction auditive"], "audioprothésiste", "B", "reserve", { deontologie: "sante" }),
  M(["opticien", "optique", "lunetterie"], "opticien", "B", "reserve", { terme: "clients", deontologie: "sante" }),
  M(["orthopedi", "orthese", "prothesist"], "orthopédiste-orthésiste", "B", "reserve", { deontologie: "sante" }),
  M(["ambulanc", "transport sanitaire"], "ambulancier", "B", "rappel", { terme: "clients", deontologie: "sante" }),
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

// FILET DE SÉCURITÉ. Le repli par défaut est « A » (commerce), le profil le PLUS
// permissif : c'est le bon choix pour un libellé inconnu — la plupart sont des
// commerces — mais c'est le mauvais sens pour un garde-fou déontologique. Un
// libellé non catalogué qui sent la profession réglementée doit basculer en C,
// même si personne n'a pensé à l'ajouter à METIERS.
const REGLEMENTE =
  /(medecin|medical|docteur|dentiste|dentaire|orthodont|stomatolog|pediatr|dermatolog|ophtalmolog|ophtalmo|cardiolog|gynecolog|rhumatolog|radiolog|neurolog|urolog|endocrinolog|gastro|oncolog|anesthesi|chirurg|psychiatr|psycholog|kinesither|orthophon|orthoptis|podolog|pedicure|sage.?femme|infirmi|pharmaci|biologiste|analyses medicales|veterinair|osteopath|audioprothes|opticien|orthopedi|prothesist|ambulanc|clinique|cabinet de sante|centre de sante|laboratoire)|(avocat|notaire|huissier|commissaire de justice|expert.?comptable|greffier|mandataire judiciaire|administrateur judiciaire)/;

export function resolveMetier(activite: string): {
  entry: MetierEntry | null;
  profil: Profil;
  def: ProfileDef;
} {
  const a = norm(activite);
  const entry = METIERS.find((m) => m.match.some((k) => a.includes(k))) ?? null;
  // Sans correspondance, on retombe sur A — sauf si le libellé désigne une
  // profession réglementée : dans ce cas, le plus sobre l'emporte.
  const profil = entry?.profil ?? (REGLEMENTE.test(a) ? "C" : DEFAULT_PROFIL);
  return { entry, profil, def: PROFILES[profil] };
}

// Déontologie d'un libellé d'activité, FILET COMPRIS.
//
// `resolveMetier().entry` est `null` pour tout libellé non catalogué : lire
// `entry?.deontologie ?? "none"` renvoie donc « aucune contrainte » pour un
// « Cabinet d'avocats Machin & associés » que personne n'a pensé à ajouter.
// C'est le mauvais sens pour un garde-fou. Ici, quand l'entrée manque, on
// interroge le même filet « profession réglementée » que resolveMetier, et on
// distingue le droit de la santé pour que le journal de campagne dise vrai.
const REGLEMENTE_DROIT =
  /(avocat|notaire|huissier|commissaire de justice|expert.?comptable|greffier|mandataire judiciaire|administrateur judiciaire)/;

export function deontologieOf(activite: string): Deontologie {
  const { entry } = resolveMetier(activite);
  if (entry) return entry.deontologie;
  const a = norm(activite);
  if (REGLEMENTE_DROIT.test(a)) return "droit";
  return REGLEMENTE.test(a) ? "sante" : "none";
}
