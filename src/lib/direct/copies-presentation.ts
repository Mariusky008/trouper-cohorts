/**
 * 🎬 TROIS VRAIS COMMERCES, EN COPIE DE PRÉSENTATION.
 *
 * « Il va me falloir deux exemples identiques à l'identique mais faux de Le
 * Bordeaux et d'El Txupinazo. Ils vont servir à faire mes présentations avec
 * des parcours (expérience) déjà mis en situation… complètement en dehors de
 * l'application… avec tous les boutons fonctionnels… le parcours complet en
 * quatre étapes comme sur la démo, avec la voix du restaurateur. »
 * Puis : « Idem pour Oxygène by Alexis… avec plusieurs coupes de coiffure
 * femme et homme. »
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
    citation: "Ce plat, c'est celui que je cuisine quand mes amis viennent manger.",
    citationFort: "quand mes amis viennent manger.",
    // SA PHOTO, DONNÉE POUR L'ÉTAPE 3 (« L'accueil ») — son fantôme y est
    // assis à la table, repris de la maquette 3 au pixel près.
    photoChef: "/direct/table/restaurant/chef-fantome.webp",
    fantomeDansLaPhoto: { x: 0.655, y: 0.33, l: 0.33, h: 0.26 },
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
    // LE MAGRET SERVI, SON FANTÔME DERRIÈRE L'ASSIETTE : la maquette 2.
    scene: "/direct/table/restaurant/scene-magret.webp",
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

/* ═══ OXYGÈNE BY ALEXIS — LES COUPES À ESSAYER, FEMME ET HOMME ═════════════
   « Idem pour Oxygène by Alexis, à dupliquer pour faire une présentation
   avec plusieurs coupes de coiffure femme et homme. »

   Un salon mixte, rue des Carmes : son Expérience est l'essayage — on se
   prend en photo, on choisit une coupe, on se voit avec. Six coupes de femme,
   quatre d'homme, toutes sur des photos du projet. Chaque description est
   écrite DEVANT sa photo, pas d'après le nom : c'est la cible que l'essai
   reproduit (voir le carré long de `fantomes.ts`, et pourquoi).

   LES PRIX SONT CEUX D'UNE PRÉSENTATION, pas les siens : c'est la part
   « fausse » de la copie, comme le magret du Bordeaux. */
const coupe = (id: string, nom: string, prix: string, photo: string, decrire: string, rayon: string) => ({
  id: `oxy-${id}`, rayon, nom, prix, photo, decrire,
});
const FEMME = "Coupes femme";
const HOMME = "Coupes homme";
const OXYGENE: CarteAutour = {
  id: "copie-oxygene",
  branche: "coiffeur",
  nom: "Oxygène by Alexis",
  metier: "Coiffeur",
  ville: VILLE,
  itineraire: itineraire("Oxygène by Alexis 25 rue des Carmes"),
  metres: 350,
  distance: "350 m",
  photo: "/direct/accueil/coiffure-apres.jpg",
  // SA PAGE NE PROPOSE QUE SES COUPES : aucune du modèle ne s'y glisse, même
  // sans base (voir `seulementLesSiennes`).
  vraiePage: true,
  fiche: {
    ou: "25 rue des Carmes, Dax",
    horaires: "Du lundi au vendredi, 9 h – 18 h 30 · le samedi, 9 h – 17 h 30",
    mot: "Salon mixte : coupes, couleurs, mèches et extensions — et la barbe.",
  },
  catalogue: [
    coupe("carre-court", "Carré court, pointes rentrées", "42 €", "/direct/accueil/coiffure-apres.jpg",
      "un carré brun foncé qui s'arrête à la mâchoire, avec une raie légèrement sur le côté, des pointes qui rentrent vers l'intérieur, du volume souple sur les côtés et rien qui touche les épaules", FEMME),
    coupe("carre-long", "Carré long, mèches qui s'ouvrent", "45 €", "/direct/coiffure-femme-face.jpg",
      "un carré noir très foncé qui s'arrête à la base du cou, nettement au-dessus des épaules, avec une raie au milieu, des mèches souples qui s'ouvrent autour du visage, du volume arrondi sur les côtés, des pointes qui rentrent vers l'intérieur au niveau du cou, et aucune longueur qui descende sur les épaules", FEMME),
    coupe("mi-long", "Mi-long dégradé", "45 €", "/direct/accueil/moi-coiffure-apres.jpg",
      "des cheveux brun foncé, lisses, qui tombent juste sur les épaules, avec une raie au milieu, un dégradé léger qui allège les pointes et des longueurs qui encadrent le visage", FEMME),
    coupe("balayage", "Balayage blond, longueurs ondulées", "120 €", "/direct/accueil/coiffure-avant.jpg",
      "de longs cheveux ondulés qui descendent sous la poitrine, raie au milieu, un balayage blond doré lumineux avec des racines un peu plus foncées et des ondulations souples et larges", FEMME),
    coupe("boucles", "Boucles longues, frange", "68 €", "/direct/coiffure1.jpg",
      "des cheveux très bouclés en petites boucles serrées, blond caramel, très volumineux, tombant jusqu'aux épaules, avec une frange bouclée qui couvre le front", FEMME),
    coupe("cuivre", "Carré cuivré, dégradé", "95 €", "/direct/coiffure2.jpg",
      "un carré dégradé au niveau du menton, très volumineux et ondulé, couleur cuivre roux, avec une frange épaisse", FEMME),
    coupe("classique", "Coupe courte, dessus texturé", "24 €", "/direct/essai/coif-barbier-avant.jpg",
      "une coupe courte masculine, cheveux châtains de trois à quatre centimètres sur le dessus, coiffés en mouvement vers l'avant et sur le côté, côtés et nuque courts", HOMME),
    coupe("boucles-homme", "Boucles sur le dessus", "26 €", "/direct/essai/coif-barbier-apres.jpg",
      "une coupe masculine aux boucles châtain bien dessinées et volumineuses sur le dessus, d'environ six centimètres, avec des côtés nettement plus courts", HOMME),
    coupe("boucles-courtes", "Boucles courtes, de face", "26 €", "/direct/coiffure-homme-face.jpg",
      "une coupe courte masculine, cheveux bouclés d'environ cinq centimètres sur le dessus, nuque et côtés plus courts, pas de raie marquée", HOMME),
    coupe("motif", "Dégradé et motif rasé", "30 €", "/direct/avis-coupe.jpg",
      "un motif géométrique rasé à la tondeuse dans les cheveux très courts de la nuque et du côté du crâne", HOMME),
  ],
  /* SON MUR : « Voir les coupes faites dans ce salon ». Le modèle y mettait
     Hugo et Léo sur le motif rasé, et une photo de fauteuil vide ; ici, des
     clientes et des clients sur SES coupes, femme et homme. Les prénoms sont
     inventés, comme tout ce que la copie ajoute. */
  murDuLieu: {
    maison: [
      { id: "oxy-m-1", qui: "Le salon", role: "Coiffure mixte", maison: true, photo: "/direct/accueil/coiffure-avant.jpg",
        mot: "Balayages et extensions : essayez la couleur sur vous avant de venir ✨", heure: "09:05", interesses: 7 },
      { id: "oxy-m-2", qui: "Le salon", role: "Accueil", maison: true, photo: "/direct/essai/coif-barbier-apres.jpg",
        mot: "Un fauteuil se libère à 16 h, coupe homme et barbe.", heure: "11:30", interesses: 3 },
    ],
    clients: [
      { id: "oxy-c-1", qui: "Sarah", photo: "/direct/accueil/coiffure-apres.jpg",
        essai: { quoi: "Carré court, pointes rentrées", verdict: "pris", note: 5 },
        mot: "Essayé hier soir, rendez-vous pris pour samedi !", heure: "10:12", humeur: "decouvre", interesses: 8, jusqua: "encore 2 jours" },
      { id: "oxy-c-2", qui: "Thomas", photo: "/direct/essai/coif-barbier-apres.jpg",
        essai: { quoi: "Boucles sur le dessus", verdict: "pris", note: 5 },
        mot: "Je n'osais pas laisser pousser. Maintenant si.", heure: "10:47", humeur: "decouvre", interesses: 5, jusqua: "encore 2 jours" },
      { id: "oxy-c-3", qui: "Julie", photo: "/direct/accueil/coiffure-avant.jpg",
        essai: { quoi: "Balayage blond, longueurs ondulées", verdict: null, note: 4 },
        mot: "J'hésite entre ça et le carré. Vos avis ?", heure: "12:05", humeur: "hesite", interesses: 6, jusqua: "encore 2 jours" },
      { id: "oxy-c-4", qui: "Nadia", photo: "/direct/coiffure2.jpg",
        essai: { quoi: "Carré cuivré, dégradé", verdict: "pris", note: 5 },
        mot: "Le cuivré sur moi, je n'y aurais jamais pensé.", heure: "14:20", humeur: "decouvre", interesses: 9, jusqua: "encore 2 jours" },
      { id: "oxy-c-5", qui: "Hugo", photo: "/direct/avis-coupe.jpg",
        essai: { quoi: "Dégradé et motif rasé", verdict: null, note: 4 },
        mot: "Motif ou pas motif ? Dites-moi.", heure: "15:02", humeur: "hesite", interesses: 4, jusqua: "encore 2 jours" },
    ],
  },
  reponse: { cadeau: "Le soin profond offert", texte: "Un fauteuil se libère, je vous prends dès votre arrivée.", tenu: "dans 30 min", apres: 5 },
  moments: [
    {
      de: 9, a: 18.5, quand: "aujourd'hui", icone: "💇‍♀️",
      titre: "Le carré, pointes rentrées",
      photo: "/direct/accueil/coiffure-apres.jpg",
      lignes: ["Shampoing, coupe, brushing", "Environ 45 minutes"],
      prix: "42 €", action: "Réserver", envies: [],
    },
    {
      de: 9, a: 18.5, quand: "aujourd'hui", icone: "✂️",
      titre: "Coupe homme et barbe",
      photo: "/direct/essai/coif-barbier-apres.jpg",
      lignes: ["Tondeuse, ciseaux, barbe taillée", "Environ 30 minutes"],
      prix: "32 €", action: "Réserver", envies: ["homme"],
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
  { slug: "demo-oxygene-by-alexis", source: "oxygene-by-alexis-a3e21b", carte: OXYGENE },
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
 * le double trouvent la copie) et on ajoute ce que la copie apporte : le
 * plat, le parcours, la voix, les coupes à essayer, la petite attention.
 */
export function fusionnerCopie(vraie: CarteAutour, copie: CarteAutour): CarteAutour {
  return {
    ...vraie,
    id: copie.id,
    voix: copie.voix ?? vraie.voix,
    menu: copie.menu ?? vraie.menu,
    moments: copie.moments ?? vraie.moments,
    reponse: vraie.reponse ?? copie.reponse,
    /* SES COUPES À ESSAYER D'ABORD, PUIS SES VRAIS TARIFS : l'onglet des
       tarifs garde tout ce que sa fiche dit, et l'essayage ne propose que ce
       qui a une photo — les coupes de la copie. */
    catalogue: copie.catalogue ? [...copie.catalogue, ...(vraie.catalogue ?? [])] : vraie.catalogue,
    murDuLieu: copie.murDuLieu ?? vraie.murDuLieu,
  };
}
