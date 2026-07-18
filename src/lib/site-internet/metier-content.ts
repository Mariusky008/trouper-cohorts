// Contenus « proposés » de la maquette (approche, consultations/motifs, FAQ),
// DÉTERMINISTES par métier — pas de génération LLM (fiable, zéro coût, jamais de
// sortie hors-cadre). L'essentiel du site reste VRAI (photos, horaires, adresse,
// téléphone) ; ces textes-là sont proposés et ajustables (« textes proposés,
// ajustables ensemble »). Un métier hors catalogue retombe sur un fallback
// sobre, et la section « consultations » est simplement omise si on n'a rien de
// juste à proposer (règle : aucun bloc vide).

export type ConsultationCard = { h: string; p: string };
export type FaqItem = { q: string; a: string };
// « Pour quoi venir me voir ? » — capte l'intention par le PROBLÈME, pas la
// technique. Générique et honnête par métier (pas de résultat promis). Le clic
// ouvre l'assistante pré-qualifiée (motif transmis via data-accueil-motif).
export type UseCase = { icon: string; title: string; desc: string };
// « Mes accompagnements » — le menu des prestations. En maquette : EXEMPLES de
// présentation (labellisés, tarifs indicatifs à personnaliser). En ligne : ce
// sont les vraies prestations saisies par le pro (jamais de tarif inventé publié).
export type Service = { name: string; duration?: string; price?: string; desc?: string };
export type MetierContent = {
  approcheTitre: string;
  approcheCorps: string;
  consultTitre: string | null; // null → section omise
  consultCartes: ConsultationCard[];
  faq: FaqItem[];
  motifs?: UseCase[]; // vide/absent → section « Pour quoi venir me voir ? » omise
  demoServices?: Service[]; // exemples de menu pour la maquette (jamais publiés tels quels)
};

const FAQ_SOIN: FaqItem[] = [
  { q: "Combien coûte une séance ?", a: "Le tarif vous est indiqué avant le rendez-vous. Vous pouvez le demander sans engagement, via l'accueil ou par téléphone." },
  { q: "Est-ce remboursé ?", a: "Selon votre situation et votre mutuelle, une prise en charge peut être possible. Les modalités vous sont précisées à la prise de contact." },
  { q: "Comment se passe le premier rendez-vous ?", a: "Il sert surtout à faire connaissance et à comprendre votre besoin, dans un cadre bienveillant et confidentiel, sans engagement pour la suite." },
];

const FAQ_COMMERCE: FaqItem[] = [
  { q: "Quels sont vos tarifs ?", a: "Les tarifs vous sont communiqués à la réservation ou sur place — n'hésitez pas à les demander via l'accueil ou par téléphone." },
  { q: "Comment prendre rendez-vous ?", a: "En quelques secondes via l'accueil du site, à toute heure, ou par téléphone pendant les horaires d'ouverture." },
  { q: "Quels moyens de paiement ?", a: "Les moyens de paiement acceptés vous sont précisés sur place. La plupart des cartes et espèces sont acceptées." },
];

// Catalogue par métier. La clé est testée par inclusion sur l'activité normalisée.
const CATALOG: Array<{ match: RegExp; content: MetierContent }> = [
  {
    match: /coiff|barbier/,
    content: {
      approcheTitre: "Un moment pour vous",
      approcheCorps:
        "On prend le temps de comprendre ce que vous voulez, puis on s'en occupe — dans une ambiance simple et soignée. Sur rendez-vous, pour être bien reçu.",
      consultTitre: "Prestations",
      consultCartes: [
        { h: "Coupe & brushing", p: "Femme, homme, enfant — selon vos envies." },
        { h: "Couleur & mèches", p: "Coloration, balayage, patine." },
        { h: "Coiffage & occasions", p: "Chignon, mise en beauté pour vos événements." },
      ],
      faq: FAQ_COMMERCE,
      demoServices: [
        { name: "Coupe femme", duration: "45 min", desc: "Shampoing, coupe, brushing." },
        { name: "Coupe homme", duration: "30 min", desc: "Coupe et finitions." },
        { name: "Couleur & mèches", duration: "1 h 30", desc: "Coloration, balayage ou patine." },
        { name: "Chignon & occasions", duration: "1 h", desc: "Mariage, événement, mise en beauté." },
      ],
    },
  },
  {
    match: /esth[eé]|institut|beaut[eé]|ongle|onglerie/,
    content: {
      approcheTitre: "Prendre soin de vous",
      approcheCorps:
        "Un moment de détente et de soin, adapté à votre peau et à vos envies. On vous accueille sur rendez-vous, dans un cadre calme et propre.",
      consultTitre: "Prestations",
      consultCartes: [
        { h: "Soins du visage", p: "Nettoyage, éclat, anti-âge." },
        { h: "Épilations", p: "Visage et corps, à la cire ou au fil." },
        { h: "Beauté des mains & pieds", p: "Manucure, pose, soin." },
      ],
      faq: FAQ_COMMERCE,
      demoServices: [
        { name: "Soin du visage", duration: "1 h", desc: "Nettoyage, éclat, hydratation." },
        { name: "Épilation", duration: "30 min", desc: "Visage ou corps, à la cire ou au fil." },
        { name: "Beauté des mains", duration: "45 min", desc: "Manucure, pose de vernis semi-permanent." },
        { name: "Beauté des pieds", duration: "45 min", desc: "Soin, gommage, pose." },
      ],
    },
  },
  {
    match: /psycho/,
    content: {
      approcheTitre: "Un accompagnement sur mesure",
      approcheCorps:
        "Un premier rendez-vous pour faire connaissance et comprendre votre demande, sans engagement. Nous avançons ensuite à votre rythme, dans un cadre bienveillant et confidentiel.",
      consultTitre: "Pour qui ?",
      consultCartes: [
        { h: "Adultes", p: "Anxiété, transitions de vie, estime de soi, accompagnement au long cours." },
        { h: "Enfants & adolescents", p: "Difficultés scolaires, émotions, relations familiales." },
        { h: "Couples", p: "Communication, conflits, moments de transition." },
      ],
      faq: [
        { q: "Combien coûte une séance ?", a: "Une séance dure environ 50 minutes. Le tarif vous est indiqué avant le rendez-vous, sans engagement." },
        { q: "Est-ce remboursé ?", a: "Pas par l'Assurance Maladie, mais de nombreuses mutuelles prennent en charge. Le dispositif « Mon soutien psy » peut s'appliquer selon votre situation." },
        { q: "Comment se passe le premier rendez-vous ?", a: "Il sert à faire connaissance et à comprendre votre demande, sans engagement pour la suite." },
      ],
      motifs: [
        { icon: "😔", title: "Anxiété & stress", desc: "Angoisses, ruminations, pression qui monte." },
        { icon: "💔", title: "Coup dur & deuil", desc: "Séparation, perte, épreuve à traverser." },
        { icon: "🪞", title: "Estime de soi", desc: "Confiance, image de soi, relations." },
        { icon: "🧭", title: "Transition de vie", desc: "Changement, décision, sentiment de blocage." },
      ],
    },
  },
  {
    match: /kin[eé]|masseur/,
    content: {
      approcheTitre: "Des séances adaptées à vous",
      approcheCorps:
        "Un premier bilan pour comprendre votre gêne et vos objectifs. Le suivi est personnalisé, à votre rythme, dans le respect de votre prescription.",
      consultTitre: "Ce que je prends en charge",
      consultCartes: [
        { h: "Rééducation", p: "Suites de blessure, d'opération ou d'immobilisation." },
        { h: "Douleurs & tensions", p: "Dos, nuque, articulations — gêne du quotidien." },
        { h: "Sport & prévention", p: "Préparation, récupération, prévention des blessures." },
      ],
      faq: [
        { q: "Faut-il une ordonnance ?", a: "Une prescription médicale est généralement nécessaire pour une prise en charge. En cas de doute, demandez à l'accueil ou par téléphone." },
        { q: "Est-ce remboursé ?", a: "Les séances prescrites sont prises en charge par l'Assurance Maladie, avec le complément habituel de votre mutuelle." },
        { q: "Comment se passe la première séance ?", a: "Elle commence par un bilan pour comprendre votre gêne et fixer les objectifs du suivi." },
      ],
    },
  },
  {
    match: /orthopt/,
    content: {
      approcheTitre: "Un suivi précis et rassurant",
      approcheCorps:
        "Un premier rendez-vous pour évaluer votre vision et comprendre votre besoin, sur prescription. Le suivi est adapté à chaque âge, dans un cadre attentif.",
      consultTitre: "Motifs de consultation",
      consultCartes: [
        { h: "Enfants", p: "Bilans visuels, rééducation, suivi scolaire." },
        { h: "Adultes", p: "Fatigue visuelle, rééducation, gêne à l'écran." },
        { h: "Dépistage & suivi", p: "Contrôles réguliers, sur orientation." },
      ],
      faq: FAQ_SOIN,
    },
  },
  {
    match: /ost[eé]o/,
    content: {
      approcheTitre: "Retrouver votre mobilité, en douceur",
      approcheCorps:
        "Un premier rendez-vous pour comprendre votre gêne et votre mode de vie. La prise en charge est douce et adaptée, à votre rythme.",
      consultTitre: "Ce que je traite",
      consultCartes: [
        { h: "Dos, nuque, articulations", p: "Douleurs du quotidien, tensions, suites de faux mouvement." },
        { h: "Sportifs", p: "Préparation, récupération, prévention des blessures." },
        { h: "Nourrissons & femmes enceintes", p: "Suivi doux et adapté." },
      ],
      faq: [
        { q: "Combien coûte une consultation ?", a: "La consultation dure environ 50 minutes. Le tarif vous est indiqué avant le rendez-vous." },
        { q: "Est-ce remboursé ?", a: "Pas par l'Assurance Maladie, mais la plupart des mutuelles prennent en charge, souvent plusieurs séances par an." },
        { q: "Faut-il une ordonnance ?", a: "Non, vous pouvez consulter directement. En cas de doute, l'accueil vous renseigne." },
      ],
      motifs: [
        { icon: "🌿", title: "Dos, nuque, articulations", desc: "Douleurs du quotidien, tensions, faux mouvement." },
        { icon: "🏃", title: "Sport & récupération", desc: "Préparation, récupération, prévention." },
        { icon: "🤰", title: "Nourrissons & grossesse", desc: "Suivi doux et adapté." },
        { icon: "😮‍💨", title: "Stress & tensions", desc: "Le corps sous pression, sommeil, respiration." },
      ],
    },
  },
  // Thérapeute / praticien·ne bien-être (énergéticien, magnétiseur, sophrologue,
  // naturopathe, réflexologue, hypnothérapeute…). Placé APRÈS « psycho » pour que
  // « psychothérapeute » retombe bien sur l'entrée psychologue.
  {
    match: /[eé]nerg|magn[eé]t|reiki|sophro|naturo|holist|hypno|relaxolog|kinesiolog|r[eé]flexolog|th[eé]rapeut|praticien.*bien|bien.?[eê]tre/,
    content: {
      approcheTitre: "Un accompagnement vers votre équilibre",
      approcheCorps:
        "Un premier échange pour comprendre ce que vous traversez, sans jugement. On avance ensuite à votre rythme, avec des séances adaptées à votre besoin, dans un cadre calme et bienveillant.",
      consultTitre: null, // remplacé par les motifs ci-dessous
      consultCartes: [],
      faq: FAQ_SOIN,
      motifs: [
        { icon: "🌿", title: "Stress & burn-out", desc: "Tensions, surcharge mentale, épuisement." },
        { icon: "💤", title: "Sommeil & fatigue", desc: "Sommeil difficile, fatigue qui s'installe." },
        { icon: "💗", title: "Équilibre émotionnel", desc: "Émotions envahissantes, période sensible." },
        { icon: "🧭", title: "Transition & blocages", desc: "Passage de vie, décision, sentiment d'être bloqué·e." },
        { icon: "🌀", title: "Douleurs & tensions", desc: "Gênes chroniques, corps sous pression." },
      ],
      demoServices: [
        { name: "Séance découverte", duration: "45 min", desc: "Premier rendez-vous : faire connaissance et cibler votre besoin." },
        { name: "Séance énergétique globale", duration: "1 h 15", desc: "Séance complète de rééquilibrage." },
        { name: "Bilan holistique", duration: "1 h 30", desc: "Bilan approfondi et plan d'accompagnement." },
        { name: "Suivi", duration: "1 h", desc: "Séance de suivi personnalisée." },
      ],
    },
  },
];

// Fallback SOIN (profils B/C) : ton attentif, « patients », pas de cartes inventées.
const FALLBACK_CARE: MetierContent = {
  approcheTitre: "Un accompagnement attentif",
  approcheCorps:
    "Un premier rendez-vous pour faire connaissance et comprendre votre besoin, sans engagement. Vous êtes accompagné(e) dans un cadre attentif et confidentiel, à votre rythme.",
  consultTitre: null, // pas de cartes inventées pour un métier inconnu (aucun bloc vide)
  consultCartes: [],
  faq: FAQ_SOIN,
};

// Fallback COMMERCE (profil A) : ton chaleureux, « clients ».
const FALLBACK_COMMERCE: MetierContent = {
  approcheTitre: "Un savoir-faire à votre service",
  approcheCorps:
    "On prend le temps de bien faire, avec le sourire. Sur rendez-vous pour être bien reçu — posez votre question ou réservez, l'accueil s'en occupe.",
  consultTitre: null,
  consultCartes: [],
  faq: FAQ_COMMERCE,
};

const normLoose = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function resolveMetierContent(activite: string, profil: "A" | "B" | "C" = "C"): MetierContent {
  const a = normLoose(activite);
  const hit = CATALOG.find((c) => c.match.test(a));
  if (hit) return hit.content;
  return profil === "A" ? FALLBACK_COMMERCE : FALLBACK_CARE;
}
