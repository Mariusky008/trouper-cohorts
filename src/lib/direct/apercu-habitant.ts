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
//   · chercher par envie (« j'ai envie d'italien ») — il n'y a aucun typage de
//     cuisine sur les commerces ;
//   · filtrer par prix ou par disponibilité immédiate — le fil est trié par
//     distance et par fraîcheur, rien d'autre ;
//   · demander à être prévenu quand quelqu'un propose ce qu'on cherche — aucune
//     demande d'habitant n'est enregistrée nulle part ;
//   · le nombre de gens qui cherchent la même chose — il ne peut venir d'aucune
//     table, puisque rien n'est enregistré.
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
import type { CarteDirect } from "@/components/direct/carte-swipe";

/** Les envies que la maquette sait filtrer. Rien de tout ça n'existe. */
export const ENVIES = [
  { cle: "italien", label: "Italien", emoji: "🇮🇹" },
  { cle: "moins15", label: "Moins de 15 €", emoji: "💶" },
  { cle: "maintenant", label: "Tout de suite", emoji: "⚡" },
  { cle: "emporter", label: "À emporter", emoji: "🥡" },
  { cle: "partager", label: "Une table à partager", emoji: "👥" },
] as const;

export type CleEnvie = (typeof ENVIES)[number]["cle"];

export type CarteAutour = CarteDirect & {
  id: string;
  /** La distance en mètres — c'est elle qui trie, pas le texte affiché. */
  metres: number;
  /** De quelle heure à quelle heure cette carte est en ligne. */
  de: number;
  a: number;
  /** Les envies auxquelles elle répond. */
  envies: CleEnvie[];
};

/** L'heure la plus tôt et la plus tard que la page laisse explorer. */
export const HEURE_MIN = 11;
export const HEURE_MAX = 22;

const VILLE = "Dax";

// SEPT CARTES POUR SIX PHOTOS. Le plat du jour sert deux fois — à midi et le
// soir — mais ses deux créneaux ne se chevauchent jamais, donc les deux ne sont
// jamais dans le même paquet. Aucune autre image n'est reprise : une ville où
// tout se ressemble ne donne pas envie de balayer.
const CARTES: CarteAutour[] = [
  {
    id: "midi-menu",
    photo: "/direct/plat-du-jour.jpg",
    cadrage: "68%",
    nom: "Un restaurant du centre",
    metier: "Restaurant",
    ville: VILLE,
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
  },
  {
    id: "midi-formule",
    photo: "/direct/sortie-du-four.jpg",
    cadrage: "100%",
    nom: "Une boulangerie",
    metier: "Boulangerie",
    ville: VILLE,
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
  },
  {
    id: "reste-lasagnes",
    photo: "/direct/portion-a-emporter.jpg",
    cadrage: "50%",
    nom: "Une cuisine à emporter",
    metier: "Restaurant",
    ville: VILLE,
    metres: 180,
    distance: "180 m",
    de: 12,
    a: 17,
    envies: ["italien", "moins15", "maintenant", "emporter"],
    reste: "Jusqu'à épuisement",
    icone: "🔥",
    quoi: "Dernières portions",
    lignes: ["Lasagnes maison", "Prêtes tout de suite"],
    prix: "8 €",
    etiquette: "IL EN RESTE 8",
    social: "3 en ont pris",
  },
  {
    id: "tables",
    photo: "/direct/tables-libres.jpg",
    cadrage: "100%",
    nom: "Une table à deux rues",
    metier: "Restaurant",
    ville: VILLE,
    metres: 250,
    distance: "250 m",
    // Une salle a des places libres à midi comme le soir : c'est la seule
    // carte du lot qui traverse la journée entière.
    de: 11,
    a: 22,
    envies: [],
    reste: "Aujourd'hui",
    icone: "🕐",
    quoi: "Il reste 4 tables",
    lignes: ["Plat + dessert", "Sans attendre"],
    prix: "16 €",
    social: "2 ont réservé",
  },
  {
    id: "avant-fermeture",
    photo: "/direct/vitrine-du-soir.jpg",
    cadrage: "72%",
    nom: "Un traiteur, avant de fermer",
    metier: "Traiteur",
    ville: VILLE,
    metres: 350,
    distance: "350 m",
    de: 16,
    a: 20,
    envies: ["moins15", "maintenant", "emporter"],
    reste: "Jusqu'à 19 h 30",
    icone: "🥡",
    quoi: "Ce qui reste de la journée",
    lignes: ["Barquettes du jour", "À emporter"],
    prix: "6 €",
    etiquette: "-50 %",
    social: "5 en ont pris",
  },
  {
    id: "soir-menu",
    photo: "/direct/plat-du-jour.jpg",
    cadrage: "68%",
    nom: "Une adresse du vieux centre",
    metier: "Restaurant",
    ville: VILLE,
    metres: 480,
    distance: "480 m",
    de: 18,
    a: 22,
    envies: [],
    reste: "Ce soir",
    icone: "🍽️",
    quoi: "Menu du soir",
    lignes: ["Entrée + plat + dessert", "Service jusqu'à 22 h"],
    prix: "26 €",
    social: "6 ont réservé",
  },
  {
    id: "tablee",
    photo: "/direct/tablee-du-soir.jpg",
    cadrage: "50%",
    nom: "Une grande table ce soir",
    metier: "Restaurant",
    ville: VILLE,
    metres: 320,
    distance: "320 m",
    de: 18,
    a: 22,
    envies: ["partager"],
    reste: "Ce soir, 20 h",
    icone: "👥",
    quoi: "Table à partager",
    lignes: ["6 places, on s'assoit ensemble", "Plat + verre compris"],
    prix: "17 €",
    social: "4 places déjà prises",
  },
];

/**
 * CE QUI EST EN LIGNE À CETTE HEURE-LÀ, DU PLUS PRÈS AU PLUS LOIN.
 *
 * Le tri par distance n'est pas cosmétique : c'est l'argument entier. À midi on
 * ne choisit pas un restaurant, on choisit un restaurant où on a le temps
 * d'aller.
 */
export function autourDeMoi(heure: number): CarteAutour[] {
  return CARTES.filter((c) => heure >= c.de && heure <= c.a).sort((a, b) => a.metres - b.metres);
}

/** Celles qui répondent à TOUTES les envies cochées. Aucune envie : tout passe. */
export function selonEnvies(cartes: CarteAutour[], envies: CleEnvie[]): CarteAutour[] {
  if (!envies.length) return cartes;
  return cartes.filter((c) => envies.every((e) => c.envies.includes(e)));
}
