// Contenus « proposés » de la maquette (approche, consultations/motifs, FAQ),
// DÉTERMINISTES par métier — pas de génération LLM (fiable, zéro coût, jamais de
// sortie hors-cadre). L'essentiel du site reste VRAI (photos, horaires, adresse,
// téléphone) ; ces textes-là sont proposés et ajustables (« textes proposés,
// ajustables ensemble »). Un métier hors catalogue retombe sur un fallback
// sobre, et la section « consultations » est simplement omise si on n'a rien de
// juste à proposer (règle : aucun bloc vide).

export type ConsultationCard = { h: string; p: string };
export type FaqItem = { q: string; a: string };
export type MetierContent = {
  approcheTitre: string;
  approcheCorps: string;
  consultTitre: string | null; // null → section omise
  consultCartes: ConsultationCard[];
  faq: FaqItem[];
};

const FAQ_SOIN: FaqItem[] = [
  { q: "Combien coûte une séance ?", a: "Le tarif vous est indiqué avant le rendez-vous. Vous pouvez le demander sans engagement, via l'accueil ou par téléphone." },
  { q: "Est-ce remboursé ?", a: "Selon votre situation et votre mutuelle, une prise en charge peut être possible. Les modalités vous sont précisées à la prise de contact." },
  { q: "Comment se passe le premier rendez-vous ?", a: "Il sert surtout à faire connaissance et à comprendre votre besoin, dans un cadre bienveillant et confidentiel, sans engagement pour la suite." },
];

// Catalogue par métier. La clé est testée par inclusion sur l'activité normalisée.
const CATALOG: Array<{ match: RegExp; content: MetierContent }> = [
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
    },
  },
];

const FALLBACK: MetierContent = {
  approcheTitre: "Un accompagnement attentif",
  approcheCorps:
    "Un premier rendez-vous pour faire connaissance et comprendre votre besoin, sans engagement. Vous êtes accompagné(e) dans un cadre attentif et confidentiel, à votre rythme.",
  consultTitre: null, // pas de cartes inventées pour un métier inconnu (aucun bloc vide)
  consultCartes: [],
  faq: FAQ_SOIN,
};

const normLoose = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function resolveMetierContent(activite: string): MetierContent {
  const a = normLoose(activite);
  const hit = CATALOG.find((c) => c.match.test(a));
  return hit ? hit.content : FALLBACK;
}
