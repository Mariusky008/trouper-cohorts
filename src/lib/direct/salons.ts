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
  carte?: { titre: string; detail: string; tampon?: string };
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
export type EnDirect = {
  qui: string;
  depuis: string;
  distance: string;
  aPied: string;
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
    enDirect: { qui: "Camille", depuis: "42 min", distance: "220 m", aPied: "3 min" },
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

/** Ouvre un salon sur une annonce, ou rend celui qui existe déjà. */
export function ouvrirSalon(salon: Omit<Salon, "messages" | "viennent" | "presents" | "ouvert">) {
  const avant = chargerSalons();
  if (avant[salon.cle]) return avant[salon.cle];
  const neuf: Salon = {
    ...salon,
    viennent: ["Vous"],
    presents: ["Vous"],
    messages: [],
    ouvert: true,
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
