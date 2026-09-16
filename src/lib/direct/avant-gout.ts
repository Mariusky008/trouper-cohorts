// 👻 L'AVANT-GOÛT — jouer avec le plat au lieu de le regarder.
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// « Faites savoir que vous êtes ici… Qui est là, ce qu'ils ont à dire… »
// finalement ne remporte pas le succès escompté, donc on va modifier cette
// section. On va jouer autour du mot ESSAYER, et faire essayer le plat du jour
// avant même d'y aller. »
//
// LE MUR DE PRÉSENCE RÉPONDAIT À UNE QUESTION QUE PERSONNE NE SE POSE. « Qui
// est là ? » suppose qu'on ait déjà décidé d'y aller. Or à midi, devant une
// annonce, la question est plus tôt : « est-ce que ça me tente ? ». Un mur de
// messages ne répond pas à ça — une photo non plus, d'ailleurs, et c'est tout
// le sujet.
//
// ═══ LA CONSTANTE, ET CE N'EST PAS « CHOISIR LES INGRÉDIENTS » ══════════════
//
// « Le parcours n'a pas besoin d'être identique pour tous les plats. Le Fantôme
// doit chercher le meilleur jeu possible autour du plat. La constante devient :
// NE REGARDEZ PAS LE PLAT. JOUEZ AVEC. »
//
// C'EST LA PHRASE QUI TIENT TOUT LE FICHIER, et c'est pour ça qu'un parcours
// est une LISTE DE TEMPS et non un gabarit à remplir. Un plat personnalisable
// se compose ; un plat de savoir-faire livre son secret ; un plat simple se
// devine ; un dessert se révèle ; une pizza se construit. Écrire une seule
// séquence pour les sept aurait donné un formulaire déguisé en jeu — exactement
// ce que le mur de présence était déjà.
//
// ET UN PLAT EN COMBINE PLUSIEURS. Les pâtes au pesto font deviner, découvrir,
// ressentir, agir, puis exprimer. Le magret fait composer trois fois, puis voir
// son plat, puis exprimer. Les deux parcours de ce fichier sont ses deux
// maquettes, au trait.
//
// ═══ CE QUE CE FICHIER NE FAIT PAS ══════════════════════════════════════════
//
// IL N'ÉCRIT PAS LES PARCOURS, IL LES PORTE. Dans le produit qu'il décrit, le
// restaurateur dit « plat du jour, pâtes au pesto, 14 € », l'assistante demande
// « qu'est-ce qui rend les vôtres particulières ? », et c'est l'IA qui choisit
// la mécanique et écrit les écrans. Ce fichier est la FORME que cette IA
// remplira : tant qu'elle n'existe pas, deux parcours écrits à la main disent à
// quoi elle doit ressembler — et prouvent que la forme tient pour deux plats
// qui n'ont rien en commun.

/**
 * CE QU'ON PEUT CHOISIR, À UN TEMPS DONNÉ.
 *
 * LA PHOTO EST FACULTATIVE, ET CE N'EST PAS UN OUBLI. Ses maquettes montrent
 * une vignette par option — trois cuissons, quatre accompagnements, trois
 * sauces — c'est-à-dire une quinzaine d'images par plat que personne n'a encore
 * prises. Une option sans photo se dessine donc en pastille, avec son
 * pictogramme : le parcours se joue en entier le premier jour, et il embellit
 * le jour où le restaurateur filme ses trois plans.
 */
export type OptionGout = {
  cle: string;
  nom: string;
  detail?: string;
  photo?: string;
  /** Le repli quand la photo n'existe pas encore. */
  emoji?: string;
  /**
   * CE QUI S'ÉCRIT SUR LE RÉCAPITULATIF. Sans lui, le dernier écran répète le
   * libellé du bouton — « La fraîcheur du basilic » sous le mot « Secret » — au
   * lieu de dire ce que la personne a choisi.
   */
  resume?: string;
};

/**
 * UN TEMPS DU PARCOURS.
 *
 * `quoi` EST LA MÉCANIQUE, ET C'EST ELLE QUI CHANGE D'UN PLAT À L'AUTRE. Les
 * six valeurs sont les six jeux qu'il a listés, ramenés à ce qui les distingue
 * VRAIMENT à l'écran :
 *
 *   · `ouvrir`  — la découverte. Le mot du chef, ce que le plat est.
 *   · `devine`  — on répond, puis on apprend la vérité. Il n'y a pas de faute :
 *                 la bonne réponse est une révélation, pas une note.
 *   · `compose` — on choisit, et le plat s'y plie. Cuisson, sauce, garniture.
 *   · `ressens` — on dit ce qui attire. Rien ne change dans le plat ; ce qui
 *                 change est qu'on s'est projeté dedans.
 *   · `geste`   — on déclenche quelque chose : la touche finale, la coupe, le
 *                 mélange. C'est le seul temps qui DEMANDE un appui pour voir.
 *   · `final`   — ce qu'on a composé, l'émotion, et la réservation.
 */
export type TempsGout = {
  quoi: "ouvrir" | "devine" | "compose" | "ressens" | "geste" | "final";
  /**
   * LE PREMIER MORCEAU DU TITRE, EN BLANC.
   *
   * L'ESPACE ENTRE LES DEUX MORCEAUX EST ÉCRIT ICI, PAS DANS LE COMPOSANT, et
   * ce n'est pas un détail de frappe : la coupure tombe AU MILIEU D'UN MOT dans
   * « Avant- / goût », et entre deux mots dans « Quelle cuisson / vous fait
   * envie ? ». Un composant qui ajoute l'espace écrirait « Avant- goût » ; un
   * composant qui ne l'ajoute pas écrit « cuissonvous ». Seul celui qui écrit la
   * phrase sait où elle se coupe, donc c'est lui qui pose l'espace.
   */
  titre: string;
  /** Le second, en couleur. Coupé ainsi parce que la maquette le coupe ainsi. */
  suite?: string;
  phrase?: string;
  /**
   * L'ANNOTATION MANUSCRITE DE LA MAQUETTE. « Tout se joue dans les détails ! »
   * Elle n'informe pas, elle donne le ton — c'est une main qui parle, pas une
   * interface. Facultative : sans elle, l'écran est simplement plus calme.
   */
  note?: string;
  photo?: string;
  /**
   * LE PLAT UNE FOIS LE GESTE FAIT — et c'est le vrai but.
   *
   * « Les images, c'est le réel fourni par le restaurant + l'IA qui le
   * transforme. Trois plans de quinze secondes qui deviennent la bibliothèque du
   * plat. »
   *
   * TANT QU'ELLE MANQUE, LE GESTE SE JOUE EN FILTRES — la caméra s'approche, le
   * plat chauffe, une lueur naît du centre. C'est honnête et ça tient debout,
   * mais un fondu entre DEUX PHOTOGRAPHIES du même plat, avant et après le
   * parmesan, battra toujours n'importe quel effet. Le jour où ce champ est
   * rempli, `gout-contenu.tsx` s'en sert sans qu'on touche à rien d'autre.
   */
  photoApres?: string;
  options?: OptionGout[];
  /** Le libellé du geste qui avance. « Je valide ma réponse », « C'est parti ! ». */
  geste?: string;
  /**
   * ET CE QU'IL DIT AU SECOND APPUI, SUR LES TEMPS QUI EN DEMANDENT DEUX.
   *
   * Une devinette et un geste se jouent en deux fois sur le même écran : on
   * répond puis on apprend, on déclenche puis on avance. Sans ce libellé, le
   * bouton répète le premier — « Je valide ma réponse » devant une réponse déjà
   * validée — et on ne sait plus si l'appui a pris. Absent, il dit « Continuer ».
   */
  apres?: string;
  /**
   * POUR `devine` : ce qu'on répond, quelle que soit la réponse choisie.
   *
   * IL N'Y A PAS DE MAUVAISE RÉPONSE, ET C'EST DÉLIBÉRÉ. « Quel est le secret
   * d'un pesto savoureux ? » n'a pas de corrigé — les quatre réponses sont
   * vraies, et celle du chef est celle qu'on va lui apprendre. Un jeu qui dit
   * « perdu » devant un plat donne envie d'aller ailleurs.
   */
  verite?: { titre: string; mot: string };
};

/** Ce que le plat est, en trois pastilles sous le titre d'ouverture. */
export type MarqueGout = { emoji: string; nom: string; detail: string };

/**
 * LE PARCOURS D'UN PLAT.
 *
 * `accent` TEINTE TOUT LE PARCOURS, et ça se voit sur ses deux maquettes : le
 * magret est magenta, le pesto est vert. Ce n'est pas de la décoration — c'est
 * ce qui fait qu'un parcours ressemble à SON plat plutôt qu'à l'application.
 */
export type Gout = {
  /** Le plat, tel qu'il s'annonce. */
  plat: string;
  detail?: string;
  prix?: string;
  accent: string;
  /** Le mot du chef, signé, sur l'écran d'ouverture. */
  chef?: { mot: string; qui: string };
  marques?: MarqueGout[];
  /** Le tampon posé sur la photo. « FAIT MAISON ». */
  tampon?: string;
  temps: TempsGout[];
};

/**
 * ═══ CE QU'ON RESSENT, ET C'EST LE DERNIER GESTE ═══════════════════════════
 *
 * « Alors, ça vous fait quoi ? » Ses deux maquettes finissent là, et les deux
 * proposent des émotions différentes. On en garde UNE liste : l'émotion n'est
 * pas une propriété du plat, c'est la réaction de quelqu'un — et elle doit être
 * la même partout pour qu'on puisse un jour compter ce qu'elle dit.
 *
 * « PAS POUR MOI » EST DEDANS, ET C'EST CE QUI REND LA LISTE HONNÊTE. Cinq
 * émotions dont cinq positives ne mesurent rien ; celle qui permet de dire non
 * est celle qui donne du poids aux quatre autres.
 */
export const EMOTIONS: { cle: string; emoji: string; mot: string }[] = [
  { cle: "non", emoji: "😐", mot: "Pas pour moi" },
  { cle: "curieux", emoji: "👀", mot: "Curieux" },
  { cle: "faim", emoji: "😋", mot: "Ça donne faim" },
  { cle: "envie", emoji: "🤤", mot: "Très envie" },
  { cle: "veux", emoji: "🔥", mot: "Je le veux" },
];

/**
 * ═══ PARCOURS 1 — LE MAGRET : JE COMPOSE ═══════════════════════════════════
 *
 * Sa première maquette, écran par écran. Un plat personnalisable : la mécanique
 * est le choix, répété trois fois, et la récompense est de voir SON plat.
 *
 * TROIS CHOIX ET PAS SIX. La maquette en montre trois — cuisson,
 * accompagnement, sauce — et c'est la bonne mesure : au quatrième, on ne joue
 * plus, on remplit un bon de commande. Le dernier écran ajoute la touche finale
 * comme un cadeau, sans la faire choisir.
 */
export const GOUT_MAGRET: Gout = {
  // LE PLAT EST CELUI DE SA CARTE, PAS CELUI DE LA MAQUETTE. Sa maquette dit
  // « Magret de canard, 17 € chez Chez Margot » — or « Chez Margot » est le nom
  // du MODÈLE de mur, pas d'un commerce du paquet, et aucun commerce ne sert ce
  // plat-là. Chez Bergine en sert un : « Garbure landaise, magret grillé », 19 €,
  // avec sa photo. Le parcours est le sien, le plat est celui qu'on peut aller
  // manger — c'est la seule version qui ne mente pas au premier appui.
  plat: "Garbure landaise, magret grillé",
  detail: "Pommes sarladaises · Pastis landais en dessert",
  prix: "19 €",
  accent: "#E56BE0",
  chef: {
    mot: "Je vais vous montrer comment je prépare notre magret, et vous allez pouvoir choisir vos préférences.",
    qui: "Chef Julien",
  },
  temps: [
    {
      quoi: "ouvrir",
      titre: "Avant-",
      suite: "goût",
      phrase: "Découvrez, choisissez, votre magret prend vie.",
      photo: "/direct/plat-garbure.jpg",
      geste: "C’est parti !",
    },
    {
      quoi: "compose",
      titre: "Quelle cuisson ",
      suite: "vous fait envie ?",
      phrase: "Le chef s’adapte à vos préférences.",
      note: "Choisissez votre cuisson en un clic !",
      photo: "/direct/plat-garbure.jpg",
      geste: "Suivant",
      options: [
        { cle: "bleu", nom: "Bleu", detail: "Très rouge et fondant", emoji: "🥩", resume: "Bleu" },
        { cle: "saignant", nom: "Saignant", detail: "Tendre et juteux", emoji: "🥩", resume: "Saignant" },
        { cle: "apoint", nom: "À point", detail: "Plus cuit et ferme", emoji: "🥩", resume: "À point" },
      ],
    },
    {
      quoi: "compose",
      titre: "Quel accompagnement ",
      suite: "vous fait envie ?",
      phrase: "Le chef vous propose ses accompagnements faits maison.",
      photo: "/direct/plat-garbure.jpg",
      geste: "Suivant",
      options: [
        { cle: "grenailles", nom: "Pommes grenailles", detail: "Dorées au four aux herbes", emoji: "🥔", resume: "Pommes grenailles" },
        { cle: "legumes", nom: "Légumes de saison", detail: "Croquants et colorés", emoji: "🥦", resume: "Légumes de saison" },
        { cle: "puree", nom: "Purée maison", detail: "Onctueuse au beurre", emoji: "🥣", resume: "Purée maison" },
        { cle: "salade", nom: "Salade", detail: "Fraîche et légère", emoji: "🥗", resume: "Salade" },
      ],
    },
    {
      quoi: "compose",
      titre: "Quelle sauce ",
      suite: "vous fait envie ?",
      phrase: "Le chef prépare sa sauce maison. À vous de choisir !",
      photo: "/direct/plat-garbure.jpg",
      geste: "Suivant",
      options: [
        { cle: "cepes", nom: "Sauce aux cèpes", detail: "Riche et parfumée", emoji: "🍄", resume: "Aux cèpes" },
        { cle: "poivre", nom: "Sauce poivre", detail: "Relevée et savoureuse", emoji: "🌶️", resume: "Au poivre" },
        { cle: "jus", nom: "Jus réduit", detail: "Classique et authentique", emoji: "🥄", resume: "Jus réduit" },
      ],
    },
    {
      quoi: "final",
      titre: "Bon ",
      suite: "appétit !",
      phrase: "Voici votre magret parfait, préparé selon vos envies.",
      photo: "/direct/plat-garbure.jpg",
    },
  ],
};

/**
 * ═══ PARCOURS 2 — LE PESTO : JE DÉCOUVRE LE SECRET ═════════════════════════
 *
 * Sa seconde maquette. Un plat SIMPLE — des pâtes, du basilic — sur lequel il
 * n'y a rien à composer : on ne choisit pas la cuisson d'un pesto. La mécanique
 * est donc l'inverse de la première : on ne demande pas ce qu'on veut, on
 * montre ce qu'on ne sait pas.
 *
 * ET C'EST LA PREUVE QUE LA FORME TIENT. Les deux parcours n'ont pas le même
 * nombre de temps, pas les mêmes mécaniques, pas la même couleur, et aucun des
 * deux n'est le gabarit de l'autre — ils sont deux remplissages du même type.
 */
export const GOUT_PESTO: Gout = {
  // MÊME ARBITRAGE, ET IL M'A COÛTÉ SA COPIE. Sa maquette raconte des pâtes au
  // pesto ; aucun commerce du paquet n'en sert, et le dépôt n'a aucune photo de
  // pesto. Servir « pâtes au pesto » sous une enseigne qui vend des lasagnes
  // serait exactement le genre de mensonge que tout ce dossier refuse.
  //
  // LA MÉCANIQUE EST INTACTE, ET C'EST ELLE QUI COMPTE : deviner, apprendre le
  // secret, ressentir, faire le geste, dire son émotion. Ce sont ses cinq temps,
  // dans son ordre, avec son ton. Seul le plat change — et il se rechange en
  // trois lignes le jour où un restaurateur de Dax fait des pâtes au pesto et
  // nous donne quinze secondes de son mortier.
  plat: "Lasagnes maison",
  detail: "Un grand classique, mais pas comme les autres.",
  prix: "11 €",
  accent: "#8CE06A",
  tampon: "Fait maison",
  marques: [
    { emoji: "🍅", nom: "Sauce", detail: "mijotée trois heures" },
    { emoji: "🧀", nom: "Parmesan AOP", detail: "24 mois" },
    { emoji: "🌿", nom: "Basilic frais", detail: "du marché" },
  ],
  temps: [
    {
      quoi: "ouvrir",
      titre: "Lasagnes ",
      suite: "maison",
      phrase: "Un grand classique, mais pas comme les autres.",
      note: "Simple sur le papier. Inoubliable dans l’assiette.",
      photo: "/direct/plat-lasagnes.jpg",
      geste: "C’est parti !",
    },
    {
      quoi: "devine",
      titre: "Quel est selon vous le ",
      suite: "secret d’une lasagne vraiment savoureuse ?",
      phrase: "Choisissez votre réponse, on vous montre la vérité juste après !",
      note: "Tout se joue dans les détails !",
      photo: "/direct/plat-lasagnes.jpg",
      geste: "Je valide ma réponse",
      apres: "Et maintenant…",
      options: [
        { cle: "sauce", nom: "La sauce mijotée", detail: "Un goût intense", emoji: "🍅" },
        { cle: "parmesan", nom: "Le parmesan de qualité", detail: "Tout le caractère", emoji: "🧀" },
        { cle: "pates", nom: "Les pâtes fraîches", detail: "Faites le matin", emoji: "🍝" },
        { cle: "facon", nom: "La façon de les monter", detail: "C’est là que tout change", emoji: "🥄" },
      ],
      verite: {
        titre: "Le secret du chef",
        mot: "La sauce mijote trois heures la veille, et les plaques sont montées le matin même. Une lasagne montée à chaud s’effondre dans l’assiette ; celle-ci se tient.",
      },
    },
    {
      quoi: "ressens",
      titre: "Maintenant, imaginez la ",
      suite: "première bouchée…",
      phrase: "Qu’est-ce qui vous attire le plus dans ce plat ?",
      note: "Des saveurs simples qui font toute la différence !",
      photo: "/direct/plat-lasagnes.jpg",
      geste: "Ça me donne envie !",
      options: [
        { cle: "sauce", nom: "La sauce qui a mijoté", detail: "Riche et intense", emoji: "🍅" },
        { cle: "parmesan", nom: "Le parmesan qui fond", detail: "Un goût unique", emoji: "🧀" },
        { cle: "gratine", nom: "Le dessus gratiné", detail: "Une touche croustillante", emoji: "🔥" },
        { cle: "tout", nom: "Tout !", detail: "C’est ça que j’aime", emoji: "😍" },
      ],
    },
    {
      quoi: "geste",
      titre: "Ajoutez la ",
      suite: "touche finale !",
      phrase: "Faites tomber le parmesan sur vos lasagnes.",
      note: "Le petit détail qui change tout !",
      photo: "/direct/plat-lasagnes.jpg",
      geste: "Faire tomber le parmesan",
      apres: "C’est prêt, on continue",
    },
    {
      quoi: "final",
      titre: "C’est ",
      suite: "prêt !",
      phrase: "Vos lasagnes, comme la maison les sert.",
      photo: "/direct/plat-lasagnes.jpg",
    },
  ],
};

/**
 * QUEL PARCOURS POUR QUEL MUR.
 *
 * DEUX MURS, DEUX PLATS, DEUX MÉCANIQUES — et c'est le minimum pour que la
 * forme soit vérifiable. Le jour où l'IA écrit les parcours, cette table
 * disparaît : elle sera remplacée par ce que le restaurateur a raconté le matin
 * même. En attendant, elle dit noir sur blanc quel plat joue à quoi.
 */
/**
 * ═══ PARCOURS 3 — L'AXOA : JE DÉCOUVRE LE SECRET ═══════════════════════════
 *
 * « Plat avec savoir-faire → je découvre le secret. »
 *
 * TROIS TEMPS SEULEMENT, ET C'EST VOULU. « Je ne mettrais pas obligatoirement
 * quatre ou cinq étapes » : un plat qui tient dans un tour de main n'a pas cinq
 * choses à raconter, et l'étirer pour ressembler aux autres redonnerait le
 * questionnaire qu'on a passé deux écrans à éviter.
 */
export const GOUT_AXOA: Gout = {
  plat: "Axoa de veau",
  detail: "Piment doux, pommes de terre",
  prix: "16 €",
  accent: "#FF8A5B",
  chef: {
    mot: "L’axoa, ça ne se hache pas à la machine. On le coupe au couteau, sinon ça devient de la bouillie.",
    qui: "Chef Pello",
  },
  tampon: "AU COUTEAU",
  marques: [
    { emoji: "🔪", nom: "Coupé main", detail: "Jamais haché" },
    { emoji: "🌶️", nom: "Piment doux", detail: "D’Espelette" },
    { emoji: "⏱️", nom: "2 h", detail: "À feu doux" },
  ],
  temps: [
    {
      quoi: "ouvrir",
      titre: "L’axoa ",
      suite: "de Pello",
      phrase: "Un plat basque que tout le monde croit connaître.",
      photo: "/direct/plat-axoa.jpg",
      geste: "Voir ce qui le change",
    },
    {
      quoi: "devine",
      titre: "À votre avis, qu’est-ce qui ",
      suite: "fait la différence ?",
      phrase: "Quatre bonnes réponses. Une seule est la sienne.",
      note: "Personne ne trouve du premier coup !",
      photo: "/direct/plat-axoa.jpg",
      geste: "Je valide ma réponse",
      apres: "Et maintenant…",
      options: [
        { cle: "piment", nom: "Le piment d’Espelette", detail: "Le goût du pays", emoji: "🌶️" },
        { cle: "veau", nom: "La qualité du veau", detail: "Élevé sous la mère", emoji: "🥩" },
        { cle: "temps", nom: "Les deux heures de feu", detail: "Rien ne se presse", emoji: "⏱️" },
        { cle: "couteau", nom: "La découpe au couteau", detail: "Un geste, pas une machine", emoji: "🔪" },
      ],
      verite: {
        titre: "Le secret de Pello",
        mot: "La découpe. Un axoa haché à la machine rend son eau et s’écrase ; coupé au couteau, chaque morceau garde sa tenue. C’est vingt minutes de travail en plus, tous les matins.",
      },
    },
    {
      quoi: "final",
      titre: "Votre axoa vous ",
      suite: "attend",
      phrase: "Servi à la louche, comme à la maison.",
      photo: "/direct/plat-axoa.jpg",
    },
  ],
};

/**
 * ═══ PARCOURS 4 — LA TABLE D'HÔTES : JE COMPOSE MON MENU ═══════════════════
 *
 * « Plat personnalisable → je compose. » Ici ce n'est pas un plat qu'on
 * compose, c'est un REPAS — c'est ce que vend une table d'hôtes, et c'est ce
 * qui la distingue d'un restaurant à la carte.
 */
export const GOUT_TABLEE: Gout = {
  plat: "Le menu du soir",
  detail: "Entrée, plat, dessert, verre compris",
  prix: "17 €",
  accent: "#FFC24B",
  chef: {
    mot: "On mange tous à la même table. Vous choisissez ce qu’il y a dans votre assiette, pas avec qui vous dînez.",
    qui: "Margot",
  },
  tampon: "TABLE D’HÔTES",
  temps: [
    {
      quoi: "ouvrir",
      titre: "Ce soir, à ",
      suite: "la grande tablée",
      phrase: "Une longue table, dix-huit couverts, un seul menu — le vôtre.",
      photo: "/direct/tablee-du-soir.jpg",
      geste: "Composer mon menu",
    },
    {
      quoi: "compose",
      titre: "Quelle entrée ",
      suite: "pour commencer ?",
      phrase: "Tout arrive du marché le matin même.",
      photo: "/direct/plat-basquaise.jpg",
      geste: "Suivant",
      options: [
        { cle: "garbure", nom: "Garbure", detail: "Chou, confit, haricots", emoji: "🍲", resume: "Garbure" },
        { cle: "salade", nom: "Salade landaise", detail: "Gésiers, magret séché", emoji: "🥗", resume: "Salade landaise" },
        { cle: "oeuf", nom: "Œuf mimosa", detail: "Comme à la maison", emoji: "🥚", resume: "Œuf mimosa" },
      ],
    },
    {
      quoi: "compose",
      titre: "Et le plat ",
      suite: "qui suit ?",
      phrase: "Servi au plat, on se ressert.",
      note: "Personne ne repart avec faim ici !",
      photo: "/direct/plat-basquaise.jpg",
      geste: "Suivant",
      options: [
        { cle: "basquaise", nom: "Poulet basquaise", detail: "Riz, poivrons du pays", emoji: "🍗", resume: "Poulet basquaise" },
        { cle: "axoa", nom: "Axoa de veau", detail: "Piment doux", emoji: "🥩", resume: "Axoa de veau" },
        { cle: "poisson", nom: "Poisson du jour", detail: "Selon l’arrivage", emoji: "🐟", resume: "Poisson du jour" },
      ],
    },
    {
      quoi: "final",
      titre: "Votre couvert ",
      suite: "est mis",
      phrase: "Le dessert, c’est la surprise de Margot.",
      photo: "/direct/tablee-du-soir.jpg",
    },
  ],
};

/**
 * ═══ PARCOURS 5 — LE PARMENTIER : JE RÉVÈLE L'INTÉRIEUR ════════════════════
 *
 * « Dessert → je révèle l'intérieur. » La mécanique vaut pour tout plat dont
 * l'intérêt est CACHÉ SOUS LA SURFACE — et un parmentier est exactement ça :
 * une purée dorée au-dessus, et tout le travail en dessous.
 *
 * C'EST LE SEUL DES CINQ QUI N'A QU'UN GESTE ET RIEN À CHOISIR. On ne compose
 * pas un plat à emporter : on regarde ce qu'il y a dedans, et on décide.
 */
export const GOUT_PARMENTIER: Gout = {
  plat: "Parmentier de canard",
  detail: "Part individuelle",
  prix: "12 €",
  accent: "#E8B04B",
  chef: {
    mot: "Le dessus, tout le monde sait le faire. C’est ce qu’il y a dessous qui prend la journée.",
    qui: "Maison Lartigue",
  },
  tampon: "FAIT MAISON",
  temps: [
    {
      quoi: "ouvrir",
      titre: "Un parmentier ",
      suite: "de canard",
      phrase: "Doré au-dessus. Et en dessous ?",
      photo: "/direct/plat-parmentier.jpg",
      geste: "C’est parti !",
    },
    {
      quoi: "geste",
      titre: "Ouvrez-le ",
      suite: "à la cuillère",
      phrase: "Allez-y, plantez la cuillère au milieu.",
      note: "C’est là que ça se passe !",
      photo: "/direct/plat-parmentier.jpg",
      geste: "Casser la croûte",
      apres: "Ça se voit, non ?",
    },
    {
      quoi: "final",
      titre: "Du confit ",
      suite: "jusqu’en bas",
      phrase: "Effiloché à la main, deux jours avant. C’est pour ça qu’il tient à la cuillère.",
      photo: "/direct/plat-parmentier.jpg",
    },
  ],
};

/**
 * ═══ PARCOURS 6 — LE VERRE : JE DIS CE QUE J'AIME, ON ME SERT ══════════════
 *
 * « Bar → un morceau de la soirée de ce soir. » « Cocktail → je choisis /
 * je mélange. »
 *
 * UN BAR NE VEND PAS UN PLAT, ET C'EST CE QUI A FAILLI LE LAISSER DE CÔTÉ. Son
 * onglet disait « Qui est là » faute d'avoir quelque chose à faire essayer —
 * honnête, et insuffisant. Ce qu'un bar à vins fait essayer, c'est LE CONSEIL :
 * on dit ce qu'on aime avec ses propres mots, et quelqu'un derrière le comptoir
 * sait quoi vous servir. C'est exactement ce qu'on ne peut pas faire seul
 * devant une carte des vins, et c'est ce qui fait entrer.
 */
export const GOUT_VERRE: Gout = {
  plat: "Le verre du soir",
  detail: "Servi au comptoir",
  prix: "5 €",
  accent: "#C77DFF",
  chef: {
    mot: "Dites-moi ce que vous aimez boire d’habitude, et je vous fais goûter autre chose. C’est tout mon métier.",
    qui: "Serge, au comptoir",
  },
  temps: [
    {
      quoi: "ouvrir",
      titre: "Ce soir, ",
      suite: "on vous sert quoi ?",
      phrase: "Dites-le en deux gestes. Serge s’occupe du reste.",
      photo: "/direct/verre-au-comptoir.jpg",
      geste: "C’est parti !",
    },
    {
      quoi: "compose",
      titre: "Vous partez plutôt ",
      suite: "sur quoi ?",
      phrase: "Il n’y a pas de mauvaise réponse, il y a la vôtre.",
      photo: "/direct/bar-cave.jpg",
      geste: "Suivant",
      options: [
        { cle: "blanc", nom: "Un blanc sec", detail: "Vif, tendu", emoji: "🥂", resume: "Un blanc sec" },
        { cle: "rouge", nom: "Un rouge léger", detail: "Souple, fruité", emoji: "🍷", resume: "Un rouge léger" },
        { cle: "corse", nom: "Quelque chose de corsé", detail: "Qui tient en bouche", emoji: "🍇", resume: "Un rouge corsé" },
        { cle: "sans", nom: "Sans alcool", detail: "Et c’est très bien", emoji: "🍎", resume: "Sans alcool" },
      ],
    },
    {
      quoi: "compose",
      titre: "Et avec ça, ",
      suite: "on grignote ?",
      phrase: "Tout vient de moins de trente kilomètres.",
      note: "La planche, c’est pour deux…",
      photo: "/direct/bar-planche.jpg",
      geste: "Suivant",
      options: [
        { cle: "planche", nom: "La planche mixte", detail: "Charcuterie et fromages", emoji: "🧀", resume: "Planche mixte" },
        { cle: "olives", nom: "Olives et amandes", detail: "Juste pour picorer", emoji: "🫒", resume: "Olives et amandes" },
        { cle: "rien", nom: "Rien, merci", detail: "Le verre suffit", emoji: "🙂", resume: "Rien" },
      ],
    },
    {
      quoi: "final",
      titre: "Votre verre ",
      suite: "vous attend",
      phrase: "Dites à Serge que vous venez de la part du Fantôme.",
      photo: "/direct/bar-salle.jpg",
    },
  ],
};

/**
 * ═══ PARCOURS 7 — LA TERRASSE : JE CHOISIS MON MOMENT ══════════════════════
 *
 * « Bar → un morceau de la soirée de ce soir. »
 *
 * CELUI-CI NE FAIT PAS ESSAYER UN PRODUIT, IL FAIT ESSAYER UN MOMENT — et
 * c'est le cas le plus éloigné du magret, donc celui qui prouve le mieux que la
 * forme tient. Ce qu'une terrasse vend, ce n'est pas le spritz : c'est
 * l'heure qu'il fera quand vous vous assiérez, et avec qui.
 */
export const GOUT_TERRASSE: Gout = {
  plat: "De la place en terrasse",
  detail: "Plein sud, sans réserver",
  accent: "#FFB454",
  chef: {
    mot: "À partir de dix-huit heures, le soleil passe derrière les platanes. C’est le meilleur moment, et personne ne le sait.",
    qui: "Lou, en salle",
  },
  temps: [
    {
      quoi: "ouvrir",
      titre: "Votre place ",
      suite: "au soleil",
      phrase: "Il reste trois tables. Voyons laquelle est la vôtre.",
      photo: "/direct/terrasse-au-soleil.jpg",
      geste: "C’est parti !",
    },
    {
      quoi: "compose",
      titre: "Vous arrivez ",
      suite: "vers quelle heure ?",
      phrase: "La lumière n’est pas la même, et le monde non plus.",
      photo: "/direct/terrasse-au-soleil.jpg",
      geste: "Suivant",
      options: [
        { cle: "gouter", nom: "Vers 17 h", detail: "Plein soleil, terrasse calme", emoji: "☀️", resume: "17 h" },
        { cle: "apero", nom: "Vers 19 h", detail: "L’ombre des platanes", emoji: "🌇", resume: "19 h" },
        { cle: "soir", nom: "Après 21 h", detail: "Guirlandes allumées", emoji: "✨", resume: "Après 21 h" },
      ],
    },
    {
      quoi: "compose",
      titre: "Et vous venez ",
      suite: "à combien ?",
      phrase: "On garde ce qu’il faut, sans réserver.",
      photo: "/direct/bar-salle.jpg",
      geste: "Suivant",
      options: [
        { cle: "deux", nom: "À deux", detail: "Une ronde au bord", emoji: "👥", resume: "À deux" },
        { cle: "bande", nom: "À quatre ou cinq", detail: "La grande table du fond", emoji: "👨‍👩‍👧‍👦", resume: "À quatre ou cinq" },
        { cle: "seul", nom: "Tout seul", detail: "Au comptoir, très bien aussi", emoji: "🙂", resume: "Seul" },
      ],
    },
    {
      quoi: "final",
      titre: "C’est noté, ",
      suite: "à tout à l’heure",
      phrase: "Passez, dites bonjour à Lou. Il reste trois places.",
      photo: "/direct/terrasse-au-soleil.jpg",
    },
  ],
};

export const GOUTS: Record<string, Gout> = {
  centre: GOUT_MAGRET,
  emporter: GOUT_PESTO,
  // « Pour les restaurants, il n'y a qu'un seul restaurant qui a le nouveau
  // parcours ; les autres sont toujours avec l'ancien concept de fantôme. »
  // Les cinq qui manquaient, chacun avec SA mécanique — c'est le point du
  // brief, et c'est aussi ce qui le met à l'épreuve : sept plats, six jeux
  // différents, et deux d'entre eux ne sont pas des plats.
  "deux-rues": GOUT_AXOA,
  tablee: GOUT_TABLEE,
  traiteur: GOUT_PARMENTIER,
  "bar-vins": GOUT_VERRE,
  "bar-terrasse": GOUT_TERRASSE,
};

/**
 * LE PARCOURS D'UN COMMERCE, S'IL EN A UN.
 *
 * ELLE EST INDEXÉE PAR COMMERCE ET NON PAR MUR, ET C'EST TOUT LE PIÈGE ÉVITÉ.
 * Tous les restaurants du paquet partagent le MÊME mur modèle — « margot » —
 * parce qu'un mur porte une mécanique, pas une carte. Une table indexée par mur
 * aurait donc servi le magret de Bergine à tous les restaurants de Dax, y
 * compris à celui qui fait des lasagnes.
 *
 * ET L'ABSENCE EST LE CAS NORMAL, PAS UN TROU. Deux plats ont été « racontés » ;
 * les autres n'ont rien à faire jouer, et leur fantôme garde le mur de
 * présence. Le jour où l'assistante interroge un restaurateur le matin, c'est
 * cette fonction qui rendra son parcours.
 */
export function goutDuCommerce(id: string | undefined): Gout | undefined {
  return id ? GOUTS[id] : undefined;
}
