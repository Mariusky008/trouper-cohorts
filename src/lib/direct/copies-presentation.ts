/**
 * 🎬 DEUX VRAIS RESTAURANTS, EN COPIE DE PRÉSENTATION.
 *
 * « Il va me falloir deux exemples identiques à l'identique mais faux de Le
 * Bordeaux et d'El Txupinazo. Ils vont servir à faire mes présentations avec
 * des parcours (expérience) déjà mis en situation… complètement en dehors de
 * l'application… avec tous les boutons fonctionnels… le parcours complet en
 * quatre étapes comme sur la démo, avec la voix du restaurateur. »
 *
 * IDENTIQUES : la page d'une copie lit la VRAIE fiche du restaurant dans la
 * base — son nom, ses photos, sa note, ses horaires, sa carte lue sur ses
 * photos — exactement comme sa page à lui. Voir `apercu/[slug]/page.tsx`.
 *
 * FAUSSES : elle n'écrit jamais rien dans cette fiche (ni vue, ni scan, ni
 * clic compté), et elle y ajoute ce que le restaurant n'a pas encore fait
 * lui-même : un plat du jour, son parcours en quatre étapes et sa voix. C'est
 * ce qu'on vient lui montrer — sa page, une fois habitée.
 *
 * EN DEHORS DE L'APPLICATION : ces cartes ne sont PAS dans le paquet de
 * `apercu-habitant.ts`. Le fil, la carte de la ville, les copains, le Direct
 * ne les voient jamais. Seuls ceux qui ont besoin d'ouvrir un commerce par son
 * identifiant — le parcours, sa voix, le double — les trouvent, par
 * `carteDuPaquet`.
 */
import { toutesLesCartes, VILLE, type CarteAutour } from "@/lib/direct/apercu-habitant";

const itineraire = (q: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${q} ${VILLE}`)}`;
/** Les photos de tapas sont dessinées — photographiées — par le moteur d'images : voir `bd-dessin.ts`. */
const genere = (id: string) => `/api/direct/bd/${id}`;

/* ═══ LE BORDEAUX — LE MAGRET FRITES MAISON ═══════════════════════════════
   « Comme sur la démo de /autour-de-moi » : le magret de Jean-Marie, sa voix
   enregistrée et ses quatre photos. Quatre étapes : le plat, la cuisson
   puis l'assiette (le rideau), sa voix qui raconte, et on vient. */
const BORDEAUX: CarteAutour = {
  id: "copie-bordeaux",
  branche: "restaurant",
  nom: "Le Bordeaux",
  metier: "Restaurant",
  ville: VILLE,
  itineraire: itineraire("Le Bordeaux"),
  metres: 300,
  distance: "300 m",
  photo: "/direct/table/magret/3.jpg",
  google: { note: "4,5", avis: 120 },
  fiche: {
    ou: "Dax",
    horaires: "Aujourd'hui, 12 h – 14 h et 19 h – 22 h",
    mot: "Cuisine maison, le magret frites qu'on vient chercher de loin.",
  },
  voix: {
    prenom: "Le chef",
    role: "cuisinier",
    signature: "Je quadrille la peau et je prends mon temps.",
    recit:
      "Bonjour. Bon, mon magret, je commence par quadriller la peau. Je le pose côté peau sur le gril, doucement, pour qu'elle devienne bien croustillante sans brusquer la viande. Pendant qu'il repose, je fais dorer les pommes de terre à la graisse de canard, avec de l'ail et du persil. Et au dernier moment, je tranche le magret. Vous avez le croustillant, le fondant… et l'odeur qui arrive avant l'assiette.",
    extrait: "/direct/voix/bergine-magret.mp3",
    photosVoix: [
      { src: "/direct/table/magret/1.jpg", mot: "Mon magret, je le commence côté peau.", fort: "côté peau" },
      { src: "/direct/table/magret/2.jpg", mot: "Je laisse la peau devenir bien croustillante.", fort: "bien croustillante" },
      { src: "/direct/table/magret/3.jpg", mot: "Rosé à cœur, avec ses pommes dorées.", fort: "Rosé à cœur" },
      { src: "/direct/table/magret/4.jpg", mot: "Je vous le prépare ce midi ?", fort: "ce midi ?" },
    ],
  },
  menu: {
    plat: "Magret frites maison",
    description: "Magret grillé côté peau, frites maison · Dessert du jour",
    prix: "19 €",
    photo: "/direct/table/magret/3.jpg",
    cadrage: "50%",
  },
  reponse: { cadeau: "Le café offert", texte: "Venez, je vous garde une table en terrasse.", tenu: "12 h 40", apres: 5 },
  moments: [
    {
      de: 12, a: 14, quand: "12 h – 14 h", icone: "🍽️",
      titre: "Magret frites maison",
      photo: "/direct/table/magret/2.jpg",
      lignes: ["Le plat du jour, en salle ou en terrasse", "Dernière commande à 13 h 45"],
      prix: "19 €", places: 8, action: "Réserver", envies: [],
      rappels: 4,
    },
    {
      de: 19, a: 22, quand: "19 h – 22 h", icone: "🌙",
      titre: "Le magret du soir",
      lignes: ["Même assiette, au calme", "Pensez à réserver le week-end"],
      prix: "19 €", places: 10, action: "Réserver", envies: [],
    },
  ],
};

/* ═══ EL TXUPINAZO — L'ASSIETTE DE TAPAS ══════════════════════════════════
   Aucune photo de tapas n'existe ici : le moteur d'images les fait, une fois,
   et le réseau les garde. Si le moteur échoue, chaque photo retombe sur une
   photo de bar de la démonstration — le parcours ne montre jamais de trou.
   Sa voix est la voix cloud, sur son récit, avec son timbre (`timbres.ts`). */
const TXUPINAZO: CarteAutour = {
  id: "copie-txupinazo",
  branche: "restaurant",
  nom: "El Txupinazo",
  metier: "Bar à tapas",
  ville: VILLE,
  itineraire: itineraire("El Txupinazo"),
  metres: 450,
  distance: "450 m",
  photo: genere("tapas-assiette"),
  google: { note: "4,1", avis: 989 },
  fiche: {
    ou: "Dax",
    horaires: "Aujourd'hui, 14 h 30 – 0 h 30",
    mot: "Bar y tapas : on pique ensemble au comptoir, sous le taureau du plafond.",
  },
  voix: {
    prenom: "Le patron",
    role: "au comptoir",
    signature: "Les tapas, ça se partage.",
    recit:
      "Ici, les tapas, ça se partage. Le matin, je coupe le jambon à la main, fin, presque transparent. Les croquetas, c'est la recette de la maison : je les roule une par une. Les pimientos, je les saisis juste, avec du gros sel. Et puis je compose l'assiette, un peu de tout, pour qu'on pique ensemble au comptoir, sous le taureau. Venez avec des amis : c'est meilleur à plusieurs.",
    photosVoix: [
      { src: genere("tapas-1"), mot: "Le jambon, coupé à la main.", fort: "à la main" },
      { src: genere("tapas-2"), mot: "Les croquetas, roulées une par une.", fort: "une par une" },
      { src: genere("tapas-3"), mot: "Les pimientos, juste saisis.", fort: "juste saisis" },
      { src: genere("tapas-4"), mot: "On la partage ce soir ?", fort: "ce soir ?" },
    ],
  },
  menu: {
    plat: "L'assiette de tapas à partager",
    description: "Jambon, croquetas, pimientos, tortilla, pan con tomate",
    prix: "16 €",
    photo: genere("tapas-assiette"),
    cadrage: "50%",
  },
  reponse: { cadeau: "Les pimientos offerts", texte: "Venez à plusieurs, je vous garde un bout de comptoir.", tenu: "19 h 30", apres: 5 },
  moments: [
    {
      de: 12, a: 15, quand: "12 h – 15 h", icone: "🍤",
      titre: "L'assiette de tapas à partager",
      photo: genere("tapas-comptoir"),
      lignes: ["Au comptoir ou en terrasse", "Pour deux, ou pour la bande"],
      prix: "16 €", places: 10, action: "Réserver", envies: [],
      rappels: 6,
    },
    {
      de: 19, a: 24, quand: "19 h – minuit", icone: "🍷",
      titre: "Tapas et verre de rouge",
      lignes: ["L'assiette et deux verres", "Le comptoir se remplit vers 21 h"],
      prix: "22 €", places: 12, action: "Réserver", envies: [],
    },
  ],
};

export type CopiePresentation = {
  /** L'adresse de la copie : `/site-internet/apercu/<slug>`. */
  slug: string;
  /** L'adresse de la VRAIE page, dont la copie lit la fiche sans jamais l'écrire. */
  source: string;
  /** Ce que la copie ajoute : le plat du jour, le parcours, la voix. */
  carte: CarteAutour;
};

export const COPIES_PRESENTATION: CopiePresentation[] = [
  { slug: "demo-le-bordeaux", source: "le-bordeaux-307d33", carte: BORDEAUX },
  { slug: "demo-el-txupinazo", source: "el-txupinazo-66acd5", carte: TXUPINAZO },
];

export function copieDePresentation(slug: string): CopiePresentation | null {
  return COPIES_PRESENTATION.find((c) => c.slug === slug) ?? null;
}

/**
 * UN COMMERCE PAR SON IDENTIFIANT : CELUI DU PAQUET, OU UNE COPIE.
 *
 * Le parcours, sa voix et le double cherchaient le commerce dans le seul
 * paquet ; ils passent maintenant par ici. Le fil, lui, continue de lire le
 * paquet seul — les copies n'y entrent jamais.
 */
export function carteDuPaquet(id: string): CarteAutour | undefined {
  return toutesLesCartes().find((c) => c.id === id) ?? COPIES_PRESENTATION.find((c) => c.carte.id === id)?.carte;
}

/**
 * LA PAGE DE LA COPIE : LA VRAIE FICHE, ET CE QU'ON Y AJOUTE.
 *
 * Tout ce que la vraie page montre est gardé — nom, photos, note, horaires,
 * sa carte. On ne remplace que l'identifiant (pour que le parcours, la voix et
 * le double trouvent la copie) et on ajoute le plat, le parcours, la voix et
 * la petite attention de la maison.
 */
export function fusionnerCopie(vraie: CarteAutour, copie: CarteAutour): CarteAutour {
  return {
    ...vraie,
    id: copie.id,
    voix: copie.voix,
    menu: copie.menu,
    moments: copie.moments,
    reponse: vraie.reponse ?? copie.reponse,
  };
}
