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
    ],
    ouvert: true,
  },
  {
    cle: "coif-centre|Une place vient de se libérer",
    sujet: "Ma coupe, vous en pensez quoi ?",
    ou: "Un salon du centre",
    parQui: "Camille",
    quand: "Aujourd'hui · 10 h 15",
    viennent: [],
    presents: ["Camille", "Léa", "Fatou"],
    messages: [
      {
        id: "c1",
        qui: "Camille",
        voix: "ami",
        texte: "Je sors de chez elle. Franchement ?",
        quand: "10 h 15",
        photo: "/direct/avis-coupe.jpg",
      },
      { id: "c2", qui: "Léa", voix: "ami", texte: "Ça te va super bien !", quand: "10 h 19" },
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
