// 👻 LE FANTÔME — ce qu'on laisse derrière soi dans un lieu.
//
// ═══ LA DÉFINITION, ET ELLE EST VERROUILLÉE ════════════════════════════════
//
//   LE FANTÔME, C'EST VOUS QUAND VOUS N'ÊTES PAS LÀ.
//
//   Vous laissez une photo, quelques mots, un lieu et une durée. Votre fantôme
//   reste là. Quelqu'un peut le découvrir. S'il est intéressé : « Ça
//   m'intéresse ». ClikMe vous met en relation. Et votre fantôme revient vous
//   raconter ce qui s'est passé.
//
// CETTE PHRASE FAIT PLUS QUE DÉFINIR : ELLE RÉCONCILIE. Il y avait jusqu'ici
// DEUX fantômes dans le produit, avec le même dessin — celui qui veille sur une
// discussion et vous rapporte ce qui s'y passe (`salons.ts`, cinq états), et
// celui qu'on laisse quelque part. « Deux animaux, un seul visage » était le
// trou du concept. Ce n'en est plus un : veiller n'est pas une seconde
// fonction, c'est le fantôme que vous avez laissé qui vous fait son rapport.
//
// CONSÉQUENCE QU'ON TIENT PARTOUT : IL N'Y EN A QU'UN. Pas un fantôme par
// publication — un fantôme, le vôtre, qui se déplace. C'est ce qui donne son
// sens au quota : ce n'est pas « trois publications par jour », c'est « votre
// fantôme ne peut pas être à plus de trois endroits à la fois ».
//
// ═══ UN GESTE, PLUSIEURS EXPRESSIONS ══════════════════════════════════════
//
// LE PIÈGE ÉTAIT D'EN FAIRE TROIS PRODUITS. Essayage, présence, petite annonce :
// trois mécaniques, trois données, trois modérations — et un utilisateur qui
// apprend un comportement chez le bijoutier, le rejoue chez le restaurateur, et
// tombe sur autre chose. Une signature qui ne tient pas sa promesse une fois sur
// deux n'est plus une signature.
//
// CE N'EST PAS CE QU'ON FAIT. Le geste est identique partout — je suis ici, je
// laisse mon fantôme, il reste — et seul le CONTENU change avec le lieu. Quatre
// façons de le remplir, et elles partagent toutes la même carte :
//
//   · ESSAI      — bijou, vêtement, coupe, ongles, objet chez soi. Une trace de
//                  désir : la chose essayée reste, qu'on l'ait prise ou non.
//   · EXPRESSION — restaurant, café, commerce de bouche. Une photo, des mots.
//   · INTENTION  — bar, événement. Pas « qui est là », mais CE QUE LA PERSONNE
//                  VIENT CHERCHER. C'est ça qui rend une soirée lisible.
//   · DEMANDE    — je cherche, je donne, je propose, je prête. Le lieu n'est
//                  qu'un ancrage : le contenu concerne la ville entière.
//
// ═══ LE MUR EST UNE FENÊTRE, PAS UNE CAGE ═════════════════════════════════
//
// LE MUR DE MARGOT N'EST PAS « LES GENS QUI PARLENT DE MARGOT », c'est « ce que
// les gens ont laissé ici aujourd'hui » — et ce qu'ils laissent peut concerner
// toute la ville. C'est la décision la plus structurante du concept, parce
// qu'elle décide de la taille du produit : « je donne vingt vinyles » n'a rien à
// voir avec un restaurant, et c'est précisément pour ça que ça vaut le coup.
//
// ET LE MÊME FANTÔME EXISTE DANS LE DIRECT, avec son tampon de lieu — « Léa ·
// chez Margot · il y a 18 min ». Le lieu ancre, il n'enferme pas. Sans cette
// remontée, le vinyle de Camille serait vu par les douze personnes qui déjeunent
// là, et le mur mourrait de faim.
//
// ═══ LA DURÉE SUIT LA CHOSE, PAS L'HORLOGE ════════════════════════════════
//
// PAS DE DISPARITION À MINUIT. « Je cherche deux places pour vendredi » publié un
// mardi mourrait le mardi soir, et c'est exactement l'annonce qui avait le plus
// de valeur. Le fantôme reste jusqu'à ce que ce qu'il porte n'ait plus de sens,
// SEPT JOURS AU MAXIMUM. C'est la logique du fil, qui trie par ordre de
// disparition ; il n'y a rien de neuf à inventer, seulement à ne pas coder
// « minuit » par réflexe.
//
// ═══ CE QU'ON S'INTERDIT AU LANCEMENT ═════════════════════════════════════
//
// PAS DE « JE VENDS ». Chercher, donner, proposer, prêter, aider : oui. Vendre :
// non. Dès qu'on vend, la page publique et indexée d'un commerce devient une
// place de marché, avec ce qui va avec — signalement, retrait, identification du
// vendeur. Ça retire l'essentiel du risque et ne coûte presque rien : l'exemple
// qui a fait naître le mur, les vinyles, est un don.
//
// PAS DE VISAGE, ET LA RÈGLE EXISTAIT DÉJÀ. `public/direct/LISEZ-MOI.md` :
// « aucun visage reconnaissable ». La photo montre CE QU'ON MONTRE — la bague au
// poignet, l'assiette, les vinyles, la coupe de dos — et la personne est
// présente autrement : son prénom, son fantôme, son heure. Ce n'est pas
// seulement une précaution : une photo de son propre visage est un geste social
// lourd, et un mur qui l'exige reste vide. Sur Instagram les gens photographient
// leur assiette, pas leur tête.

/** Les quatre façons de remplir le même geste. */
export type GenreDeFantome = "essai" | "expression" | "intention" | "demande";

/**
 * CE QUE LA PERSONNE VIENT CHERCHER — les bars et les événements, et eux seuls.
 *
 * POURQUOI CE N'EST PAS UN STATUT DE PRÉSENCE. « Thomas est ici » ne sert à
 * personne : dans un bar plein, tout le monde est ici. Ce qui manque, et
 * qu'aucune application ne dit, c'est POURQUOI on y est — et c'est la seule
 * information qui permette à deux inconnus de se parler sans que ce soit gênant.
 */
export const INTENTIONS = [
  { cle: "amis", emoji: "🍻", mot: "Entre amis" },
  { cle: "monde", emoji: "🫶", mot: "Rencontrer du monde" },
  { cle: "fete", emoji: "🎉", mot: "Faire la fête" },
  { cle: "musique", emoji: "🎶", mot: "Pour la musique" },
  { cle: "decouvre", emoji: "👀", mot: "Je découvre" },
] as const;

export type CleIntention = (typeof INTENTIONS)[number]["cle"];

/**
 * LES VERBES AUTORISÉS SUR UNE DEMANDE.
 *
 * LA LISTE EST LA RÈGLE, ET C'EST POUR ÇA QU'ELLE EST ICI ET PAS DANS L'ÉCRAN.
 * « Je vends » n'y est pas, et son absence est une décision de produit, pas un
 * oubli : voir l'en-tête. Un champ libre laisserait la vente entrer par la
 * phrase ; une liste fermée oblige à choisir un verbe qu'on assume.
 */
export const VERBES = [
  { cle: "cherche", mot: "Je cherche" },
  { cle: "donne", mot: "Je donne" },
  { cle: "propose", mot: "Je propose" },
  { cle: "prete", mot: "Je prête" },
  { cle: "aide", mot: "Je peux aider" },
] as const;

export type CleVerbe = (typeof VERBES)[number]["cle"];

export type Fantome = {
  id: string;
  /** Prénom seul. Ce sont des voisins, pas des comptes. */
  qui: string;
  /**
   * LE FANTÔME DE LA MAISON — le patron, le chef, le personnel.
   *
   * UN MUR NE DOIT JAMAIS DÉMARRER VIDE, et c'est une règle, pas une astuce de
   * lancement. Le mur vide tue les surfaces contributives : personne ne veut
   * être le premier à parler dans une pièce silencieuse. À l'ouverture, ce sont
   * donc ceux de la maison qu'on voit — le commerce accueille, et les clients
   * prennent le relais tout seuls.
   *
   * ILS SONT MARQUÉS, ET C'EST NON NÉGOCIABLE. Un fantôme de la maison qui
   * passerait pour un client, c'est un faux avis.
   */
  maison?: boolean;
  /** « Chef », « Patronne ». Seulement pour les fantômes de la maison. */
  role?: string;
  genre: GenreDeFantome;
  /** Ce qu'on montre : jamais un visage. Voir l'en-tête. */
  photo?: string;
  /** Ses mots à elle ou à lui. Une ou deux phrases, jamais un paragraphe. */
  mot: string;
  /** ESSAI : ce qui a été essayé, et ce qui en a été décidé. */
  essai?: {
    quoi: string;
    /**
     * `null` = pas encore décidé. LES TROIS CAS COMPTENT, et le refus le plus :
     * « cette bague a été essayée par quatorze personnes et deux l'ont prise »
     * est une information qu'aucun commerçant n'a jamais eue.
     */
    verdict: "pris" | "passe" | null;
  };
  /** INTENTION : la pastille, et rien d'autre. */
  intention?: CleIntention;
  /** DEMANDE : le verbe, pris dans la liste fermée. */
  verbe?: CleVerbe;
  /** « il y a 12 min ». */
  depuis: string;
  /**
   * JUSQU'À QUAND ÇA A ENCORE DU SENS. Écrit comme on le dirait — « encore 3 h »,
   * « jusqu'à vendredi ». Sept jours au maximum, voir l'en-tête.
   */
  jusqua: string;
  /**
   * COMBIEN ONT DIT « ÇA M'INTÉRESSE ».
   *
   * CE N'EST PAS UN SCORE, ET LA DIFFÉRENCE EST TOUT LE SUJET. Un « j'aime » est
   * gratuit, donc il ne veut rien dire. Celui-ci ENGAGE — on accepte d'être mis
   * en relation — et c'est ce coût qui rend le compteur honnête : huit, ce sont
   * huit personnes prêtes à parler. Corollaire tenu à l'écran : il reste petit.
   * Le jour où il devient gros, on a refabriqué le like.
   */
  interesses: number;
};

export type Mur = {
  cle: string;
  /** Le commerce où ces fantômes ont été laissés. */
  lieu: string;
  metier: string;
  ville: string;
  /** Ce que le lieu propose de laisser : décide de l'écran de dépôt. */
  offre: GenreDeFantome;
  fantomes: Fantome[];
};

/**
 * TROIS MURS, ET ILS NE SONT PAS TROIS EXEMPLES : CE SONT TROIS ÉPREUVES.
 *
 * Un restaurant, dont le mur parle surtout d'autre chose que du restaurant — le
 * cas qui décide si l'idée est grande ou petite. Un bar, où le contenu n'est
 * plus une photo mais une intention. Une onglerie, où le fantôme est un essai.
 * Si le même écran tient les trois sans se tordre, le concept tient.
 */
export const MURS: Mur[] = [
  {
    cle: "margot",
    lieu: "Le Bocal de Margot",
    metier: "Restaurant",
    ville: "Dax",
    offre: "expression",
    fantomes: [
      {
        id: "m-marc",
        qui: "Marc",
        role: "Chef",
        maison: true,
        genre: "expression",
        photo: "/direct/plat-lasagnes.jpg",
        mot: "Les lasagnes sortent du four. La pâte est de ce matin 😋",
        depuis: "il y a 1 h",
        jusqua: "encore 4 h",
        interesses: 12,
      },
      {
        id: "m-margot",
        qui: "Margot",
        role: "Patronne",
        maison: true,
        genre: "expression",
        photo: "/direct/tables-libres.jpg",
        mot: "On vous attend ce midi. Il reste de la place en terrasse.",
        depuis: "il y a 2 h",
        jusqua: "encore 3 h",
        interesses: 4,
      },
      {
        id: "m-lea",
        qui: "Léa",
        genre: "demande",
        verbe: "cherche",
        photo: "/direct/concert-kiosque.jpg",
        mot: "2 places pour le concert de vendredi soir. J'échange contre un repas ici 🙂",
        depuis: "il y a 18 min",
        // ELLE NE MEURT PAS CE SOIR, ET C'EST TOUT LE POINT DE LA REGLE DE DUREE.
        jusqua: "jusqu’à vendredi",
        interesses: 8,
      },
      {
        id: "m-thomas",
        qui: "Thomas",
        genre: "demande",
        verbe: "donne",
        photo: "/direct/vide-grenier.jpg",
        mot: "20 vinyles rock des années 80. À récupérer ici, je passe tous les midis.",
        depuis: "il y a 40 min",
        jusqua: "encore 6 jours",
        interesses: 5,
      },
      {
        id: "m-julie",
        qui: "Julie",
        genre: "expression",
        photo: "/direct/portion-a-emporter.jpg",
        mot: "Première fois ici. J'en ai repris une part pour ce soir.",
        depuis: "il y a 2 h",
        jusqua: "encore 2 h",
        interesses: 3,
      },
      {
        id: "m-karim",
        qui: "Karim",
        genre: "demande",
        verbe: "propose",
        photo: "/direct/marche-producteurs.jpg",
        mot: "Je descends au marché de Saint-Vincent samedi matin. Une place dans la voiture.",
        depuis: "il y a 3 h",
        jusqua: "jusqu’à samedi",
        interesses: 6,
      },
    ],
  },
  {
    cle: "bar",
    lieu: "Un bar à vins",
    metier: "Bar",
    ville: "Dax",
    offre: "intention",
    fantomes: [
      {
        id: "b-patron",
        qui: "Serge",
        role: "Patron",
        maison: true,
        genre: "expression",
        photo: "/direct/verre-au-comptoir.jpg",
        mot: "Dégustation de trois blancs des Landes à partir de 19 h, au comptoir.",
        depuis: "il y a 2 h",
        jusqua: "encore 5 h",
        interesses: 9,
      },
      {
        id: "b-clara",
        qui: "Clara",
        genre: "intention",
        intention: "monde",
        // PAS `avis-verre.jpg` ICI, ET LE CHANGEMENT DE TAILLE EST LA RAISON.
        // `LISEZ-MOI.md` la classe parmi les deux exceptions datées — une marque
        // lisible sur trois verres — tolérées « en vignette carrée » sur une page
        // en noindex. Sur ce mur elle n'est plus une vignette : elle occupe
        // l'écran entier, et la marque avec. Une exception se juge à ce qu'elle
        // montre, pas à ce qu'elle était le jour où on l'a écrite.
        photo: "/direct/tablee-du-soir.jpg",
        mot: "Je viens d'arriver à Dax, je ne connais personne ici.",
        depuis: "maintenant",
        jusqua: "encore 3 h",
        interesses: 12,
      },
      {
        id: "b-thomas",
        qui: "Thomas",
        genre: "intention",
        intention: "amis",
        photo: "/direct/terrasse-au-soleil.jpg",
        mot: "On est quatre en terrasse, il reste de la place à la table.",
        depuis: "il y a 25 min",
        jusqua: "encore 2 h",
        interesses: 7,
      },
      {
        id: "b-ines",
        qui: "Inès",
        genre: "intention",
        intention: "musique",
        photo: "/direct/concert-kiosque.jpg",
        mot: "Il y a un groupe qui joue à 21 h. Je reste jusqu'à la fin.",
        depuis: "il y a 10 min",
        jusqua: "encore 4 h",
        interesses: 5,
      },
    ],
  },
  {
    cle: "ongles",
    lieu: "Une prothésiste ongulaire",
    metier: "Prothésiste ongulaire",
    ville: "Dax",
    offre: "essai",
    fantomes: [
      {
        id: "o-patronne",
        qui: "Sandra",
        role: "Prothésiste",
        maison: true,
        genre: "expression",
        photo: "/direct/pose-ongles.jpg",
        mot: "Les nouveaux motifs sont arrivés. Essayez-les avant de venir 💅",
        depuis: "il y a 3 h",
        jusqua: "encore 5 h",
        interesses: 6,
      },
      {
        id: "o-julie",
        qui: "Julie",
        genre: "essai",
        // L'ETIQUETTE DIT CE QUE MONTRE LA PHOTO, et ce n'etait pas le cas :
        // « chrome, ongles courts » sous une main aux ongles longs a motif. Sur
        // un ecran ou l'image occupe tout, un libelle qui contredit ce qu'on
        // voit se remarque avant tout le reste.
        essai: { quoi: "Motif cœurs, ongles longs", verdict: null },
        photo: "/direct/pose-ongles.jpg",
        mot: "J'hésite entre celui-ci et le nude tout simple. Vos avis ?",
        depuis: "il y a 22 min",
        jusqua: "encore 2 jours",
        interesses: 6,
      },
      {
        id: "o-nadia",
        qui: "Nadia",
        genre: "essai",
        essai: { quoi: "French, ongles longs", verdict: "pris" },
        photo: "/direct/avis-ongles.jpg",
        mot: "Essayé ce matin, rendez-vous pris pour jeudi.",
        depuis: "il y a 1 h",
        jusqua: "encore 2 jours",
        interesses: 4,
      },
      {
        id: "o-camille",
        qui: "Camille",
        genre: "essai",
        essai: { quoi: "Rouge mat", verdict: "passe" },
        photo: "/direct/avis-ongles.jpg",
        mot: "Pas pour moi finalement, mais ça m'a évité de me tromper.",
        depuis: "il y a 4 h",
        jusqua: "encore 2 jours",
        interesses: 2,
      },
    ],
  },
];

/**
 * COMBIEN DE FANTÔMES IL RESTE AUJOURD'HUI.
 *
 * TROIS, ET LE CHIFFRE COMPTE MOINS QUE LA RAISON. Ce n'est pas un anti-spam :
 * c'est ce qui donne sa valeur au geste. Un fantôme illimité ne vaut rien — et
 * comme il n'y en a qu'UN, votre fantôme, la règle se dit dans le monde plutôt
 * que dans les réglages : il ne peut pas être à plus de trois endroits à la fois.
 *
 * IL DOIT ÊTRE VISIBLE. Un quota qu'on découvre en le heurtant est un mur
 * invisible ; écrit d'avance, il devient une raison de choisir où l'on se pose.
 */
export const QUOTA_DU_JOUR = 3;

/** Le libellé de l'intention, pour l'écran. */
export function motDeLIntention(cle: CleIntention | undefined) {
  return INTENTIONS.find((i) => i.cle === cle);
}

/** Le libellé du verbe, pour l'écran. */
export function motDuVerbe(cle: CleVerbe | undefined) {
  return VERBES.find((v) => v.cle === cle);
}

/**
 * CE QUE CLIKME DIT QUAND ON APPUIE SUR « ÇA M'INTÉRESSE ».
 *
 * LA PHRASE EST LE PRODUIT. Le bouton ne « like » pas et ne commente pas : il
 * déclare une disponibilité, et ce qui suit doit donc être une MISE EN RELATION,
 * pas une confirmation. « Merci pour votre retour » tuerait la mécanique en un
 * mot.
 *
 * ELLE EST ÉCRITE DEPUIS LE FANTÔME, jamais depuis le lecteur : c'est ce que
 * cette personne cherche qui décide de ce qu'on propose de faire.
 */
export function miseEnRelation(f: Fantome): { quoi: string; geste: string } {
  if (f.genre === "demande") {
    const v = motDuVerbe(f.verbe)?.mot ?? "propose";
    return {
      quoi: `${f.qui} ${v.replace(/^Je /, "").toLowerCase()} — vous avez peut-être ce qu’il faut.`,
      geste: `Écrire à ${f.qui}`,
    };
  }
  if (f.genre === "intention") {
    return {
      quoi: `${f.qui} est ${motDeLIntention(f.intention)?.mot.toLowerCase()} — et vous y allez aussi.`,
      geste: `Dire bonjour à ${f.qui}`,
    };
  }
  if (f.genre === "essai") {
    return {
      quoi: `${f.qui} hésite. Votre avis compte plus que celui du vendeur.`,
      geste: `Répondre à ${f.qui}`,
    };
  }
  return {
    // L'EXPRESSION EST LE CAS LE PLUS DIFFICILE, et il l'est parce que la
    // personne ne demande rien. Ce qu'on peut proposer, ce n'est donc pas de
    // répondre à une demande — c'est que quelqu'un qui y était PEUT DIRE CE QUE
    // ÇA VAUT. « Vous étiez tenté par la même chose » était faux : rien ne dit
    // qu'on l'était, et une phrase qui présume tue la confiance dans le reste.
    quoi: `${f.qui} y était avant vous. C’est la personne à qui demander si ça vaut le détour.`,
    geste: `Poser la question à ${f.qui}`,
  };
}
