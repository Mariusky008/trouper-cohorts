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

/**
 * ═══ LA CARTE DU PARCOURS EST LA DERNIÈRE, PAS LA PREMIÈRE ════════════════
 *
 * « J'aimerais que la première annonce de chaque onglet se retrouve en
 * dernier, puisque c'est seulement celle-là qui amène sur le parcours du
 * commerçant — sachant que les autres annonces amènent sur le parcours de
 * cette première annonce. Comme cela, quand j'arrive à la dernière annonce, je
 * peux cliquer et ce sera le bon parcours. »
 *
 * LE BOUTON OUVRE TOUJOURS LE MÊME PARCOURS, quelle que soit la carte qu'on
 * regarde : il est attaché au commerce écrit dans `parcours-*.ts`, pas à la
 * carte du dessus. Tant que ce commerce était en PREMIER, on balayait quatre
 * cartes et on appuyait sur un bouton qui rouvrait la première — la promesse
 * la plus concrète qu'un écran puisse rompre.
 *
 * ON LE MET DONC AU BOUT. Celui qui balaie jusqu'à la fin tombe sur la carte
 * dont le parcours va s'ouvrir, et celui qui appuie tout de suite voit une
 * carte qui n'est pas la sienne — c'est le même défaut, mais dans le sens où
 * il coûte le moins : on n'a rien parcouru, donc on n'a rien perdu.
 *
 * LA VRAIE CORRECTION RESTE À FAIRE, et elle est ailleurs : que le bouton
 * ouvre le parcours DE LA CARTE QU'ON REGARDE. Elle demande un parcours par
 * commerce, pas un par catégorie.
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
    /* ═══ QUATRE VETEMENTS, PARCE QUE LE TITRE NE DEMANDE QUE CA ══════════

       « Peux-tu remplacer la derniere annonce, qui est un bijou, par un
       vetement. »

       C'EST LE MEME DEFAUT QUE L'ONGLERIE SOUS « QUELLE COUPE M'IRAIT ? », et
       je l'avais laisse passer ici apres l'avoir repare la-bas. Le bracelet de
       l'atelier etait dans la categorie « mode » au sens du metier, et hors
       sujet sous la question posee : on ne PORTE pas un bracelet au sens ou
       l'on porte un manteau — on ne se demande pas s'il tombe bien.

       LE DEPOT-VENTE PREND SA PLACE, avec un manteau. L'atelier de bijoux
       n'est pas perdu : il est dans l'application, avec son propre essayage au
       poignet, qui est exactement l'ecran qu'il lui faut. */
    cartes: [
      { id: "mode-friperie", photo: "/direct/mode-veste-dentelle.jpg" },
      { id: "mode-homme", photo: "/direct/homme-veste-ciree-kaki.jpg" },
      { id: "mode-depot", photo: "/direct/mode-manteau-leopard.jpg" },
      { id: "mode-centre", photo: "/direct/accueil/mode-apres.jpg" },
    ],
  },
  {
    cle: "restaurants",
    onglet: "Restaurants",
    titreBlanc: "Ce midi,",
    titreRose: "je mange quoi ?",
    bulle: "Glissez pour découvrir les menus près de vous",
    bouton: "Découvrir ce menu",
    /* ═══ SEPT REPAS DU JOUR, TOUS DIFFERENTS ═════════════════════════════

       « Il faut que les 5 annonces montrent des repas du jour et pas une
       ambiance, et la boucherie un plat aussi du jour. Et si tu peux, meme
       rajouter deux ou trois autres annonces avec des plats du jour varies,
       pour montrer vraiment qu'on represente plein de repas differents a
       choisir le midi. »

       DEUX CARTES SUR CINQ MONTRAIENT UNE SALLE. La grande tablee eclairee a
       la bougie et l'etal du boucher sont de belles photos, et aucune des deux
       ne repond a « ce midi, je mange quoi ? ». Elles s'affichaient parce que
       ces deux commerces n'avaient AUCUNE offre a midi : l'ecran se rabattait
       alors sur la photo du commerce, faute de mieux. La reparation n'est donc
       pas dans cette liste, elle est dans leur journee — ils servent a midi
       maintenant, et ils le disent. Voir `apercu-habitant.ts`.

       CHAQUE PHOTO EST CELLE D'UN MOMENT DE LA JOURNEE, sans exception. C'est
       ce qui accroche le titre et le prix a l'assiette qu'on regarde : l'ecran
       n'ecrit un chiffre que s'il peut le rattacher a la chose montree.

       ET LA BOULANGERIE ET LE TRAITEUR ARRIVENT ICI. Il les avait sortis de la
       Deco — « hors sujet dans l'onglet Commerces, qui est plutot Deco » — et
       il avait raison deux fois : ils n'y repondaient a rien, et ils repondent
       exactement a celle-ci. Une formule sandwich et une barquette du jour
       sont ce qu'on mange a midi quand on ne s'assoit pas.

       SEPT PLATS, SEPT COMMERCES, SEPT ASSIETTES QUI NE SE RESSEMBLENT PAS :
       magret, poulet basquaise, axoa, parmentier, sandwich, barquette,
       lasagnes. C'est le nombre qui fait la demonstration — un midi ou l'on
       choisit vraiment, et pas une vitrine de cinq restaurants.

       LE `quoi` N'EST ECRIT QUE LA OU LE TITRE DE L'OFFRE N'EST PAS UN PLAT.
       « Le service du midi » et « Les deux plats du jour » disent l'heure, pas
       ce qu'on mange ; le plat, lui, est ecrit dans le `menu` du commerce, au
       meme prix. Ailleurs le titre nomme deja l'assiette, et on ne le double
       pas. */
    cartes: [
      { id: "centre", photo: "/direct/plat-du-jour.jpg", quoi: "Magret grillé, pommes sarladaises" },
      { id: "tablee", photo: "/direct/plat-basquaise.jpg" },
      { id: "deux-rues", photo: "/direct/plat-axoa.jpg", quoi: "Axoa de veau, riz de pays" },
      { id: "boucher", photo: "/direct/plat-parmentier.jpg" },
      { id: "boulange", photo: "/direct/plat-formule.jpg", quoi: "Sandwich, boisson, dessert" },
      { id: "traiteur", photo: "/direct/portion-a-emporter.jpg", quoi: "Le gratin du jour, en barquette" },
      { id: "emporter", photo: "/direct/plat-lasagnes.jpg", quoi: "Lasagnes maison" },
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
      { id: "coif-nouveau", photo: "/direct/coiffure1.jpg" },
      { id: "coif-barbier", photo: "/direct/coiffure-homme-face.jpg" },
      { id: "coif-halle", photo: "/direct/coiffure2.jpg" },
      { id: "coif-centre", photo: "/direct/coiffure-femme-face.jpg" },
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
      { id: "bar-terrasse", photo: "/direct/terrasse-au-soleil.jpg" },
      { id: "marche-nuit", photo: "/direct/marche-producteurs.jpg" },
      { id: "expo", photo: "/direct/nocturne-musee.jpg" },
      { id: "vide-grenier", photo: "/direct/vide-grenier.jpg" },
      { id: "kiosque", photo: "/direct/concert-kiosque.jpg" },
    ],
  },
  {
    cle: "commerces",
    /* ═══ L'ONGLET DIT CE QU'IL CONTIENT ═══════════════════════════════════

       « Le Pétrin d'Amanieu et Maison Lartigues sont hors sujet dans l'onglet
       "Commerces", qui est plutôt "Déco". »

       IL AVAIT RAISON SUR LES DEUX BOUTS. Le titre demande « et chez moi ? »,
       le bouton dit « Découvrir cette pièce », et le parcours derrière est
       celui de la déco : on essaie un fauteuil dans son salon. Une boulangerie
       et un traiteur n'y répondent pas — ils sont excellents, et ailleurs.

       LE MOT « COMMERCES » NE DISAIT RIEN, en plus : tout est un commerce dans
       cette application. Un onglet qui ne trie pas ne sert qu'à être compté.

       (La clé technique reste `commerces` : elle est lue à six endroits et la
       renommer ne changerait rien à l'écran.) */
    onglet: "Déco",
    titreBlanc: "Et",
    titreRose: "chez moi ?",
    bulle: "Glissez pour découvrir les boutiques près de vous",
    bouton: "Découvrir cette pièce",
    cartes: [
      { id: "cirier", photo: "/direct/table-salon-bougie.jpg" },
      { id: "fleur-marche", photo: "/direct/bouquet-du-jour.jpg" },
      /* TROIS PLUTOT QUE CINQ. La boulangerie et le traiteur remplissaient le
         paquet, pas l'onglet : mieux vaut trois cartes qui repondent a la
         question que cinq dont deux parlent d'autre chose. C'est la meme
         decision que sur la beaute, le meme jour, pour la meme raison. */
      { id: "maison-dax", photo: "/direct/deco/fauteuil-grand.jpg" },
    ],
  },
];

/** La catégorie par laquelle on ouvre. La beauté, parce que c'est l'essai le plus parlant. */
export const CATEGORIE_DEPART: CleCategorie = "beaute";

export function categorieDe(cle: CleCategorie): Categorie {
  return CATEGORIES.find((c) => c.cle === cle) ?? CATEGORIES[0];
}
