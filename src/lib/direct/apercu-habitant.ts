// ⚠️ MAQUETTE DE CONCEPT — CE FICHIER NE DÉCRIT PAS LE PRODUIT.
//
// Il alimente UNE seule page, `/autour-de-moi`, faite pour être montrée de la
// main à la main à quelques habitants et savoir si l'idée leur parle. Elle se
// joue comme si tout existait — c'est le seul moyen d'obtenir une réaction
// utile, et les gens à qui on la montre savent déjà que c'est un essai. Ce qui
// n'existe pas n'est donc écrit NULLE PART à l'écran ; c'est écrit ici, et la
// page est en `noindex` pour que personne ne tombe dessus par hasard.
//
// LES FONCTIONS MISES EN SCÈNE ET QUI N'EXISTENT PAS :
//
//   · choisir un métier et voir ce que ses commerces proposent maintenant — le
//     fil réel est une ville entière, sans rayon par branche ;
//   · chercher par envie (« j'ai envie d'italien ») — il n'y a aucun typage de
//     cuisine ni de prestation sur les commerces ;
//   · filtrer par prix ou par disponibilité immédiate — le fil est trié par
//     distance et par fraîcheur, rien d'autre ;
//   · les avis attachés à un plat, et rappelés quand il revient à la carte ;
//   · demander à être prévenu quand quelqu'un propose ce qu'on cherche — aucune
//     demande d'habitant n'est enregistrée nulle part.
//
// C'EST POURQUOI CES DONNÉES SONT ICI ET PAS DANS `cartes-demo.ts`. Ce
// dernier alimente la démonstration montrée aux COMMERÇANTS, et la règle y est
// absolue : on ne leur montre jamais un écran qui n'existe pas, parce que celui
// qui signe dessus le réclame la semaine suivante. Mélanger les deux fichiers,
// c'est laisser une fonction imaginaire fuir un jour dans un argumentaire de
// vente. Elles restent séparées.
//
// EN REVANCHE, DEUX RÈGLES TIENNENT ENCORE ICI :
//   · aucun commerce inventé n'est nommé — ce sont des voisins anonymes, pas de
//     fausses enseignes ;
//   · les cartes sont le VRAI composant du produit (`CarteSwipe`), pas un
//     dessin : ce qu'on teste doit ressembler à ce qu'on livrerait.
//
// IL MANQUE DES PHOTOS, ET ÇA SE VOIT. `public/direct/` n'en contient que six,
// toutes alimentaires. Les cartes des autres métiers tombent donc sur le repli
// du composant — dégradé plus emoji — qui est propre mais muet. La branche
// « Restaurants » est la seule à montrer ce que le produit fait vraiment.
import type { CarteDirect } from "@/components/direct/carte-swipe";

/**
 * LES MÉTIERS, TELS QU'ON LES CHOISIT DANS LE BANDEAU.
 *
 * C'est la pastille en haut de l'écran : on appuie, on choisit une branche, et
 * le paquet devient celui de ses commerces. Le fil réel ne fonctionne pas comme
 * ça — il montre la ville entière — mais c'est précisément la question qu'on
 * pose ici : est-ce qu'un habitant cherche « ce qui se passe », ou « ce qui se
 * passe chez les coiffeurs » ?
 */
export const METIERS = [
  { cle: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { cle: "bar", label: "Bars", emoji: "🍸" },
  { cle: "coiffeur", label: "Coiffeurs", emoji: "💇" },
  { cle: "fleuriste", label: "Fleuristes", emoji: "💐" },
  { cle: "ongles", label: "Ongleries", emoji: "💅" },
] as const;

export type CleMetier = (typeof METIERS)[number]["cle"];

/** Une envie cochable. Les libellés changent avec le métier : on ne cherche pas
 *  « à emporter » chez un coiffeur, ni « une couleur » au restaurant. */
export type Envie = { cle: string; label: string; emoji: string };

export const ENVIES: Record<CleMetier, Envie[]> = {
  restaurant: [
    { cle: "italien", label: "Italien", emoji: "🇮🇹" },
    { cle: "moins15", label: "Moins de 15 €", emoji: "💶" },
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "emporter", label: "À emporter", emoji: "🥡" },
    { cle: "partager", label: "Une table à partager", emoji: "👥" },
  ],
  bar: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "happy", label: "Happy hour", emoji: "🍷" },
    { cle: "musique", label: "Musique live", emoji: "🎶" },
    { cle: "terrasse", label: "En terrasse", emoji: "☀️" },
  ],
  coiffeur: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "moins30", label: "Moins de 30 €", emoji: "💶" },
    { cle: "couleur", label: "Couleur", emoji: "🎨" },
    { cle: "homme", label: "Coupe homme", emoji: "✂️" },
  ],
  fleuriste: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "moins20", label: "Moins de 20 €", emoji: "💶" },
    { cle: "saison", label: "De saison", emoji: "🌿" },
  ],
  ongles: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "pose", label: "Pose complète", emoji: "💅" },
    { cle: "moins35", label: "Moins de 35 €", emoji: "💶" },
  ],
};

/**
 * UN AVIS SUR CE QU'ON CONSOMME — pas sur l'établissement.
 *
 * C'EST TOUTE L'IDÉE, ET ELLE NE RESSEMBLE À AUCUN SITE D'AVIS. Ailleurs, on
 * note une maison : une moyenne unique, tirée sur des années, qui ne dit rien
 * de ce qu'il y a dans l'assiette aujourd'hui. Ici l'avis est attaché AU PLAT.
 * Quand le restaurateur remet sa lasagne à la carte — même plat, même photo —
 * les avis d'il y a trois semaines reviennent avec elle. Sa carte du jour se
 * bonifie à chaque fois qu'il la ressert, et l'habitant qui hésite lit ce qu'on
 * a pensé de CE plat, pas de la maison en général.
 *
 * C'est aussi ce qui donne un intérêt au commerçant à reprendre la même photo :
 * elle devient le porte-avis du plat.
 */
export type AvisPlat = {
  /** De 1 à 5. */
  note: number;
  /** Une phrase, jamais plus. Un avis long ne se lit pas sur une carte. */
  texte: string;
  /** Un prénom. */
  qui: string;
  /** Quand — écrit tel quel, la maquette ne calcule pas de dates. */
  quand: string;
};

export type CarteAutour = CarteDirect & {
  id: string;
  /** La branche à laquelle ce commerce appartient. */
  branche: CleMetier;
  /** La distance en mètres — c'est elle qui trie, pas le texte affiché. */
  metres: number;
  /** De quelle heure à quelle heure cette carte est en ligne. */
  de: number;
  a: number;
  /** Les envies auxquelles elle répond, par leur clé. */
  envies: string[];
  /**
   * LES AVIS DÉJÀ LAISSÉS, des plus récents aux plus anciens.
   *
   * Absents sur ce qui ne se goûte ni ne s'essaie — une table libre, une place
   * à partager, un créneau. On ne note pas une table : la ligne d'avis
   * n'apparaît donc pas sur ces cartes-là, et c'est voulu.
   */
  avis?: AvisPlat[];
  /** Ce que la fiche du commerce ajoute quand on appuie sur « Le pro ». */
  fiche?: {
    /** Où c'est, en clair. Jamais une adresse : le commerce est anonyme. */
    ou: string;
    /** Quand c'est ouvert aujourd'hui. */
    horaires: string;
    /** Deux ou trois lignes sur la maison. */
    mot: string;
  };
  /** Les créneaux proposés à la réservation. Vide : pas de bouton Réserver. */
  creneaux?: string[];
};

/** L'heure la plus tôt et la plus tard où la maquette a du contenu. */
export const HEURE_MIN = 11;
export const HEURE_MAX = 22;

const VILLE = "Dax";
const YALLER = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(VILLE);

// SEPT CARTES POUR SIX PHOTOS, côté restauration. Le plat du jour sert deux
// fois — à midi et le soir — mais ses deux créneaux ne se chevauchent jamais.
// Les autres métiers n'ont pas d'image du tout : voir l'avertissement en tête.
const CARTES: CarteAutour[] = [
  // ── RESTAURANTS ──────────────────────────────────────────────────────────
  {
    id: "midi-menu",
    branche: "restaurant",
    photo: "/direct/plat-du-jour.jpg",
    cadrage: "68%",
    nom: "Un restaurant du centre",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 400,
    distance: "400 m",
    de: 11,
    a: 15,
    envies: [],
    reste: "Servi jusqu'à 14 h",
    icone: "🍽️",
    quoi: "Menu du jour",
    lignes: ["Garbure landaise", "Magret grillé", "Dessert maison"],
    prix: "19 €",
    social: "4 ont réservé",
    creneaux: ["12 h", "12 h 30", "13 h", "13 h 30"],
    fiche: {
      ou: "Rue piétonne, à côté de la halle",
      horaires: "Aujourd'hui, 12 h – 14 h et 19 h – 22 h",
      mot: "Cuisine du marché, carte changée chaque matin. Terrasse à l'ombre le midi.",
    },
    avis: [
      { note: 5, texte: "La garbure vaut le détour.", qui: "Hélène", quand: "la semaine dernière" },
      { note: 4, texte: "Magret cuit pile comme il faut.", qui: "Karim", quand: "il y a 3 semaines" },
      { note: 4, texte: "Bon rapport qualité-prix le midi.", qui: "Sofia", quand: "en février" },
    ],
  },
  {
    id: "midi-formule",
    branche: "restaurant",
    photo: "/direct/sortie-du-four.jpg",
    cadrage: "100%",
    nom: "Une boulangerie",
    metier: "Boulangerie",
    ville: VILLE,
    itineraire: YALLER,
    metres: 600,
    distance: "600 m",
    de: 11,
    a: 15,
    envies: ["moins15", "maintenant", "emporter"],
    reste: "Jusqu'à 14 h",
    icone: "🥪",
    quoi: "Formule du midi",
    lignes: ["Sandwich au choix", "Boisson + dessert"],
    prix: "8,50 €",
    social: "9 l'ont vu passer",
    fiche: {
      ou: "Avenue principale, en face de l'arrêt de bus",
      horaires: "Aujourd'hui, 6 h 30 – 19 h 30",
      mot: "Pains au levain, tout est fait sur place. Formule à emporter servie en deux minutes.",
    },
    avis: [
      { note: 4, texte: "Pain frais, ça change tout.", qui: "Thomas", quand: "hier" },
      { note: 3, texte: "Correct, un peu petit pour moi.", qui: "Léa", quand: "il y a 2 semaines" },
    ],
  },
  {
    id: "reste-lasagnes",
    branche: "restaurant",
    photo: "/direct/portion-a-emporter.jpg",
    cadrage: "50%",
    nom: "Une cuisine à emporter",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 180,
    distance: "180 m",
    de: 11,
    a: 17,
    envies: ["italien", "moins15", "maintenant", "emporter"],
    reste: "Jusqu'à épuisement",
    icone: "🔥",
    quoi: "Dernières portions",
    lignes: ["Lasagnes maison", "Prêtes tout de suite"],
    prix: "8 €",
    etiquette: "IL EN RESTE 8",
    social: "3 en ont pris",
    fiche: {
      ou: "Petite rue derrière l'église",
      horaires: "Aujourd'hui, 11 h – 14 h 30",
      mot: "Deux plats par jour, cuisinés le matin. Quand c'est fini, c'est fini.",
    },
    // LE PLAT LE PLUS COMMENTÉ DU LOT, et c'est le sujet de la démonstration :
    // ces avis ont été laissés les fois PRÉCÉDENTES où la lasagne est sortie.
    // Ils reviennent avec elle.
    avis: [
      { note: 5, texte: "Les meilleures lasagnes de la ville.", qui: "Camille", quand: "mardi dernier" },
      { note: 5, texte: "Généreux, et encore chaud à la maison.", qui: "Bastien", quand: "il y a 2 semaines" },
      { note: 4, texte: "Très bon. J'aurais pris deux parts.", qui: "Nadia", quand: "il y a 1 mois" },
      { note: 4, texte: "Bien fondant, pas gras du tout.", qui: "Pierre", quand: "en mars" },
    ],
  },
  {
    id: "tables",
    branche: "restaurant",
    photo: "/direct/tables-libres.jpg",
    cadrage: "100%",
    nom: "Une table à deux rues",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 250,
    distance: "250 m",
    de: 11,
    a: 22,
    envies: ["maintenant"],
    reste: "Aujourd'hui",
    icone: "🕐",
    quoi: "Il reste 4 tables",
    lignes: ["Plat + dessert", "Sans attendre"],
    prix: "16 €",
    social: "2 ont réservé",
    creneaux: ["Maintenant", "Dans 30 min", "13 h", "20 h"],
    fiche: {
      ou: "Place du marché, sous les arcades",
      horaires: "Aujourd'hui, 12 h – 14 h et 19 h – 22 h 30",
      mot: "Salle de trente couverts, cuisine ouverte. On peut venir sans réserver.",
    },
  },
  {
    id: "avant-fermeture",
    branche: "restaurant",
    photo: "/direct/vitrine-du-soir.jpg",
    cadrage: "72%",
    nom: "Un traiteur, avant de fermer",
    metier: "Traiteur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 350,
    distance: "350 m",
    de: 11,
    a: 20,
    envies: ["moins15", "maintenant", "emporter"],
    reste: "Jusqu'à 19 h 30",
    icone: "🥡",
    quoi: "Ce qui reste de la journée",
    lignes: ["Barquettes du jour", "À emporter"],
    prix: "6 €",
    etiquette: "-50 %",
    social: "5 en ont pris",
    fiche: {
      ou: "Rue du port, à l'angle",
      horaires: "Aujourd'hui, 9 h – 19 h 30",
      mot: "Ce qui n'est pas parti dans la journée passe à moitié prix la dernière heure.",
    },
    avis: [
      { note: 4, texte: "Pour 6 €, franchement rien à dire.", qui: "Julie", quand: "avant-hier" },
      { note: 5, texte: "J'y passe tous les vendredis soir.", qui: "Marc", quand: "il y a 3 semaines" },
    ],
  },
  {
    id: "soir-menu",
    branche: "restaurant",
    photo: "/direct/plat-du-jour.jpg",
    cadrage: "68%",
    nom: "Une adresse du vieux centre",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 480,
    distance: "480 m",
    de: 17,
    a: 22,
    envies: [],
    reste: "Ce soir",
    icone: "🍽️",
    quoi: "Menu du soir",
    lignes: ["Entrée + plat + dessert", "Service jusqu'à 22 h"],
    prix: "26 €",
    social: "6 ont réservé",
    creneaux: ["19 h", "19 h 30", "20 h", "21 h"],
    fiche: {
      ou: "Vieille ville, ruelle pavée",
      horaires: "Ce soir, 19 h – 22 h",
      mot: "Douze tables, une carte courte. Réservation conseillée le week-end.",
    },
    avis: [
      { note: 5, texte: "Belle assiette, service attentionné.", qui: "Inès", quand: "samedi" },
      { note: 4, texte: "Un peu d'attente, mais ça valait le coup.", qui: "Damien", quand: "il y a 10 jours" },
      { note: 5, texte: "Le dessert, surtout.", qui: "Claire", quand: "en février" },
    ],
  },
  {
    id: "tablee",
    branche: "restaurant",
    photo: "/direct/tablee-du-soir.jpg",
    cadrage: "50%",
    nom: "Une grande table ce soir",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 320,
    distance: "320 m",
    de: 17,
    a: 22,
    envies: ["partager"],
    reste: "Ce soir, 20 h",
    icone: "👥",
    quoi: "Table à partager",
    lignes: ["6 places, on s'assoit ensemble", "Plat + verre compris"],
    prix: "17 €",
    social: "4 places déjà prises",
    creneaux: ["20 h"],
    fiche: {
      ou: "Quai, au bord de l'eau",
      horaires: "Ce soir, à partir de 19 h 30",
      mot: "Une grande table commune une fois par semaine. On s'assoit avec qui vient.",
    },
  },

  // ── BARS ─────────────────────────────────────────────────────────────────
  {
    id: "bar-happy",
    branche: "bar",
    nom: "Un bar à vins",
    metier: "Bar à vins",
    ville: VILLE,
    itineraire: YALLER,
    metres: 190,
    distance: "190 m",
    de: 11,
    a: 22,
    envies: ["maintenant", "happy"],
    reste: "Happy hour jusqu'à 20 h",
    icone: "🍷",
    quoi: "Deux verres pour un",
    lignes: ["Verre de vin + planche", "De 18 h à 20 h"],
    prix: "9 €",
    social: "7 y sont passés",
    creneaux: ["18 h", "18 h 30", "19 h"],
    fiche: {
      ou: "Rue piétonne, première à droite",
      horaires: "Aujourd'hui, 17 h – 1 h",
      mot: "Une quarantaine de références au verre, planches de la région.",
    },
    avis: [
      { note: 5, texte: "La planche est généreuse.", qui: "Anaïs", quand: "vendredi" },
      { note: 4, texte: "Bon choix de vins nature.", qui: "Vincent", quand: "il y a 2 semaines" },
    ],
  },
  {
    id: "bar-terrasse",
    branche: "bar",
    nom: "Une terrasse au soleil",
    metier: "Bar",
    ville: VILLE,
    itineraire: YALLER,
    metres: 310,
    distance: "310 m",
    de: 11,
    a: 20,
    envies: ["maintenant", "terrasse"],
    reste: "Cet après-midi",
    icone: "☀️",
    quoi: "Il reste 3 tables dehors",
    lignes: ["En terrasse, plein sud", "Sans réserver"],
    social: "3 y sont",
    creneaux: ["Maintenant", "Dans 30 min"],
    fiche: {
      ou: "Sur la place, côté fontaine",
      horaires: "Aujourd'hui, 10 h – 21 h",
      mot: "Terrasse au soleil jusqu'en fin d'après-midi. Cafés, bières locales, limonades maison.",
    },
  },
  {
    id: "bar-concert",
    branche: "bar",
    nom: "Un bar de quartier",
    metier: "Bar",
    ville: VILLE,
    itineraire: YALLER,
    metres: 450,
    distance: "450 m",
    de: 11,
    a: 22,
    envies: ["musique"],
    reste: "Ce soir, 21 h",
    icone: "🎶",
    quoi: "Concert acoustique",
    lignes: ["Duo guitare-voix", "Entrée libre"],
    etiquette: "GRATUIT",
    social: "12 ont dit qu'ils venaient",
    fiche: {
      ou: "Derrière la gare, rue calme",
      horaires: "Aujourd'hui, 17 h – 2 h",
      mot: "Concerts le jeudi et le samedi. Petite salle, on entend vraiment les musiciens.",
    },
  },

  // ── COIFFEURS ────────────────────────────────────────────────────────────
  {
    id: "coif-maintenant",
    branche: "coiffeur",
    nom: "Un salon du centre",
    metier: "Coiffeur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 220,
    distance: "220 m",
    de: 11,
    a: 19,
    envies: ["maintenant", "moins30"],
    reste: "Créneau libre dans 20 min",
    icone: "💇",
    quoi: "Une place vient de se libérer",
    lignes: ["Coupe + brushing", "45 minutes"],
    prix: "28 €",
    social: "1 a réservé",
    creneaux: ["Dans 20 min", "15 h", "16 h 30"],
    fiche: {
      ou: "Rue piétonne, au-dessus de la pharmacie",
      horaires: "Aujourd'hui, 9 h – 19 h",
      mot: "Quatre fauteuils, sans rendez-vous quand il reste de la place.",
    },
  },
  {
    id: "coif-homme",
    branche: "coiffeur",
    nom: "Un coiffeur, rue piétonne",
    metier: "Coiffeur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 380,
    distance: "380 m",
    de: 11,
    a: 19,
    envies: ["maintenant", "moins30", "homme"],
    reste: "Place à 16 h 30",
    icone: "✂️",
    quoi: "Coupe homme",
    lignes: ["Tondeuse + ciseaux", "20 minutes"],
    prix: "18 €",
    social: "4 y sont passés aujourd'hui",
    creneaux: ["16 h 30", "17 h", "17 h 30"],
    fiche: {
      ou: "Rue piétonne, en face du kiosque",
      horaires: "Aujourd'hui, 8 h 30 – 19 h",
      mot: "Coupe homme et barbe, sans rendez-vous. Rarement plus de dix minutes d'attente.",
    },
  },
  {
    id: "coif-couleur",
    branche: "coiffeur",
    nom: "Un salon qui vient d'ouvrir",
    metier: "Coiffeur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 500,
    distance: "500 m",
    de: 11,
    a: 19,
    envies: ["couleur"],
    reste: "Cette semaine",
    icone: "🎨",
    quoi: "Couleur + coupe",
    lignes: ["Végétale ou classique", "1 h 30"],
    prix: "55 €",
    prixBarre: "69 €",
    etiquette: "OUVERTURE",
    social: "6 l'ont gardé",
    creneaux: ["Demain 10 h", "Demain 14 h", "Jeudi 11 h"],
    fiche: {
      ou: "Quartier des écoles",
      horaires: "Aujourd'hui, 10 h – 18 h",
      mot: "Salon ouvert ce mois-ci. Colorations végétales, sur rendez-vous.",
    },
  },

  // ── FLEURISTES ───────────────────────────────────────────────────────────
  {
    id: "fleur-jour",
    branche: "fleuriste",
    nom: "Une fleuriste du marché",
    metier: "Fleuriste",
    ville: VILLE,
    itineraire: YALLER,
    metres: 150,
    distance: "150 m",
    de: 11,
    a: 19,
    envies: ["maintenant", "moins20", "saison"],
    reste: "Jusqu'à 19 h",
    icone: "💐",
    quoi: "Bouquet du jour",
    lignes: ["Fleurs de saison", "Prêt en cinq minutes"],
    prix: "15 €",
    social: "8 en ont pris",
    fiche: {
      ou: "Sous la halle du marché",
      horaires: "Aujourd'hui, 8 h – 19 h",
      mot: "Un bouquet composé chaque matin avec ce qui est arrivé. Producteurs des Landes.",
    },
  },
  {
    id: "fleur-reste",
    branche: "fleuriste",
    nom: "Un atelier floral",
    metier: "Fleuriste",
    ville: VILLE,
    itineraire: YALLER,
    metres: 420,
    distance: "420 m",
    de: 11,
    a: 19,
    envies: ["maintenant", "moins20"],
    reste: "Avant la fermeture",
    icone: "🌿",
    quoi: "Il reste 4 bouquets",
    lignes: ["Composés ce matin", "À emporter"],
    prix: "12 €",
    prixBarre: "18 €",
    etiquette: "-30 %",
    social: "2 en ont pris",
    fiche: {
      ou: "Avenue des thermes",
      horaires: "Aujourd'hui, 9 h 30 – 19 h",
      mot: "Ce qui reste en fin de journée part à prix réduit plutôt qu'à la poubelle.",
    },
  },

  // ── ONGLERIES ────────────────────────────────────────────────────────────
  {
    id: "ongle-libre",
    branche: "ongles",
    nom: "Une prothésiste ongulaire",
    metier: "Prothésiste ongulaire",
    ville: VILLE,
    itineraire: YALLER,
    metres: 340,
    distance: "340 m",
    de: 11,
    a: 19,
    envies: ["maintenant", "moins35"],
    reste: "Place libre maintenant",
    icone: "💅",
    quoi: "Un désistement",
    lignes: ["Remplissage", "45 minutes"],
    prix: "30 €",
    social: "1 a réservé",
    creneaux: ["Maintenant", "Dans 1 h"],
    fiche: {
      ou: "Rue commerçante, au premier étage",
      horaires: "Aujourd'hui, 10 h – 19 h",
      mot: "Sur rendez-vous. Les désistements sont annoncés ici plutôt que perdus.",
    },
  },
  {
    id: "ongle-pose",
    branche: "ongles",
    nom: "Un institut à deux rues",
    metier: "Institut",
    ville: VILLE,
    itineraire: YALLER,
    metres: 260,
    distance: "260 m",
    de: 11,
    a: 19,
    envies: ["pose"],
    reste: "Créneau à 17 h",
    icone: "✨",
    quoi: "Pose complète",
    lignes: ["Gel ou semi-permanent", "1 h 15"],
    prix: "45 €",
    social: "3 l'ont gardé",
    creneaux: ["17 h", "18 h 15", "Demain 11 h"],
    fiche: {
      ou: "Petite place, à côté du fleuriste",
      horaires: "Aujourd'hui, 9 h 30 – 19 h 30",
      mot: "Ongles et cils. Deux postes, rendez-vous conseillé.",
    },
  },
];

/**
 * CE QUI EST EN LIGNE MAINTENANT, DANS CE MÉTIER, DU PLUS PRÈS AU PLUS LOIN.
 *
 * Le tri par distance n'est pas cosmétique : c'est l'argument entier. On ne
 * choisit pas un commerce, on choisit un commerce où on a le temps d'aller.
 */
export function autourDeMoi(heure: number, branche: CleMetier): CarteAutour[] {
  return CARTES.filter((c) => c.branche === branche && heure >= c.de && heure <= c.a).sort(
    (a, b) => a.metres - b.metres,
  );
}

/** Combien de cartes chaque métier a en ligne à cette heure-là. */
export function comptesParMetier(heure: number): Record<CleMetier, number> {
  const n = {} as Record<CleMetier, number>;
  for (const m of METIERS) n[m.cle] = autourDeMoi(heure, m.cle).length;
  return n;
}

/** Celles qui répondent à TOUTES les envies cochées. Aucune envie : tout passe. */
export function selonEnvies(cartes: CarteAutour[], envies: string[]): CarteAutour[] {
  if (!envies.length) return cartes;
  return cartes.filter((c) => envies.every((e) => c.envies.includes(e)));
}

/** La moyenne, arrondie au dixième. Zéro avis : rien à afficher. */
export function moyenneAvis(avis: AvisPlat[]): number {
  if (!avis.length) return 0;
  return Math.round((avis.reduce((t, a) => t + a.note, 0) / avis.length) * 10) / 10;
}
