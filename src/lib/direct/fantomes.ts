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
export type Verbe = { cle: string; emoji: string; mot: string };

export const VERBES: Verbe[] = [
  { cle: "cherche", emoji: "📣", mot: "Je cherche" },
  { cle: "propose", emoji: "🤲", mot: "Je propose" },
  { cle: "places", emoji: "🎟️", mot: "J’ai 2 places" },
  { cle: "donne", emoji: "🎁", mot: "Je donne" },
  { cle: "aide", emoji: "🤝", mot: "Je peux aider" },
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

/** Une pièce du catalogue du commerçant, pour l'essai. */
export type Piece = { id: string; nom: string; prix: string; photo: string };

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
  essai?: { partie: string; consigne: string; pieces: Piece[] };
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
    verbes: ["cherche", "propose", "places", "donne", "aide"],
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
        photo: "/direct/concert-kiosque.jpg",
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
        photo: "/direct/vide-grenier.jpg",
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
    verbes: ["cherche", "propose", "places", "aide"],
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
        verbe: "places",
        mot: "J’ai 2 places pour la nocturne du musée samedi.",
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
      consigne: "Posez votre main à plat, paume vers le bas, à la lumière du jour.",
      pieces: [
        { id: "p-coeurs", nom: "Motif cœurs", prix: "45 €", photo: "/direct/pose-ongles.jpg" },
        { id: "p-french", nom: "French classique", prix: "38 €", photo: "/direct/avis-ongles.jpg" },
        { id: "p-nude", nom: "Nude mat", prix: "32 €", photo: "/direct/avis-ongles.jpg" },
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
        mot: "Les nouveaux motifs sont arrivés. Essayez-les avant de venir 💅",
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
];

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
