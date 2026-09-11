// 👻 LE FANTÔME — ce qu'on laisse derrière soi dans un lieu.
//
// ═══ LA DÉFINITION, ET ELLE EST VERROUILLÉE ════════════════════════════════
//
//   LE FANTÔME, C'EST VOUS QUAND VOUS N'ÊTES PAS LÀ.
//
//   Vous laissez une trace dans un lieu — une photo, quelques mots, une envie,
//   un essai. Elle y reste quelques heures. Les autres la découvrent. S'ils
//   sont intéressés : « Ça m'intéresse ». ClikMe met en relation. Et votre
//   fantôme revient vous raconter ce qui s'est passé.
//
// CETTE PHRASE FAIT PLUS QUE DÉFINIR : ELLE RÉCONCILIE. Il y avait deux
// fantômes dans le produit avec le même dessin — celui qui veille sur une
// discussion et vous rapporte ce qui s'y passe (`salons.ts`, cinq états), et
// celui qu'on laisse quelque part. Veiller n'est pas une seconde fonction :
// c'est le fantôme qu'on a laissé qui fait son rapport.
//
// CONSÉQUENCE TENUE PARTOUT : IL N'Y EN A QU'UN. Pas un fantôme par
// publication — un fantôme, le vôtre, qui se déplace. C'est ce qui donne son
// sens au quota : ce n'est pas « trois publications par jour », c'est « votre
// fantôme ne peut pas être à plus de trois endroits à la fois ».
//
// ═══ UN GESTE, DEUX FAÇONS DE LE REMPLIR ══════════════════════════════════
//
// Le geste est identique partout — je suis ici, je laisse mon fantôme, il reste
// — et c'est le LIEU qui décide de ce qu'on y met. Deux dépôts, et deux
// seulement :
//
//   · ANNONCE — restaurant, café, bar, commerce. Une photo, quelques mots, et
//     un verbe pris dans une liste fermée. Plus une humeur : ce qu'on vient
//     chercher ici aujourd'hui.
//   · ESSAI — bijou, vêtement, coiffure, ongles, objet chez soi. LE CLIENT
//     PHOTOGRAPHIE CE QUI VA RECEVOIR LA CHOSE — son poignet, sa main, sa
//     table de salon — et la photo du commerçant vient s'y poser. Le fantôme
//     reste sur le mur qu'on ait pris ou non : « cette bague a été essayée par
//     quatorze personnes et deux l'ont prise » est un chiffre qu'aucun
//     commerçant n'a jamais eu.
//
// CE QUI SERAIT UNE ERREUR : EN FAIRE DEUX PRODUITS. Ils partagent la carte, le
// mur, la durée, le quota, « Ça m'intéresse » et la mise en relation. Seul
// l'écran de dépôt diffère, et il diffère parce que le lieu diffère — c'est
// exactement ce que l'application fait déjà pour le mot du métier : un coiffeur
// n'a pas de « carte », il n'a pas non plus le même fantôme.
//
// ═══ LE MUR EST UNE FENÊTRE, PAS UNE CAGE ═════════════════════════════════
//
// LE MUR DE MARGOT N'EST PAS « LES GENS QUI PARLENT DE MARGOT », c'est « ce que
// les gens ont laissé ici aujourd'hui » — et ce qu'ils laissent peut concerner
// toute la ville. C'est la décision la plus structurante du concept, parce
// qu'elle décide de la taille du produit : « je donne vingt vinyles » n'a rien à
// voir avec un restaurant, et c'est précisément pour ça que ça vaut le coup.
//
// ET LE MÊME FANTÔME EXISTE AILLEURS, avec son tampon de lieu. Sans cette
// remontée, les vinyles de Thomas seraient vus par les douze personnes qui
// déjeunent là, et le mur mourrait de faim.
//
// ═══ UN MUR NE DÉMARRE JAMAIS VIDE ════════════════════════════════════════
//
// C'est une règle, pas une astuce de lancement. Le mur vide tue les surfaces
// contributives : personne ne veut être le premier à parler dans une pièce
// silencieuse. À l'ouverture, ce sont donc les fantômes de LA MAISON qu'on voit
// — le chef, la patronne — et les clients prennent le relais tout seuls. Ils
// sont marqués, et ce n'est pas négociable : un fantôme du patron qui passerait
// pour un client, c'est un faux avis.
//
// ═══ CE QU'ON S'INTERDIT AU LANCEMENT ═════════════════════════════════════
//
// PAS DE « JE VENDS ». Chercher, proposer, donner, prêter, aider : oui. Vendre :
// non. Dès qu'on vend, la page publique d'un commerce devient une place de
// marché, avec ce qui va avec — signalement, retrait, identification du vendeur.
// La liste des verbes est fermée POUR ÇA : un champ libre laisserait la vente
// entrer par la phrase.
//
// `import type` ET PAS `import` : `essai.ts` vit dans le navigateur — il touche
// `document` — alors que ce fichier est lu aussi par le serveur. Un import de
// TYPE disparaît à la compilation et ne fait donc entrer aucun code.
import type { Gabarit } from "./essai";

/** Ce que le lieu propose de déposer. Décide de l'écran, et de lui seul. */
import { numeroDeFiction } from "@/lib/direct/prevenir";

export type Depot = "annonce" | "essai";

/**
 * L'HUMEUR — ce qu'on vient chercher ici, aujourd'hui.
 *
 * CE N'EST PAS UN STATUT DE PRÉSENCE. « Thomas est ici » ne sert à personne :
 * dans une salle pleine, tout le monde est ici. Ce qui manque, et qu'aucune
 * application ne dit, c'est POURQUOI on y est — et c'est la seule information
 * qui permette à deux inconnus de se parler sans que ce soit gênant.
 *
 * ELLE N'EST PAS RÉSERVÉE AUX BARS. Un restaurant en a autant besoin : « avec
 * mon groupe » et « ouvert aux rencontres » ne décrivent pas le même déjeuner,
 * et c'est ce qui rend une salle lisible depuis la rue.
 */
export type Humeur = {
  cle: string;
  emoji: string;
  mot: string;
  /** La teinte de la pastille. Quatre, pas douze : au-delà, plus rien ne tranche. */
  teinte: "menthe" | "violet" | "ambre" | "bleu";
};

export const HUMEURS: Humeur[] = [
  { cle: "chill", emoji: "😌", mot: "En mode chill", teinte: "menthe" },
  { cle: "gourmand", emoji: "🍴", mot: "Gourmand", teinte: "violet" },
  { cle: "groupe", emoji: "👥", mot: "Avec mon groupe", teinte: "ambre" },
  { cle: "rencontres", emoji: "💙", mot: "Ouvert aux rencontres", teinte: "bleu" },
  { cle: "amis", emoji: "🍻", mot: "Entre amis", teinte: "ambre" },
  { cle: "monde", emoji: "🫶", mot: "Rencontrer du monde", teinte: "bleu" },
  { cle: "musique", emoji: "🎶", mot: "Pour la musique", teinte: "violet" },
  { cle: "decouvre", emoji: "👀", mot: "Je découvre", teinte: "menthe" },
  { cle: "hesite", emoji: "🤔", mot: "J’hésite encore", teinte: "violet" },
  { cle: "offrir", emoji: "🎁", mot: "C’est pour offrir", teinte: "ambre" },
];

export function humeurDe(cle: string | undefined): Humeur | undefined {
  return HUMEURS.find((h) => h.cle === cle);
}

/**
 * LES VERBES, ET LA LISTE EST LA RÈGLE.
 *
 * Elle est ici et pas dans l'écran parce que c'en est une : « je vends » n'y est
 * pas, et son absence est une décision de produit. Voir l'en-tête.
 */
export type Verbe = {
  cle: string;
  emoji: string;
  mot: string;
  /**
   * CE QU'ON ÉCRIT DERRIÈRE CE VERBE-LÀ.
   *
   * « Quand je clique sur une des options, rien ne se passe, ça ne produit aucun
   * changement. » C'était vrai à l'œil : seule une bordure changeait. L'exemple
   * du champ change maintenant AVEC le verbe — c'est la preuve visible que
   * l'appui a fait quelque chose, et c'est aussi ce qui apprend quoi écrire.
   */
  exemple: string;
};

export const VERBES: Verbe[] = [
  { cle: "cherche", emoji: "📣", mot: "Je cherche", exemple: "Je cherche 2 places pour le concert de vendredi…" },
  { cle: "propose", emoji: "🤲", mot: "Je propose", exemple: "Je propose une place dans ma voiture pour le marché de samedi…" },
  /**
   * « J'Y SERAI » A REMPLACÉ « J'AI 2 PLACES ».
   *
   * « Cette option est étrange » — et elle l'était : un verbe entier consacré à
   * un cas particulier, alors que les quatre autres décrivent des intentions.
   * Ce qui manquait, c'était le verbe qui SERT LE LIEU : dire qu'on y sera, à
   * quelle heure, et qu'il reste de la place à sa table. C'est celui-là qui fait
   * venir les gens chez le commerçant — c'est-à-dire tout l'objet du mur.
   */
  { cle: "serai", emoji: "🙋", mot: "J’y serai", exemple: "Je serai là ce midi vers 12 h 30, il reste de la place à ma table…" },
  { cle: "donne", emoji: "🎁", mot: "Je donne", exemple: "Je donne 20 vinyles rock, à récupérer ici…" },
  { cle: "aide", emoji: "🤝", mot: "Je peux aider", exemple: "Je peux aider à monter un meuble ce week-end…" },
];

export function verbeDe(cle: string | undefined): Verbe | undefined {
  return VERBES.find((v) => v.cle === cle);
}

export type Fantome = {
  id: string;
  /** Prénom seul. Ce sont des voisins, pas des comptes. */
  qui: string;
  /** « Chef », « Patronne ». Marque le fantôme de la maison — voir l'en-tête. */
  role?: string;
  maison?: boolean;
  /**
   * CE QU'ON MONTRE, ET JAMAIS UN VISAGE.
   *
   * `public/direct/LISEZ-MOI.md` l'interdit, et la raison de produit pèse plus
   * lourd que la précaution : une photo de son propre visage est un geste social
   * lourd, et un mur qui l'exige reste vide. Sur Instagram les gens
   * photographient leur assiette, pas leur tête. La personne est présente
   * autrement — son prénom, son fantôme, son heure.
   */
  photo?: string;
  mot: string;
  /** L'heure telle qu'on l'écrit : « 11:03 ». */
  heure: string;
  humeur?: string;
  verbe?: string;
  /** ESSAI : ce qui a été essayé, et ce qui en a été décidé. */
  essai?: { quoi: string; verdict: "pris" | "passe" | null };
  /**
   * COMBIEN ONT DIT « ÇA M'INTÉRESSE ».
   *
   * CE N'EST PAS UN SCORE, ET LA DIFFÉRENCE EST TOUT LE SUJET. Un « j'aime » est
   * gratuit, donc il ne veut rien dire. Celui-ci ENGAGE — on accepte d'être mis
   * en relation — et c'est ce coût qui rend le compteur honnête. Corollaire tenu
   * à l'écran : il reste petit. Le jour où il devient gros, on a refait le like.
   */
  interesses?: number;
  /**
   * JUSQU'À QUAND ÇA A ENCORE DU SENS.
   *
   * PAS DE DISPARITION À MINUIT PAR RÉFLEXE. Une trace posée dans un lieu vit
   * quelques heures — c'est le cas ordinaire, et c'est ce que dit l'écran de
   * dépôt. Mais « je cherche deux places pour vendredi » publié un mardi
   * mourrait le mardi soir, et c'est justement l'annonce qui vaut le plus : la
   * durée suit donc LA CHOSE, sept jours au maximum. C'est la logique du fil,
   * qui trie par ordre de disparition.
   */
  jusqua?: string;
};

/**
 * UNE PIÈCE DU CATALOGUE, POUR L'ESSAI.
 *
 * `photo` est la pièce telle que le commerçant la montre — détourée, sur fond
 * neutre. `rendu` est ce que ça donne SUR LA PHOTO DU CLIENT, et c'est la seule
 * chose qui compte : sans lui, on montre un catalogue de plus.
 *
 * `decoupe` EST CE QUI A REMPLACÉ LE RENDU TOUT FAIT, et c'est le changement le
 * plus important de cette version. Avant, chaque pièce exigeait une photo du
 * résultat, prise à l'avance, sur un bras précis : impossible à tenir pour un
 * commerçant qui publie UNE PIÈCE PAR JOUR. Maintenant elle n'exige que sa
 * propre découpe — le PNG détouré de la photo qu'il a prise ce matin — et le
 * rendu se calcule dans le téléphone du client, sur SA photo à lui.
 *
 * `bientot` DIT LA VÉRITÉ PLUTÔT QUE DE LA MAQUILLER, et il reste. La première
 * tentative de poser l'image détourée sur le poignet avait donné un bijou qui
 * FLOTTE, et les deux pièces concernées avaient été marquées ainsi. Ce qui
 * manquait a été trouvé depuis — l'arc arrière doit passer DERRIÈRE le bras, et
 * la pièce doit prendre la lumière de la peau — donc elles s'essaient. Ce qui
 * n'a pas de découpe, lui, se marque toujours.
 */
export type Piece = {
  id: string;
  nom: string;
  prix: string;
  photo: string;
  /** Le PNG détouré de la pièce. C'est lui qu'on pose sur la photo du client. */
  decoupe?: string;
  /** Un rendu tout prêt, quand il en existe un de meilleur que le calcul. */
  rendu?: string;
  /**
   * LA PHOTO DU TRAVAIL FINI, ET C'EST ELLE QU'ON ESSAIE.
   *
   * « Je n'ai plus que des choix de couleurs, mais plus le choix qu'on voit sur
   * une photo prise par le commerçant qui aurait mis les ongles d'une cliente
   * avec des motifs. »
   *
   * IL AVAIT RAISON, ET C'ÉTAIT MA FAUTE. J'avais transformé les pièces en
   * teintes parce que mon moteur ne savait poser qu'une couleur — c'est-à-dire
   * que j'avais mis le MODÈLE DE DONNÉES au service de ma limite technique. Ce
   * qu'une cliente veut essayer, c'est le travail de la prothésiste : un motif,
   * une french, un dégradé. Une pastille de couleur ne se désire pas.
   *
   * C'est cette image qui part au modèle avec la photo du client. Voir
   * `app/api/direct/essayer/route.ts`.
   */
  reference?: string;
  /**
   * LA COULEUR SEULE — l'ancien moteur géométrique.
   *
   * GARDÉE, MAIS PLUS UTILISÉE PAR L'ONGLERIE. Elle ne sait poser qu'un aplat, ce
   * qui a été jugé sans appel sur un vrai téléphone. Voir
   * `lib/direct/ongles.ts`, qui reste en place et documenté : le jour où l'on
   * voudra un essai hors ligne, dégradé et gratuit, c'est là qu'il est.
   */
  vernis?: { couleur: string; longueur?: number };
  bientot?: boolean;
};

export type Mur = {
  cle: string;
  /**
   * DE QUEL MODÈLE CE MUR EST TIRÉ.
   *
   * `cle` porte l'identité DU COMMERCE (l'identifiant de sa carte), pas celle du
   * modèle — c'est ce qui fait que deux ongleries n'ont pas le même mur. Le
   * modèle se perdait donc à la construction, et sans lui on ne peut pas
   * reconstituer le mur plus tard à partir d'un souvenir. Voir `murDuSouvenir`.
   */
  modele?: string;
  lieu: string;
  metier: string;
  ville: string;
  distance: string;
  note: string;
  avis: number;
  /** Deux ou trois mots sous le nom : « Cuisine française », « Terrasse ». */
  etiquettes: string[];
  /**
   * LA PHOTO DU LIEU, ET ELLE PEUT MANQUER.
   *
   * UN MÉTIER PEUT ENTRER DANS LA DÉMONSTRATION AVANT SES PHOTOS. Le tatoueur
   * a été demandé depuis le terrain ; ses images arriveront après. Deux
   * mauvaises réponses étaient possibles : lui prêter la photo d'un autre
   * commerce — la faute qui a donné le mur des bougies à un hypnothérapeute —
   * ou pointer un fichier absent, ce qui fabrique une erreur 404 dans la
   * console. Une console qui crie pour une raison connue est une console où
   * plus personne ne voit les vraies erreurs.
   *
   * ABSENTE, LE MUR PREND UN FOND SOMBRE ET NE PRÉTEND RIEN.
   */
  photoLieu?: string;
  depot: Depot;
  /** Les humeurs proposées ici. Vide = on ne demande pas d'humeur. */
  humeurs: string[];
  /** Les verbes proposés ici. */
  verbes: string[];
  /**
   * L'ESSAI, ET CE QU'IL DEMANDE AU CLIENT.
   *
   * `partie` est ce qu'il photographie — son poignet, sa main, sa table de
   * salon. C'est le cœur de la mécanique et ce qui la rend possible sans
   * visage : on ne photographie pas la personne, on photographie L'ENDROIT OÙ
   * LA CHOSE VA.
   */
  essai?: {
    partie: string;
    consigne: string;
    /**
     * LA PHOTO QUE LE CLIENT VIENT DE PRENDRE.
     *
     * Dans le produit elle sort de l'appareil ; ici elle est fournie, et elle
     * doit être LE MÊME CADRE que les rendus — même bras, même lumière, même
     * fond. C'est la seule condition pour que l'avant-après démontre quelque
     * chose : deux photos différentes ne prouvent rien, sinon qu'on sait
     * afficher deux images l'une après l'autre.
     */
    avant: string;
    /**
     * LE GABARIT — CE QUE L'ÉCRAN DE PRISE DE VUE A DEMANDÉ.
     *
     * IL N'EST PAS UNE CONTRAINTE IMPOSÉE AU CLIENT, C'EST CE QUI REND L'ESSAI
     * GRATUIT. Parce que l'écran a demandé de mettre le poignet LÀ, on sait où
     * il est ; parce qu'on sait où il est, on n'a pas besoin d'un modèle pour le
     * chercher ; et parce qu'on n'a pas besoin d'un modèle, l'essai ne coûte
     * rien, ne s'envoie nulle part et sort instantanément.
     *
     * Sans gabarit, la pièce n'est pas essayable : voir `bientot`.
     */
    gabarit?: Gabarit;
    /**
     * LES MOTS DU MÉTIER, ET ILS NE SE PARTAGENT PAS.
     *
     * « Il faut aussi que chaque texte soit vraiment en fonction du métier, et
     * donc pas le même texte pour un coiffeur, une onglerie ou un magasin de
     * vêtements. »
     *
     * C'EST JUSTE, ET C'EST PLUS QU'UNE QUESTION DE TON. « Choisissez la pièce »
     * ne veut rien dire chez un coiffeur ; « Je réserve ma séance » ne veut rien
     * dire dans une boutique de vêtements. Un mot générique force le client à
     * traduire, et traduire coûte une seconde à chaque écran.
     *
     * LES MOTS SONT DONC DES DONNÉES, PAS DU CODE. Ajouter un métier, c'est
     * écrire ses sept phrases — pas ouvrir un composant et y mettre un `if`.
     */
    mots: {
      /** Le titre de l'écran d'essai. Court, et il nomme la partie du corps. */
      titre: string;
      /** Une phrase, une seule, qui dit ce qui va se passer. */
      phrase: string;
      /** Le grand bouton de prise de vue. */
      geste: string;
      /** Ce qu'on choisit ensuite : une pose, une coupe, une pièce. */
      choisir: string;
      /** Le geste d'achat, après le rendu. */
      reserver: string;
      /** Revenir choisir autre chose. */
      autres: string;
      /** Le seul lien vers le mur, depuis l'essai. */
      mur: string;
    };
    pieces: Piece[];
  };
  /**
   * SON NUMÉRO, POUR LE PRÉVENIR APRÈS UN ESSAI.
   *
   * « Quand je dis "je réserve ma place", j'ai cet écran au lieu d'avoir le
   * WhatsApp qui s'ouvre. » Le mur ne savait pas joindre le commerçant : il
   * portait son nom, sa note et sa distance, mais rien par quoi lui parler.
   *
   * DANS LA MAQUETTE C'EST UN NUMÉRO DE FICTION, et c'est une règle de
   * sécurité : un numéro inventé au hasard existe vraiment chez quelqu'un. Voir
   * `numeroDeFiction` dans `lib/direct/prevenir.ts`.
   */
  telephone?: string;
  /**
   * CE QUE LE LIEU MET SOUS LE MUR — le plat du jour, la pièce du jour.
   * C'est le seul endroit de la feuille où le commerce parle de ce qu'il vend.
   */
  contexte?: { titre: string; quoi: string; detail: string; photo: string; geste: string };
  /** Les fantômes de la maison. Ils ouvrent le mur : voir l'en-tête. */
  maison: Fantome[];
  clients: Fantome[];
};

/**
 * TROIS MURS, ET CE SONT TROIS ÉPREUVES, PAS TROIS EXEMPLES.
 *
 * Un restaurant, dont le mur parle surtout d'autre chose que du restaurant — le
 * cas qui décide si l'idée est grande ou petite. Un bar, où ce qui compte est
 * l'humeur. Une onglerie, où le fantôme est un essai. Si la même feuille tient
 * les trois sans se tordre, le concept tient.
 */
export const MURS: Mur[] = [
  {
    cle: "margot",
    lieu: "Chez Margot",
    metier: "Restaurant",
    ville: "Dax",
    distance: "350 m",
    note: "4,7",
    avis: 124,
    etiquettes: ["Cuisine française", "Terrasse"],
    photoLieu: "/direct/tables-libres.jpg",
    depot: "annonce",
    humeurs: ["chill", "gourmand", "groupe", "rencontres"],
    verbes: ["cherche", "propose", "serai", "donne", "aide"],
    contexte: {
      titre: "Le plat du jour",
      quoi: "Magret de canard",
      detail: "Purée maison & légumes de saison",
      photo: "/direct/plat-du-jour.jpg",
      geste: "Voir la carte",
    },
    maison: [
      {
        id: "m-marc",
        qui: "Marc",
        role: "Chef",
        maison: true,
        photo: "/direct/plat-du-jour.jpg",
        mot: "Le magret est particulièrement réussi aujourd’hui 😋",
        heure: "10:24",
        interesses: 12,
      },
      {
        id: "m-brigitte",
        qui: "Brigitte",
        role: "Patronne",
        maison: true,
        photo: "/direct/terrasse-au-soleil.jpg",
        mot: "Bienvenue chez Margot ! On vous attend pour un bon moment.",
        heure: "09:12",
        interesses: 4,
      },
    ],
    clients: [
      {
        id: "m-lea",
        qui: "Léa",
        photo: "/direct/billets-concert.jpg",
        verbe: "cherche",
        mot: "Je cherche 2 places pour le concert de vendredi au Tube !",
        heure: "11:03",
        humeur: "chill",
        interesses: 12,
        jusqua: "jusqu’à vendredi",
      },
      {
        id: "m-thomas",
        qui: "Thomas",
        photo: "/direct/vinyles-a-donner.jpeg",
        verbe: "donne",
        mot: "Je donne 20 vinyles rock des années 80, à récupérer ici.",
        heure: "11:27",
        humeur: "gourmand",
        interesses: 8,
        jusqua: "encore 6 jours",
      },
      {
        id: "m-chloe",
        qui: "Chloé",
        photo: "/direct/marche-producteurs.jpg",
        verbe: "aide",
        mot: "Je peux aider pour un covoiturage vers le concert de vendredi.",
        heure: "11:41",
        humeur: "groupe",
        interesses: 6,
        jusqua: "jusqu’à vendredi",
      },
      {
        id: "m-nico",
        qui: "Nico",
        photo: "/direct/portion-a-emporter.jpg",
        mot: "Un café et c’est reparti !",
        heure: "12:08",
        humeur: "rencontres",
        interesses: 3,
        jusqua: "encore 3 h",
      },
    ],
  },
  {
    cle: "bar",
    lieu: "Un bar à vins",
    metier: "Bar",
    ville: "Dax",
    distance: "480 m",
    note: "4,6",
    avis: 71,
    etiquettes: ["Vins nature", "Comptoir"],
    photoLieu: "/direct/verre-au-comptoir.jpg",
    depot: "annonce",
    humeurs: ["amis", "monde", "musique", "decouvre"],
    verbes: ["cherche", "propose", "serai", "aide"],
    contexte: {
      titre: "Ce soir au comptoir",
      quoi: "Trois blancs des Landes",
      detail: "Dégustation à partir de 19 h",
      photo: "/direct/verre-au-comptoir.jpg",
      geste: "Voir l’ardoise",
    },
    maison: [
      {
        id: "b-serge",
        qui: "Serge",
        role: "Patron",
        maison: true,
        photo: "/direct/verre-au-comptoir.jpg",
        mot: "Dégustation de trois blancs des Landes à partir de 19 h.",
        heure: "17:40",
        interesses: 9,
      },
      {
        id: "b-lou",
        qui: "Lou",
        role: "En salle",
        maison: true,
        photo: "/direct/tablee-du-soir.jpg",
        mot: "La grande table du fond est libre ce soir, si vous êtes nombreux.",
        heure: "18:05",
        interesses: 3,
      },
    ],
    clients: [
      {
        id: "b-clara",
        qui: "Clara",
        photo: "/direct/tablee-du-soir.jpg",
        mot: "Je viens d’arriver à Dax, je ne connais personne ici.",
        heure: "19:12",
        humeur: "monde",
        interesses: 12,
        jusqua: "encore 3 h",
      },
      {
        id: "b-thomas",
        qui: "Thomas",
        photo: "/direct/terrasse-au-soleil.jpg",
        mot: "On est quatre en terrasse, il reste de la place à la table.",
        heure: "19:26",
        humeur: "amis",
        interesses: 7,
        jusqua: "encore 2 h",
      },
      {
        id: "b-ines",
        qui: "Inès",
        photo: "/direct/concert-kiosque.jpg",
        mot: "Il y a un groupe qui joue à 21 h, je reste jusqu’à la fin.",
        heure: "19:38",
        humeur: "musique",
        interesses: 5,
        jusqua: "encore 4 h",
      },
      {
        id: "b-karim",
        qui: "Karim",
        photo: "/direct/vitrine-du-soir.jpg",
        verbe: "propose",
        mot: "J’ai 2 places pour la nocturne du musée samedi, je les donne.",
        heure: "19:51",
        humeur: "decouvre",
        interesses: 9,
        jusqua: "jusqu’à samedi",
      },
    ],
  },
  {
    cle: "ongles",
    lieu: "Une prothésiste ongulaire",
    metier: "Prothésiste ongulaire",
    ville: "Dax",
    distance: "210 m",
    note: "4,8",
    avis: 51,
    etiquettes: ["Pose complète", "Sans rendez-vous"],
    photoLieu: "/direct/pose-ongles.jpg",
    depot: "essai",
    humeurs: ["hesite", "offrir", "decouvre"],
    verbes: [],
    /**
     * L'ESSAI, MONTRÉ SUR LE MÉTIER OÙ ON PEUT VRAIMENT LE MONTRER.
     *
     * Il l'a décrit sur le bijoutier — le client photographie son poignet, la
     * photo du bracelet vient s'y poser. La mécanique est la même ici, et c'est
     * le seul métier du dépôt pour lequel `public/direct/` contient à la fois un
     * AVANT crédible (une main) et un APRÈS (des ongles posés). Le bijoutier
     * suivra le jour où on aura ses deux images : un poignet nu, et un bracelet
     * détouré sur fond neutre. Faire l'essai avec des images qui ne se
     * correspondent pas ne démontrerait rien du tout — sinon qu'on peut coller
     * deux photos.
     */
    essai: {
      partie: "votre main",
      consigne: "Toute la main dans le cadre, à plat, paume vers le bas, à la lumière du jour.",
      /**
       * L'AVANT A CHANGÉ DE PHOTO, ET POUR UNE RAISON MESURÉE.
       *
       * C'était `pose-ongles.jpg`. Le modèle de main N'Y TROUVE RIEN, à aucun
       * réglage : la main y est repliée, à contre-jour, sur du noir. Essai fait,
       * quatre cadrages, deux délégués, zéro détection. `avis-ongles.jpg` est la
       * même onglerie, bien éclairée, main entière — et elle est reconnue en
       * quatre-vingt-dix millisecondes.
       *
       * ET C'EST UN CAS DUR, PAS UN CAS FACILE : cette main porte déjà un vernis
       * rose à paillettes avec un dégradé. On repeint PAR-DESSUS, ce qui est la
       * situation la plus fréquente — on essaie une couleur quand on en porte
       * déjà une.
       */
      avant: "/direct/avis-ongles.jpg",
      // Rien à placer : c'est le modèle qui trouve les doigts. Voir `Gabarit`.
      gabarit: { forme: "main" },
      mots: {
        titre: "Vos ongles, avant de venir",
        phrase: "Prenez votre main en photo : la pose du salon s’y installe en quelques secondes.",
        geste: "Photographier ma main",
        choisir: "Choisissez la pose",
        reserver: "Je réserve ma séance",
        autres: "Voir les autres poses du jour",
        mur: "Voir les poses portées par les clientes",
      },
      pieces: [
        /**
         * CE QU'ON ESSAIE EST LE TRAVAIL DE LA PROTHÉSISTE, PAS UNE PASTILLE.
         *
         * Chaque pièce porte la PHOTO du résultat sur une vraie main. C'est elle
         * qu'on voit dans la grille, c'est elle qui part au modèle avec la photo
         * de la cliente, et c'est elle qu'on désire — un aplat de couleur ne se
         * désire pas.
         *
         * ET LE MOTIF N'EST PLUS « BIENTÔT ». Il l'était parce que le moteur
         * géométrique ne savait poser qu'une couleur ; un modèle qui reproduit
         * une image n'a pas cette limite. C'était la pièce la plus demandée du
         * mur, et c'est maintenant la première.
         */
        {
          id: "p-coeurs",
          nom: "Motif cœurs, pose amande",
          prix: "45 €",
          photo: "/direct/pose-ongles.jpg",
          reference: "/direct/pose-ongles.jpg",
        },
        {
          id: "p-paillettes",
          nom: "Dégradé pailleté",
          prix: "52 €",
          photo: "/direct/avis-ongles.jpg",
          reference: "/direct/avis-ongles.jpg",
        },
      ],
    },
    contexte: {
      titre: "La pose du moment",
      quoi: "Motif cœurs",
      detail: "Pose complète, 1 h 15",
      photo: "/direct/pose-ongles.jpg",
      geste: "Voir les prestations",
    },
    maison: [
      {
        id: "o-sandra",
        qui: "Sandra",
        role: "Prothésiste",
        maison: true,
        photo: "/direct/pose-ongles.jpg",
        /**
         * ELLE NE PROMET PLUS CE QUE L'ESSAI NE SAIT PAS FAIRE.
         *
         * Elle disait « les nouveaux MOTIFS sont arrivés, essayez-les » au-dessus
         * d'une photo d'ongles à cœurs — alors que l'essai pose UNE COULEUR, et
         * que le motif est marqué « Bientôt essayable » deux écrans plus loin.
         * On promettait donc en haut du mur exactement ce qu'on refusait en bas.
         */
        mot: "Les nouvelles couleurs sont arrivées. Essayez-les avant de venir 💅",
        heure: "09:30",
        interesses: 6,
      },
      {
        id: "o-elodie",
        qui: "Élodie",
        role: "En cabine",
        maison: true,
        photo: "/direct/avis-ongles.jpg",
        mot: "Il me reste un créneau à 16 h aujourd’hui.",
        heure: "10:15",
        interesses: 2,
      },
    ],
    clients: [
      {
        id: "o-julie",
        qui: "Julie",
        photo: "/direct/pose-ongles.jpg",
        essai: { quoi: "Motif cœurs", verdict: null },
        mot: "J’hésite entre celui-ci et le nude tout simple. Vos avis ?",
        heure: "11:12",
        humeur: "hesite",
        interesses: 6,
        jusqua: "encore 2 jours",
      },
      {
        id: "o-nadia",
        qui: "Nadia",
        photo: "/direct/avis-ongles.jpg",
        essai: { quoi: "French classique", verdict: "pris" },
        mot: "Essayé ce matin, rendez-vous pris pour jeudi.",
        heure: "10:48",
        humeur: "decouvre",
        interesses: 4,
        jusqua: "encore 2 jours",
      },
      {
        id: "o-camille",
        qui: "Camille",
        photo: "/direct/avis-ongles.jpg",
        essai: { quoi: "Nude mat", verdict: "passe" },
        mot: "Pas pour moi finalement, mais ça m’a évité de me tromper.",
        heure: "09:55",
        humeur: "hesite",
        interesses: 2,
        jusqua: "encore 2 jours",
      },
      {
        id: "o-sofia",
        qui: "Sofia",
        photo: "/direct/pose-ongles.jpg",
        essai: { quoi: "Motif cœurs", verdict: null },
        mot: "C’est pour le mariage de ma sœur. Trop ou pas assez ?",
        heure: "12:20",
        humeur: "offrir",
        interesses: 7,
        jusqua: "encore 2 jours",
      },
    ],
  },
  {
    cle: "bijoux",
    lieu: "Une créatrice de bijoux",
    metier: "Créatrice de bracelets et colliers",
    ville: "Dax",
    distance: "540 m",
    note: "4,8",
    avis: 64,
    etiquettes: ["Pièces uniques", "Sur mesure"],
    photoLieu: "/direct/atelier-bijoux.jpg",
    depot: "essai",
    humeurs: ["hesite", "offrir", "decouvre"],
    verbes: [],
    /**
     * LE MÉTIER QU'IL AVAIT DÉCRIT, ET CE QUI A CHANGÉ DEPUIS.
     *
     * `poignet-avant.jpg` et `poignet-bracelet.jpg` sont LE MÊME BRAS, la même
     * lumière, le même fond — le premier est un cadrage du second, pris avant le
     * bijou. C'est la seule paire vraie du dépôt, et elle reste la référence.
     *
     * LES DEUX AUTRES PIÈCES ÉTAIENT MARQUÉES « BIENTÔT », ET ELLES NE LE SONT
     * PLUS. L'aveu était honnête : le bijou flottait. Ce qui manquait a été
     * trouvé — l'arc arrière doit passer DERRIÈRE le bras, et la pièce doit
     * prendre la lumière de la peau. Leur rendu n'est donc plus une photo prise
     * à l'avance : il se CALCULE, dans le téléphone, sur la photo du client.
     *
     * ET C'EST CE QUI REND LA MÉCANIQUE TENABLE. Une pièce par jour et par
     * commerce, ça n'a jamais pu vouloir dire une séance photo par jour : ça veut
     * dire une photo du produit sur un fond uni, détourée en cent millisecondes,
     * et posée ensuite sur n'importe quel poignet.
     */
    essai: {
      partie: "votre poignet",
      consigne: "Posez votre poignet à plat, à la lumière du jour, sans montre.",
      avant: "/direct/poignet-avant.jpg",
      // Mesuré sur `poignet-avant.jpg` : le bras y court à environ trente
      // degrés, et il occupe un peu moins de la moitié de la largeur.
      gabarit: {
        forme: "cylindre",
        axe: [
          [0.158, 0.649],
          [0.789, 0.321],
        ],
        diametre: 0.52,
      },
      mots: {
        titre: "Ce bijou, à votre poignet",
        phrase: "Posez votre poignet à plat et photographiez-le : la pièce vient s’y poser.",
        geste: "Photographier mon poignet",
        choisir: "Choisissez la pièce",
        reserver: "Je la réserve",
        autres: "Voir les autres pièces de l’atelier",
        mur: "Voir les bijoux portés par les clientes",
      },
      pieces: [
        {
          id: "j-chaine",
          nom: "Chaîne fine, pierre noire",
          prix: "89 €",
          photo: "/direct/poignet-bracelet.jpg",
          reference: "/direct/poignet-bracelet.jpg",
        },
        {
          id: "j-riviere",
          nom: "Bracelet rivière",
          prix: "240 €",
          photo: "/direct/bracelet-seul.png",
          reference: "/direct/bracelet-seul.png",
        },
        /**
         * CELLE-CI RESTE « BIENTÔT », ET LA RAISON A CHANGÉ.
         *
         * Ce n'est plus le calcul qui manque : sa découpe existe
         * (`decoupe-collier.png`, produite par notre propre détourage) et le
         * composite sait la poser. CE QUI MANQUE EST UNE PHOTO DE COU.
         *
         * On l'a essayée sur le poignet du mur — le seul gabarit disponible — et
         * le résultat est sans appel : un collier drapé sur une main. Un essai
         * n'est juste que si la partie du corps est la bonne, et un gabarit de
         * poignet ne peut pas mentir sur ce point.
         *
         * `cou-nu.jpg` LA DÉBLOQUE, ET RIEN D'AUTRE. C'est déjà la demande écrite
         * dans `public/direct/LISEZ-MOI.md` ; elle vaut maintenant beaucoup moins
         * cher qu'avant, puisqu'il ne faut plus la PAIRE — juste le cou nu.
         */
        {
          id: "j-collier",
          nom: "Collier pierre bleue",
          prix: "120 €",
          photo: "/direct/collier-seul.png",
          bientot: true,
        },
      ],
    },
    contexte: {
      titre: "La pièce du moment",
      quoi: "Chaîne fine, pierre noire",
      detail: "Montée à l’atelier, 89 €",
      photo: "/direct/poignet-bracelet.jpg",
      geste: "Voir les créations",
    },
    maison: [
      {
        id: "j-lucie",
        qui: "Lucie",
        role: "Créatrice",
        maison: true,
        photo: "/direct/atelier-bijoux.jpg",
        mot: "Je monte les chaînes ici, à l’établi. Essayez-les avant de passer ✨",
        heure: "09:40",
        interesses: 7,
      },
      {
        id: "j-atelier",
        qui: "Lucie",
        role: "Atelier",
        maison: true,
        photo: "/direct/poignet-bracelet.jpg",
        mot: "La pierre noire est revenue en stock, en trois longueurs.",
        heure: "10:55",
        interesses: 3,
      },
    ],
    clients: [
      {
        id: "j-julie",
        qui: "Julie",
        photo: "/direct/poignet-bracelet.jpg",
        essai: { quoi: "Chaîne fine, pierre noire", verdict: null },
        mot: "Sur moi ça donne ça. Trop discret pour un cadeau, vous pensez ?",
        heure: "11:20",
        humeur: "offrir",
        interesses: 9,
        jusqua: "encore 2 jours",
      },
      {
        id: "j-nadia",
        qui: "Nadia",
        photo: "/direct/poignet-nu.jpg",
        essai: { quoi: "Bracelet rivière", verdict: "passe" },
        mot: "Essayé, pas pour tous les jours. Mais j’y repense depuis ce matin.",
        heure: "10:12",
        humeur: "hesite",
        interesses: 5,
        jusqua: "encore 2 jours",
      },
      {
        id: "j-sofia",
        qui: "Sofia",
        photo: "/direct/collier-seul.png",
        essai: { quoi: "Collier pierre bleue", verdict: "pris" },
        mot: "Pris pour l’anniversaire de ma mère. Elle ne l’a pas encore vu 🤫",
        heure: "12:04",
        humeur: "offrir",
        interesses: 6,
        jusqua: "encore 2 jours",
      },
    ],
  },
  {
    cle: "bougies",
    lieu: "Une cirière",
    metier: "Cirière",
    ville: "Dax",
    distance: "620 m",
    note: "4,9",
    avis: 38,
    etiquettes: ["Cire végétale", "Fleurs séchées"],
    photoLieu: "/direct/atelier-bougies.jpeg",
    depot: "essai",
    humeurs: ["offrir", "decouvre", "hesite"],
    verbes: [],
    /**
     * L'ESSAI CHEZ SOI, ET C'EST LÀ QUE L'EFFET RECHERCHÉ SE TROUVE.
     *
     * UN OBJET POSÉ SUR UNE SURFACE SE COMPOSE VRAIMENT BIEN. Il a une base, une
     * ombre couchée, et rien à épouser : la lumière du salon prend dessus,
     * l'ombre le pose sur le bois, et le résultat se tient. Mesuré, pas supposé.
     *
     * ET C'EST LA CATÉGORIE LA PLUS LARGE, PAS UN CAS PARTICULIER : tout ce qui
     * se met dans un lieu plutôt que sur un corps — déco, luminaire, plante,
     * mobilier, un plat sur une nappe. L'essai gratuit y couvre tout le métier.
     */
    essai: {
      partie: "votre table de salon",
      consigne: "Reculez d’un pas et cadrez la table entière, de trois quarts.",
      avant: "/direct/table-salon.jpeg",
      // Le pied se pose au centre gauche du plateau, devant les livres — mesuré
      // sur `table-salon.jpeg`, bord avant compris : un objet à cheval sur
      // l'arête de la table se voit tout de suite.
      gabarit: { forme: "plan", pied: [0.365, 0.455], hauteur: 0.235, lumiere: -0.7 },
      mots: {
        titre: "Cette bougie, chez vous",
        phrase: "Photographiez l’endroit où elle irait : elle s’y pose, à la bonne échelle.",
        geste: "Photographier ma table",
        choisir: "Choisissez la bougie",
        reserver: "Je la réserve",
        autres: "Voir les autres bougies du moment",
        mur: "Voir ces bougies chez d’autres",
      },
      pieces: [
        {
          id: "c-trio",
          nom: "Trio bougies & houx",
          prix: "34 €",
          photo: "/direct/bougie-seule.png",
          decoupe: "/direct/decoupe-bougies.png",
        },
        {
          id: "c-fleurs",
          nom: "Bougie fleurs séchées",
          prix: "22 €",
          photo: "/direct/atelier-bougies.jpeg",
          bientot: true,
        },
      ],
    },
    contexte: {
      titre: "La série du moment",
      quoi: "Trio bougies & houx",
      detail: "Cire végétale, mèche bois",
      photo: "/direct/bougie-seule.png",
      geste: "Voir les bougies",
    },
    maison: [
      {
        id: "c-alice",
        qui: "Alice",
        role: "Cirière",
        maison: true,
        photo: "/direct/atelier-bougies.jpeg",
        mot: "Je coule le matin, je démoule l’après-midi. Voyez-les chez vous 🕯️",
        heure: "09:15",
        interesses: 8,
      },
      {
        id: "c-serie",
        qui: "Alice",
        role: "Atelier",
        maison: true,
        photo: "/direct/table-salon-bougie.jpg",
        mot: "Le trio de Noël est sorti du moule. Il reste douze pièces.",
        heure: "11:30",
        interesses: 4,
      },
    ],
    clients: [
      {
        id: "c-camille",
        qui: "Camille",
        photo: "/direct/table-salon-bougie.jpg",
        essai: { quoi: "Trio bougies & houx", verdict: "pris" },
        mot: "Chez moi ça rend mieux que sur la photo de la boutique. Pris.",
        heure: "12:10",
        humeur: "decouvre",
        interesses: 11,
        jusqua: "encore 2 jours",
      },
      {
        id: "c-marc",
        qui: "Marc",
        photo: "/direct/table-salon.jpeg",
        essai: { quoi: "Trio bougies & houx", verdict: null },
        mot: "Ma table est plus petite. Quelqu’un l’a mise sur une console ?",
        heure: "11:48",
        humeur: "hesite",
        interesses: 4,
        jusqua: "encore 2 jours",
      },
    ],
  },
  /**
   * LE COIFFEUR, ET IL N'AVAIT PAS DE MUR.
   *
   * Il tombait sur celui de l'onglerie : « Photographiez votre main » chez un
   * coiffeur. Le défaut venait d'un repli dans `murDeLaCarte`, écrit quand trois
   * murs devaient couvrir dix-huit commerces — et il est resté longtemps après
   * que ce ne soit plus vrai.
   *
   * SA PHOTO « AVANT » NE DÉMONTRE RIEN, ET C'EST ÉCRIT PLUTÔT QUE MASQUÉ. Le
   * dépôt n'a aucun portrait sans visage reconnaissable, donc le chemin « voir
   * avec la photo d'exemple » ne prouve rien ici. Le vrai chemin — on se
   * photographie soi-même — fonctionne. `LISEZ-MOI.md` nomme la photo qui
   * manque.
   */
  {
    cle: "coiffeur",
    lieu: "Un salon de coiffure",
    metier: "Coiffeur",
    ville: "Dax",
    distance: "260 m",
    note: "4,7",
    avis: 88,
    etiquettes: ["Sur rendez-vous", "Colorations"],
    photoLieu: "/direct/salon-neuf.jpg",
    depot: "essai",
    humeurs: ["hesite", "decouvre", "offrir"],
    verbes: [],
    essai: {
      partie: "votre tête",
      consigne: "Face à une fenêtre, cheveux dégagés, sans casquette ni lunettes de soleil.",
      /**
       * LA PHOTO D'EXEMPLE EST ENFIN UN VISAGE DE FACE.
       *
       * ELLE ETAIT UNE NUQUE, ET C'ETAIT LE DEFAUT DE FOND. On se photographie
       * DE FACE ; le modele recevait une photo de face et une reference de dos,
       * et devait deviner le reste. « Il faudrait une coupe de devant pour homme
       * et une coupe de devant pour femme » — c'etait la meme remarque, vue de
       * l'autre bout.
       *
       * L'HOMME SERT DE CLIENT D'EXEMPLE, la femme de reference a essayer sur
       * lui : deux angles identiques, une vraie transformation a voir. Essayer
       * SA propre coupe sur lui donnerait l'identite, ce qui ne demontre rien —
       * mais l'ecran dit deja « photo d'exemple, ce n'est pas la votre », donc
       * personne ne s'y trompe.
       */
      avant: "/direct/coiffure-homme-face.jpg",
      gabarit: { forme: "cadre" },
      mots: {
        titre: "Votre coupe, avant le rendez-vous",
        phrase: "Prenez-vous en photo : la coupe du salon s’installe sur vos cheveux.",
        geste: "Me photographier de face",
        choisir: "Choisissez la coupe",
        reserver: "Je réserve mon créneau",
        autres: "Voir les autres coupes du salon",
        mur: "Voir les coupes faites dans ce salon",
      },
      pieces: [
        {
          id: "c-motif",
          nom: "Motif rasé, nuque",
          prix: "28 €",
          photo: "/direct/avis-coupe.jpg",
          reference: "/direct/avis-coupe.jpg",
        },
        // CE QUI MANQUE EST UNE PHOTO, PAS UN CALCUL. Le modèle sait reproduire
        // une coupe ou une couleur ; il lui faut la photo du travail fini, prise
        // par le salon. Voir `LISEZ-MOI.md`.
        /**
         * UNE COUPE DE FACE POUR CHACUN, ET C'ÉTAIT LE MANQUE.
         *
         * « Il faudrait une coupe de devant pour homme et une coupe de devant
         * pour femme. »
         *
         * JUSTE, ET PLUS PROFOND QU'UN MANQUE DE CHOIX. La seule référence
         * essayable était un motif rasé sur une NUQUE — c'est-à-dire vue de
         * dos. Or on se photographie de face : le modèle recevait une photo de
         * face et une référence de dos, et devait deviner. Une coupe vue du même
         * angle que la photo du client est la condition pour que le rendu
         * tienne, pas un agrément.
         *
         * ELLES SONT « BIENTÔT ESSAYABLES » TANT QUE LES PHOTOS N'EXISTENT PAS.
         * Les deux fichiers sont nommés et décrits dans `LISEZ-MOI.md` — le jour
         * où ils arrivent, il suffit d'ajouter `reference` et de retirer
         * `bientot`. Servir la photo du salon à la place serait un catalogue
         * déguisé en essai.
         */
        { id: "c-homme", nom: "Boucles courtes, de face", prix: "26 €",
          photo: "/direct/coiffure-homme-face.jpg", reference: "/direct/coiffure-homme-face.jpg" },
        { id: "c-femme", nom: "Carré long, de face", prix: "38 €",
          photo: "/direct/coiffure-femme-face.jpg", reference: "/direct/coiffure-femme-face.jpg" },
        { id: "c-balayage", nom: "Balayage miel", prix: "95 €", photo: "/direct/salon-neuf.jpg", bientot: true },
        { id: "c-carre", nom: "Carré dégradé", prix: "45 €", photo: "/direct/fauteuil-coiffeur.jpg", bientot: true },
      ],
    },
    contexte: {
      titre: "La coupe du moment",
      quoi: "Motif rasé",
      detail: "Environ 30 minutes",
      photo: "/direct/avis-coupe.jpg",
      geste: "Voir les tarifs",
    },
    maison: [
      {
        id: "co-yann",
        qui: "Yann",
        role: "Coiffeur",
        maison: true,
        photo: "/direct/avis-coupe.jpg",
        mot: "Il me reste deux créneaux cet après-midi. Essayez avant de venir ✂️",
        heure: "09:10",
        interesses: 5,
      },
      {
        id: "co-salon",
        qui: "Le salon",
        role: "Accueil",
        maison: true,
        photo: "/direct/salon-neuf.jpg",
        mot: "Un désistement à 16 h, la place est pour qui la prend.",
        heure: "11:40",
        interesses: 3,
      },
    ],
    clients: [
      {
        id: "co-hugo",
        qui: "Hugo",
        photo: "/direct/avis-coupe.jpg",
        essai: { quoi: "Motif rasé, nuque", verdict: "pris" },
        mot: "Essayé hier soir, rendez-vous pris pour samedi.",
        heure: "10:20",
        humeur: "decouvre",
        interesses: 6,
        jusqua: "encore 2 jours",
      },
      {
        id: "co-leo",
        qui: "Léo",
        photo: "/direct/salon-neuf.jpg",
        essai: { quoi: "Motif rasé, nuque", verdict: null },
        mot: "J’hésite avec quelque chose de plus sobre. Vos avis ?",
        heure: "12:05",
        humeur: "hesite",
        interesses: 4,
        jusqua: "encore 2 jours",
      },
    ],
  },
  /**
   * LE PRÊT-À-PORTER, ET IL MANQUAIT AUSSI.
   *
   * LES DEUX RÉFÉRENCES SONT DÉCOUPÉES DANS DES PHOTOS DU DÉPÔT, et le recadrage
   * de la cabine RETIRE le visage qui s'y trouvait — une dérivation qui améliore
   * la règle au lieu de l'entamer. Voir `LISEZ-MOI.md`.
   */
  {
    cle: "mode",
    lieu: "Une boutique de prêt-à-porter",
    metier: "Prêt-à-porter",
    ville: "Dax",
    distance: "180 m",
    note: "4,6",
    avis: 42,
    etiquettes: ["Pièces uniques", "Retouches offertes"],
    photoLieu: "/direct/vitrine-mode.jpg",
    depot: "essai",
    humeurs: ["hesite", "decouvre", "offrir"],
    verbes: [],
    essai: {
      partie: "vous, en buste",
      consigne: "Debout face à une fenêtre, bras le long du corps, buste entier dans le cadre.",
      avant: "/direct/poignet-nu.jpg",
      gabarit: { forme: "cadre" },
      mots: {
        titre: "Cette pièce, sur vous",
        phrase: "Prenez-vous en photo en buste : le vêtement de la boutique s’y met.",
        geste: "Me photographier en buste",
        choisir: "Choisissez la pièce",
        reserver: "Je la mets de côté",
        autres: "Voir les autres pièces rentrées",
        mur: "Voir ces pièces portées par d’autres",
      },
      pieces: [
        {
          id: "m-combinaison",
          nom: "Combinaison beige, ceinturée",
          prix: "129 €",
          photo: "/direct/mode-combinaison.jpg",
          reference: "/direct/mode-combinaison.jpg",
        },
        {
          id: "m-chemise",
          nom: "Chemise en jean",
          prix: "69 €",
          photo: "/direct/mode-chemise-jean.jpg",
          reference: "/direct/mode-chemise-jean.jpg",
        },
        { id: "m-robe", nom: "Robe à carreaux", prix: "89 €", photo: "/direct/vitrine-mode.jpg", bientot: true },
      ],
    },
    contexte: {
      titre: "La pièce du moment",
      quoi: "Combinaison beige",
      detail: "Tailles 36 à 44",
      photo: "/direct/mode-combinaison.jpg",
      geste: "Voir la boutique",
    },
    maison: [
      {
        id: "mo-claire",
        qui: "Claire",
        role: "Vendeuse",
        maison: true,
        photo: "/direct/mode-combinaison.jpg",
        mot: "La combinaison est rentrée ce matin, en quatre tailles. Essayez-la 👗",
        heure: "09:45",
        interesses: 7,
      },
      {
        id: "mo-vitrine",
        qui: "La boutique",
        role: "Vitrine",
        maison: true,
        photo: "/direct/vitrine-mode.jpg",
        mot: "Les retouches sont offertes jusqu’à samedi.",
        heure: "10:30",
        interesses: 2,
      },
    ],
    clients: [
      {
        id: "mo-julie",
        qui: "Julie",
        photo: "/direct/mode-chemise-jean.jpg",
        essai: { quoi: "Chemise en jean", verdict: "pris" },
        mot: "Essayée depuis mon canapé, je passe la chercher ce soir.",
        heure: "11:15",
        humeur: "decouvre",
        interesses: 5,
        jusqua: "encore 2 jours",
      },
      {
        id: "mo-sarah",
        qui: "Sarah",
        photo: "/direct/mode-combinaison.jpg",
        essai: { quoi: "Combinaison beige, ceinturée", verdict: null },
        mot: "Je la trouve très belle mais j’hésite sur la taille.",
        heure: "12:40",
        humeur: "hesite",
        interesses: 8,
        jusqua: "encore 2 jours",
      },
    ],
  },
  /**
   * LA FLEURISTE, ET ELLE PARLAIT AVEC LA VOIX DE LA CIRIÈRE.
   *
   * « Je suis sur une annonce comme le fleuriste : "Les fleurs · Bouquet du
   * jour · Fleurs de saison · Prêt en cinq minutes · 15 €". Et quand je clique
   * sur le fantôme, au lieu d'avoir le texte coordonné avec l'annonce, j'ai
   * "Cette bougie, chez vous". »
   *
   * LE REPLI ENVOYAIT « fleuriste » ET « artisan » SUR LE MUR DES BOUGIES. Il
   * était écrit quand trois murs devaient couvrir dix-huit commerces, et il a
   * survécu à chaque mur ajouté — c'est la troisième fois qu'on le trouve, après
   * le coiffeur et le prêt-à-porter. La leçon est que le repli lui-même est le
   * défaut : voir `murDeLaCarte`, où il ne mène plus jamais à un essai.
   *
   * LA MÉCANIQUE EST BIEN CELLE DE LA CIRIÈRE, ET C'EST LÉGITIME : un bouquet,
   * comme une bougie, se pose sur une surface et prend la lumière de la pièce.
   * Ce qui ne l'était pas, c'est de garder AUSSI ses mots et son catalogue. Un
   * bouquet n'est pas une bougie, et « chez vous » ne veut pas dire la même
   * chose quand ce qu'on regarde tiendra huit jours.
   */
  {
    cle: "fleurs",
    lieu: "Une fleuriste du marché",
    metier: "Fleuriste",
    ville: "Dax",
    distance: "150 m",
    note: "4,9",
    avis: 47,
    etiquettes: ["Producteurs des Landes", "Composé le matin"],
    photoLieu: "/direct/bouquet-du-jour.jpg",
    depot: "essai",
    humeurs: ["offrir", "decouvre", "hesite"],
    verbes: [],
    essai: {
      partie: "l’endroit où il ira",
      consigne: "Cadrez la table ou la console entière, de trois quarts, à hauteur d’yeux.",
      avant: "/direct/table-salon.jpeg",
      // Même point d'appui que la cirière : la mesure porte sur la photo, pas
      // sur le métier. Un bouquet est plus haut qu'une bougie, d'où la hauteur.
      gabarit: { forme: "plan", pied: [0.365, 0.455], hauteur: 0.38, lumiere: -0.7 },
      mots: {
        titre: "Ce bouquet, chez vous",
        phrase: "Photographiez la table où il ira : il s’y pose, à sa vraie taille.",
        geste: "Photographier où il ira",
        choisir: "Choisissez le bouquet",
        reserver: "Je le fais mettre de côté",
        autres: "Voir les autres bouquets du jour",
        mur: "Voir ces bouquets chez d’autres",
      },
      pieces: [
        {
          id: "f-jour",
          nom: "Bouquet du jour",
          prix: "15 €",
          photo: "/direct/bouquet-du-jour.jpg",
          reference: "/direct/bouquet-du-jour.jpg",
        },
        {
          id: "f-marche",
          nom: "Bouquet du marché",
          prix: "18 €",
          photo: "/direct/avis-bouquet.jpg",
          reference: "/direct/avis-bouquet.jpg",
        },
      ],
    },
    contexte: {
      titre: "Le bouquet du jour",
      quoi: "Fleurs de saison",
      detail: "Prêt en cinq minutes",
      photo: "/direct/bouquet-du-jour.jpg",
      geste: "Voir les bouquets",
    },
    maison: [
      {
        id: "f-claire",
        qui: "Claire",
        role: "Fleuriste",
        maison: true,
        photo: "/direct/bouquet-du-jour.jpg",
        mot: "Composé ce matin avec ce qui est monté des Landes. Voyez-le chez vous 💐",
        heure: "08:40",
        interesses: 7,
      },
      {
        id: "f-halle",
        qui: "Claire",
        role: "Sous la halle",
        maison: true,
        photo: "/direct/avis-bouquet.jpg",
        mot: "Il reste des renoncules. Après 18 h, ce qui reste part pour rien.",
        heure: "11:20",
        interesses: 5,
      },
    ],
    clients: [
      {
        id: "f-maryse",
        qui: "Maryse",
        photo: "/direct/avis-bouquet.jpg",
        essai: { quoi: "Bouquet du jour", verdict: "pris" },
        mot: "Sur ma console il était trop haut, sur la table c’est parfait. Pris.",
        heure: "10:05",
        humeur: "decouvre",
        interesses: 9,
        jusqua: "encore 2 jours",
      },
      {
        id: "f-chloe",
        qui: "Chloé",
        photo: "/direct/bouquet-du-jour.jpg",
        essai: { quoi: "Bouquet du marché", verdict: null },
        mot: "Je le voulais pour offrir, je l’ai essayé chez moi et je le garde.",
        heure: "12:15",
        humeur: "offrir",
        interesses: 6,
        jusqua: "encore 2 jours",
      },
    ],
  },
  /**
   * LE TATOUEUR — « c'est un commerce qui est souvent demandé ».
   *
   * C'EST LE MÉTIER OÙ « VOIR AVANT » VAUT LE PLUS CHER. Une pose d'ongles se
   * refait dans trois semaines, une coupe repousse ; un tatouage ne revient
   * pas. L'hésitation y est la règle et non l'exception — et c'est exactement
   * ce qu'un essai supprime.
   *
   * MÊME MÉCANIQUE QUE LES ONGLES : la photo du flash chez le tatoueur, posée
   * sur la photo de l'avant-bras du client par le modèle d'image. Rien de
   * nouveau côté moteur, seulement une partie du corps de plus.
   *
   * LES PHOTOS MANQUENT ENCORE, ET C'EST ÉCRIT PLUTÔT QUE MASQUÉ : voir
   * `LISEZ-MOI.md`. Une pièce sans référence est marquée « bientôt essayable »
   * — on ne sert jamais une image de catalogue à la place d'un essai qui n'a
   * pas eu lieu.
   */
  {
    cle: "tatouage",
    lieu: "Un tatoueur du centre",
    metier: "Tatoueur",
    ville: "Dax",
    distance: "480 m",
    note: "4,9",
    avis: 64,
    etiquettes: ["Flash du mois", "Sur rendez-vous"],
    photoLieu: "/direct/atelier-tatouage.jpeg",
    depot: "essai",
    humeurs: ["hesite", "decouvre", "offrir"],
    verbes: [],
    essai: {
      partie: "votre avant-bras",
      consigne: "Avant-bras à plat, manche remontée, à la lumière du jour, sans ombre portée.",
      avant: "/direct/avant-bras.jpg",
      gabarit: { forme: "cadre" },
      mots: {
        titre: "Ce flash, sur votre peau",
        phrase: "Photographiez votre avant-bras : le dessin s\u2019y pose, à la bonne échelle.",
        geste: "Photographier mon avant-bras",
        choisir: "Choisissez le flash",
        reserver: "Demander un rendez-vous",
        autres: "Voir les autres flashs du mois",
        mur: "Voir les flashs déjà posés",
      },
      pieces: [
        /**
         * LA PIECE PORTE LE NOM DE CE QUE LA PHOTO MONTRE.
         *
         * J'avais ecrit « Serpent fin » en attendant l'image ; la planche
         * livree est une Santa Muerte a la rose. Garder l'ancien nom aurait
         * refait, en petit, la faute de la vignette de vernis : on choisit une
         * chose et on en recoit une autre.
         *
         * UN FLASH EST UNE PLANCHE, PAS UNE PHOTO DE PEAU, et c'est exactement
         * la bonne reference : c'est le dessin que le tatoueur propose, et le
         * modele a pour travail de le poser sur l'avant-bras.
         */
        { id: "t-muerte", nom: "Santa Muerte à la rose", prix: "180 €",
          photo: "/direct/cartoon-santa-muerte-portrait-1.webp",
          reference: "/direct/cartoon-santa-muerte-portrait-1.webp" },
        { id: "t-fleur", nom: "Branche fleurie, poignet", prix: "120 €",
          photo: "/direct/atelier-tatouage.jpeg", bientot: true },
      ],
    },

    maison: [
      {
        id: "t-nine",
        qui: "Nine",
        role: "Tatoueuse",
        maison: true,
        photo: "/direct/atelier-tatouage.jpeg",
        mot: "Trois flashs dessinés cette semaine. Essayez-les avant de venir 🪡",
        heure: "10:20",
        interesses: 11,
      },
    ],
    clients: [
      {
        id: "t-lise",
        qui: "Lise",
        photo: "/direct/cartoon-santa-muerte-portrait-1.webp",
        essai: { quoi: "Santa Muerte à la rose", verdict: null },
        mot: "Je l\u2019ai essayé trois fois avant de me décider sur le placement.",
        heure: "11:55",
        humeur: "hesite",
        interesses: 9,
        jusqua: "encore 2 jours",
      },
    ],
  },
];

/**
 * LE MUR DE LA CARTE QU'ON REGARDE.
 *
 * ═══ POURQUOI CETTE FONCTION EXISTE ═══════════════════════════════════════
 *
 * « Je veux que la pop-up soit spécifique à l'annonce que je suis en train de
 * visionner. Je ne veux pas voir autre chose : tous les éléments de ce module
 * doivent être liés à l'annonce que je regarde. »
 *
 * Le fantôme de la barre ouvre donc le mur DE CE COMMERCE-LÀ — son nom, son
 * métier, sa photo, sa note, sa distance. Rien de ce qui s'affiche ne vient
 * d'ailleurs, et il n'y a plus d'onglet, plus de sélecteur, plus d'autre
 * annonce.
 *
 * ═══ CE QUI EST ENCORE UNE MAQUETTE, ET IL FAUT LE SAVOIR ════════════════
 *
 * Les fantômes eux-mêmes sont empruntés au mur modèle de la branche : il y a
 * cinq murs écrits à la main pour dix-huit commerces. Dans le produit, chaque
 * commerce a les siens — ce sont ceux que ses clients y auront laissés. Ce qui
 * se démontre ici est la MÉCANIQUE et la façon dont elle épouse le métier : un
 * bar montre des humeurs, une bijoutière un essai, un restaurant des annonces.
 */
/**
 * QUEL MUR POUR QUELLE BRANCHE — ET IL N'Y A QU'UNE TABLE.
 *
 * ELLE ÉTAIT ÉCRITE DEUX FOIS : ici et dans la maquette de jugement des murs.
 * Les deux copies ont divergé exactement comme deux copies divergent — le
 * coiffeur et le prêt-à-porter ont été corrigés d'un côté seulement, et on l'a
 * découvert en cherchant pourquoi une fleuriste parlait de bougies.
 *
 * CHAQUE MÉTIER D'ESSAI A SON MUR, ET LE REPLI N'EN DONNE PLUS AUCUN. Le
 * coiffeur tombait sur l'onglerie, la mode sur la bijoutière, la fleuriste sur
 * la cirière — trois fois la même faute, à trois moments différents, parce
 * qu'un repli vers un mur d'essai A L'AIR DE MARCHER : l'écran s'affiche, les
 * boutons répondent, et seuls les MOTS sont ceux de quelqu'un d'autre. Un
 * métier qu'on ne connaît pas va donc sur le mur d'annonces, qui ne prétend
 * rien savoir de ce qu'il vend.
 */
export function modeleDeLaBranche(
  branche: string | null | undefined,
  metier?: string | null,
): string {
  if (branche === "bar") return "bar";
  if (branche === "ongles") return "ongles";
  if (branche === "coiffeur") return "coiffeur";
  if (branche === "mode") return "mode";
  if (branche === "fleuriste") return "fleurs";
  /**
   * « ARTISAN » N'EST PAS UN MÉTIER, C'EST UN SAC.
   *
   * Il contient une cirière, une créatrice de bijoux — et un hypnothérapeute,
   * qui recevait donc « Cette bougie, chez vous ». Le sac se vide sur le métier,
   * et CE QUI N'EN SORT PAS N'A PAS D'ESSAI : on n'essaie pas une séance
   * d'hypnose sur une photo, et lui proposer de photographier sa table serait
   * la même faute que celle de la fleuriste, en plus absurde.
   */
  if (branche === "artisan") {
    const m = (metier ?? "").toLowerCase();
    if (/tatou|tattoo/.test(m)) return "tatouage";
    if (/cir|bougie/.test(m)) return "bougies";
    if (/bijou|bracelet|collier|joaill/.test(m)) return "bijoux";
    return "margot";
  }
  return "margot";
}

/**
 * CE QU'UN COMMERCE VEND, TEL QUE SA CARTE LE DIT DÉJÀ.
 *
 * On n'en prend que les entrées QUI ONT UNE PHOTO : une pièce sans image ne
 * s'essaie pas, et la faire figurer grisée dans la grille apprendrait au client
 * que la moitié du catalogue est morte.
 */
type EntreeCatalogue = { id: string; nom: string; detail?: string; prix?: string; photo?: string };

/**
 * LE MOMENT EN COURS — ce que la carte affiche à cette heure-ci.
 * `titre` + `lignes` + `prix`, c'est exactement le bloc que l'écran montrait.
 *
 * IL DEVIENT LE CONTEXTE, JAMAIS UNE PIÈCE À ESSAYER. C'est tentant : le moment
 * EST ce que l'annonce vend, et il porterait la photo de la carte. Mais chez un
 * coiffeur cette photo est `fauteuil-coiffeur.jpg`, chez une boutique
 * `vitrine-mode.jpg`, chez la cirière `atelier-bougies.jpeg` — la VITRINE, pas
 * le produit. On proposerait d'essayer un fauteuil de salon sur sa tête. Pour
 * qu'un produit du jour soit essayable, il doit exister dans le catalogue AVEC
 * sa photo ; voir la fleuriste dans `lib/direct/apercu-habitant.ts`.
 */
type MomentCourant = { titre: string; lignes?: string[]; prix?: string; photo?: string };

export function murDeLaCarte(c: {
  id: string;
  nom: string;
  metier: string;
  branche: string;
  ville: string;
  distance: string;
  photo?: string;
  google?: { note: string; avis: number };
  /** Son numéro, quand il en a déclaré un. Sinon, un numéro de fiction. */
  telephone?: string;
  /**
   * LE CATALOGUE DU COMMERÇANT, ET IL MANQUAIT.
   *
   * « Au lieu d'avoir le texte coordonné avec l'annonce, j'ai "Cette bougie,
   * chez vous". »
   *
   * LE MUR NE RECEVAIT QUE L'IDENTITÉ DU COMMERCE — nom, métier, photo, note.
   * Tout le reste restait celui du modèle, donc la grille d'essai proposait
   * « Trio bougies & houx, 34 € » à qui regardait une annonce de fleuriste. Le
   * bon mur ne suffisait pas : même bien aiguillée, une fleuriste n'a pas le
   * catalogue de la cirière.
   *
   * CE QUI VIENT DU MODÈLE ET CE QUI VIENT DU COMMERÇANT SE PARTAGENT
   * MAINTENANT NETTEMENT. Le modèle porte la MÉCANIQUE — ce qu'on photographie,
   * la consigne de cadrage, le gabarit mesuré, les mots du métier. Le commerçant
   * porte CE QU'IL VEND — ses pièces, leurs noms, leurs prix, et le bloc du
   * moment sous le mur.
   */
  catalogue?: EntreeCatalogue[];
  /** Le moment que la carte affiche à cette heure-ci. Devient `contexte`. */
  moment?: MomentCourant | null;
}): Mur {
  const modele = MURS.find((m) => m.cle === modeleDeLaBranche(c.branche, c.metier)) ?? MURS[0];

  /**
   * LES PIÈCES DU COMMERÇANT REMPLACENT CELLES DU MODÈLE.
   *
   * `reference` EST LA PHOTO DU CATALOGUE, et c'est juste : c'est la photo du
   * produit fini, prise par le commerçant — exactement ce que le modèle d'image
   * doit reproduire sur la photo du client. Ce qu'on ne reprend pas, c'est la
   * `decoupe` du modèle : un PNG détouré est fait POUR UNE PIÈCE, et le coller
   * sous le nom d'une autre reproduirait la faute qu'on vient de corriger.
   */
  const siennes: Piece[] = (c.catalogue ?? [])
    .filter((e) => !!e.photo)
    .map((e) => ({
      id: e.id,
      nom: e.nom,
      prix: e.prix ?? "",
      photo: e.photo as string,
      reference: e.photo as string,
    }));

  /**
   * LES SIENNES D'ABORD, PUIS CELLES DU MODÈLE — ET JAMAIS MOINS QU'AVANT.
   *
   * Remplacer purement la grille rétrécissait la démonstration : la fleuriste
   * n'a qu'une entrée photographiée dans son catalogue, si bien que passer au
   * « vrai » catalogue faisait tomber la grille de deux pièces à une. On met
   * donc les siennes en tête et on complète avec celles du modèle, en écartant
   * les doublons de photo.
   *
   * CE MÉLANGE N'EST PLUS UN MENSONGE DEPUIS QUE CHAQUE MÉTIER A SON MUR : les
   * pièces du modèle sont désormais toujours du bon métier. Il l'était tant
   * qu'une fleuriste pouvait hériter des bougies — c'est ce qui vient d'être
   * corrigé, et c'est pour ça que ces deux changements vont ensemble.
   */
  // ON ÉCARTE LE DOUBLON SUR LA PHOTO **ET** SUR LE NOM. Sur la photo seule, la
  // grille de la fleuriste affichait « Bouquet du marché · 18 € » deux fois,
  // avec deux images différentes : le catalogue et le modèle nomment la même
  // chose, chacun avec sa photo.
  const pareil = (a: string) => a.toLowerCase().replace(/[^a-zà-ÿ0-9]/g, "");
  const complement = (modele.essai?.pieces ?? []).filter(
    (p) => !siennes.some((s) => s.photo === p.photo || pareil(s.nom) === pareil(p.nom)),
  );
  const essai =
    modele.essai && siennes.length > 0
      ? { ...modele.essai, pieces: [...siennes, ...complement].slice(0, 6) }
      : modele.essai;

  // LE BLOC SOUS LE MUR DIT CE QUE LA CARTE DIT, MOT POUR MOT. C'est le seul
  // endroit où le commerce parle de ce qu'il vend ; qu'il annonce autre chose
  // que l'annonce qu'on vient de quitter n'a aucun sens.
  const contexte = c.moment
    ? {
        titre: c.moment.titre,
        quoi: c.moment.lignes?.[0] ?? c.moment.titre,
        detail: [c.moment.lignes?.[1], c.moment.prix].filter(Boolean).join(" · "),
        // LA PHOTO DU BLOC PEUT MANQUER DES TROIS COTES : moment, commerce,
        // modele. Une chaine vide vaut mieux qu'un `undefined` qui se glisse
        // dans un attribut `src` et fabrique une requete vers la page courante.
        photo: c.moment.photo || c.photo || modele.photoLieu || "",
        geste: modele.contexte?.geste ?? "Voir",
      }
    : modele.contexte;

  return {
    ...modele,
    modele: modele.cle,
    cle: c.id,
    lieu: c.nom,
    metier: c.metier,
    ville: c.ville,
    distance: c.distance,
    note: c.google?.note ?? modele.note,
    avis: c.google?.avis ?? modele.avis,
    photoLieu: c.photo || modele.photoLieu,
    // LE NUMÉRO SUIT LE COMMERCE, PAS LE MODÈLE. Un mur emprunté au modèle de
    // la branche ne doit jamais emprunter AUSSI son numéro : on écrirait à
    // quelqu'un d'autre. Voir `numeroDeFiction` pour la maquette.
    telephone: c.telephone ?? numeroDeFiction(c.id),
    essai,
    contexte,
  };
}

/**
 * REFAIRE UN MUR À PARTIR D'UN SOUVENIR, SANS LE PAQUET.
 *
 * C'EST CE QUI PERMET DE REVENIR CHEZ UN COMMERCE FERMÉ. Le paquet ne garde que
 * ce qui est ouvert maintenant — règle juste pour une table libre à midi, mais
 * qui rendait injoignable le mur d'une onglerie le soir, c'est-à-dire à l'heure
 * où l'on essaie des ongles. Le fantôme qu'on y a laissé porte de quoi rouvrir
 * la porte tout seul.
 */
export function murDuSouvenir(s: {
  cle: string;
  modele: string;
  lieu: string;
  metier: string;
  ville: string;
  distance: string;
  note: string;
  avis: number;
  photoLieu: string;
}): Mur {
  const modele = MURS.find((m) => m.cle === s.modele) ?? MURS[0];
  return {
    ...modele,
    modele: modele.cle,
    cle: s.cle,
    lieu: s.lieu,
    metier: s.metier,
    ville: s.ville,
    distance: s.distance,
    note: s.note,
    avis: s.avis,
    photoLieu: s.photoLieu,
  };
}

/**
 * COMBIEN DE FANTÔMES IL RESTE AUJOURD'HUI.
 *
 * TROIS, ET LE CHIFFRE COMPTE MOINS QUE LA RAISON. Ce n'est pas un anti-spam :
 * c'est ce qui donne sa valeur au geste. Un fantôme illimité ne vaut rien — et
 * comme il n'y en a qu'UN, la règle se dit dans le monde plutôt que dans les
 * réglages : il ne peut pas être à plus de trois endroits à la fois.
 *
 * IL DOIT ÊTRE VISIBLE. Un quota qu'on découvre en le heurtant est un mur
 * invisible ; écrit d'avance, il devient une raison de choisir où l'on se pose.
 */
export const QUOTA_DU_JOUR = 3;

/** Combien de temps une trace vit dans un lieu, par défaut. */
export const HEURES_PAR_DEFAUT = 4;

/**
 * CE QUE CLIKME DIT QUAND ON APPUIE SUR « ÇA M'INTÉRESSE ».
 *
 * LA PHRASE EST LE PRODUIT. Le bouton ne « like » pas et ne commente pas : il
 * déclare une disponibilité, et ce qui suit doit donc être une MISE EN RELATION,
 * pas une confirmation. « Merci pour votre retour » tuerait la mécanique en trois
 * mots. Elle est écrite depuis le fantôme, jamais depuis le lecteur : c'est ce
 * que CETTE personne cherche qui décide de ce qu'on propose de faire.
 */
export function miseEnRelation(f: Fantome): { quoi: string; geste: string } {
  if (f.verbe) {
    const v = verbeDe(f.verbe)?.mot ?? "propose";
    return {
      quoi: `${f.qui} ${v.replace(/^J’?e? ?/, "").toLowerCase()} — vous avez peut-être ce qu’il faut.`,
      geste: `Écrire à ${f.qui}`,
    };
  }
  if (f.essai) {
    return {
      quoi:
        f.essai.verdict === null
          ? `${f.qui} hésite. Votre avis compte plus que celui du vendeur.`
          : `${f.qui} a essayé la même chose que vous regardez.`,
      geste: `Répondre à ${f.qui}`,
    };
  }
  if (f.maison) {
    return {
      quoi: `${f.qui} vous répond directement — c’est la maison, pas un robot.`,
      geste: `Écrire à ${f.qui}`,
    };
  }
  return {
    quoi: `${f.qui} y était avant vous. C’est la personne à qui demander si ça vaut le détour.`,
    geste: `Poser la question à ${f.qui}`,
  };
}
