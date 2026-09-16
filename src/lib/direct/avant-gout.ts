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
export const GOUTS: Record<string, Gout> = {
  centre: GOUT_MAGRET,
  emporter: GOUT_PESTO,
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
