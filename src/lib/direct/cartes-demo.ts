// LES CARTES DU DIRECT MONTRÉES PENDANT LA DÉMONSTRATION.
//
// LE DÉFAUT QUE ÇA CORRIGE, ET IL EST GROS. La démonstration parlait du Direct
// sans jamais le montrer. Le commerçant entendait « votre menu part dans Le
// Direct » et voyait un encadré stylisé qui ne ressemblait à rien. Or c'est le
// mode swipe qui fait comprendre le système d'un seul coup d'œil : une carte
// plein écran, une photo, un prix, trois gestes. Tant qu'il ne l'a pas vu, il
// ne sait pas ce qu'on lui vend.
//
// TROIS RÈGLES GOUVERNENT CE FICHIER, ET AUCUNE N'EST NÉGOCIABLE :
//
//  1. AUCUN COMMERCE INVENTÉ N'EST NOMMÉ. Les cartes de l'acte 3 décrivent ce
//     que les habitants voient dans la ville — donc d'AUTRES commerces. Leur
//     donner un nom, ce serait fabriquer trois faux voisins ; leur donner LE
//     sien, ce serait lui faire croire qu'il y est déjà. Elles portent donc un
//     métier et une ville, et rien de plus.
//
//  2. SES CARTES À LUI NE DISENT QUE CE QU'IL A SAISI. Le menu vient de
//     `geste-du-jour`, les gestes de la journée de `acte-metier` — c'est-à-dire
//     des mêmes sources que le reste de la démonstration. Rien n'est réécrit
//     ici, sinon la promesse et le produit divergeraient au premier ajustement.
//
//  3. LES PHOTOS SONT LES SIENNES. Celles de sa fiche Google, déjà affichées
//     sur son site. Une image d'illustration achetée ailleurs serait plus jolie
//     et moins convaincante : ce qui frappe, c'est de voir SON commerce dans
//     l'écran de ses clients. Quand il n'en a aucune, la carte tombe sur un
//     fond dégradé et l'emoji du métier — jamais sur la photo d'un autre.
import type { CarteDirect } from "@/components/direct/carte-swipe";
import { estRestauration } from "@/lib/direct/mots-metier";

/**
 * LES SIX PHOTOS D'ILLUSTRATION — et le périmètre étroit de leur emploi.
 *
 * Elles ne servent qu'à deux choses : les cartes de la VILLE (qui décrivent
 * d'autres commerces que celui qui regarde), et le repli quand un commerçant
 * n'a aucune photo sur sa fiche Google. Partout ailleurs ce sont les SIENNES —
 * voir la règle 3 en tête de fichier.
 *
 * ELLES ÉTAIENT QUATRE, ET ÇA SE VOYAIT. Avec quatre images pour trois cartes
 * de ville et quatre temps de journée, les mêmes revenaient sans arrêt : « c'est
 * toujours les mêmes 3 photos qu'on voit ». Pire, deux moments manquaient
 * d'image JUSTE et tombaient sur une approximation — un invendu à emporter
 * montrait un magret à l'assiette, une table à partager montrait une vitrine
 * vide. Les deux nouvelles ne sont pas de la variété pour la variété : elles
 * disent ce que les deux autres ne savaient pas dire.
 *
 * Un fichier absent n'est pas une panne : la carte empile l'image sur un
 * dégradé, et c'est le dégradé qui reste. Voir `carte-swipe.tsx`.
 */
const PHOTOS = {
  plat: "/direct/plat-du-jour.jpg",
  tables: "/direct/tables-libres.jpg",
  four: "/direct/sortie-du-four.jpg",
  vitrine: "/direct/vitrine-du-soir.jpg",
  /** Une part soulevée d'un plat entamé : l'image de « il m'en reste ». */
  portion: "/direct/portion-a-emporter.jpg",
  /** Une tablée du soir : l'image d'une place qu'on partage, pas d'une salle vide. */
  tablee: "/direct/tablee-du-soir.jpg",
} as const;

/**
 * OÙ REGARDER DANS CHACUNE — vérifié en les posant dans le vrai cadre.
 *
 * Le sujet de trois d'entre elles est dans la moitié BASSE, c'est-à-dire sous
 * le voile qui porte le nom et le prix : les tables vides et les viennoiseries
 * disparaissaient presque entièrement. On descend donc le point de visée pour
 * remonter le sujet dans la zone lisible.
 *
 * La marge de manœuvre est limitée — ces images ne dépassent le cadre que de
 * 8 % en hauteur, on ne peut pas les recadrer beaucoup depuis ici. Un tirage
 * avec le sujet plus haut ferait mieux ; celui-ci fait déjà la différence.
 */
const CADRAGE: Record<string, string> = {
  [PHOTOS.plat]: "68%",
  [PHOTOS.tables]: "100%",
  [PHOTOS.four]: "100%",
  [PHOTOS.vitrine]: "72%",
  // CES DEUX-LÀ SONT DÉJÀ RECADRÉES AU FORMAT DU CADRE, et c'est pour ça
  // qu'elles ne demandent rien. Les tirages d'origine avaient leur sujet au
  // milieu — la part soulevée à 60 % de la hauteur, les visages de la tablée
  // sous un tiers de ciel vide — donc sous le voile qui porte le nom et le
  // prix. `object-position` ne pouvait pas les sauver : quand l'image et le
  // cadre ont presque le même rapport, il ne reste que 8 % de course, mesuré.
  // On a donc recadré les fichiers eux-mêmes autour du sujet. 50 % ici veut
  // dire « rien à corriger ».
  [PHOTOS.portion]: "50%",
  [PHOTOS.tablee]: "50%",
};
import type { GesteDuJour } from "@/lib/direct/geste-du-jour";
import type { TempsMetier } from "@/lib/direct/acte-metier";

/** Un temps de l'acte 7, tel qu'il s'affiche : un titre, sa phrase, sa carte. */
export type TempsIllustre = {
  /** L'heure, en gros au-dessus. C'est elle qui fait la journée. */
  heure: string;
  /** CE QU'IL PEUT FAIRE À CETTE HEURE-LÀ, en une question courte.
   *  Sans ce titre, les quatre cartes se lisaient comme quatre écrans de
   *  produit ; avec lui, comme quatre moments de sa journée. */
  titre: string;
  /** Ce que le commerçant dit — ou, pour la demande inversée, ce qu'il reçoit. */
  dit: string;
  /** Ce que ça donne dans Le Direct. */
  carte: CarteDirect;
  /** L'intitulé du geste attendu de l'habitant sur cette carte. */
  action: string;
  /**
   * LA COULEUR DE CE MOMENT DE LA JOURNÉE.
   *
   * LE DÉFAUT QU'ELLE CORRIGE. Les quatre temps s'enchaînaient dans exactement
   * la même livrée — même vert, même cadre, même composition — et seul le texte
   * changeait. En quatre secondes chacun, on ne lit pas quatre textes : on voit
   * quatre fois le même écran, et on conclut que le produit fait une seule
   * chose. La couleur n'est pas une décoration ici, c'est ce qui dit « on a
   * changé de moment ».
   *
   * Elle suit le SENS du geste, pas un cycle : l'ambre de l'ardoise, la brique
   * de ce qui allait à la poubelle, le bleu des places libres, le violet de la
   * demande qui vient vers lui.
   */
  teinte: string;
};

/**
 * JUSQU'À QUAND CETTE CARTE VAUT — ce que le sablier affiche.
 *
 * Ce ne sont pas des échéances calculées : l'acte 7 est une journée illustrée,
 * pas une publication réelle. Ce sont les limites que le produit pose lui-même
 * sur ces gestes (une carte du jour s'efface le soir, un invendu ne survit pas
 * à la nuit), écrites dans les mots de la carte. Un geste sans limite claire
 * n'affiche pas de sablier.
 */
const ECHEANCE_TEMPS: Record<string, string> = {
  carte: "Jusqu'à 14 h",
  arrivage: "Ce matin",
  reste: "Jusqu'à ce soir",
  creneau: "Ce soir",
  venir: "Jusqu'à midi",
  evenement: "",
};

/** La couleur de chaque geste — voir `teinte`. */
const TEINTE: Record<string, string> = {
  carte: "#F0B429",
  arrivage: "#F08A29",
  reste: "#D2604A",
  creneau: "#4EA8DE",
  fideles: "#E86AA6",
  realisation: "#7C5CFC",
  // Pas le vert du produit : c'est la couleur de tout le reste de l'écran, et
  // un temps qui la prend a l'air de ne pas en avoir.
  venir: "#38BDF8",
  evenement: "#9B7BFF",
  nouveaute: "#4ED2C0",
  horaires: "#8AA0B4",
};

/** Le mot d'action de l'habitant, dans les termes du métier. On ne « veut » pas
 *  une table, on la réserve ; on ne « réserve » pas une fournée, on la veut. */
export function motDAction(g: GesteDuJour): string {
  if (g.cherchent === "où manger") return "Je réserve";
  return "Je veux";
}

/**
 * ACTE 3 — CE QUE LES HABITANTS VOIENT EN OUVRANT LE DIRECT.
 *
 * Cinq cartes, aucun nom. Elles disent la VILLE, pas lui — et c'est
 * exactement ce qui rend l'acte suivant douloureux : il n'y est pas.
 */
export function cartesDeLaVille(ville: string): CarteDirect[] {
  // CE QU'UN HABITANT A BESOIN DE SAVOIR POUR CHOISIR, et rien d'autre.
  //
  // LE DÉFAUT. Les trois cartes disaient « Le menu du jour · Servi jusqu'à
  // 14 h » et « Ce qui vient de sortir du four · Depuis 7 h ». C'est joli et
  // ça ne décide rien : on ne sait pas ce qu'il y a dans l'assiette, ni
  // combien ça coûte, ni surtout si c'est à deux rues ou à l'autre bout de la
  // ville. À midi, la distance décide plus souvent que le prix — on ne
  // choisit pas un restaurant, on choisit un restaurant où on a le temps
  // d'aller. Chaque carte porte donc les PLATS, le PRIX, la DISTANCE et le
  // bouton qui y emmène.
  //
  // ET TOUTES PARLENT DU MÊME BESOIN : on cherche où manger. La boulangerie
  // y a sa place — mais par sa formule du midi, pas par sa fournée de 7 h, qui
  // répondait à une question que personne ne se pose à midi.
  //
  // ELLES ÉTAIENT TROIS, ELLES SONT CINQ. Le paquet tournait en boucle sur les
  // mêmes trois images pendant tout l'acte : au troisième geste on avait déjà
  // fait le tour, et Le Direct avait l'air d'une ville où il se passe trois
  // choses. Les deux ajoutées ne sont pas là pour meubler — elles montrent les
  // deux formes que les trois premières ne savaient pas montrer : ce qui reste
  // d'un service (à emporter, tout de suite, moins cher) et une place à une
  // table déjà occupée. Et la dernière est datée de CE SOIR, volontairement :
  // Le Direct n'est pas un déjeuner, c'est une journée.
  //
  // AUCUN COMMERCE N'EST NOMMÉ (règle 1 en tête de fichier) : ce sont les
  // voisins de celui qui regarde, et leur inventer une enseigne reviendrait à
  // fabriquer trois faux concurrents.
  const yAller = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(ville);
  return [
    {
      photo: PHOTOS.plat,
      cadrage: CADRAGE[PHOTOS.plat],
      nom: "Un restaurant du centre",
      metier: "Restaurant",
      ville,
      distance: "400 m",
      itineraire: yAller,
      reste: "Jusqu'à 14 h",
      icone: "🍽️",
      quoi: "Menu du jour",
      lignes: ["Garbure landaise", "Magret grillé", "Dessert maison"],
      prix: "19 €",
      social: "4 ont réservé",
    },
    {
      photo: PHOTOS.tables,
      cadrage: CADRAGE[PHOTOS.tables],
      nom: "Une table à deux rues",
      metier: "Restaurant",
      ville,
      distance: "250 m",
      itineraire: yAller,
      reste: "Ce midi",
      icone: "🕐",
      quoi: "Il reste 3 tables",
      lignes: ["Plat + dessert", "Service jusqu'à 13 h 45"],
      prix: "16 €",
      social: "1 a réservé",
    },
    {
      photo: PHOTOS.four,
      cadrage: CADRAGE[PHOTOS.four],
      nom: "Une boulangerie",
      metier: "Boulangerie",
      ville,
      distance: "600 m",
      itineraire: yAller,
      reste: "Jusqu'à 14 h",
      icone: "🥪",
      quoi: "Formule du midi",
      lignes: ["Sandwich au choix", "Boisson + dessert"],
      prix: "8,50 €",
      social: "9 l'ont vu passer",
    },
    {
      photo: PHOTOS.portion,
      cadrage: CADRAGE[PHOTOS.portion],
      nom: "Une cuisine à emporter",
      metier: "Restaurant",
      ville,
      distance: "180 m",
      itineraire: yAller,
      // Pas une heure : une quantité. C'est ce qui distingue un invendu d'un
      // menu — il ne finit pas à 14 h, il finit quand il n'y en a plus.
      reste: "Jusqu'à épuisement",
      icone: "🔥",
      quoi: "Dernières portions",
      lignes: ["Lasagnes maison", "À emporter, prêtes tout de suite"],
      prix: "8 €",
      social: "3 en ont pris",
    },
    {
      photo: PHOTOS.tablee,
      cadrage: CADRAGE[PHOTOS.tablee],
      nom: "Une grande table ce soir",
      metier: "Restaurant",
      ville,
      distance: "320 m",
      itineraire: yAller,
      reste: "Ce soir, 20 h",
      icone: "👥",
      quoi: "Table à partager",
      lignes: ["6 places, on s'assoit ensemble", "Plat + verre compris"],
      prix: "17 €",
      social: "4 places déjà prises",
    },
  ];
}

/** Un moment de la journée vu du trottoir : l'heure, la rubrique, la carte. */
export type MomentHabitant = {
  /** L'heure qu'il est. C'est elle qui raconte, pas la carte. */
  heure: string;
  /** CE QUE LA VILLE PROPOSE À CETTE HEURE-LÀ, en trois mots.
   *  Sans cette ligne, on lit quatre commerces ; avec elle, on lit une ville
   *  qui change de contenu au fil de la journée. */
  rubrique: string;
  /** La couleur du moment — la même grammaire que partout ailleurs. */
  teinte: string;
  carte: CarteDirect;
};
// PAS DE LIBELLÉ DE BOUTON ICI, et c'est voulu. L'écran montré rend les VRAIS
// gestes du produit (`GestesDirect`), dont le mot du milieu suit le métier —
// « Je réserve » en restauration. Écrire « J'en prends une » ferait plus vivant
// et montrerait un bouton qui n'existe pas.

/**
 * LA JOURNÉE VUE DU TROTTOIR — ce qu'un habitant trouve dans Le Direct, heure
 * par heure.
 *
 * POURQUOI CE DEUXIÈME POINT DE VUE EXISTE. Toute la démonstration, et toute la
 * page d'accueil, sont écrites du côté du commerçant : ce qu'il dit, ce que ça
 * devient. Ça explique le mécanisme et ça laisse entière la seule question
 * qu'il se pose vraiment — « est-ce que quelqu'un regarde ? ». Personne n'y
 * répond en l'affirmant. On y répond en montrant l'autre bout du fil : un
 * téléphone, dans la rue, à midi.
 *
 * ET C'EST LE MÊME TÉLÉPHONE QUI CHANGE, pas quatre écrans différents. C'est
 * tout l'argument : un annuaire ne peut pas faire ça, par construction. Google
 * sait qui existe ; il ne sait pas qu'il reste huit parts de lasagnes à 14 h.
 * La démonstration ne le dit pas, elle le fait voir — d'où les quatre heures,
 * dans l'ordre, sur un seul appareil.
 *
 * CE QU'ON NE MONTRE PAS, ET C'EST DÉLIBÉRÉ. Pas de recherche par envie
 * (« j'ai envie d'italien »), pas de filtre par prix, pas de « 37 personnes
 * cherchent italien demain midi », pas d'alerte quand un commerce publie. Rien
 * de tout ça n'existe dans le produit : il n'y a ni typage de cuisine, ni
 * recherche en langage naturel, ni demande d'habitant enregistrée. C'est la
 * règle qui gouverne toute la démonstration — on ne montre jamais un écran qui
 * n'existe pas, parce que le commerçant qui signe dessus le réclame la semaine
 * suivante.
 *
 * AUCUN COMMERCE N'EST NOMMÉ, comme à l'acte 3 : ce sont les voisins de celui
 * qui lit, et leur inventer une enseigne reviendrait à fabriquer des
 * concurrents.
 */
export function momentsDeLaJournee(ville: string): MomentHabitant[] {
  const yAller = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(ville);
  const socle = { metier: "Restaurant", ville, itineraire: yAller };
  return [
    {
      heure: "12 h 05",
      rubrique: "Les menus du jour",
      teinte: "#F0B429",
      carte: {
        ...socle,
        photo: PHOTOS.plat,
        cadrage: CADRAGE[PHOTOS.plat],
        nom: "Un restaurant du centre",
        distance: "400 m",
        reste: "Servi jusqu'à 14 h",
        icone: "🍽️",
        quoi: "Menu du jour",
        lignes: ["Garbure landaise", "Magret grillé", "Dessert maison"],
        prix: "19 €",
        social: "4 ont réservé",
      },
    },
    {
      // L'HEURE CHARNIÈRE DE TOUTE LA PAGE. C'est ici que la phrase du
      // restaurateur, montrée plus haut — « Il me reste 8 lasagnes maison. » —
      // réapparaît dans le téléphone de quelqu'un d'autre. Les deux moitiés de
      // la boucle se rejoignent sur cette carte, et sur aucune autre.
      heure: "14 h 10",
      rubrique: "Ce qui reste du service",
      teinte: "#D2604A",
      carte: {
        ...socle,
        photo: PHOTOS.portion,
        cadrage: CADRAGE[PHOTOS.portion],
        nom: "Une cuisine à emporter",
        distance: "180 m",
        reste: "Jusqu'à épuisement",
        icone: "🔥",
        quoi: "Dernières portions",
        lignes: ["Lasagnes maison", "À emporter, prêtes tout de suite"],
        prix: "8 €",
        etiquette: "IL EN RESTE 8",
        social: "3 en ont pris",
      },
    },
    {
      heure: "18 h 50",
      rubrique: "Les tables encore libres",
      teinte: "#4EA8DE",
      carte: {
        ...socle,
        photo: PHOTOS.tables,
        cadrage: CADRAGE[PHOTOS.tables],
        nom: "Une table à deux rues",
        distance: "250 m",
        reste: "Ce soir",
        icone: "🕐",
        quoi: "Il reste 4 tables",
        lignes: ["Service de 19 h à 22 h", "Plat + dessert"],
        prix: "24 €",
        social: "2 ont réservé",
      },
    },
    {
      heure: "19 h 30",
      rubrique: "Les tables à partager",
      teinte: "#9B7BFF",
      carte: {
        ...socle,
        photo: PHOTOS.tablee,
        cadrage: CADRAGE[PHOTOS.tablee],
        nom: "Une grande table ce soir",
        distance: "320 m",
        reste: "Ce soir, 20 h",
        icone: "👥",
        quoi: "Table à partager",
        lignes: ["6 places, on s'assoit ensemble", "Plat + verre compris"],
        prix: "17 €",
        social: "4 places déjà prises",
      },
    },
  ];
}

/**
 * ACTE 5 — SA CARTE À LUI, telle qu'elle apparaît une fois la photo prise.
 *
 * C'est le moment de bascule de toute la démonstration : le même contenu qu'il
 * vient de photographier, mais dans l'écran de ses clients.
 */
export function saCarte(
  g: GesteDuJour,
  nom: string,
  metierLabel: string,
  ville: string,
  photo?: string
): CarteDirect {
  // Sa photo d'abord. Sans elle, une illustration qui correspond à ce qu'il
  // vient de photographier — et hors restauration, la vitrine, qui ne montre le
  // métier de personne en particulier.
  const repli = g.cherchent === "où manger"
    ? PHOTOS.plat
    : /boulanger|pâtissier|patissier/i.test(metierLabel)
      ? PHOTOS.four
      : PHOTOS.vitrine;
  return {
    photo: photo || repli,
    // Le cadrage n'est connu que pour NOS illustrations : celles du commerçant
    // gardent le centre, faute de savoir ce qu'elles montrent.
    cadrage: photo ? undefined : CADRAGE[repli],
    nom,
    metier: metierLabel,
    ville,
    reste: g.heure === "11 h" ? "Jusqu'à 14 h" : "Aujourd'hui",
    icone: g.cherchent === "où manger" ? "🍽️" : "✨",
    quoi: g.extrait.titre,
    lignes: g.extrait.lignes,
    prix: g.extrait.prix || undefined,
  };
}

/**
 * CE QUE L'HABITANT LIT SUR LA CARTE.
 *
 * PAS L'INTITULÉ DU BOUTON DE L'ESPACE PRO. « Montrer ma carte du jour » est ce
 * que le COMMERÇANT appuie ; sur la carte reçue par le client, ça se lit comme
 * une consigne adressée à lui. Le fait est le même, le point de vue change —
 * c'est la même règle que partout ailleurs dans cette démonstration : il parle,
 * elle écrit, et ce qui sort est écrit pour celui qui va le lire.
 */
const VU_PAR_HABITANT: Record<string, string> = {
  carte: "Le menu du jour",
  arrivage: "Arrivé ce matin",
  reste: "Il en reste",
  creneau: "Il reste des places",
  fideles: "Pour les habitués",
  realisation: "Vient d'être terminé",
  venir: "Aujourd'hui seulement",
  // Les trois gestes occasionnels manquaient : ils ne sont jamais montrés dans
  // l'acte 7 (qui ne raconte qu'une journée ordinaire), mais ils sont bel et
  // bien proposés dans « Créer une annonce d'essai ». Sans eux, la carte
  // reprenait l'intitulé du bouton du commerçant — « Annoncer un événement » —
  // sur l'écran de son client.
  nouveaute: "Nouveau ici",
  evenement: "À ne pas manquer",
  horaires: "Bon à savoir",
};

/**
 * L'IMAGE DE REPLI, quand le commerçant n'a aucune photo sur sa fiche Google.
 *
 * ELLE SUIT LE GESTE **ET** LE MÉTIER, et il a fallu les deux. La première
 * version ne regardait que le geste : un coiffeur qui annonçait ses créneaux
 * libres recevait la photo d'une SALLE DE RESTAURANT, parce que c'est l'image
 * rangée sous « des places restent libres ». C'est exactement le défaut qu'on
 * traque depuis le début de cette démonstration — montrer au commerçant le
 * commerce d'à côté — et il était réintroduit par la porte de derrière.
 *
 * Les quatre illustrations disponibles parlent toutes de restauration ou de
 * boulangerie, sauf la vitrine. Hors de ces deux métiers, c'est donc la vitrine
 * qui sert, systématiquement : elle n'est jamais juste, mais elle n'est jamais
 * FAUSSE. Une image approximative se pardonne ; une image qui montre un autre
 * métier détruit l'argument.
 */
function photoDeRepli(cle: string, resto: boolean, boulangerie: boolean): string {
  if (resto) {
    if (cle === "carte") return PHOTOS.plat;
    // « IL M'EN RESTE » A ENFIN SON IMAGE. Ce geste tombait sur la photo du
    // plat du jour — un magret dressé à l'assiette — pour dire « dernières
    // portions de lasagnes à emporter ». L'image contredisait le texte juste
    // au-dessus d'elle, et c'est l'image qu'on croit. Une part soulevée d'un
    // plat déjà entamé dit la même chose que le texte : il en reste, et on
    // l'emporte.
    if (cle === "reste") return PHOTOS.portion;
    // Une salle vide pour des places libres, une tablée pour un moment qu'on
    // partage : ce n'est pas la même promesse, et ce n'était pas la même photo
    // qui manquait.
    if (cle === "creneau") return PHOTOS.tables;
    if (cle === "evenement" || cle === "venir" || cle === "fideles") return PHOTOS.tablee;
    return PHOTOS.vitrine;
  }
  if (boulangerie && (cle === "arrivage" || cle === "carte" || cle === "reste")) return PHOTOS.four;
  return PHOTOS.vitrine;
}

/** L'emoji d'ambiance de chaque geste, quand il n'y a pas de photo à mettre. */
const ICONE_TEMPS: Record<string, string> = {
  carte: "🍽️",
  arrivage: "🚚",
  reste: "🥘",
  creneau: "🕐",
  fideles: "❤️",
  realisation: "📸",
  venir: "🎉",
  nouveaute: "✨",
  evenement: "🎪",
  horaires: "🕘",
};

/**
 * CE QU'IL PEUT FAIRE À CETTE HEURE-LÀ, en une question.
 *
 * C'est le titre demandé au-dessus de chaque carte de l'acte 7 : quatre écrans
 * qui s'enchaînent sans titre se lisent comme un catalogue de fonctions, et le
 * commerçant décroche exactement là où on voulait qu'il se reconnaisse.
 */
const TITRE_TEMPS: Record<string, string> = {
  carte: "Votre carte du jour",
  arrivage: "Votre arrivage du matin",
  reste: "Il vous en reste ?",
  creneau: "Vous avez des places vides ?",
  fideles: "Un geste pour vos habitués ?",
  realisation: "Vous venez de terminer un beau travail ?",
  venir: "Une demi-heure à remplir ?",
  evenement: "Un événement à annoncer ?",
  nouveaute: "Une nouveauté à montrer ?",
  horaires: "Un horaire qui change ?",
};

/**
 * « CRÉER UNE ANNONCE D'ESSAI » — l'annonce qu'il vient de composer, DANS LE DIRECT.
 *
 * LE DÉFAUT QUE ÇA CORRIGE. Le parcours d'essai se terminait sur un encadré
 * maison : sa photo en fond, son texte par-dessus, deux pastilles « Votre
 * site » et « Catalogue ». Joli, et sans rapport avec ce que ses clients
 * verront réellement — c'est-à-dire la carte du mode swipe, la même que dans
 * la démonstration, la même que dans le fil de la ville. Il cliquait sur une
 * proposition et n'apprenait pas ce qu'il obtiendrait.
 *
 * On lui montre donc l'objet, pas une représentation de l'objet. Et comme il
 * n'existe qu'un seul composant de carte, la promesse ne peut plus diverger du
 * produit : le jour où la carte change, elle change ici aussi.
 *
 * CE QUI EST ÉCRIT DESSUS reste ce que le moteur a produit — `brief()`, mot
 * pour mot. Rien n'est reformulé ici.
 */
export function carteDAnnonce(opts: {
  /** La clé de l'intention choisie (`carte`, `reste`, `creneau`…). */
  cle: string;
  /** L'emoji de l'intention — le secours quand la clé n'a pas d'icône à elle. */
  emoji: string;
  /** L'annonce construite, telle qu'elle sera diffusée. */
  annonce: string;
  nom: string;
  metierLabel: string;
  ville: string;
  /** SA photo. Sans elle, une illustration cohérente avec le geste et le métier. */
  photo?: string;
  /** L'échéance déjà mise en forme (« jusqu'à 14 h »), si le moteur en calcule une. */
  reste?: string;
}): CarteDirect {
  const resto = estRestauration(opts.metierLabel);
  const boulangerie = /boulanger|pâtissier|patissier|viennoiserie/i.test(opts.metierLabel);
  const repli = photoDeRepli(opts.cle, resto, boulangerie);
  return {
    photo: opts.photo || repli,
    cadrage: opts.photo ? undefined : CADRAGE[repli],
    nom: opts.nom,
    metier: opts.metierLabel,
    ville: opts.ville,
    reste: opts.reste || undefined,
    icone: ICONE_TEMPS[opts.cle] || opts.emoji,
    // Jamais `intention.action` : « Montrer ma carte du jour » est ce que LE
    // COMMERÇANT appuie. Sur l'écran de son client, ça se lit comme un ordre.
    quoi: VU_PAR_HABITANT[opts.cle] || "En ce moment",
    lignes: opts.annonce ? [opts.annonce] : undefined,
  };
}

/**
 * LE MOT D'ACTION, déduit du seul métier.
 *
 * `motDAction` a besoin du geste du jour, que le parcours d'annonce d'essai n'a
 * pas : il part d'une intention, pas d'une journée. Le métier suffit — c'est
 * déjà lui qui décide dans l'autre fonction.
 */
export function motDActionMetier(metierLabel: string): string {
  return estRestauration(metierLabel) ? "Je réserve" : "Je veux";
}

/**
 * ACTE 7 — LA JOURNÉE, HEURE PAR HEURE, ILLUSTRÉE DANS LE DIRECT.
 *
 * Chaque temps de `acte-metier` devient un écran : l'heure, ce qu'il peut
 * faire, ce qu'il dit, et la carte que ses clients reçoivent. L'annonce
 * affichée sur la carte est celle que produit le VRAI moteur du produit — pas
 * une reformulation écrite ici.
 */
export function tempsIllustres(
  temps: TempsMetier[],
  g: GesteDuJour,
  nom: string,
  metierLabel: string,
  ville: string,
  photos: string[]
): TempsIllustre[] {
  const action = motDAction(g);
  const resto = g.cherchent === "où manger";
  // Le pain sort d'un four ; les fleurs, non. Faute de savoir distinguer les
  // deux depuis ici, on ne sert la photo du four qu'à ceux dont le métier le
  // dit en toutes lettres.
  const boulangerie = /boulanger|pâtissier|patissier|viennoiserie/i.test(metierLabel);
  // AUCUN TEMPS NE REPREND L'IMAGE DU PRÉCÉDENT.
  //
  // L'intention était déjà écrite ici — « la même image quatre fois de suite
  // donne l'impression que rien ne se passe » — mais elle ne tenait que pour
  // SES photos. Sur le repli, elle tombait : le geste « carte du jour » et le
  // geste « il m'en reste » sont tous deux rangés sous la photo du plat, donc
  // deux des quatre écrans étaient rigoureusement identiques. Mesuré au
  // navigateur sur un restaurant sans photo : 11 h et 14 h, même image.
  //
  // On tient donc un registre. Quand l'image juste est déjà prise, on descend
  // dans les autres illustrations. Une image approximative se pardonne ; deux
  // fois la même fait croire que le produit ne fait qu'une chose.
  //
  // MAIS LE MÉTIER PASSE AVANT LA VARIÉTÉ, et la première version l'avait
  // oublié : en cherchant une image inédite, un restaurant qui annonçait ses
  // tables libres recevait la photo d'un four à viennoiseries. C'est le défaut
  // qu'on traque depuis le début — montrer au commerçant le commerce d'à côté —
  // et il rentrait par la porte de derrière une deuxième fois. La substitution
  // ne sort donc JAMAIS des images de son métier.
  //
  // Quand le vivier est épuisé, on reprend la PLUS ANCIENNE : une image
  // revient, mais jamais deux fois de suite. Une répétition à trois écrans
  // d'écart ne se remarque pas ; deux écrans identiques à la suite, si.
  //
  // POUR LA RESTAURATION, LE VIVIER NE SE VIDE PLUS. Il tenait trois images
  // pour quatre temps : la quatrième était forcément une reprise. Avec la part
  // à emporter et la tablée du soir il en tient cinq, et les quatre écrans de
  // la journée sont désormais quatre images différentes — vérifié au
  // navigateur sur un restaurant sans photo Google.
  const vivier = resto
    ? [PHOTOS.plat, PHOTOS.portion, PHOTOS.tablee, PHOTOS.tables, PHOTOS.vitrine]
    : boulangerie
      ? [PHOTOS.four, PHOTOS.vitrine]
      : [PHOTOS.vitrine];
  // Les images déjà servies, de la plus ancienne à la plus récente.
  const servies: string[] = [];
  const servir = (img: string) => {
    const deja = servies.indexOf(img);
    if (deja >= 0) servies.splice(deja, 1);
    servies.push(img);
    return img;
  };
  /** L'image de ce temps : la sienne, sinon l'illustration la moins vue. */
  const imagePour = (cle: string, sienne?: string): string => {
    if (sienne && !servies.includes(sienne)) return sienne;
    const voulue = photoDeRepli(cle, resto, boulangerie);
    if (!servies.includes(voulue)) return voulue;
    return vivier.find((p) => !servies.includes(p)) ?? servies[0];
  };
  return temps.map((t, i) => {
    // SES photos d'abord ; l'illustration seulement s'il n'en a pas assez.
    const sienne = photos.length ? photos[i % photos.length] : undefined;
    const photo = servir(imagePour(t.cle, sienne));
    // Le cadrage n'est connu que pour NOS illustrations : les siennes gardent
    // le centre, faute de savoir ce qu'elles montrent.
    const cadrage = photo === sienne ? undefined : CADRAGE[photo];

    // LE TEMPS « DEMANDE INVERSÉE » A DISPARU avec la fonction qu'il décrivait
    // (voir `acte-metier.ts`) : c'était le seul écran de la démonstration à
    // montrer quelque chose qui n'existe pas dans le produit.
    return {
      heure: t.heure,
      titre: TITRE_TEMPS[t.cle] || t.label,
      dit: t.dis,
      action,
      teinte: TEINTE[t.cle] || "#3DE2A6",
      carte: {
        photo,
        cadrage,
        nom,
        metier: metierLabel,
        ville,
        // LE SABLIER DIT COMBIEN DE TEMPS IL RESTE, pas quelle heure il est.
        // On y posait l'heure du geste : la carte publiée à 10 h affichait
        // « ⏳ 10 h », c'est-à-dire, pour qui la lit, « ça se termine à 10 h ».
        // L'heure du geste est déjà écrite en grand au-dessus de la carte ;
        // ici, ou bien on connaît l'échéance, ou bien on ne met rien.
        reste: ECHEANCE_TEMPS[t.cle] || "",
        icone: ICONE_TEMPS[t.cle] || t.emoji,
        quoi: VU_PAR_HABITANT[t.cle] || t.label,
        lignes: [t.annonce],
      },
    };
  });
}
