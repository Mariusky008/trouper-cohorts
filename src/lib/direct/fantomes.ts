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
   * LA COULEUR DE LA POSE, POUR UN MÉTIER QUI VEND UNE COULEUR.
   *
   * Une onglerie n'a pas d'objet à découper : elle a une teinte et une longueur.
   * La pièce ne porte donc pas une découpe mais un vernis, et c'est
   * `lib/direct/ongles.ts` qui le pose. Voir ce fichier pour pourquoi on dessine
   * l'ongle DU SALON plutôt que de chercher celui de la cliente.
   */
  vernis?: { couleur: string; longueur?: number };
  bientot?: boolean;
};

export type Mur = {
  cle: string;
  lieu: string;
  metier: string;
  ville: string;
  distance: string;
  note: string;
  avis: number;
  /** Deux ou trois mots sous le nom : « Cuisine française », « Terrasse ». */
  etiquettes: string[];
  photoLieu: string;
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
    pieces: Piece[];
  };
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
      pieces: [
        /**
         * L'ORDRE DES COULEURS EST UN CHOIX, PAS UN HASARD.
         *
         * « On ne voit pas les couleurs. » Le nude était en deuxième, donc c'est
         * lui qui a été essayé — et un nude sur une peau claire est INVISIBLE PAR
         * CONSTRUCTION : c'est ce qu'on lui demande d'être. Impossible de juger
         * un placement avec, alors que c'est justement ce qu'on cherche à juger.
         * Les deux couleurs franches passent devant ; le nude reste, en dernier,
         * parce que c'est un vrai produit.
         */
        {
          id: "p-nuit",
          nom: "Bleu nuit, pose longue",
          prix: "52 €",
          photo: "/direct/pose-ongles.jpg",
          vernis: { couleur: "#1E2E5A", longueur: 1.9 },
        },
        {
          id: "p-bordeaux",
          nom: "Bordeaux, pose moyenne",
          prix: "45 €",
          photo: "/direct/pose-ongles.jpg",
          vernis: { couleur: "#8E1B3F", longueur: 1.4 },
        },
        {
          id: "p-nude",
          nom: "Nude mat, pose courte",
          prix: "32 €",
          photo: "/direct/avis-ongles.jpg",
          vernis: { couleur: "#C89684", longueur: 1 },
        },
        // LE MOTIF RESTE « BIENTÔT », ET C'EST LA LIMITE ÉCRITE DE `ongles.ts` :
        // on pose une couleur, pas un dessin. Un motif demande de savoir où est
        // le haut de l'ongle dans le plan de l'image, ce qui n'est pas calculé.
        { id: "p-coeurs", nom: "Motif cœurs", prix: "45 €", photo: "/direct/pose-ongles.jpg", bientot: true },
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
      pieces: [
        {
          id: "j-chaine",
          nom: "Chaîne fine, pierre noire",
          prix: "89 €",
          photo: "/direct/poignet-bracelet.jpg",
          rendu: "/direct/poignet-bracelet.jpg",
        },
        {
          id: "j-riviere",
          nom: "Bracelet rivière",
          prix: "240 €",
          photo: "/direct/bracelet-seul.png",
          decoupe: "/direct/decoupe-bracelet.png",
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
export function murDeLaCarte(c: {
  id: string;
  nom: string;
  metier: string;
  branche: string;
  ville: string;
  distance: string;
  photo?: string;
  google?: { note: string; avis: number };
}): Mur {
  const modele =
    MURS.find((m) => {
      if (c.branche === "bar") return m.cle === "bar";
      if (c.branche === "ongles" || c.branche === "coiffeur") return m.cle === "ongles";
      if (c.branche === "mode") return m.cle === "bijoux";
      if (c.branche === "artisan" || c.branche === "fleuriste") return m.cle === "bougies";
      return m.cle === "margot";
    }) ?? MURS[0];
  return {
    ...modele,
    cle: c.id,
    lieu: c.nom,
    metier: c.metier,
    ville: c.ville,
    distance: c.distance,
    note: c.google?.note ?? modele.note,
    avis: c.google?.avis ?? modele.avis,
    photoLieu: c.photo || modele.photoLieu,
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
