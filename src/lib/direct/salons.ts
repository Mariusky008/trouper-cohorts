// LE SALON — UNE CONVERSATION ATTACHÉE À CE QUI SE PASSE, ET QUI MEURT AVEC.
//
// ─── POURQUOI CE FICHIER EXISTE ────────────────────────────────────────────
//
// LE GESTE QU'IL DIGITALISE EXISTE DÉJÀ, ET IL EST MASSIF. Ce qui se passe
// aujourd'hui à Dax, des centaines de fois par jour : quelqu'un voit un truc,
// fait une capture d'écran, l'envoie dans son groupe WhatsApp — « ça vous dit ? »
// — le groupe décide, et ils y vont. C'est invisible pour le commerçant, et
// c'est en dehors du produit. On n'invente aucun comportement : on lui donne
// l'endroit qui lui manque.
//
// ─── L'OBJECTION QUI A ÉTÉ LEVÉE, ET COMMENT ───────────────────────────────
//
// La première analyse écartait le salon pour une raison qui paraissait
// décisive : « tes amis ne sont pas sur ClikMe, donc la salle est vide par
// construction pendant un an ». C'ÉTAIT FAUX, et l'erreur était de supposer
// qu'il faudrait un compte. LE LIEN EST L'APPLICATION : celui qui reçoit
// l'adresse dans WhatsApp l'ouvre dans le navigateur qu'il a déjà, voit le
// salon et écrit dedans. Rien à installer, rien à créer. Le démarrage à froid
// n'existe pas.
//
// L'exemple qui a tranché n'était d'ailleurs pas « organiser une sortie » —
// WhatsApp le fait très bien — mais « REGARDE CE QUE JE VIENS DE FAIRE, TU EN
// PENSES QUOI ? ». Une amie sort de chez le coiffeur et demande un avis :
// WhatsApp le sert mal, parce que l'objet n'y est pas. Ici la prestation, la
// photo et le commerce sont là, sous la conversation.
//
// ─── CE QUI EN FAIT AUTRE CHOSE QU'UNE MESSAGERIE ──────────────────────────
//
//  1. LE SALON EST ATTACHÉ À L'ANNONCE, PAS AU COMMERÇANT. Pas « discussion
//     avec Gaïa » mais « le menu du 25 août ». Demain, autre menu, autre salon.
//  2. IL MEURT AVEC ELLE. Quand le moment est passé, on n'écrit plus. C'est ce
//     qui empêche le produit de dériver vers un réseau social : personne ne
//     discute de tout et n'importe quoi, on parle de ce qui se passe maintenant.
//  3. IL RESTE DANS L'HISTOIRE. Terminé ne veut pas dire effacé — on retrouve
//     ce qu'on a vécu, et pourquoi on avait ouvert la conversation.
//  4. IL EST SUR INVITATION. Le compte est public sur l'annonce — « 3 groupes
//     s'y retrouvent » — le contenu ne l'est jamais.
//
// ─── DANS LA MAQUETTE ──────────────────────────────────────────────────────
//
// Les amis répondent tout seuls, en quelques secondes, comme les commerces
// répondent à une demande de sortie. C'est le seul moyen de montrer l'effet à
// quelqu'un qui tient le téléphone seul. Le vrai produit n'a pas ce ressort :
// ce sont de vraies personnes qui écrivent.

/** Qui parle. « moi » est la personne qui tient le téléphone. */
export type Voix = "moi" | "ami" | "systeme";

export type MessageSalon = {
  id: string;
  qui: string;
  voix: Voix;
  texte: string;
  quand: string;
  /** Une photo envoyée dans le salon, en data-URL ou en chemin public. */
  photo?: string;
  /**
   * LES RÉACTIONS. Un cœur sous un message coûte un appui et dit ce qu'une
   * réponse écrite ne dirait pas mieux — c'est la moitié des échanges d'un
   * groupe. Un compte par emoji, jamais la liste de qui a réagi : dans un
   * groupe de quatre, savoir qui n'a PAS réagi est une information qu'on ne
   * veut donner à personne.
   */
  reactions?: Record<string, number>;
  /** Ce que J'ai mis, pour pouvoir le retirer. */
  maReaction?: string;
  /** Une carte de service : réservation, arrivée. Pas une bulle. */
  carte?: {
    titre: string;
    detail: string;
    tampon?: string;
    /**
     * CETTE CARTE MONTRE L'AUTRE CÔTÉ — ce que le COMMERÇANT reçoit.
     *
     * POURQUOI ELLE EXISTE, ET CE N'EST PAS UN ORNEMENT. Le groupe voit sa
     * demande partir et n'a plus rien à regarder ; le commerçant, lui, reçoit
     * la seule chose qu'aucune plateforme de réservation ne lui donne : non
     * pas « table de 4 à 12 h 30 », mais CE QU'ILS ONT CHOISI. Il sait quoi
     * sortir du frigo. C'est le moment exact où un restaurateur comprend ce
     * que l'application lui apporte, et il faut donc qu'il le VOIE.
     *
     * Elle est marquée pour être lue comme telle : ce n'est pas un message du
     * salon, c'est un écran d'ailleurs, montré ici.
     */
    pro?: boolean;
  };
};

/**
 * CE QU'UNE PERSONNE EST DANS LE SALON.
 *
 * Trois états, pas plus : celui qui a ouvert, ceux qui viennent, ceux que ça
 * intéresse sans qu'ils s'engagent. Le troisième est le plus utile — sans lui,
 * quelqu'un qui hésite n'a que « je viens » ou le silence, et il choisit le
 * silence.
 */
export type Statut = "hote" | "vient" | "interesse";

/**
 * QUAND QUELQU'UN Y EST, MAINTENANT.
 *
 * C'EST LA SEULE CHOSE QUE WHATSAPP NE PEUT PAS FAIRE, et donc ce qui doit
 * être le plus soigné. WhatsApp dit « Pauline m'envoie une photo » ; ici on dit
 * « Pauline est chez Sophie, à 280 m, depuis 42 minutes — vous voulez la
 * rejoindre ? ». C'est une autre proposition.
 *
 * ELLE NE S'ALLUME JAMAIS TOUTE SEULE. Diffuser « je suis ici, en ce moment »
 * est une information de position ET d'activité en temps réel. Même entre amis,
 * même dans un salon fermé, ça se choisit et ça s'arrête en un appui — et dans
 * une petite ville où tout le monde se reconnaît, ça compte plus, pas moins.
 */
/**
 * QUELQU'UN Y EST, EN CE MOMENT — et c'est la seule chose qu'aucune messagerie
 * ne sait faire.
 *
 * CE QUE LE BLOC EST DEVENU, ET POURQUOI. C'était trois lignes de texte dans un
 * encadré rouge. Or ce dont il parle est, par nature, une IMAGE : quelqu'un est
 * quelque part et le montre. Le jugement de l'usage l'a dit dans ces termes —
 * « il faudrait qu'on voie le live direct, c'est-à-dire une personne en vidéo
 * qui est en train de se faire coiffer, et les autres interagissent en voyant
 * la vidéo ». Un encadré de texte demande de croire ; une image montre.
 *
 * LA VIDÉO EST FACULTATIVE, ET LE BLOC MARCHE SANS. Une image fixe fait déjà
 * l'essentiel — on voit où elle est — et c'est ce qui permet à un habitant de
 * lancer un direct avec une photo prise d'une main, ce qui est le seul geste
 * réaliste quand on a des papillotes sur la tête. La vidéo, quand elle existe,
 * remplace l'image et tourne en boucle, sans son : un son qui démarre tout
 * seul dans un salon de coiffure est la façon la plus rapide de faire fermer
 * l'application.
 */
export type EnDirect = {
  qui: string;
  depuis: string;
  distance: string;
  aPied: string;
  /** Ce qu'elle montre. Absente, le bloc se replie sur son texte. */
  image?: string;
  /** Muette et en boucle. L'image lui sert d'affiche pendant le chargement. */
  video?: { mp4: string; webm: string };
};

/**
 * FAIRE CHOISIR SES AMIS — le geste qui justifie tout le reste.
 *
 * Une femme dans le fauteuil qui photographie deux nuances et demande
 * « laquelle ? » : ça se fait déjà tous les jours, par SMS, et c'est invisible.
 * On n'invente rien, on lui donne l'endroit.
 *
 * IL SE DÉCLENCHE DEPUIS UNE PHOTO, JAMAIS DEPUIS UNE « ÉTAPE ». Une frise
 * d'étapes — arrivée, couleur, séchage, résultat — supposerait que quelqu'un la
 * saisisse : celle qui a des papillotes sur la tête a les mains prises, et la
 * coiffeuse a les mains dans les cheveux. La seule saisie réaliste est une
 * photo, et tout doit en découler.
 */
export type Vote = {
  question: string;
  options: { cle: string; label: string; voix: number }[];
  /** Ce que j'ai voté. Vide : je n'ai pas encore tranché. */
  monVote?: string;
  /** Ce que la personne sur place a finalement choisi. */
  choisi?: string;
};

/**
 * ─── UNE PROPOSITION : « ET SI ON ALLAIT PLUTÔT LÀ ? » ───
 *
 * C'EST CE QUI FAIT QU'UN SALON N'EST PAS UNE CONVERSATION DE PLUS. Sur
 * WhatsApp : « vous préférez où ? — moi Gaïa — moi pizza — attends je regarde
 * Google — il est ouvert ? — je sais pas ». Personne ne décide, et la décision
 * meurt de fatigue. Ici, proposer une alternative n'est pas écrire une phrase :
 * c'est poser une annonce RÉELLE — son menu du jour, son prix, sa distance,
 * ce qu'il en reste — que ClikMe connaît déjà. C'est la seule chose qu'une
 * messagerie ne pourra jamais faire, parce qu'elle ne sait pas ce qui est
 * ouvert à trois cents mètres.
 */
export type Proposition = {
  /** La clé de l'annonce proposée : commerce + moment. */
  cle: string;
  /** Qui l'a mise sur la table. */
  par: string;
  /** Ce qu'on y mange, y fait, y voit. */
  quoi: string;
  /** Chez qui. */
  ou: string;
  prix?: string;
  distance?: string;
  photo?: string;
  /**
   * LES VOIX, ET UNE SEULE PAR PERSONNE.
   *
   * PAS DE POUCE EN BAS, ET C'EST UN CHOIX DE FOND. Un « 👎 1 » public contre
   * le choix de Paul est une petite humiliation devant le groupe — et c'est
   * exactement ce que les gens évitent, ce qui explique la bouillie WhatsApp :
   * personne ne veut être celui qui dit non. On DÉPLACE sa voix vers ce qu'on
   * préfère ; on ne raye jamais le choix de quelqu'un.
   */
  voix: string[];
};

export type Salon = {
  /** L'identifiant de l'annonce : commerce + moment, ou événement. */
  cle: string;
  /** Ce dont on parle, écrit comme on le dirait. */
  sujet: string;
  /** Le commerce ou l'organisateur. */
  ou: string;
  /** Qui a ouvert la conversation. */
  parQui: string;
  /** Quand ça se joue — la phrase, pas une heure machine. */
  quand: string;
  /** Ceux qui ont dit qu'ils venaient. */
  viennent: string[];
  /** Ceux qui sont dans le salon sans s'être encore prononcés. */
  presents: string[];
  messages: MessageSalon[];
  /** Faux quand le moment est passé : on lit, on n'écrit plus. */
  ouvert: boolean;
  /**
   * PRIVÉ, C'EST-À-DIRE INVISIBLE À CEUX QU'ON N'A PAS INVITÉS.
   *
   * PUBLIC PAR DÉFAUT, et c'est le seul choix qui rende le produit possible :
   * un salon privé ne sert que ceux qui étaient déjà d'accord pour sortir —
   * autrement dit WhatsApp. Ce qui n'existe nulle part ailleurs, c'est de voir
   * que trois personnes vont quelque part ce soir et de pouvoir s'y joindre.
   *
   * MAIS LE CHOIX DOIT ÊTRE OFFERT, ET AVANT D'ÉCRIRE. « Je réserve pour
   * l'anniversaire de ma mère » n'a rien à faire sur la place publique, et
   * quelqu'un qui découvre ça après coup n'ouvrira plus jamais de salon. Seul
   * celui qui l'a ouvert peut basculer.
   */
  prive?: boolean;
  /**
   * LA JAUGE, QUAND CE SALON EST CELUI D'UN COLLECTIF.
   *
   * CE QUI LE REND DIFFÉRENT DE TOUS LES AUTRES, ET C'EST STRUCTUREL : un
   * salon ordinaire N'EXISTE PAS avant qu'on l'ouvre, et il ne contient que
   * les gens qu'on y a mis. Celui-ci existait avant nous, il n'y en a qu'un
   * par moment d'annonce, et on ne l'ouvre pas — on le rejoint. C'est
   * exactement pourquoi sa porte n'est pas « En parler » mais un bouton
   * « Rejoindre », posé dans les options de l'annonce.
   *
   * La forme est recopiée plutôt qu'importée d'`apercu-habitant` : ce module
   * est la couche basse, et lui faire dépendre du catalogue des annonces
   * créerait un cycle pour trois nombres.
   */
  collectif?: {
    objectif: number;
    participants: number;
    prixGroupe?: string;
    debloque?: string;
    /** La fenêtre de confirmation, quand le seuil est tombé. Voir
     *  `Collectif` dans `apercu-habitant.ts` : c'est elle qui donne du poids
     *  à un clic qui ne coûte rien. */
    fenetre?: { jusqua: string; confirmes: number; moi?: boolean };
  };
  /** Ce que chacun est. Absent : présent, sans s'être prononcé. */
  statuts?: Record<string, Statut>;
  /** Quelqu'un y est en ce moment, et l'a choisi. */
  enDirect?: EnDirect;
  /** La question posée à ceux qui ne sont pas là. */
  vote?: Vote;
  /** La photo de l'annonce, pour la carte en tête du salon. */
  photo?: string;
  /**
   * CE QUE DIT L'ANNONCE — et non ce que dit celui qui a ouvert le salon.
   * Les deux étaient confondus, donc le titre s'affichait deux fois de suite :
   * « Je suis chez elle, aidez-moi à choisir » n'est pas le nom de la
   * prestation, c'est la phrase de Camille.
   */
  annonce?: string;
  /** Le prix et ce qu'il reste, repris de l'annonce. */
  prix?: string;
  /** Ce qui reste : « 8 portions », « 1 place ». */
  reste?: string;
  distance?: string;
  /**
   * CE QUI EST SUR LA TABLE. Absent ou à un seul élément : personne n'a encore
   * proposé autre chose, et il n'y a rien à départager.
   */
  propositions?: Proposition[];
  /**
   * LE JOUR, POUR CEUX QUI SONT PASSÉS — « Hier », « Samedi », « La semaine
   * dernière ». Écrit comme on le dirait, pas une date machine : dans une liste
   * de souvenirs, « 23/08 » ne dit rien et « samedi dernier » dit tout.
   * Absent sur un salon encore ouvert : c'est aujourd'hui.
   */
  jour?: string;
  /**
   * CE QUI EN EST SORTI. C'est la seule raison de garder un salon fermé.
   *
   * Une conversation morte ne vaut rien ; « on y est allés à quatre » est un
   * souvenir, et c'est ce qui fait qu'on rouvre la liste. Le salon ne s'efface
   * donc pas quand il se ferme — il change de statut, il perd le droit
   * d'écrire, et il garde sa fin.
   */
  denouement?: string;
};

/**
 * LES SALONS SEMÉS — ceux qui existent déjà quand on arrive.
 *
 * SANS EUX, TOUTE LA MÉCANIQUE EST INVISIBLE. Une annonce sur laquelle personne
 * ne parle encore ne montre rien de ce qu'on veut faire comprendre ; il faut en
 * voir un vivant pour comprendre qu'on peut en ouvrir un. C'est la même leçon
 * que « faites-le revenir » : sans un cas déjà exaucé à l'écran, le bouton reste
 * une boîte à idées.
 */
export const SALONS_SEMES: Salon[] = [
  {
    // La clé porte le MENU, pas le créneau : sinon ce salon ne serait
    // atteignable qu'entre midi et deux heures, et invisible le reste du jour.
    cle: "centre|menu",
    sujet: "Garbure et magret, ce midi",
    ou: "Chez Bergine",
    parQui: "Pauline",
    quand: "Aujourd'hui · 12 h 30",
    viennent: ["Pauline", "Sarah", "Julie"],
    presents: ["Pauline", "Sarah", "Julie", "Marc"],
    statuts: { Pauline: "hote", Sarah: "vient", Julie: "vient", Marc: "interesse" },
    photo: "/direct/plat-garbure.jpg",
    annonce: "Garbure landaise, magret grillé",
    prix: "19 €",
    reste: "8 portions restantes",
    distance: "400 m",
    messages: [
      {
        id: "s1",
        qui: "Pauline",
        voix: "ami",
        texte: "Qui vient manger avec moi ? Il y a la garbure aujourd'hui.",
        quand: "11 h 42",
      },
      { id: "s2", qui: "Sarah", voix: "ami", texte: "Moi !", quand: "11 h 46" },
      {
        id: "s3",
        qui: "Julie",
        voix: "ami",
        texte: "Je peux vous rejoindre à 12 h 30, pas avant.",
        quand: "11 h 51",
      },
      {
        id: "s4",
        qui: "Pauline",
        voix: "ami",
        texte: "Parfait, je réserve pour quatre au cas où.",
        quand: "11 h 53",
      },
      {
        id: "s5",
        qui: "Marc",
        voix: "ami",
        texte: "Je ne peux pas ce midi, mais gardez-moi ça pour jeudi.",
        quand: "12 h 04",
      },
      // UNE CARTE DE SERVICE, PAS UNE BULLE. Ce que fait le groupe — réserver,
      // arriver — n'est pas dit par quelqu'un : c'est arrivé. Le montrer comme
      // un message de plus le noierait dans la conversation.
      {
        id: "s6",
        qui: "",
        voix: "systeme",
        texte: "",
        quand: "11 h 47",
        carte: {
          titre: "Pauline a réservé pour 4 personnes",
          detail: "Aujourd'hui à 12 h 30",
          tampon: "Confirmé par Chez Bergine",
        },
      },
      {
        id: "s7",
        qui: "Pauline",
        voix: "ami",
        texte: "On se retrouve là-bas alors !",
        quand: "11 h 48",
        reactions: { "❤️": 2 },
      },
    ],
    ouvert: true,
  },
  {
    cle: "coif-centre|Une place vient de se libérer",
    sujet: "Je suis chez elle, aidez-moi à choisir",
    ou: "Un salon du centre",
    parQui: "Camille",
    quand: "Maintenant",
    viennent: [],
    presents: ["Camille", "Léa", "Fatou"],
    statuts: { Camille: "hote", "Léa": "interesse", Fatou: "interesse" },
    photo: "/direct/fauteuil-coiffeur.jpg",
    annonce: "Coupe + brushing, une place libre",
    prix: "28 €",
    reste: "1 place cet après-midi",
    distance: "220 m",
    // ELLE Y EST, ET ELLE L'A CHOISI. C'est la seule chose que WhatsApp ne sait
    // pas faire : « Camille est là-bas, à 220 m, depuis 42 minutes ».
    // LE DIRECT EST UNE VRAIE VIDÉO. Quinze secondes filmées dans un salon,
    // à la verticale, muettes et en boucle. C'est la seule chose de cet écran
    // qui ne pouvait pas être dessinée : une image fixe dit « elle y est »,
    // une vidéo le MONTRE, et c'est toute la différence entre une capture et
    // un direct.
    //
    // CE QUI A ÉTÉ FAIT AU FICHIER REÇU, et il faut le savoir avant d'en
    // remettre un autre : le .mov d'origine n'est lisible par aucun
    // navigateur, il pesait 7,6 Mo, il portait des sous-titres incrustés
    // d'un autre réseau et l'icône de son de son application. Le bas de
    // l'image a donc été recadré — les deux visages restent entiers — et le
    // tout ré-encodé en MP4 et WebM sans son : 314 Ko et 511 Ko. Voir
    // `scripts/video-direct.sh`.
    enDirect: {
      qui: "Camille",
      depuis: "42 min",
      distance: "220 m",
      aPied: "3 min",
      image: "/direct/coiffure.jpg",
      video: { mp4: "/direct/coiffure.mp4", webm: "/direct/coiffure.webm" },
    },
    vote: {
      question: "Laquelle je fais ?",
      options: [
        { cle: "naturel", label: "🟤 Naturel", voix: 3 },
        { cle: "clair", label: "✨ Plus clair", voix: 8 },
      ],
    },
    messages: [
      {
        id: "c1",
        qui: "Camille",
        voix: "ami",
        texte: "Je sors de chez elle. Franchement ?",
        quand: "10 h 15",
        photo: "/direct/avis-coupe.jpg",
      },
      {
        id: "c2",
        qui: "Léa",
        voix: "ami",
        texte: "Ça te va super bien !",
        quand: "10 h 19",
        reactions: { "❤️": 2 },
      },
      {
        id: "c3",
        qui: "Fatou",
        voix: "ami",
        texte: "J'adore. Elle prend sans rendez-vous ?",
        quand: "10 h 24",
      },
      {
        id: "c4",
        qui: "Camille",
        voix: "ami",
        texte: "Oui, il reste une place cet après-midi d'après l'annonce.",
        quand: "10 h 26",
      },
    ],
    ouvert: true,
  },
  {
    cle: "ev|kiosque",
    sujet: "Le concert au kiosque",
    ou: "La mairie",
    parQui: "Thomas",
    quand: "Ce soir · 19 h",
    viennent: ["Thomas", "Inès", "Paul", "Sonia"],
    presents: ["Thomas", "Inès", "Paul", "Sonia"],
    statuts: { Thomas: "hote", "Inès": "vient", Paul: "vient", Sonia: "vient" },
    photo: "/direct/concert-kiosque.jpg",
    annonce: "Concert au kiosque · Trio de jazz",
    prix: "Gratuit",
    distance: "450 m",
    messages: [
      { id: "k1", qui: "Thomas", voix: "ami", texte: "Qui vient ce soir ?", quand: "09 h 30" },
      { id: "k2", qui: "Inès", voix: "ami", texte: "Nous deux on y sera.", quand: "09 h 41" },
      {
        id: "k3",
        qui: "Sonia",
        voix: "ami",
        texte: "J'apporte des chaises pliantes, il n'y a jamais de place assise.",
        quand: "10 h 02",
      },
    ],
    ouvert: true,
  },

  // ─── CEUX QU'ON PEUT DÉCOUVRIR ───
  //
  // DES SALONS PUBLICS OÙ L'ON N'EST PAS. Sans eux, « Mes salons » ne montre
  // que ce qu'on a soi-même déclenché, et le mot « public » ne veut rien dire :
  // on ne découvre jamais rien. Ce sont eux qui portent la seule chose que
  // WhatsApp ne saura jamais faire — voir que trois personnes vont quelque part
  // ce soir, et pouvoir s'y joindre sans connaître personne.
  {
    cle: "pub|tablee",
    sujet: "La grande tablée de ce soir",
    ou: "La Grande Tablée",
    parQui: "Inès",
    quand: "Ce soir · 20 h",
    viennent: ["Inès", "Marc"],
    presents: ["Inès", "Marc", "Chloé"],
    statuts: { "Inès": "hote", Marc: "vient", "Chloé": "interesse" },
    photo: "/direct/tablee-du-soir.jpg",
    annonce: "La table des inconnus · Poulet basquaise",
    prix: "17 €",
    reste: "4 places",
    distance: "320 m",
    messages: [
      { id: "t1", qui: "Inès", voix: "ami", texte: "J'y vais seule, il reste des places à la grande table.", quand: "17 h 40" },
      { id: "t2", qui: "Marc", voix: "ami", texte: "Je viens, j'habite à côté.", quand: "17 h 52", reactions: { "❤️": 1 } },
    ],
    ouvert: true,
  },
  {
    cle: "pub|halles-soir",
    sujet: "Le marché du soir, sous les halles",
    ou: "Sous les halles",
    parQui: "Karim",
    quand: "Jeudi · 18 h",
    viennent: ["Karim"],
    presents: ["Karim", "Léa"],
    statuts: { Karim: "hote", "Léa": "interesse" },
    photo: "/direct/marche-producteurs.jpg",
    annonce: "Marché de producteurs, le soir",
    prix: "Entrée libre",
    distance: "300 m",
    messages: [
      { id: "ms1", qui: "Karim", voix: "ami", texte: "Quelqu'un y va jeudi ? On peut se retrouver à l'entrée.", quand: "12 h 10" },
    ],
    ouvert: true,
  },

  // ─── CEUX QUI SONT PASSÉS ───
  //
  // POURQUOI DEUX SALONS MORTS DANS LA MAQUETTE. Un onglet « Mes salons » qui
  // ne montre que ce qui est ouvert aujourd'hui n'est qu'une boîte de
  // réception : il se vide chaque soir, et rien ne dit à quoi il aura servi.
  // Ce qui donne envie de rouvrir la liste, c'est ce qu'on y a VÉCU. Il faut
  // donc en voir au moins deux déjà refermés, avec leur fin — dont un qui ne
  // s'est pas fait, parce qu'une archive où tout réussit ne ressemble à rien.
  {
    cle: "passe|halles",
    sujet: "Le marché du samedi",
    ou: "Sous les halles",
    parQui: "Vous",
    quand: "Samedi · 11 h",
    jour: "Samedi dernier",
    denouement: "Vous y êtes allés à 4",
    viennent: ["Vous", "Sophie", "Paul", "Nadia"],
    presents: ["Vous", "Sophie", "Paul", "Nadia"],
    statuts: { Vous: "hote", Sophie: "vient", Paul: "vient", Nadia: "vient" },
    photo: "/direct/marche-producteurs.jpg",
    annonce: "Les producteurs, sous les halles",
    prix: "Entrée libre",
    distance: "300 m",
    messages: [
      { id: "h1", qui: "Vous", voix: "moi", texte: "J'ai trouvé ça, qui vient ?", quand: "09 h 40" },
      { id: "h2", qui: "Sophie", voix: "ami", texte: "Oui !", quand: "09 h 46", reactions: { "❤️": 2 } },
      { id: "h3", qui: "Paul", voix: "ami", texte: "Je passe vous prendre à 10 h 45.", quand: "09 h 58" },
      {
        id: "h4",
        qui: "Nadia",
        voix: "ami",
        texte: "On était bien. À refaire le mois prochain.",
        quand: "13 h 12",
        reactions: { "❤️": 3 },
      },
    ],
    ouvert: false,
  },
  {
    cle: "passe|nocturne",
    sujet: "La nocturne du musée",
    ou: "Musée de Borda",
    parQui: "Inès",
    quand: "Vendredi · 18 h",
    jour: "Vendredi",
    // UNE SORTIE QUI NE S'EST PAS FAITE RESTE UNE SORTIE. L'effacer donnerait
    // une archive où tout réussit, c'est-à-dire une archive à laquelle on ne
    // croit pas — et on perdrait l'information la plus utile du lot : ce
    // soir-là, personne ne pouvait.
    denouement: "Personne ne pouvait — reporté",
    viennent: [],
    presents: ["Inès", "Vous", "Thomas"],
    statuts: { "Inès": "hote", Vous: "interesse", Thomas: "interesse" },
    photo: "/direct/nocturne-musee.jpg",
    annonce: "Nocturne au musée · Visite aux lampes",
    prix: "5 €",
    distance: "380 m",
    messages: [
      { id: "n1", qui: "Inès", voix: "ami", texte: "Ça tente quelqu'un vendredi ?", quand: "14 h 20" },
      { id: "n2", qui: "Vous", voix: "moi", texte: "Envie, mais je finis à 19 h 30.", quand: "14 h 51" },
      { id: "n3", qui: "Thomas", voix: "ami", texte: "Pareil. On le refait quand ils remettent ça ?", quand: "15 h 06", reactions: { "❤️": 2 } },
    ],
    ouvert: false,
  },
];

/**
 * CE QUE LES AMIS RÉPONDENT QUAND ON OUVRE UN SALON — dans la maquette seulement.
 *
 * Trois voix, échelonnées, comme les commerces répondent à une demande de
 * sortie. Sans ça, celui qui tient le téléphone ouvre une conversation vide et
 * ne voit rien de ce qui fait l'intérêt du salon. Le vrai produit n'a pas ce
 * ressort : ce sont de vraies personnes.
 */
export const AMIS_QUI_REPONDENT: {
  qui: string;
  texte: string;
  apres: number;
  vient: boolean;
}[] = [
  { qui: "Sophie", texte: "Oui !", apres: 2200, vient: true },
  { qui: "Paul", texte: "Moi aussi, mais je peux seulement à 19 h.", apres: 5200, vient: true },
  { qui: "Nadia", texte: "Pas ce soir, la prochaine fois sans faute.", apres: 8400, vient: false },
];

// ─── COMMENT SAIT-ON COMMENT S'APPELLENT LES GENS ? ────────────────────────
//
// QUESTION POSÉE AU TEST, ET ELLE TOUCHE UN TROU RÉEL : « comment connaît-on
// les initiales des gens qui interagissent dans le salon si on ne leur demande
// pas ? » On ne les connaît pas. On ne peut pas les connaître : il n'y a pas de
// compte, pas de carnet d'adresses, pas de numéro. C'était donc une invention
// silencieuse.
//
// LA SEULE RÉPONSE HONNÊTE EST DE DEMANDER. Un prénom, une fois, au moment où
// la personne prend la parole — pas à l'arrivée : quelqu'un qui vient de
// cliquer sur un lien doit pouvoir LIRE sans rien donner. C'est la même règle
// que pour la permission de notification : on demande au seul instant où la
// demande est justifiée.
//
// CE PRÉNOM NE QUITTE PAS LE TÉLÉPHONE. Il vit à côté des avis et des salons,
// dans le même stockage local, et il ne part sur aucun serveur. Il sert à deux
// choses : signer ce qu'on écrit, et faire une initiale dans un rond.

const CLE_PRENOM = "clikme-prenom";
const abonnesPrenom = new Set<() => void>();
let prenomCache: string | null = null;

export function monPrenom(): string {
  if (prenomCache !== null) return prenomCache;
  if (typeof window === "undefined") return "";
  try {
    prenomCache = window.localStorage.getItem(CLE_PRENOM) ?? "";
  } catch {
    prenomCache = "";
  }
  return prenomCache;
}

export function abonnerPrenom(f: () => void) {
  abonnesPrenom.add(f);
  return () => {
    abonnesPrenom.delete(f);
  };
}

/**
 * Un prénom, rien d'autre : pas de nom, pas d'adresse, pas de photo.
 *
 * ET ON RÉÉCRIT LE PASSÉ, PARCE QU'IL LE FAUT. On peut ouvrir un salon, poser
 * une proposition et donner sa voix AVANT d'avoir dit son prénom : tout cela
 * est alors signé « Vous ». Sans cette reprise, la même personne existe deux
 * fois — défaut mesuré : « 1 sur 2 » de voix exprimées avec une seule personne
 * dans le salon, parce que « Vous » et « Camille » comptaient chacun pour un.
 */
export function direSonPrenom(p: string) {
  const net = p.trim().slice(0, 24);
  if (!net) return;
  prenomCache = net;
  try {
    window.localStorage.setItem(CLE_PRENOM, net);
  } catch {
    /* La session continue en mémoire. */
  }
  renommerVous(net);
  abonnesPrenom.forEach((f) => f());
}

/** Tout ce qui était signé « Vous » prend le prénom, partout, d'un coup. */
function renommerVous(nom: string) {
  const avant = chargerSalons();
  const remplace = (l: string[]) => {
    const n = l.map((x) => (x === "Vous" ? nom : x));
    return [...new Set(n)];
  };
  const apres: Record<string, Salon> = {};
  for (const [cle, s] of Object.entries(avant)) {
    const statuts = s.statuts
      ? Object.fromEntries(
          Object.entries(s.statuts).map(([q, v]) => [q === "Vous" ? nom : q, v]),
        )
      : undefined;
    apres[cle] = {
      ...s,
      parQui: s.parQui === "Vous" ? nom : s.parQui,
      presents: remplace(s.presents),
      viennent: remplace(s.viennent),
      statuts,
      messages: s.messages.map((m) => (m.qui === "Vous" ? { ...m, qui: nom } : m)),
      propositions: s.propositions?.map((p) => ({
        ...p,
        par: p.par === "Vous" ? nom : p.par,
        voix: remplace(p.voix),
      })),
    };
  }
  garder(apres);
}

/** L'heure telle qu'on l'écrit dans une conversation. */
export function heureCourte(d = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .format(d)
    .replace(":", " h ");
}

// ─── CE QUE LE NAVIGATEUR GARDE ────────────────────────────────────────────
//
// Même stockage que les avis, les rappels et les coups de pouce, et pour la
// même raison : on écrit, on ferme, on revient, et la conversation est encore
// là. Un salon qui se vide au rechargement ne prouve rien.
//
// Ce qui est gardé ne sort pas du téléphone : la maquette n'a pas de serveur de
// conversation, et c'est très bien — la seule chose qu'on cherche à savoir,
// c'est si le geste prend.

const CLE = "clikme-salons-v1";
let memoire: Record<string, Salon> | null = null;
const abonnes = new Set<() => void>();
export const SALONS_VIDES: Record<string, Salon> = {};

function semer(): Record<string, Salon> {
  const d: Record<string, Salon> = {};
  for (const s of SALONS_SEMES) d[s.cle] = { ...s, messages: [...s.messages] };
  return d;
}

export function chargerSalons(): Record<string, Salon> {
  if (memoire) return memoire;
  try {
    const brut = window.localStorage.getItem(CLE);
    // Les salons semés sont reposés à chaque fois SOUS ce qui a été écrit : ils
    // font partie du décor, pas des données de la personne.
    memoire = { ...semer(), ...(brut ? JSON.parse(brut) : {}) };
  } catch {
    memoire = semer();
  }
  return memoire ?? SALONS_VIDES;
}

export function abonnerSalons(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

function garder(suivant: Record<string, Salon>) {
  memoire = suivant;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(suivant));
  } catch {
    /* Refusé : le salon vit quand même le temps de la visite. */
  }
  abonnes.forEach((f) => f());
}

/**
 * Ouvre un salon sur une annonce, ou rend celui qui existe déjà.
 *
 * `presents` EST FACULTATIF, ET N'EXISTE QUE POUR LE COLLECTIF. Partout
 * ailleurs, un salon neuf ne contient que celui qui l'ouvre — c'est la vérité
 * du produit et on ne peuple jamais une salle à sa place. Mais un collectif
 * existait AVANT lui : sept personnes s'y sont déjà mises, et c'est même la
 * seule raison pour laquelle il le rejoint. L'afficher vide dirait le
 * contraire de ce que la jauge annonce sur l'annonce.
 */
export function ouvrirSalon(
  salon: Omit<Salon, "messages" | "viennent" | "presents" | "ouvert"> & {
    presents?: string[];
  },
) {
  const avant = chargerSalons();
  if (avant[salon.cle]) return avant[salon.cle];
  /**
   * ON S'INSCRIT SOUS LE NOM QU'ON PORTE DÉJÀ, et pas sous « Vous ».
   *
   * `direSonPrenom` réécrit le passé, ce qui règle l'ordre « j'ouvre puis je me
   * présente ». L'ORDRE INVERSE N'ÉTAIT PAS COUVERT : quand on s'était déjà
   * présenté, ce salon-ci naissait quand même signé « Vous », et le premier
   * vote de Camille créait une deuxième personne — le « 1 sur 2 » avec un seul
   * habitant dans le salon, relevé au test, revenait par l'autre porte.
   */
  const moi = monPrenom() || "Vous";
  const neuf: Salon = {
    ...salon,
    // La page appelle avec « Vous » parce qu'elle ne sait pas encore qui vous
    // etes ; ici on le sait, et c'est le dernier endroit avant l'ecriture.
    parQui: salon.parQui === "Vous" ? moi : salon.parQui,
    viennent: [moi],
    // MOI D'ABORD, PUIS CEUX QUI Y ÉTAIENT DÉJÀ — et jamais deux fois le même
    // si l'appelant m'a inclus par mégarde.
    presents: [moi, ...(salon.presents ?? []).filter((q) => q !== moi)],
    messages: [],
    ouvert: true,
    // CE QUI EST SUR LA TABLE DÈS L'OUVERTURE : l'annonce qui a déclenché le
    // salon, portée par celui qui l'a ouvert. Sans elle, la première
    // alternative proposée n'aurait rien à départager.
    propositions: [
      {
        cle: salon.cle,
        par: moi,
        quoi: salon.annonce ?? salon.sujet,
        ou: salon.ou,
        prix: salon.prix,
        distance: salon.distance,
        photo: salon.photo,
        voix: [moi],
      },
    ],
  };
  garder({ ...avant, [salon.cle]: neuf });
  return neuf;
}

export function ecrireDansSalon(cle: string, m: Omit<MessageSalon, "id">) {
  const avant = chargerSalons();
  const s = avant[cle];
  if (!s) return;
  const id = `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  garder({ ...avant, [cle]: { ...s, messages: [...s.messages, { ...m, id }] } });
}

/** Le préfixe qui marque une annonce de tête, et rien d'autre. */
const TETE = "🏆 ";

/**
 * ANNONCER CE QUI MÈNE — UNE SEULE LIGNE, QUI SE MET À JOUR.
 *
 * DÉFAUT RELEVÉ AU TEST, et il rend le salon illisible : chaque déplacement de
 * voix écrivait une ligne de plus. Un groupe qui hésite entre deux endroits en
 * produisait cinq d'affilée —
 *
 *     🏆 Chez Bergine passe en tête.
 *     🏆 La Grande Tablée passe en tête.
 *     🏆 Chez Bergine passe en tête.
 *     🏆 La Grande Tablée passe en tête.
 *     🏆 Chez Bergine passe en tête.
 *
 * — et la conversation devenait le journal d'un serveur. L'intention était
 * bonne : un bandeau qui change pendant qu'on regarde ailleurs passe inaperçu,
 * et une ligne dans le fil est ce qu'un groupe relit. Mais CINQ lignes ne se
 * relisent pas, elles noient ce qui a été dit.
 *
 * ON REMPLACE PLUTÔT QUE D'EMPILER : si la dernière chose du fil est déjà une
 * annonce de tête, elle prend la nouvelle valeur. Dès que quelqu'un a parlé
 * entre-temps, la suivante s'écrit normalement — parce qu'alors elle répond à
 * quelque chose, et qu'on la relira.
 *
 * ET RIEN SI RIEN N'A CHANGÉ : revenir à ce qui menait déjà n'est pas un
 * événement, c'est un aller-retour.
 */
export function annoncerLaTete(cle: string, texte: string, quand: string) {
  const avant = chargerSalons();
  const s = avant[cle];
  if (!s) return;
  const dernier = s.messages[s.messages.length - 1];
  const remplace =
    dernier && dernier.voix === "systeme" && dernier.texte.startsWith(TETE);
  if (remplace && dernier.texte === texte) return;
  const ligne: MessageSalon = {
    id: remplace ? dernier.id : `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    qui: "Clikme",
    voix: "systeme",
    texte,
    quand,
  };
  const messages = remplace
    ? [...s.messages.slice(0, -1), ligne]
    : [...s.messages, ligne];
  garder({ ...avant, [cle]: { ...s, messages } });
}

// ─── CE QUI EST EN TÊTE, ET COMMENT ON Y ARRIVE ────────────────────────────
//
// PAS DE SEUIL DE MAJORITÉ, ET C'EST DÉLIBÉRÉ. « Quand la majorité est
// atteinte » ne se définit pas proprement : majorité des présents, ou des
// votants ? Dans un salon où les gens arrivent au fil de l'eau, le
// dénominateur bouge, et un bandeau qui bascule puis rebascule à chaque
// arrivée est pire qu'un bandeau qui ne bouge pas.
//
// ON PREND DONC LE PLUS SIMPLE ET LE PLUS VRAI : le bandeau suit ce qui est EN
// TÊTE, en direct. À égalité, la plus ancienne reste — celle qui a lancé le
// salon ne se fait pas doubler par un ex æquo. Et c'est RÉSERVER qui tranche
// pour de bon : tant que personne n'a réservé, rien n'est décidé, ce qui est
// exactement la vérité d'un groupe qui hésite.

/** La proposition qui mène. Rend l'annonce d'origine s'il n'y en a pas. */
export function enTete(s: Salon): Proposition | undefined {
  const p = s.propositions ?? [];
  if (!p.length) return undefined;
  return p.reduce((m, x) => (x.voix.length > m.voix.length ? x : m), p[0]);
}

/**
 * Poser une alternative sur la table. Celui qui propose donne sa voix du même
 * geste : proposer sans voter pour soi n'aurait aucun sens.
 */
export function proposer(cleSalon: string, p: Omit<Proposition, "voix">, qui: string) {
  const avant = chargerSalons();
  const s = avant[cleSalon];
  if (!s) return;
  const liste = s.propositions ?? [];
  if (liste.some((x) => x.cle === p.cle)) {
    // Déjà sur la table : on n'en fait pas un doublon, on y met sa voix.
    donnerSaVoix(cleSalon, p.cle, qui);
    return;
  }
  const avecMaVoix = liste.map((x) => ({ ...x, voix: x.voix.filter((v) => v !== qui) }));
  garder({
    ...avant,
    [cleSalon]: { ...s, propositions: [...avecMaVoix, { ...p, voix: [qui] }] },
  });
}

/**
 * Déplacer sa voix. UNE SEULE PAR PERSONNE : on ne cumule pas, on choisit.
 *
 * ON NE PEUT PAS SE RETIRER, ET C'EST VOULU. La première version faisait qu'un
 * deuxième appui sur la même proposition ôtait la voix — mesuré : deux
 * propositions à zéro voix, un bandeau qui retombe sur la première venue et
 * un décompte « 0 sur 0 » qui ressemble à une panne. Surtout, ce n'est pas le
 * geste que les gens ont en tête : on appuie pour dire « je préfère
 * celle-ci », jamais pour dire « je n'ai plus d'avis ». Qui n'a pas d'avis ne
 * vote pas — c'est déjà possible, et ça se lit dans le décompte.
 */
export function donnerSaVoix(cleSalon: string, clePropo: string, qui: string) {
  const avant = chargerSalons();
  const s = avant[cleSalon];
  if (!s?.propositions) return;
  garder({
    ...avant,
    [cleSalon]: {
      ...s,
      propositions: s.propositions.map((p) => ({
        ...p,
        voix:
          p.cle === clePropo
            ? [...p.voix.filter((v) => v !== qui), qui]
            : p.voix.filter((v) => v !== qui),
      })),
    },
  });
}

/**
 * Public ou privé. Réservé à celui qui a ouvert le salon : les autres n'ont pas
 * à décider de la visibilité d'une sortie qu'ils n'ont pas proposée.
 */
/**
 * Rend l'état APRÈS le geste : vrai si le salon vient de passer en privé.
 *
 * LE GARDE-FOU CHERCHAIT « Vous », ET C'EST LE MÊME DÉFAUT QUE LES AUTRES.
 * On s'appelle « Vous » avant de s'être présenté, et Camille après — si bien
 * qu'une fois son prénom donné, celui qui avait ouvert le salon n'en était plus
 * reconnu comme l'hôte : l'interrupteur ne faisait plus rien, sans un mot.
 */
export function basculerVisibilite(cle: string): boolean {
  const avant = chargerSalons();
  const s = avant[cle];
  const moi = monPrenom() || "Vous";
  if (!s || (s.parQui !== "Vous" && s.parQui !== moi)) return !!s?.prive;
  const prive = !s.prive;
  garder({ ...avant, [cle]: { ...s, prive } });
  return prive;
}

/** Entre ou sort de la liste de ceux qui viennent. */
export function basculerVenue(cle: string, qui = "Vous") {
  const avant = chargerSalons();
  const s = avant[cle];
  if (!s) return;
  const dedans = s.viennent.includes(qui);
  garder({
    ...avant,
    [cle]: {
      ...s,
      viennent: dedans ? s.viennent.filter((x) => x !== qui) : [...s.viennent, qui],
      presents: s.presents.includes(qui) ? s.presents : [...s.presents, qui],
    },
  });
}

/** Un cœur sous un message, ou le retirer. Un appui, jamais plus. */
export function reagir(cle: string, idMessage: string, emoji: string) {
  const avant = chargerSalons();
  const s = avant[cle];
  if (!s) return;
  garder({
    ...avant,
    [cle]: {
      ...s,
      messages: s.messages.map((m) => {
        if (m.id !== idMessage) return m;
        const avait = m.maReaction === emoji;
        const n = { ...(m.reactions ?? {}) };
        n[emoji] = Math.max(0, (n[emoji] ?? 0) + (avait ? -1 : 1));
        if (!n[emoji]) delete n[emoji];
        return { ...m, reactions: n, maReaction: avait ? undefined : emoji };
      }),
    },
  });
}

/** Voter pour celle qui est sur place. Revoter change la voix, n'en ajoute pas. */
export function voter(cle: string, option: string) {
  const avant = chargerSalons();
  const s = avant[cle];
  if (!s?.vote) return;
  const ancien = s.vote.monVote;
  if (ancien === option) return;
  garder({
    ...avant,
    [cle]: {
      ...s,
      vote: {
        ...s.vote,
        monVote: option,
        options: s.vote.options.map((o) => ({
          ...o,
          voix: o.voix + (o.cle === option ? 1 : o.cle === ancien ? -1 : 0),
        })),
      },
    },
  });
}

/** Fait entrer quelqu'un dans le salon sans qu'il se prononce. */
export function entrerDansSalon(cle: string, qui: string, vient: boolean) {
  const avant = chargerSalons();
  const s = avant[cle];
  if (!s) return;
  garder({
    ...avant,
    [cle]: {
      ...s,
      presents: s.presents.includes(qui) ? s.presents : [...s.presents, qui],
      viennent: vient && !s.viennent.includes(qui) ? [...s.viennent, qui] : s.viennent,
    },
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  LE FANTÔME VEILLE SUR LA DISCUSSION
// ═════════════════════════════════════════════════════════════════════════════
//
// « Les gens ne viendront pas sur ce chat comme ils iraient sur WhatsApp, donc
//  pas certain qu'ils le voient — mais j'aime bien l'idée de changer de couleur
//  pour une raison spécifique, et qu'en appuyant dessus… »
//
// PAS UN CHATBOT, PAS UN MENU, PAS UN ASSISTANT : UN ARBITRE. La différence
// n'est pas de ton, elle est de forme. Cinq états qui OUVRENT UN MENU obligent
// à réfléchir à quoi cliquer — c'est un assistant, et un assistant se referme.
// Cinq états qui déclenchent UNE SEULE ACTION DÉJÀ DÉCIDÉE ne demandent qu'un
// oui — c'est un arbitre, et un arbitre on l'écoute. D'où la règle qui tient
// tout ce fichier : `action` est au singulier, et le restera.
//
// ET IL NE DEVINE RIEN. Chaque état ci-dessous se déduit de données qui
// existent déjà — les voix des propositions, ceux qui viennent, ce qu'il reste,
// les cartes du fil. Aucun compte à rebours inventé, aucune humeur simulée : un
// arbitre qui se trompe sur l'état du jeu perd son autorité au premier appel.
//
// POURQUOI C'EST ICI ET PAS DANS L'ÉCRAN. La barre du bas doit connaître cet
// état SANS ouvrir le salon — c'est même toute l'idée : le fantôme est le seul
// objet visible en permanence, donc c'est lui qui ramène. Une fonction pure,
// dans la couche basse, se lit depuis la barre comme depuis le salon, et se
// vérifie sans navigateur.

export type TonDuFantome = "calme" | "neuf" | "hesite" | "decide" | "presse";

export type EtatDuFantome = {
  ton: TonDuFantome;
  /** Le salon concerné : la barre doit savoir où emmener. */
  cle: string;
  /** Ce qu'il dit, en une phrase, comme on le dirait à table. */
  phrase: string;
  /**
   * LE SEUL GESTE PROPOSÉ, et il n'y en aura jamais deux. Absent quand il n'y
   * a rien à faire — un arbitre qui parle pour ne rien trancher est un bavard.
   */
  action?: {
    libelle: string;
    faire: "voter" | "reserver" | "ouvrir";
    /** La proposition à départager, pour « voter ». */
    propo?: string;
  };
};

/** Ce qu'il reste, quand c'est un nombre de parts et pas une phrase. */
export function placesRestantes(s: Salon): number | undefined {
  if (!s.reste || !/place|portion|part\b/i.test(s.reste)) return undefined;
  const n = /(\d+)/.exec(s.reste);
  return n ? Number(n[1]) : undefined;
}

/**
 * LA DEMANDE EN COURS, LUE DANS LE FIL. Elle y est déjà écrite, en carte de
 * service : c'est la source de vérité, elle survit au rechargement et elle est
 * la même pour tout le monde. Un second état, à côté, aurait fini par diverger.
 *
 * DEUX FORMULATIONS : celle qu'écrit la demande (« Alice demande pour 4 ») et
 * celle déjà confirmée par le commerce (« Pauline a réservé pour 4 »).
 */
export function demandeDuFil(s: Salon): { qui: string; combien: number } | undefined {
  for (let i = s.messages.length - 1; i >= 0; i--) {
    const m = s.messages[i];
    const t = m.carte?.titre ?? "";
    if (/annule la demande/i.test(t)) return undefined;
    const d = /^(.+?) (?:demande|a réservé) pour (\d+)/.exec(t);
    if (m.voix === "systeme" && d) return { qui: d[1], combien: Number(d[2]) };
  }
  return undefined;
}

/**
 * ═══ CE QU'ON A DÉJÀ LU, PAR SALON ═══
 *
 * UN MAGASIN, PAS UNE LECTURE DIRECTE, ET C'EST UNE CORRECTION. La première
 * version lisait `localStorage` depuis `etatDuSalon`. Mesuré : en sortant d'un
 * salon, le compteur était bien écrit, et le fantôme restait violet — rien
 * n'avait prévenu React que quoi que ce soit avait changé. Un état qui ne se
 * rafraîchit pas est pire qu'un état absent : il dit du neuf sur du lu.
 *
 * ET `etatDuSalon` REÇOIT LA CARTE PLUTÔT QUE D'ALLER LA CHERCHER. Une
 * fonction qui décide de ce que le produit affiche doit se vérifier sans
 * navigateur, et une lecture cachée du stockage lui interdisait exactement ça.
 */
const CLE_LUS = "clikme-salons-lus-v1";
export const AUCUN_LU: Record<string, number> = {};
let memoireLus: Record<string, number> | null = null;
const abonnesLus = new Set<() => void>();

export function chargerLus(): Record<string, number> {
  if (memoireLus) return memoireLus;
  try {
    memoireLus = JSON.parse(window.localStorage.getItem(CLE_LUS) ?? "{}") ?? {};
  } catch {
    memoireLus = {};
  }
  return memoireLus ?? AUCUN_LU;
}

export function abonnerLus(f: () => void) {
  abonnesLus.add(f);
  return () => void abonnesLus.delete(f);
}

/**
 * ON NOTE CE QU'ON A VU EN SORTANT DU SALON, PAS EN Y ENTRANT. Marquer à
 * l'entrée effaçait l'état « neuf » avant que la personne ait eu le temps de
 * lire ce qui l'avait fait venir — le fantôme s'éteignait pile au moment où il
 * aurait dû montrer pourquoi il s'était allumé.
 */
export function marquerLu(cle: string, combien: number) {
  const avant = chargerLus();
  if (avant[cle] === combien) return;
  memoireLus = { ...avant, [cle]: combien };
  try {
    window.localStorage.setItem(CLE_LUS, JSON.stringify(memoireLus));
  } catch {
    /* Refusé : le compte vit quand même le temps de la visite. */
  }
  abonnesLus.forEach((f) => f());
}

/**
 * L'ÉTAT D'UN SALON, DANS L'ORDRE DE CE QUI PRESSE.
 *
 * L'ORDRE EST LA MOITIÉ DE LA FONCTION. Un groupe qui hésite ALORS QUE la
 * table va manquer n'a pas besoin qu'on l'invite à voter : il a besoin qu'on
 * lui dise qu'il va rester dehors. Chaque test ci-dessous ne se lit donc que si
 * tous ceux d'au-dessus ont échoué, et c'est ce qui garantit une seule phrase.
 */
export function etatDuSalon(
  s: Salon,
  moi: string,
  lus: Record<string, number> = AUCUN_LU,
): EtatDuFantome {
  const calme: EtatDuFantome = { ton: "calme", cle: s.cle, phrase: "" };
  if (!s.ouvert) return calme;

  const deja = demandeDuFil(s);
  const propos = s.propositions ?? [];
  const chef = enTete(s);
  const combien = Math.max(s.viennent.length, 1);

  // ─── 1. ÇA PRESSE : il manquera de la place, et personne n'a encore réservé.
  //     LE SEUL SIGNAL D'URGENCE QU'ON AIT VRAIMENT. Un compte à rebours en
  //     minutes aurait été plus spectaculaire, mais le salon ne connaît pas
  //     l'heure de fin du moment — l'inventer aurait fait mentir l'arbitre au
  //     premier essai, et un arbitre pris en défaut ne se rattrape pas.
  const restant = placesRestantes(s);
  if (!deja && restant !== undefined && restant < s.viennent.length) {
    return {
      ton: "presse",
      cle: s.cle,
      phrase: `Attention : ${s.reste}, et vous êtes ${s.viennent.length}.`,
      action: { libelle: "Réserver maintenant", faire: "reserver" },
    };
  }

  // ─── 2. C'EST DÉCIDÉ : il ne reste plus qu'à le dire au commerce.
  //     « DÉCIDÉ » NE VEUT PAS DIRE UNANIME. Une voix d'avance suffit à trancher
  //     quand personne ne réclame le contraire ; attendre l'unanimité, c'est
  //     exactement la panne qu'on répare — la table se prend pendant qu'on
  //     s'assure que tout le monde est bien d'accord.
  if (!deja && s.viennent.length >= 2) {
    const second = propos
      .filter((p) => p.cle !== chef?.cle)
      .reduce((m, x) => (!m || x.voix.length > m.voix.length ? x : m), undefined as Proposition | undefined);
    const tranche = propos.length <= 1 || (chef && chef.voix.length - (second?.voix.length ?? 0) >= 2);
    if (tranche) {
      // LE TITRE GARDE SA CASSE, ENTRE GUILLEMETS. Le mettre en minuscules
      // pour qu'il coule dans la phrase donnait « pour concert au kiosque ·
      // trio de jazz » : un nom propre écrasé, et un point médian au milieu
      // d'une phrase parlée. Les guillemets disent que c'est une citation, et
      // la phrase se lit sans qu'on ait à toucher au titre du commerce.
      const quoi = chef?.quoi ?? s.annonce ?? s.sujet;
      return {
        ton: "decide",
        cle: s.cle,
        phrase: `Ça a l'air décidé ! Vous êtes ${combien} pour « ${quoi} ».`,
        action: { libelle: `Réserver pour ${combien}`, faire: "reserver" },
      };
    }
  }

  // ─── 3. ÇA HÉSITE : deux idées se tiennent, et quelqu'un doit départager.
  //     ON NE TRANCHE PAS À LEUR PLACE, ON LEUR REND LA MAIN. Le fantôme dit ce
  //     qu'il voit — le décompte, à voix haute — et propose le geste qui sort de
  //     l'ornière. C'est la seule chose qui manque à un groupe qui hésite : non
  //     pas un avis de plus, mais quelqu'un qui demande de lever la main.
  if (!deja && propos.length >= 2 && chef) {
    const compte = [...propos]
      .sort((a, b) => b.voix.length - a.voix.length)
      .slice(0, 2)
      .map((p) => `${p.voix.length} → ${p.quoi}`)
      .join(", ");
    const sansVoix = s.presents.filter((q) => !propos.some((p) => p.voix.includes(q)));
    const serre =
      chef.voix.length - (propos.filter((p) => p.cle !== chef.cle).reduce((m, x) => Math.max(m, x.voix.length), 0)) <= 1;
    if (serre || sansVoix.length) {
      return {
        ton: "hesite",
        cle: s.cle,
        phrase: `Je crois que vous hésitez… ${compte}. Je vous propose de choisir ?`,
        // LE LIBELLÉ NE PROMET QUE CE QUE LE BOUTON FAIT. « Relancer le vote »,
        // pour qui a déjà voté, laisse croire qu'on va prévenir les autres —
        // et rien, ici, ne prévient personne. Il montre où ça en est ; il le
        // dit. Un arbitre qui promet ce qu'il ne tient pas cesse d'être cru.
        action: {
          libelle: propos.some((p) => p.voix.includes(moi)) ? "Voir où ça en est" : "Voter",
          faire: "voter",
          propo: chef.cle,
        },
      };
    }
  }

  // ─── 4. C'EST NEUF : un ami a parlé depuis mon dernier passage.
  //     LE PLUS FAIBLE DES QUATRE, ET IL VIENT DONC EN DERNIER. « Quelqu'un a
  //     répondu » n'est pas une décision à prendre : c'est une invitation à
  //     lire. Il ne porte pas d'action — il ouvre la porte, rien de plus.
  const vu = lus[s.cle] ?? 0;
  const neufs = s.messages.length - vu;
  if (neufs > 0 && vu > 0) {
    const dernier = [...s.messages].reverse().find((m) => m.voix === "ami");
    return {
      ton: "neuf",
      cle: s.cle,
      phrase: dernier
        ? `${dernier.qui} a répondu — ${neufs} message${neufs > 1 ? "s" : ""} depuis votre passage.`
        : `${neufs} message${neufs > 1 ? "s" : ""} depuis votre passage.`,
      action: { libelle: "Voir la discussion", faire: "ouvrir" },
    };
  }

  return calme;
}

/**
 * CE QUE LE FANTÔME DE LA BARRE PORTE — l'état le plus pressant de MES salons.
 *
 * C'EST ICI QUE L'IDÉE TIENT OU TOMBE. Un indicateur posé DANS le salon a
 * exactement le défaut qu'on lui reprochait : personne ne revient le voir. Le
 * fantôme, lui, est à l'écran en permanence — c'est le seul objet du produit
 * dont ce soit vrai. Mettre l'état là, et pas seulement dans la conversation,
 * est ce qui fait la différence entre un signal joli et un signal qui ramène.
 */
export function etatDesSalons(
  salons: Record<string, Salon>,
  moi: string,
  lesMiens: (s: Salon) => boolean,
  lus: Record<string, number> = AUCUN_LU,
): EtatDuFantome | undefined {
  const rang: Record<TonDuFantome, number> = { presse: 4, decide: 3, hesite: 2, neuf: 1, calme: 0 };
  let meilleur: EtatDuFantome | undefined;
  for (const s of Object.values(salons)) {
    if (!lesMiens(s)) continue;
    const e = etatDuSalon(s, moi, lus);
    if (e.ton === "calme") continue;
    if (!meilleur || rang[e.ton] > rang[meilleur.ton]) meilleur = e;
  }
  return meilleur;
}
