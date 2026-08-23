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
//   · l'annonce unique du jour avec ses moments horodatés (voir plus bas) ;
//   · choisir un métier et voir ce que ses commerces proposent maintenant ;
//   · chercher par envie, filtrer par prix ou par disponibilité immédiate ;
//   · les avis attachés à un plat, rappelés quand il revient à la carte.
//
// C'EST POURQUOI CES DONNÉES SONT ICI ET PAS DANS `cartes-demo.ts`. Ce dernier
// alimente la démonstration montrée aux COMMERÇANTS, et la règle y est absolue :
// on ne leur montre jamais un écran qui n'existe pas. Les deux fichiers restent
// séparés pour qu'une fonction imaginaire ne fuie jamais dans un argumentaire
// de vente.
//
// DEUX RÈGLES TIENNENT ENCORE ICI :
//   · aucun commerce inventé n'est nommé — ce sont des voisins anonymes ;
//   · les cartes sont le VRAI composant du produit (`CarteSwipe`).
//
// IL MANQUE DES PHOTOS. `public/direct/` n'en contient que six, toutes
// alimentaires. Les autres métiers tombent sur le repli du composant — dégradé
// et emoji — qui est propre et muet.
import type { CarteDirect } from "@/components/direct/carte-swipe";

/**
 * LES MÉTIERS, TELS QU'ON LES CHOISIT DANS LE BANDEAU.
 *
 * La mode est là pour une raison précise : c'est le métier qui n'avait rien à
 * dire tant qu'une annonce était une « carte du jour ». Avec la journée
 * horodatée, il a enfin un programme comme les autres.
 */
export const METIERS = [
  { cle: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { cle: "mode", label: "Mode", emoji: "👗" },
  { cle: "bar", label: "Bars", emoji: "🍸" },
  { cle: "coiffeur", label: "Coiffeurs", emoji: "💇" },
  { cle: "fleuriste", label: "Fleuristes", emoji: "💐" },
  { cle: "ongles", label: "Ongleries", emoji: "💅" },
] as const;

export type CleMetier = (typeof METIERS)[number]["cle"];

/** Une envie cochable. Les libellés changent avec le métier. */
export type Envie = { cle: string; label: string; emoji: string };

export const ENVIES: Record<CleMetier, Envie[]> = {
  restaurant: [
    { cle: "italien", label: "Italien", emoji: "🇮🇹" },
    { cle: "moins15", label: "Moins de 15 €", emoji: "💶" },
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "emporter", label: "À emporter", emoji: "🥡" },
    { cle: "partager", label: "Table à partager", emoji: "👥" },
  ],
  mode: [
    { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
    { cle: "solde", label: "En promo", emoji: "🏷️" },
    { cle: "arrivage", label: "Nouveautés", emoji: "✨" },
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
 * Ailleurs on note une maison : une moyenne tirée sur des années, qui ne dit
 * rien de ce qu'il y a dans l'assiette aujourd'hui. Ici l'avis est attaché au
 * PLAT : quand le restaurateur remet sa lasagne à la carte, les avis d'il y a
 * trois semaines reviennent avec elle.
 */
export type AvisPlat = {
  note: number;
  texte: string;
  qui: string;
  quand: string;
};

/**
 * UN MOMENT DE LA JOURNÉE D'UN COMMERCE.
 *
 * C'EST LE CŒUR DU CHANGEMENT, ET IL VIENT D'UN CONSTAT SUR LE TERRAIN. Le
 * produit demandait au commerçant cinq gestes répartis dans la journée : sa
 * carte à 11 h, ce qu'il lui reste à 14 h, ses places libres à 17 h 30. C'est
 * irréaliste — un restaurateur en plein service ne répond pas à 14 h, il est en
 * cuisine. Le produit lui demandait d'être joignable précisément aux heures où
 * il ne l'est jamais.
 *
 * À 10 h, en revanche, il connaît sa journée. Il pose UNE annonce et il y range
 * ses moments : le service de midi, les trois places à −20 %, la table
 * découverte du soir, les restes à venir chercher. Un seul geste, au seul
 * moment où il est disponible.
 *
 * DEUX CONSÉQUENCES, ET ELLES SONT LE VRAI GAIN :
 *
 *  1. LA CARTE VIT AVEC L'HEURE. Une seule annonce, mais elle n'affiche pas la
 *     même chose à 11 h et à 14 h : elle montre CE QUI VIENT. Le commerçant n'a
 *     rien retouché. C'est la promesse « ce qui se passe maintenant » tenue par
 *     la mécanique, et plus par sa bonne volonté.
 *  2. LES MÉTIERS SANS CARTE DU JOUR EXISTENT ENFIN. Un magasin de vêtements
 *     n'a pas de plat du jour, donc n'avait rien à dire, donc ne venait pas.
 *     Mais il a une journée : arrivage ce matin, essayage privé à 15 h, dernier
 *     jour des soldes à 18 h.
 */
export type MomentJour = {
  /** Début et fin en heures décimales — 11.5 vaut 11 h 30. */
  de: number;
  a: number;
  /** L'heure telle qu'on l'écrit. */
  quand: string;
  /** Ce que c'est, en trois mots. */
  titre: string;
  /** Le détail, une ou deux lignes. */
  lignes?: string[];
  prix?: string;
  prixBarre?: string;
  etiquette?: string;
  /** Combien il en reste. Zéro : c'est complet. */
  places?: number;
  /** L'emoji du moment. */
  icone: string;
  /** Le libellé du bouton. Vide : rien à réserver, on passe, c'est tout. */
  action?: string;
  /** Les envies auxquelles CE moment répond. */
  envies: string[];
  /** Les avis, quand le moment porte sur quelque chose qui se goûte ou s'essaie. */
  avis?: AvisPlat[];
};

/**
 * CE QU'UN COMMERCE RÉPOND QUAND QUELQU'UN ANNONCE QU'IL SORT.
 *
 * C'EST L'INVERSION DE TOUT LE PRODUIT, ET ELLE VIENT D'UN CONSTAT DE TERRAIN :
 * à Dax, aucun restaurant n'est complet. La capacité est abondante, donc elle
 * ne vaut rien — et une table qui se libère dans une salle à moitié vide
 * n'intéresse personne. Ce qui est rare dans cette ville, ce que tout le monde
 * s'arrache sans pouvoir l'attraper, c'est QUELQU'UN QUI A DÉCIDÉ DE SORTIR
 * DÉPENSER ET QUI N'A PAS ENCORE CHOISI OÙ.
 *
 * Quand l'offre dépasse la demande, on ne joue pas sur la rareté : on joue sur
 * la courtisation. L'habitant dit qu'il sort ; les commerces qui veulent le
 * recevoir se manifestent. Ce n'est pas une recherche filtrée — RIEN N'EXISTE
 * avant qu'il demande. Les cartes arrivent une par une, adressées à lui.
 *
 * ET CE N'EST PAS FORCÉMENT UNE REMISE. Dans une ville où tout le monde est à
 * moitié vide, l'attention vaut plus que 10 % : « je vous garde la table près
 * de la fenêtre » a plus d'effet qu'un prix barré, et ne coûte rien.
 *
 * LE COMMERÇANT NE RÉPOND PAS PENDANT LE SERVICE — il a armé son offre le
 * matin, avec la même ardoise que ses moments. Ça se déclenche tout seul.
 */
export type Reponse = {
  /**
   * CE QU'IL OFFRE — et c'est ça qu'on lit en premier sur la carte.
   *
   * LE DÉFAUT QUE ÇA CORRIGE, MESURÉ SUR DE VRAIES PERSONNES. Les premières
   * réponses ne donnaient « pas du tout envie » : une phrase aimable, sans
   * photo, sans prix, sans avis, et rien à gagner. Une attention seule ne fait
   * pas se lever quelqu'un — il faut qu'il se sente PRIVILÉGIÉ.
   *
   * Le cadeau n'est pas une remise, et la différence n'est pas cosmétique : un
   * digestif offert coûte deux euros au restaurateur et se raconte, « −10 % »
   * lui coûte deux euros aussi et ne se raconte pas. Ce qui engage, c'est qu'on
   * vous donne quelque chose, pas qu'on vous fasse un prix.
   */
  cadeau: string;
  /** Le mot du commerçant, court et adressé. Il vient SOUS le cadeau. */
  texte: string;
  /** Jusqu'à quand il la tient. Une proposition sans échéance ne fait pas bouger. */
  tenu: string;
  /** Dans combien de secondes elle arrive. La maquette échelonne les réponses :
   *  toutes en même temps, on ne verrait pas qu'elles VIENNENT de commerces. */
  apres: number;
};

export type CarteAutour = {
  id: string;
  branche: CleMetier;
  photo?: string;
  cadrage?: string;
  /** Anonyme : ce sont les voisins de celui qui lit. */
  nom: string;
  metier: string;
  ville: string;
  itineraire: string;
  metres: number;
  distance: string;
  /** LA JOURNÉE, dans l'ordre. C'est l'annonce unique posée le matin. */
  moments: MomentJour[];
  /** Ce que la fiche ajoute quand on descend. */
  fiche: { ou: string; horaires: string; mot: string };
  /** Ce qu'il propose à quelqu'un qui vient d'annoncer qu'il sort. Absent : il
   *  n'a rien armé, il ne répond pas — et c'est le cas le plus fréquent. */
  reponse?: Reponse;
};

export const HEURE_MIN = 8;
export const HEURE_MAX = 23;

const VILLE = "Dax";
const YALLER = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(VILLE);

const CARTES: CarteAutour[] = [
  // ── RESTAURANTS ──────────────────────────────────────────────────────────
  {
    id: "centre",
    branche: "restaurant",
    photo: "/direct/plat-du-jour.jpg",
    cadrage: "68%",
    nom: "Un restaurant du centre",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 400,
    distance: "400 m",
    fiche: {
      ou: "Rue piétonne, à côté de la halle",
      horaires: "Aujourd'hui, 12 h – 14 h et 19 h – 22 h",
      mot: "Cuisine du marché, carte changée chaque matin. Terrasse à l'ombre le midi.",
    },
    reponse: {
      cadeau: "Le digestif maison offert",
      texte: "Venez, je vous garde la table près de la fenêtre.",
      tenu: "12 h 40",
      apres: 5,
    },
    moments: [
      {
        de: 11, a: 11.5, quand: "11 h", icone: "👨‍🍳",
        titre: "Manger avec le service",
        lignes: ["À la table du personnel, avant l'ouverture", "4 places"],
        prix: "12 €", places: 2, action: "Réserver", envies: ["moins15"],
      },
      {
        de: 11.5, a: 12, quand: "11 h 30", icone: "🎟️",
        titre: "3 places à −20 %",
        lignes: ["Menu du jour complet", "Service à 11 h 45"],
        prix: "15,20 €", prixBarre: "19 €", etiquette: "−20 %", places: 3,
        action: "Réserver", envies: ["moins15", "maintenant"],
      },
      {
        de: 12, a: 14, quand: "12 h – 14 h", icone: "🍽️",
        titre: "Menu du jour",
        lignes: ["Garbure landaise", "Magret grillé", "Dessert maison"],
        prix: "19 €", places: 8, action: "Réserver", envies: [],
        avis: [
          { note: 5, texte: "La garbure vaut le détour.", qui: "Hélène", quand: "la semaine dernière" },
          { note: 4, texte: "Magret cuit pile comme il faut.", qui: "Karim", quand: "il y a 3 semaines" },
          { note: 4, texte: "Bon rapport qualité-prix le midi.", qui: "Sofia", quand: "en février" },
        ],
      },
      {
        de: 14, a: 15, quand: "14 h", icone: "🥡",
        titre: "Les restes, à emporter",
        lignes: ["Ce qui n'est pas parti du service", "Sur place, tant qu'il y en a"],
        prix: "7 €", places: 5, action: "J'en prends", envies: ["moins15", "maintenant", "emporter"],
      },
      {
        de: 19, a: 22, quand: "19 h – 22 h", icone: "🌙",
        titre: "Service du soir",
        lignes: ["Entrée + plat + dessert", "Dernière commande à 21 h 30"],
        prix: "26 €", places: 6, action: "Réserver", envies: [],
      },
    ],
  },
  {
    id: "emporter",
    branche: "restaurant",
    photo: "/direct/portion-a-emporter.jpg",
    cadrage: "50%",
    nom: "Une cuisine à emporter",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 180,
    distance: "180 m",
    fiche: {
      ou: "Petite rue derrière l'église",
      horaires: "Aujourd'hui, 11 h – 14 h 30",
      mot: "Deux plats par jour, cuisinés le matin. Quand c'est fini, c'est fini.",
    },
    reponse: {
      cadeau: "Une part de dessert en plus",
      texte: "Il me reste de la lasagne, je vous la mets de côté.",
      tenu: "13 h 15",
      apres: 9,
    },
    moments: [
      {
        de: 11, a: 13, quand: "11 h – 13 h", icone: "🍲",
        titre: "Les deux plats du jour",
        lignes: ["Lasagnes maison", "Curry de légumes"],
        prix: "11 €", places: 14, action: "J'en prends", envies: ["italien", "moins15", "maintenant", "emporter"],
      },
      {
        de: 13, a: 17, quand: "à partir de 13 h", icone: "🔥",
        titre: "Dernières portions",
        lignes: ["Lasagnes maison", "Prêtes tout de suite"],
        prix: "8 €", etiquette: "IL EN RESTE 8", places: 8,
        action: "J'en prends", envies: ["italien", "moins15", "maintenant", "emporter"],
        avis: [
          { note: 5, texte: "Les meilleures lasagnes de la ville.", qui: "Camille", quand: "mardi dernier" },
          { note: 5, texte: "Généreux, et encore chaud à la maison.", qui: "Bastien", quand: "il y a 2 semaines" },
          { note: 4, texte: "Très bon. J'aurais pris deux parts.", qui: "Nadia", quand: "il y a 1 mois" },
          { note: 4, texte: "Bien fondant, pas gras du tout.", qui: "Pierre", quand: "en mars" },
        ],
      },
    ],
  },
  {
    id: "deux-rues",
    branche: "restaurant",
    photo: "/direct/tables-libres.jpg",
    cadrage: "100%",
    nom: "Une table à deux rues",
    metier: "Restaurant",
    ville: VILLE,
    itineraire: YALLER,
    metres: 250,
    distance: "250 m",
    fiche: {
      ou: "Place du marché, sous les arcades",
      horaires: "Aujourd'hui, 12 h – 14 h et 19 h – 22 h 30",
      mot: "Salle de trente couverts, cuisine ouverte. On peut venir sans réserver.",
    },
    reponse: {
      cadeau: "L'apéritif maison offert",
      texte: "Deux tables au calme sous les arcades, à vous de choisir.",
      tenu: "13 h",
      apres: 16,
    },
    moments: [
      {
        de: 11, a: 14, quand: "ce midi", icone: "🕐",
        titre: "Il reste 4 tables",
        lignes: ["Plat + dessert", "Sans attendre"],
        prix: "16 €", places: 4, action: "Réserver", envies: ["maintenant"],
        avis: [
          { note: 5, texte: "Servi en dix minutes, et c'était bon.", qui: "Bruno", quand: "mardi dernier" },
          { note: 4, texte: "Les arcades à l'ombre, parfait l'été.", qui: "Nadia", quand: "il y a 2 semaines" },
        ],
      },
      {
        de: 19, a: 22.5, quand: "20 h", icone: "👥",
        titre: "Table découverte entre inconnus",
        lignes: ["4 places, on s'assoit ensemble", "Plat + verre compris"],
        prix: "22 €", places: 2, action: "Réserver", envies: ["partager"],
      },
    ],
  },
  {
    id: "boulange",
    branche: "restaurant",
    photo: "/direct/sortie-du-four.jpg",
    cadrage: "100%",
    nom: "Une boulangerie",
    metier: "Boulangerie",
    ville: VILLE,
    itineraire: YALLER,
    metres: 600,
    distance: "600 m",
    fiche: {
      ou: "Avenue principale, en face de l'arrêt de bus",
      horaires: "Aujourd'hui, 6 h 30 – 19 h 30",
      mot: "Pains au levain, tout est fait sur place.",
    },
    moments: [
      {
        de: 8, a: 11, quand: "ce matin", icone: "🥐",
        titre: "La fournée de 7 h",
        lignes: ["Pains au levain", "Viennoiseries encore tièdes"],
        prix: "1,30 €", places: 40, envies: ["moins15", "maintenant", "emporter"],
      },
      {
        de: 11, a: 14, quand: "11 h – 14 h", icone: "🥪",
        titre: "Formule du midi",
        lignes: ["Sandwich au choix", "Boisson + dessert"],
        prix: "8,50 €", places: 20, action: "J'en prends",
        envies: ["moins15", "maintenant", "emporter"],
        avis: [
          { note: 4, texte: "Pain frais, ça change tout.", qui: "Thomas", quand: "hier" },
          { note: 3, texte: "Correct, un peu petit pour moi.", qui: "Léa", quand: "il y a 2 semaines" },
        ],
      },
      {
        de: 18, a: 19.5, quand: "18 h", icone: "🏷️",
        titre: "Ce qui reste, à moitié prix",
        lignes: ["Pains et viennoiseries du jour", "Jusqu'à la fermeture"],
        prix: "0,65 €", prixBarre: "1,30 €", etiquette: "−50 %", places: 12,
        envies: ["moins15", "maintenant", "emporter"],
      },
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
    fiche: {
      ou: "Quai, au bord de l'eau",
      horaires: "Ce soir, à partir de 19 h 30",
      mot: "Une grande table commune une fois par semaine. On s'assoit avec qui vient.",
    },
    moments: [
      {
        de: 17, a: 23, quand: "20 h", icone: "👥",
        titre: "Table à partager",
        lignes: ["6 places, on s'assoit ensemble", "Plat + verre compris"],
        prix: "17 €", places: 2, action: "Réserver", envies: ["partager"],
      },
    ],
  },
  {
    id: "traiteur",
    branche: "restaurant",
    photo: "/direct/vitrine-du-soir.jpg",
    cadrage: "72%",
    nom: "Un traiteur, avant de fermer",
    metier: "Traiteur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 350,
    distance: "350 m",
    fiche: {
      ou: "Rue du port, à l'angle",
      horaires: "Aujourd'hui, 9 h – 19 h 30",
      mot: "Ce qui n'est pas parti dans la journée passe à moitié prix la dernière heure.",
    },
    moments: [
      {
        de: 10, a: 18, quand: "toute la journée", icone: "🍱",
        titre: "Les barquettes du jour",
        lignes: ["Six plats au choix", "À emporter"],
        prix: "12 €", places: 25, action: "J'en prends",
        envies: ["maintenant", "emporter"],
      },
      {
        de: 18, a: 19.5, quand: "18 h", icone: "🥡",
        titre: "Ce qui reste de la journée",
        lignes: ["Barquettes du jour", "Moitié prix jusqu'à 19 h 30"],
        prix: "6 €", prixBarre: "12 €", etiquette: "−50 %", places: 7,
        action: "J'en prends", envies: ["moins15", "maintenant", "emporter"],
        avis: [
          { note: 4, texte: "Pour 6 €, franchement rien à dire.", qui: "Julie", quand: "avant-hier" },
          { note: 5, texte: "J'y passe tous les vendredis soir.", qui: "Marc", quand: "il y a 3 semaines" },
        ],
      },
    ],
  },

  // ── MODE ─────────────────────────────────────────────────────────────────
  // Le métier qui n'existait pas dans le produit tant qu'une annonce était une
  // carte du jour. Avec la journée horodatée, il a un programme comme les autres.
  {
    id: "mode-centre",
    branche: "mode",
    nom: "Une boutique de la rue piétonne",
    metier: "Prêt-à-porter",
    ville: VILLE,
    itineraire: YALLER,
    metres: 210,
    distance: "210 m",
    fiche: {
      ou: "Rue piétonne, à côté du kiosque",
      horaires: "Aujourd'hui, 10 h – 19 h",
      mot: "Petites séries, marques françaises. On peut faire mettre de côté.",
    },
    reponse: {
      cadeau: "Une retouche offerte sur votre achat",
      texte: "Je vous sors les nouveautés à votre taille avant que vous arriviez.",
      tenu: "19 h",
      apres: 7,
    },
    moments: [
      {
        de: 10, a: 13, quand: "ce matin", icone: "✨",
        titre: "L'arrivage est en vitrine",
        lignes: ["La collection d'automne", "Déballée ce matin"],
        places: 30, envies: ["arrivage", "maintenant"],
        avis: [
          { note: 5, texte: "Des marques qu'on ne trouve pas ailleurs ici.", qui: "Élodie", quand: "le mois dernier" },
          { note: 4, texte: "Conseil honnête, on ne m'a rien poussé.", qui: "Thomas", quand: "en juin" },
        ],
      },
      {
        de: 15, a: 17, quand: "15 h", icone: "🪞",
        titre: "Essayage privé",
        lignes: ["La boutique pour vous seule, 30 min", "Sur rendez-vous"],
        places: 2, action: "Réserver", envies: [],
      },
      {
        de: 17, a: 19, quand: "18 h", icone: "🏷️",
        titre: "Dernier jour des soldes",
        lignes: ["Tout le rayon d'été", "Jusqu'à la fermeture"],
        prix: "−40 %", etiquette: "DERNIER JOUR", places: 60,
        envies: ["solde", "maintenant"],
      },
    ],
  },
  {
    id: "mode-friperie",
    branche: "mode",
    nom: "Une friperie du vieux centre",
    metier: "Friperie",
    ville: VILLE,
    itineraire: YALLER,
    metres: 470,
    distance: "470 m",
    fiche: {
      ou: "Vieille ville, ruelle pavée",
      horaires: "Aujourd'hui, 11 h – 19 h",
      mot: "Pièces chinées une par une. Ce qui part le matin ne revient pas.",
    },
    moments: [
      {
        de: 11, a: 19, quand: "aujourd'hui", icone: "🧥",
        titre: "40 pièces sorties ce matin",
        lignes: ["Manteaux et vestes d'hiver", "Une seule de chaque"],
        prix: "à partir de 12 €", places: 40, envies: ["arrivage", "maintenant"],
      },
    ],
  },

  // ── BARS ─────────────────────────────────────────────────────────────────
  {
    id: "bar-vins",
    branche: "bar",
    nom: "Un bar à vins",
    metier: "Bar à vins",
    ville: VILLE,
    itineraire: YALLER,
    metres: 190,
    distance: "190 m",
    fiche: {
      ou: "Rue piétonne, première à droite",
      horaires: "Aujourd'hui, 17 h – 1 h",
      mot: "Une quarantaine de références au verre, planches de la région.",
    },
    reponse: {
      cadeau: "Le premier verre offert",
      texte: "Poussez la porte, je vous installe au comptoir.",
      tenu: "19 h",
      apres: 6,
    },
    moments: [
      {
        de: 17, a: 20, quand: "18 h – 20 h", icone: "🍷",
        titre: "Deux verres pour un",
        lignes: ["Verre de vin + planche"],
        prix: "9 €", places: 20, action: "Réserver", envies: ["maintenant", "happy"],
        avis: [
          { note: 5, texte: "La planche est généreuse.", qui: "Anaïs", quand: "vendredi" },
          { note: 4, texte: "Bon choix de vins nature.", qui: "Vincent", quand: "il y a 2 semaines" },
        ],
      },
      {
        de: 20, a: 23, quand: "21 h", icone: "🎶",
        titre: "Concert acoustique",
        lignes: ["Duo guitare-voix", "Entrée libre"],
        etiquette: "GRATUIT", places: 35, envies: ["musique"],
      },
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
    fiche: {
      ou: "Sur la place, côté fontaine",
      horaires: "Aujourd'hui, 10 h – 21 h",
      mot: "Terrasse au soleil jusqu'en fin d'après-midi. Bières locales, limonades maison.",
    },
    moments: [
      {
        de: 8, a: 20, quand: "toute la journée", icone: "☀️",
        titre: "Il reste 3 tables dehors",
        lignes: ["En terrasse, plein sud", "Sans réserver"],
        places: 3, envies: ["maintenant", "terrasse"],
      },
    ],
  },

  // ── COIFFEURS ────────────────────────────────────────────────────────────
  {
    id: "coif-centre",
    branche: "coiffeur",
    nom: "Un salon du centre",
    metier: "Coiffeur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 220,
    distance: "220 m",
    fiche: {
      ou: "Rue piétonne, au-dessus de la pharmacie",
      horaires: "Aujourd'hui, 9 h – 19 h",
      mot: "Quatre fauteuils, sans rendez-vous quand il reste de la place.",
    },
    reponse: {
      cadeau: "Le café et le brushing offerts",
      texte: "Le fauteuil du fond est libre, je vous prends dès votre arrivée.",
      tenu: "dans 40 min",
      apres: 5,
    },
    moments: [
      {
        de: 8, a: 19, quand: "dans 20 min", icone: "💇",
        titre: "Une place vient de se libérer",
        lignes: ["Coupe + brushing", "45 minutes"],
        prix: "28 €", places: 1, action: "Réserver", envies: ["maintenant", "moins30"],
        avis: [
          { note: 5, texte: "Elle écoute avant de couper, ça change tout.", qui: "Camille", quand: "il y a 3 semaines" },
          { note: 5, texte: "Pris sans rendez-vous, sorti une heure après.", qui: "Yann", quand: "en juillet" },
          { note: 4, texte: "Brushing impeccable, tenue trois jours.", qui: "Fatou", quand: "le mois dernier" },
        ],
      },
      {
        de: 8, a: 19, quand: "16 h 30", icone: "✂️",
        titre: "Coupe homme",
        lignes: ["Tondeuse + ciseaux", "20 minutes"],
        prix: "18 €", places: 3, action: "Réserver", envies: ["moins30", "homme"],
      },
    ],
  },
  {
    id: "coif-nouveau",
    branche: "coiffeur",
    nom: "Un salon qui vient d'ouvrir",
    metier: "Coiffeur",
    ville: VILLE,
    itineraire: YALLER,
    metres: 500,
    distance: "500 m",
    fiche: {
      ou: "Quartier des écoles",
      horaires: "Aujourd'hui, 10 h – 18 h",
      mot: "Salon ouvert ce mois-ci. Colorations végétales, sur rendez-vous.",
    },
    reponse: {
      cadeau: "Le diagnostic et le brushing offerts",
      texte: "Première visite : venez, on prend le temps.",
      tenu: "18 h",
      apres: 12,
    },
    moments: [
      {
        de: 8, a: 18, quand: "cette semaine", icone: "🎨",
        titre: "Couleur + coupe",
        lignes: ["Végétale ou classique", "1 h 30"],
        prix: "55 €", prixBarre: "69 €", etiquette: "OUVERTURE", places: 6,
        action: "Réserver", envies: ["couleur"],
        // UN SALON QUI VIENT D'OUVRIR A PEU D'AVIS, et c'est la vérité : deux,
        // pas trente. Lui en inventer une pleine page le rendrait moins
        // crédible que son propre « on vient d'ouvrir ».
        avis: [
          { note: 5, texte: "Végétale sur cheveux blancs, très réussi.", qui: "Martine", quand: "il y a 10 jours" },
          { note: 4, texte: "Salon tout neuf, accueil au top.", qui: "Léa", quand: "ce mois-ci" },
        ],
      },
    ],
  },

  // ── FLEURISTES ───────────────────────────────────────────────────────────
  {
    id: "fleur-marche",
    branche: "fleuriste",
    nom: "Une fleuriste du marché",
    metier: "Fleuriste",
    ville: VILLE,
    itineraire: YALLER,
    metres: 150,
    distance: "150 m",
    fiche: {
      ou: "Sous la halle du marché",
      horaires: "Aujourd'hui, 8 h – 19 h",
      mot: "Un bouquet composé chaque matin avec ce qui est arrivé. Producteurs des Landes.",
    },
    moments: [
      {
        de: 8, a: 19, quand: "jusqu'à 19 h", icone: "💐",
        titre: "Bouquet du jour",
        lignes: ["Fleurs de saison", "Prêt en cinq minutes"],
        prix: "15 €", places: 12, action: "J'en prends",
        envies: ["maintenant", "moins20", "saison"],
      },
      {
        de: 17, a: 19, quand: "18 h", icone: "🌿",
        titre: "Il reste 4 bouquets",
        lignes: ["Composés ce matin", "À emporter"],
        prix: "12 €", prixBarre: "18 €", etiquette: "−30 %", places: 4,
        action: "J'en prends", envies: ["maintenant", "moins20"],
      },
    ],
  },

  // ── ONGLERIES ────────────────────────────────────────────────────────────
  {
    id: "ongle-institut",
    branche: "ongles",
    nom: "Une prothésiste ongulaire",
    metier: "Prothésiste ongulaire",
    ville: VILLE,
    itineraire: YALLER,
    metres: 340,
    distance: "340 m",
    fiche: {
      ou: "Rue commerçante, au premier étage",
      horaires: "Aujourd'hui, 10 h – 19 h",
      mot: "Sur rendez-vous. Les désistements sont annoncés ici plutôt que perdus.",
    },
    moments: [
      {
        de: 8, a: 19, quand: "maintenant", icone: "💅",
        titre: "Un désistement",
        lignes: ["Remplissage", "45 minutes"],
        prix: "30 €", places: 1, action: "Réserver", envies: ["maintenant", "moins35"],
      },
      {
        de: 8, a: 19, quand: "17 h", icone: "✨",
        titre: "Pose complète",
        lignes: ["Gel ou semi-permanent", "1 h 15"],
        prix: "45 €", places: 2, action: "Réserver", envies: ["pose"],
      },
    ],
  },
];

/** Les moments encore d'actualité — en cours, ou à venir dans la journée. */
export function momentsRestants(c: CarteAutour, heure: number): MomentJour[] {
  return c.moments.filter((m) => heure < m.a);
}

/**
 * LE MOMENT QUE LA CARTE AFFICHE — celui qui se passe, sinon le prochain.
 *
 * C'est ce qui fait qu'une seule annonce ne montre pas la même chose à 11 h et
 * à 14 h, sans que le commerçant ait retouché quoi que ce soit.
 */
export function momentEnCours(c: CarteAutour, heure: number): MomentJour | null {
  return c.moments.find((m) => heure >= m.de && heure < m.a) ?? momentsRestants(c, heure)[0] ?? null;
}

/** Vrai si le moment se passe en ce moment même, faux s'il est à venir. */
export function seJoueMaintenant(m: MomentJour, heure: number): boolean {
  return heure >= m.de && heure < m.a;
}

/**
 * CE QUI EST OUVERT MAINTENANT, DANS CE MÉTIER, DU PLUS PRÈS AU PLUS LOIN.
 *
 * Un commerce n'apparaît que s'il lui reste au moins un moment dans la journée.
 * Le tri par distance n'est pas cosmétique : on ne choisit pas un commerce, on
 * choisit un commerce où on a le temps d'aller.
 */
export function autourDeMoi(heure: number, branche: CleMetier): CarteAutour[] {
  return CARTES.filter((c) => c.branche === branche && momentsRestants(c, heure).length > 0).sort(
    (a, b) => a.metres - b.metres,
  );
}

/** Combien de commerces chaque métier a en ligne à cette heure-là. */
export function comptesParMetier(heure: number): Record<CleMetier, number> {
  const n = {} as Record<CleMetier, number>;
  for (const m of METIERS) n[m.cle] = autourDeMoi(heure, m.cle).length;
  return n;
}

/** Ceux dont AU MOINS UN moment restant répond à toutes les envies cochées. */
export function selonEnvies(
  cartes: CarteAutour[],
  envies: string[],
  heure: number,
): CarteAutour[] {
  if (!envies.length) return cartes;
  return cartes.filter((c) =>
    momentsRestants(c, heure).some((m) => envies.every((e) => m.envies.includes(e))),
  );
}

/** La moyenne, arrondie au dixième. Zéro avis : rien à afficher. */
export function moyenneAvis(avis: AvisPlat[]): number {
  if (!avis.length) return 0;
  return Math.round((avis.reduce((t, a) => t + a.note, 0) / avis.length) * 10) / 10;
}

/**
 * LA CARTE TELLE QU'ELLE S'AFFICHE À CETTE HEURE-LÀ.
 *
 * Le commerce et le moment en cours fusionnent en un seul objet, celui que le
 * composant du produit sait dessiner. C'est ici, et nulle part ailleurs, que
 * « une annonce qui vit avec l'heure » devient concret.
 */
export function carteAffichee(c: CarteAutour, heure: number): CarteDirect {
  const m = momentEnCours(c, heure);
  return {
    photo: c.photo,
    cadrage: c.cadrage,
    nom: c.nom,
    metier: c.metier,
    ville: c.ville,
    distance: c.distance,
    itineraire: c.itineraire,
    // Le badge du haut ne dit plus une échéance mais QUAND ça se passe : c'est
    // devenu l'information principale de la carte.
    reste: m ? (seJoueMaintenant(m, heure) ? `Maintenant · ${m.quand}` : m.quand) : "",
    icone: m?.icone ?? "📍",
    quoi: m?.titre ?? "",
    lignes: m?.lignes,
    prix: m?.prix,
    prixBarre: m?.prixBarre,
    etiquette: m?.etiquette,
    // PAS DE LIGNE « SOCIAL » ICI. Le nombre de moments y était écrit une
    // première fois, et la pastille de défilement le répétait dix pixels plus
    // bas, avec en prime le cœur vert qui veut dire « gardé » partout ailleurs
    // dans le produit. Une seule fois, au seul endroit sur lequel on appuie.
  };
}

/**
 * LES SUGGESTIONS SOUS LE CHAMP — pas des choix, des amorces.
 *
 * LE DÉFAUT QU'ELLES CORRIGENT, ET IL A ÉTÉ MESURÉ SUR DE VRAIES PERSONNES. La
 * première version posait deux questions à choix multiples : « vous sortez pour
 * quoi » puis « quand ». Personne n'a vu la différence avec le mode normal — et
 * ils avaient raison : deux appuis sur des options pré-écrites, c'est un filtre.
 * Rien de la personne ne partait, donc rien ne pouvait revenir qui lui soit
 * adressé.
 *
 * On demande donc une PHRASE. Même quatre mots. C'est elle qui s'affiche en haut
 * de la conversation, c'est à elle que les commerces répondent, et c'est ce qui
 * fait la différence entre une liste de résultats et une réponse.
 *
 * Les suggestions ne remplacent pas le champ : elles le remplissent. Un appui
 * pour ceux qui n'ont pas envie d'écrire, le clavier pour les autres.
 */
export const SORTIES = [
  { cle: "restaurant", label: "Déjeuner, rapide et pas cher", emoji: "🍽️" },
  { cle: "restaurant", label: "Une bonne table ce midi", emoji: "🍷" },
  { cle: "bar", label: "Boire un verre en terrasse", emoji: "☀️" },
  { cle: "coiffeur", label: "Me faire couper les cheveux", emoji: "💇" },
  { cle: "mode", label: "Trouver une veste", emoji: "👗" },
] as const satisfies readonly { cle: CleMetier; label: string; emoji: string }[];

/**
 * À QUI LA DEMANDE PART, D'APRÈS CE QUI EST ÉCRIT.
 *
 * Reconnaissance de mots, pas de compréhension : c'est une maquette, et une
 * poignée de mots-clés suffit à ce que la démonstration ne se trompe pas de
 * métier devant quelqu'un. Le vrai produit ferait autrement ; ce qu'on teste
 * ici, c'est l'effet, pas le moteur.
 */
export function brancheDeLaDemande(texte: string): CleMetier {
  const t = texte.toLowerCase();
  if (/coiff|cheveu|coupe|brushing|couleur/.test(t)) return "coiffeur";
  if (/ongle|manucure|vernis/.test(t)) return "ongles";
  if (/fleur|bouquet|plante/.test(t)) return "fleuriste";
  if (/verre|bar|bière|biere|apéro|apero|terrasse|vin/.test(t)) return "bar";
  if (/veste|robe|vêtement|vetement|fringue|boutique|jean|pull|chaussure/.test(t)) return "mode";
  return "restaurant";
}

/** Les commerces d'une branche qui ont armé quelque chose, dans l'ordre où
 *  leurs réponses arrivent. Les autres ne répondent pas, et c'est normal. */
export function repondeurs(heure: number, branche: CleMetier): CarteAutour[] {
  return autourDeMoi(heure, branche)
    .filter((c) => c.reponse)
    .sort((a, b) => (a.reponse?.apres ?? 0) - (b.reponse?.apres ?? 0));
}

/**
 * LA CARTE D'UNE INVITATION — riche, désirable, et balayable comme les autres.
 *
 * DEUX ERREURS CORRIGÉES ICI, TOUTES DEUX VUES SUR DE VRAIES PERSONNES.
 *
 * La première version renvoyait la carte du jour avec un liseré vert : personne
 * ne sentait qu'on s'adressait à lui. La deuxième a remplacé la carte par une
 * bulle de messagerie : on sentait bien la réponse, mais « ça ne donne pas du
 * tout envie » — plus de photo, plus de prix, plus d'avis, plus de swipe.
 *
 * Une invitation a besoin des deux : le ton personnel ET tout ce qui fait
 * saliver. Donc la vraie carte du produit, avec sa photo plein cadre, son prix
 * et ses avis — mais dont l'accroche n'est plus le plat, c'est LE CADEAU, et
 * dont la ligne en dessous est le mot du commerçant, entre guillemets.
 */
export function carteDeReponse(c: CarteAutour, heure: number): CarteDirect {
  const m = momentEnCours(c, heure);
  return {
    photo: c.photo,
    cadrage: c.cadrage,
    nom: c.nom,
    metier: c.metier,
    ville: c.ville,
    distance: c.distance,
    itineraire: c.itineraire,
    // COURT, PARCE QUE LA PASTILLE PARTAGE SA LIGNE AVEC « Y ALLER ». Mesuré au
    // navigateur : « Rien que pour vous · jusqu'à 12 h 40 » passait sous le
    // bouton dès 402 px de large, et se coupait au milieu de l'heure à 360 px.
    reste: c.reponse ? `Pour vous · ${c.reponse.tenu}` : "",
    // LE CADEAU EST L'ACCROCHE, pas le plat : c'est la seule ligne qui fasse se
    // lever quelqu'un, et elle doit être la plus grosse de la carte.
    icone: "🎁",
    quoi: c.reponse?.cadeau ?? "",
    lignes: c.reponse ? [`« ${c.reponse.texte} »`, ...(m?.lignes?.slice(0, 1) ?? [])] : undefined,
    prix: m?.prix,
    prixBarre: m?.prixBarre,
    etiquette: "INVITATION",
  };
}

/**
 * LES AVIS À MONTRER SUR UNE INVITATION.
 *
 * Ceux du moment en cours d'abord — c'est ce qu'on va manger ou essayer tout à
 * l'heure, donc c'est ce qui compte. Mais un moment n'en porte pas toujours : à
 * 11 h le restaurant du centre propose la table du personnel, qui n'a pas
 * d'avis, et l'invitation partait sans une étoile. C'est exactement le défaut
 * mesuré (« pas d'avis »), et le pire moment pour l'avoir : une invitation sans
 * note demande de se déplacer sur une promesse et rien d'autre.
 *
 * Alors on retombe sur les avis d'un autre moment de la même journée. Ce n'est
 * pas un mensonge : ce sont bien les clients de cette maison, sur autre chose
 * qu'elle sert. C'est ce que fait n'importe quel guide, sauf qu'ici la
 * précision revient dès que le moment noté est celui qui se joue.
 */
export function avisDuMoment(c: CarteAutour, heure: number): AvisPlat[] {
  const m = momentEnCours(c, heure);
  if (m?.avis?.length) return m.avis;
  return c.moments.find((x) => x.avis?.length)?.avis ?? [];
}
