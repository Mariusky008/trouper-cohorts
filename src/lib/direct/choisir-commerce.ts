/**
 * 🎯 L'ÉCRAN DE DÉPART : ON CHOISIT UNE CATÉGORIE, PUIS UN COMMERÇANT.
 *
 * ═══ CE QU'IL A DEMANDÉ ════════════════════════════════════════════════════
 *
 * « J'ai revu l'écran de démarrage de l'app démo pour qu'elle soit plus claire
 * et gamifiée. Je t'ai mis pour chaque catégorie (5 au total) les screenshots
 * respectifs : quand on appuie sur un des 5 pictogrammes on arrive sur les
 * commerçants — disons qu'on en a 4 ou 5 qu'on peut faire défiler à droite ou
 * à gauche — et quand l'un de ces commerçants nous plaît, alors le parcours en
 * plusieurs étapes commencera, mais ça sera la partie 2. Pour le moment
 * concentrons-nous sur cette première étape où on choisit un commerçant de la
 * catégorie que nous voulons. »
 *
 * ═══ POURQUOI CE FICHIER NE CONTIENT PRESQUE PAS DE TEXTE DE COMMERCE ══════
 *
 * IL DÉCLARE QUI EST DANS QUELLE CATÉGORIE, ET RIEN D'AUTRE. Le nom, le métier,
 * la distance, la ville, la note et les annonces vivent déjà dans
 * `apercu-habitant.ts` : les recopier ici ferait deux vérités pour une seule
 * question, et la seconde serait fausse au premier changement. L'écran va les
 * chercher là-bas par leur identifiant.
 *
 * C'EST AUSSI CE QU'IL A TRANCHÉ. Ses maquettes portent des enseignes qui
 * n'existent nulle part dans l'app — « Studio Camille », « Boutique Alba »,
 * « Maison Dax ». Les créer aurait fait choisir « Studio Camille » pour
 * atterrir sur « Un salon du centre », parce que ce sont les commerces
 * EXISTANTS qui portent les annonces. Question posée, réponse donnée :
 * « réutiliser les commerces de démo existants ».
 *
 * ═══ LES PHOTOS SONT TOUTES ICI, ET C'EST VOULU ════════════════════════════
 *
 * Une seule ligne par carte. Les images de ses maquettes ne sont pas dans le
 * dépôt et je ne peux pas les fabriquer ; il va les envoyer. Le jour où elles
 * arrivent, remplacer une photo est un chemin à changer dans ce fichier, et
 * rien d'autre nulle part.
 *
 * ON MONTRE LA CHOSE, PAS LA DEVANTURE. C'est la règle de l'annonce, et elle
 * vaut ici deux fois plus : cet écran demande « quelle coupe m'irait ? », donc
 * il montre des coupes. Un fauteuil de salon ne donne envie de rien. Voir
 * `scripts/verifier-annonce-essayable.mjs`.
 */

/** Les cinq pictogrammes du bas, dans l'ordre de ses maquettes. */
export type CleCategorie = "mode" | "restaurants" | "beaute" | "sorties" | "commerces";

/**
 * CE QU'UNE CARTE AJOUTE À CE QUE LE COMMERCE SAIT DÉJÀ.
 *
 * `id` pointe sur un commerce de `toutesLesCartes()` ou sur un événement de
 * `evenementsDeLaVille()`. Tout le reste — l'enseigne, la distance, la ville —
 * se lit là-bas.
 */
export type ChoixCarte = {
  id: string;
  /** La chose qu'on vient regarder : une coupe, un plat, une tenue, une scène. */
  photo: string;
  /**
   * CE QUE LA CARTE ANNONCE, quand le commerce ne le dit pas lui-même.
   *
   * IL EST FACULTATIF ET IL DOIT LE RESTER. Sur ses maquettes, la seconde ligne
   * dit « DJ set », « Trio Jazz », « Concert acoustique » — le genre de la
   * soirée, que l'événement porte déjà. Ailleurs elle est vide, et la carte
   * n'écrit alors que l'enseigne. Une ligne inventée pour remplir un gabarit
   * est exactement ce que ce produit refuse.
   */
  quoi?: string;
};

export type Categorie = {
  cle: CleCategorie;
  /** Le mot sous le pictogramme. */
  onglet: string;
  /**
   * LE TITRE EN DEUX MORCEAUX, parce qu'il est écrit en deux couleurs.
   * « QUELLE COUPE » en blanc, « M'IRAIT ? » en magenta souligné.
   */
  titreBlanc: string;
  titreRose: string;
  /** Ce que dit le fantôme dans sa bulle. */
  bulle: string;
  /** Le grand bouton du bas. Il ne fait rien pour l'instant — voir l'écran. */
  bouton: string;
  cartes: ChoixCarte[];
};

/**
 * ═══ LES CINQ CATÉGORIES ═══════════════════════════════════════════════════
 *
 * QUATRE À CINQ COMMERÇANTS CHACUNE, comme il l'a demandé. Ce sont les
 * commerces de la démo, choisis par métier : ceux qui ne rentrent dans aucune
 * des quatre premières vont dans « Commerces », qui est la catégorie des
 * artisans et des boutiques — c'est ce que montre sa maquette déco.
 */
export const CATEGORIES: Categorie[] = [
  {
    cle: "mode",
    onglet: "Mode",
    titreBlanc: "Qu’est-ce que",
    titreRose: "je porte ?",
    bulle: "Glissez pour découvrir les boutiques près de vous",
    bouton: "Découvrir cette tenue",
    cartes: [
      { id: "mode-centre", photo: "/direct/accueil/mode-apres.jpg" },
      { id: "mode-friperie", photo: "/direct/mode-veste-dentelle.jpg" },
      { id: "mode-homme", photo: "/direct/homme-veste-ciree-kaki.jpg" },
      { id: "bijoux-atelier", photo: "/direct/poignet-bracelet.jpg" },
    ],
  },
  {
    cle: "restaurants",
    onglet: "Restaurants",
    titreBlanc: "Ce midi,",
    titreRose: "je mange quoi ?",
    bulle: "Glissez pour découvrir les menus près de vous",
    bouton: "Découvrir ce menu",
    cartes: [
      /* DEUX DE CES CINQ PHOTOS SONT CELLES D'UN MOMENT DE LA JOURNEE, et
         c'est ce qui leur donne leur prix : l'écran ne l'écrit que s'il peut
         le rattacher à la chose montrée. Les trois autres sont les photos de
         l'annonce — un vrai plat du commerce, sans prix, plutôt qu'un prix
         emprunté au plat d'à côté. */
      { id: "centre", photo: "/direct/plat-du-jour.jpg" },
      { id: "emporter", photo: "/direct/plat-lasagnes.jpg" },
      { id: "tablee", photo: "/direct/tablee-du-soir.jpg" },
      { id: "deux-rues", photo: "/direct/plat-axoa.jpg" },
      { id: "boucher", photo: "/direct/etal-boucher.jpg" },
    ],
  },
  {
    cle: "beaute",
    onglet: "Beauté",
    titreBlanc: "Quelle coupe",
    titreRose: "m’irait ?",
    bulle: "Glissez pour choisir un salon près de vous",
    bouton: "Découvrir cette coupe",
    /* ═══ QUE DES COUPES, PARCE QUE LE TITRE NE DEMANDE QUE ÇA ═════════════

       « On a comme titre "Quelle coupe m'irait ?" et, à partir de la troisième
       annonce, on a des ongles, des lunettes... Il faut que ce soit que des
       coupes de coiffure pour être dans le thème. »

       LE PAQUET TENAIT CINQ CARTES ET LA CATÉGORIE N'AVAIT QUE DEUX SALONS. Je
       l'avais rempli avec l'onglerie, l'opticien et le tatoueur — tous de la
       catégorie « Beauté », tous hors sujet sous ce titre-là. Un écran qui
       demande « quelle coupe m'irait ? » et répond par une paire de lunettes
       ne se rattrape pas : la question était la promesse, et c'est le gabarit
       que j'avais servi à sa place.

       DEUX SALONS DE PLUS EXISTENT MAINTENANT — un barbier, un salon près du
       parc — et les quatre cartes portent quatre coupes. Quatre plutôt que
       cinq : mieux vaut une carte de moins qu'une cinquième qui reparle du
       même salon. Voir `apercu-habitant.ts`.

       L'ONGLERIE, L'OPTICIEN ET LE TATOUEUR NE SONT PAS PERDUS : ils sont dans
       l'application, avec leurs propres essayages. Ils n'ont simplement rien à
       faire sous une question qui parle de cheveux. */
    cartes: [
      { id: "coif-centre", photo: "/direct/coiffure-femme-face.jpg" },
      { id: "coif-nouveau", photo: "/direct/coiffure1.jpg" },
      { id: "coif-barbier", photo: "/direct/coiffure-homme-face.jpg" },
      { id: "coif-halle", photo: "/direct/coiffure2.jpg" },
    ],
  },
  {
    cle: "sorties",
    onglet: "Sorties",
    titreBlanc: "Et ce",
    titreRose: "soir ?",
    bulle: "Glissez pour découvrir les sorties",
    bouton: "Découvrir cette soirée",
    cartes: [
      { id: "kiosque", photo: "/direct/concert-kiosque.jpg" },
      { id: "bar-terrasse", photo: "/direct/terrasse-au-soleil.jpg" },
      { id: "marche-nuit", photo: "/direct/marche-producteurs.jpg" },
      { id: "expo", photo: "/direct/nocturne-musee.jpg" },
      { id: "vide-grenier", photo: "/direct/vide-grenier.jpg" },
    ],
  },
  {
    cle: "commerces",
    onglet: "Commerces",
    titreBlanc: "Et",
    titreRose: "chez moi ?",
    bulle: "Glissez pour découvrir les boutiques près de vous",
    bouton: "Découvrir cette pièce",
    cartes: [
      /* MAISON DAX PASSE EN TETE, et c'est le parcours qui le demande : c'est
         le seul des cinq a porter un essai « chez vous », et c'est lui que le
         bouton ouvre. Une categorie dont la premiere carte ne mene pas au
         parcours ferait chercher. */
      { id: "maison-dax", photo: "/direct/deco/fauteuil-grand.jpg" },
      { id: "cirier", photo: "/direct/table-salon-bougie.jpg" },
      { id: "fleur-marche", photo: "/direct/bouquet-du-jour.jpg" },
      { id: "boulange", photo: "/direct/sortie-du-four.jpg" },
      { id: "traiteur", photo: "/direct/plat-parmentier.jpg" },
    ],
  },
];

/** La catégorie par laquelle on ouvre. La beauté, parce que c'est l'essai le plus parlant. */
export const CATEGORIE_DEPART: CleCategorie = "beaute";

export function categorieDe(cle: CleCategorie): Categorie {
  return CATEGORIES.find((c) => c.cle === cle) ?? CATEGORIES[0];
}
