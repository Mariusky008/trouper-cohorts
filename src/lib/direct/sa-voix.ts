// 🎙️ SA VOIX — la phrase qu'il a dite sans savoir qu'elle valait quelque chose
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// L'écran 3 du parcours d'avant-goût est celui-ci : « J'ai demandé à Margot ce
// qui fait la différence… », et on entend Margot. C'est le seul écran du
// parcours qu'un concurrent ne peut pas copier, parce qu'il ne tient pas au
// dessin mais à un canal — celui qui fait parler un commerçant tous les matins.
//
// ET ON L'AVAIT DÉJÀ, ENTIÈREMENT. `voix-micro.ts` enregistrait sa voix à
// chaque tour de parole pour servir de filet à la transcription, puis la
// laissait tomber avec la fin de la fonction. Il ne manquait pas un micro, pas
// une permission, pas un fournisseur : il manquait de ne pas jeter.
//
// ═══ CE QU'ON NE FAIT PAS, ET C'EST LE POINT ════════════════════════════════
//
// ON NE LUI DEMANDE PAS D'ENREGISTRER UN VOCAL. « Monsieur, faites-nous vingt
// secondes sur votre plat » est un travail, et un commerçant en plein service
// ne le fait pas deux fois. On lui montre une phrase QU'IL VIENT DE DIRE et on
// demande « on le garde ? ». Un doigt, sur quelque chose qui existe déjà.
//
// C'EST DONC CLIKME QUI REPÈRE, PAS LUI QUI FABRIQUE. Il n'a pas à savoir
// laquelle de ses phrases est bonne — c'est précisément ce qu'un artisan ne
// sait jamais de son propre métier, parce que pour lui c'est évident.
//
// ET RIEN NE PART SANS LE OUI. Ce fichier ne publie rien : il repère, il range
// ce qu'on lui confie, et il oublie sur demande. Sa voix diffusée à une ville
// n'est pas une case dans des conditions générales.

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIÈRE PARTIE — REPÉRER
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * CE QUI FAIT QU'UNE PHRASE VAUT LA PEINE : ELLE DIT COMMENT IL TRAVAILLE.
 *
 * « J'achète la bête entière à l'éleveur » vaut quelque chose. « Il me reste
 * quatre parts » ne vaut rien ici — c'est vrai, c'est utile, et c'est déjà sur
 * la carte. La différence n'est pas la qualité de la phrase, c'est sa DURÉE DE
 * VIE : l'une est vraie pour toujours, l'autre est périmée à quatorze heures.
 *
 * TROIS FAMILLES, ET IL EN FAUT DEUX. Un geste seul (« je coupe ») ne dit rien ;
 * un geste et une origine, ou un geste et une durée, racontent un métier. C'est
 * la règle la plus simple qui ne laisse pas passer « je fais la caisse ».
 */
const GESTES = [
  "achèt",
  "choisi",
  "sélectionn",
  "prépar",
  "cuis",
  "cuit",
  "pétri",
  "mijot",
  "coup",
  "désoss",
  "découp",
  "travaill",
  "monte",
  "tourne",
  "fume",
  "sale",
  "marin",
  "pluche",
  "lève",
  "pèse",
  "fais",
  "faisons",
  "élève",
  "récolt",
  "cultiv",
  "assaisonn",
  "réduis",
  "dress",
];

const ORIGINES = [
  "éleveur",
  "producteur",
  "ferme",
  "marché",
  "maison",
  "moi-même",
  "nous-mêmes",
  "sur place",
  "artisan",
  "levain",
  "maturation",
  "matur",
  "entière",
  "entier",
  "du pays",
  "local",
  "voisin",
  "saison",
  "aop",
  "bio",
  "frais",
  "fraîche",
  "grand-mère",
  "mon père",
  "ma mère",
  "recette",
];

const DUREES = [
  " heure",
  " jour",
  " semaine",
  " mois",
  " an",
  "depuis",
  "chaque matin",
  "tous les matins",
  "la veille",
  "toute la nuit",
  "minute",
  "lent",
];

/**
 * CE QUI DISQUALIFIE UNE PHRASE, MÊME BIEN TOURNÉE.
 *
 * UN PRIX, UN HORAIRE, UN RESTE : ça se périme. Gardé dans un parcours qu'on
 * rejoue trois semaines plus tard, « il m'en reste deux » devient un mensonge
 * qu'on a soi-même mis en scène — et c'est exactement le reproche qu'on fait
 * partout ailleurs dans ce produit.
 *
 * ET LE CHIFFRE EST LE PIRE DE TOUS. « Quatorze euros » entendu « quatre euros »
 * est déjà la raison pour laquelle la carte de validation existe dans
 * l'assistante ; on ne va pas le remettre dans un enregistrement qu'on diffuse.
 */
const PERISSABLES = [
  "€",
  "euro",
  "il reste",
  "il me reste",
  "il n'en reste",
  "jusqu'à",
  "à partir de",
  "aujourd'hui seulement",
  "ce soir seulement",
  "promo",
  "réserv",
  "disponible",
  "en stock",
  "ferme à",
  "ouvre à",
];

/** Un horaire ou une quantité écrits en chiffres : « 12 h », « 4 parts », « 19 € ». */
const CHIFFRE = /\d/;

/**
 * LA PREMIÈRE PERSONNE EST OBLIGATOIRE, et ce n'est pas une préférence de style.
 *
 * L'écran dit « j'ai demandé à Margot ce qui fait la différence » puis donne la
 * parole à Margot. Une phrase à la troisième personne — « le pain est bon » —
 * ne tient pas cette promesse : ce n'est plus quelqu'un qui parle de son
 * métier, c'est une réclame.
 */
const PERSONNE = /\b(je|j['’]|on|nous|mon|ma|mes|notre|nos|chez moi|ici)\b/i;

/** Sous six mots ce n'est pas une phrase ; au-delà de trente, ce n'est plus une citation. */
const MOTS_MIN = 6;
const MOTS_MAX = 30;

/**
 * ═══ HUIT SECONDES, ET LE RESTE SE REDIT ══════════════════════════════════
 *
 * L'ENREGISTREMENT COUVRE TOUT CE QU'IL A DIT, PAS LA PHRASE QU'ON A REPÉRÉE.
 * S'il a parlé trente secondes et qu'on affiche une phrase de huit, le bouton
 * ▶ joue autre chose que ce qui est écrit — et on ne sait pas découper un
 * fichier audio dans le navigateur sans le décoder.
 *
 * ON NE BRICOLE DONC PAS : soit la prise de parole entière tient dans la durée
 * d'une citation, et l'enregistrement colle au texte ; soit elle déborde, et on
 * lui demande de redire cette phrase-là, toute seule. Un geste de plus, mais
 * un écran qui ne ment pas.
 */
export const SECONDES_MAX = 14;
/** En dessous, il n'a pas eu le temps de dire quoi que ce soit d'écoutable. */
export const SECONDES_MIN = 1.5;

export type Reperage = {
  /** La phrase, telle qu'il l'a dite — jamais réécrite. */
  texte: string;
  /** Ce qui l'a fait remarquer. Sert à le lui dire, pas à le classer. */
  raison: string;
  /**
   * L'ENREGISTREMENT CORRESPOND-IL À CE TEXTE ? Faux quand la phrase est bonne
   * mais noyée dans une longue prise de parole : on a alors le texte sans la
   * voix, et l'écran demande de la redire.
   */
  colle: boolean;
  audio?: string;
  secondes: number;
  /**
   * ON AVAIT DÉJÀ CETTE PHRASE, SANS LA VOIX, ET LA VOILÀ.
   *
   * Posé par l'écran qui compare avec ce qui est rangé, pas par le repérage :
   * ce fichier ne sait pas ce qu'un commerçant a déjà validé, et n'a pas à le
   * savoir. Sert seulement à ne pas reposer une question déjà répondue.
   */
  voixAttendue?: boolean;
};

const sansAccent = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const contient = (bas: string, liste: string[]) => liste.some((m) => bas.includes(sansAccent(m)));

/**
 * ON COUPE SUR LA PONCTUATION, PUIS SUR « ET » ET « PUIS ».
 *
 * La dictée d'un téléphone ponctue mal : on reçoit souvent un bloc de quarante
 * mots sans un point. Couper aussi sur les liaisons rend des morceaux qui sont
 * des phrases pour l'oreille, à défaut de l'être pour la grammaire — et c'est
 * l'oreille qui compte, puisque c'est elle qui les écoutera.
 */
function phrases(texte: string): string[] {
  const gros = texte
    .split(/(?<=[.!?…])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const sortis: string[] = [];
  for (const g of gros) {
    if (g.split(/\s+/).length <= MOTS_MAX) {
      sortis.push(g);
      continue;
    }
    for (const bout of g.split(/,\s+(?=et\s|puis\s)|\s+puis\s+/i)) {
      const b = bout.trim();
      if (b) sortis.push(b);
    }
  }
  return sortis;
}

/** La note d'une phrase, et la raison qui va avec. Zéro : on ne la propose pas. */
function noter(phrase: string): { note: number; raison: string } {
  const bas = sansAccent(phrase);
  const mots = phrase.split(/\s+/).filter(Boolean).length;
  if (mots < MOTS_MIN || mots > MOTS_MAX) return { note: 0, raison: "" };
  if (!PERSONNE.test(phrase)) return { note: 0, raison: "" };
  if (contient(bas, PERISSABLES)) return { note: 0, raison: "" };
  if (CHIFFRE.test(phrase)) return { note: 0, raison: "" };

  const geste = contient(bas, GESTES);
  const origine = contient(bas, ORIGINES);
  const duree = contient(bas, DUREES);
  const familles = Number(geste) + Number(origine) + Number(duree);
  if (familles < 2) return { note: 0, raison: "" };

  // LA RAISON EST CELLE QU'ON LUI DIRA, donc elle est écrite pour lui et pas
  // pour le journal de bord.
  const raison = geste && origine
    ? "d’où ça vient et ce que vous en faites"
    : geste && duree
      ? "le temps que ça vous prend"
      : "d’où ça vient, et depuis quand";

  /* LA PLUS COURTE DES BONNES GAGNE. Une citation se lit d'un coup d'œil sous
     une photo ; à vingt-cinq mots on ne la lit plus, on la saute. */
  return { note: familles * 100 - mots, raison };
}

/**
 * REPÉRER LA PHRASE D'UNE PRISE DE PAROLE — ou ne rien proposer du tout.
 *
 * NE RIEN PROPOSER EST LE CAS NORMAL. Sur dix tours de parole avec
 * l'assistante, neuf disent « le plat du jour c'est les lasagnes » et n'ont
 * aucune raison d'être gardés. Une carte « on le garde ? » à chaque phrase
 * deviendrait un péage, et il apprendrait à appuyer sur « non » sans lire.
 */
export function repererLaPhrase(ecoute: {
  texte: string;
  audio?: string;
  secondes?: number;
}): Reperage | null {
  const brut = (ecoute.texte || "").trim();
  if (!brut) return null;

  let meilleure = "";
  let meilleureNote = 0;
  let raison = "";
  for (const p of phrases(brut)) {
    const { note, raison: r } = noter(p);
    if (note > meilleureNote) {
      meilleureNote = note;
      meilleure = p;
      raison = r;
    }
  }
  if (!meilleure) return null;

  const secondes = ecoute.secondes ?? 0;
  /* L'ENREGISTREMENT NE COLLE QUE S'IL NE CONTIENT QUE ÇA. Prise de parole
     entière assez courte, et la phrase en occupe l'essentiel. */
  const entiere = meilleure.length >= brut.length * 0.8;
  const colle =
    !!ecoute.audio && secondes >= SECONDES_MIN && secondes <= SECONDES_MAX && entiere;

  return {
    texte: meilleure,
    raison,
    colle,
    audio: colle ? ecoute.audio : undefined,
    secondes: colle ? secondes : 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEUXIÈME PARTIE — GARDER
   ═══════════════════════════════════════════════════════════════════════════ */

export type PhraseGardee = {
  /** Le commerce à qui elle appartient. */
  carte: string;
  /** La phrase, mot pour mot. */
  texte: string;
  /**
   * SA VOIX, EN DATA-URL. Absente quand il a dit oui à la phrase sans redire
   * l'enregistrement : on garde alors le texte, et l'écran affiche la citation
   * sans bouton ▶. Voir `colle` dans `Reperage`.
   */
  audio?: string;
  secondes: number;
  /** Qui parle : « Margot », « Serge, boucher ». Ce qu'on écrira sous la citation. */
  qui?: string;
  quand: number;
};

const CLE = "clikme-sa-voix-v1";
const abonnes = new Set<() => void>();
let cache: PhraseGardee[] | null = null;

export const AUCUNE_PHRASE: PhraseGardee[] = [];

/**
 * ═══ LE BUDGET, PARCE QUE LE STOCKAGE LOCAL N'EST PAS ÉLASTIQUE ═══════════
 *
 * Huit secondes d'opus pèsent une vingtaine de kilo-octets, et le même dossier
 * a déjà dû apprendre qu'« une photo d'iPhone pèse trois à cinq mégaoctets et
 * le stockage local en tient très peu » (voir l'assistante). Une voix est mille
 * fois plus légère qu'une photo, mais un commerçant qui parle tous les matins
 * pendant six mois, ça finit par compter.
 *
 * UNE PAR COMMERCE, ET LA PLUS RÉCENTE GAGNE. Ce n'est pas une archive : c'est
 * ce qu'on entend sur SON parcours, aujourd'hui. Douze commerces et six cent
 * mille octets sont larges pour un téléphone de commerçant, qui n'en a qu'un.
 */
const MAX_PHRASES = 12;
const BUDGET_OCTETS = 600_000;

export function chargerPhrasesGardees(): PhraseGardee[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNE_PHRASE;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    cache = Array.isArray(l) && l.length ? (l as PhraseGardee[]) : AUCUNE_PHRASE;
  } catch {
    cache = AUCUNE_PHRASE;
  }
  return cache;
}

/** Le même tableau à chaque appel : c'est ce que demande le rendu serveur. */
export function phrasesGardeesVides(): PhraseGardee[] {
  return AUCUNE_PHRASE;
}

export function abonnerPhrasesGardees(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

const poids = (p: PhraseGardee) => (p.audio?.length ?? 0) + p.texte.length;

/**
 * ON RENTRE DANS LE BUDGET EN PERDANT DES VOIX, PAS DES PHRASES.
 *
 * LE TEXTE EST CE QUI COMPTE LE PLUS, et de loin : la transcription s'affiche
 * tout de suite, le son est coupé par défaut, et quatre personnes sur cinq
 * liront sans jamais appuyer sur ▶. Quand la place manque, on retire donc les
 * ENREGISTREMENTS des plus anciennes avant de retirer quoi que ce soit — la
 * citation reste, elle perd seulement son bouton.
 */
function tenirDansLeBudget(l: PhraseGardee[]): PhraseGardee[] {
  const sortis = l.slice(0, MAX_PHRASES);
  let total = sortis.reduce((s, p) => s + poids(p), 0);
  for (let i = sortis.length - 1; i >= 0 && total > BUDGET_OCTETS; i--) {
    if (!sortis[i].audio) continue;
    total -= sortis[i].audio?.length ?? 0;
    sortis[i] = { ...sortis[i], audio: undefined, secondes: 0 };
  }
  return sortis;
}

function ecrire(l: PhraseGardee[]) {
  const tenable = tenirDansLeBudget(l);
  cache = tenable.length ? tenable : AUCUNE_PHRASE;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(tenable));
  } catch {
    /* ═══ LE QUOTA A SAUTÉ QUAND MÊME ═══
       Le budget est une prévision, pas une garantie : le reste du produit
       occupe la même réserve et on ne sait pas ce qu'il y a mis. On retente
       sans les voix plutôt que de perdre les phrases — et si ça refuse encore,
       la session continue en mémoire, comme partout ailleurs ici. */
    try {
      const sansVoix = tenable.map((p) => ({ ...p, audio: undefined, secondes: 0 }));
      window.localStorage.setItem(CLE, JSON.stringify(sansVoix));
      cache = sansVoix.length ? sansVoix : AUCUNE_PHRASE;
    } catch {
      /* Stockage refusé : la session continue en mémoire. */
    }
  }
  abonnes.forEach((f) => f());
}

/**
 * IL A DIT OUI. La phrase remplace celle de ce commerce, elle ne s'y ajoute pas.
 *
 * UN PARCOURS N'A QU'UN ÉCRAN 3. Deux citations pour le même restaurant
 * obligeraient à en choisir une — donc à inventer un critère, donc à ranger sa
 * parole par ordre de qualité présumée. La dernière qu'il a validée est celle
 * qu'il veut : c'est la seule réponse qui ne demande rien à personne.
 */
export function garderLaPhrase(p: Omit<PhraseGardee, "quand">) {
  const l = chargerPhrasesGardees();
  ecrire([{ ...p, quand: Date.now() }, ...l.filter((x) => x.carte !== p.carte)]);
}

/** Il a changé d'avis. On ne garde pas de trace d'une voix qu'on nous retire. */
export function oublierLaPhrase(carte: string) {
  const l = chargerPhrasesGardees();
  const restantes = l.filter((x) => x.carte !== carte);
  if (restantes.length !== l.length) ecrire(restantes);
}

export function phraseDeLaCarte(
  carte: string,
  gardees: PhraseGardee[],
): PhraseGardee | undefined {
  return gardees.find((x) => x.carte === carte);
}

/**
 * COMBIEN DE TEMPS ÇA PREND À LIRE, écrit comme on le dit.
 *
 * Le bouton ▶ porte la durée pour que personne n'appuie à l'aveugle : « 8 s »
 * se décide, « écouter » se subit.
 */
export function dureeEnMots(secondes: number): string {
  const s = Math.round(secondes);
  if (s <= 0) return "";
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
}
