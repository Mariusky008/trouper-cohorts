/**
 * ⚔️ LE DUEL D'UN SALON — « le lieu où le peut-être devient oui ».
 *
 * « Le salon ClikMe ne doit surtout pas être un simple chat où des amis
 * discutent d'un vêtement. WhatsApp sait déjà faire ça. Le salon doit être le
 * lieu où une hésitation se transforme en décision, puis en action. »
 *
 *   JE VOIS → J'HÉSITE → CLIKME M'AIDE À TRANCHER → JE DIS OUI → J'AGIS
 *
 * UN DUEL, C'EST A CONTRE B, ET RIEN DE PLUS. A est ce dont on parle (ou le
 * champion du duel d'avant) ; B est UN challenger choisi dans ce que le
 * commerce propose vraiment. Pas trois, pas cinq : « 1 duel = 1 challenger »,
 * et donc au plus une génération d'image par geste.
 *
 * ═══ QUI DÉCIDE ═══════════════════════════════════════════════════════════
 *
 * CELUI QUI A LANCÉ LE DUEL. Les autres votent, et leur vote compte — il se
 * voit, il se compte, il fait réagir le Fantôme — mais « le groupe conseille,
 * il ne décide jamais à la place de l'utilisateur ». Quand ses amis préfèrent
 * B et lui A, l'écran ne déclare pas B gagnant : il dit les deux, et c'est lui
 * qui garde A ou revoit B.
 *
 * ═══ CE QUI EST VRAI, ET SEULEMENT ÇA ═════════════════════════════════════
 *
 * Le verdict ne dit que des faits : son choix, celui du salon, le nombre de
 * voix, le gagnant. Aucun « plus lumineux », aucun « mieux pour votre
 * morphologie » — personne n'a analysé ça. Et « mis de côté » ne s'affiche que
 * si LE COMMERÇANT l'a dit (voir `reponse`).
 *
 * FICHIER PUR : lu par le téléphone, par le serveur (gestes rejoués) et par
 * les gardes. Ni fenêtre, ni stockage.
 */

export type Cote = "a" | "b";

/** Une des deux choses du duel. */
export type ObjetDuel = {
  id: string;
  nom: string;
  prix?: string;
  /** Sa vraie photo — celle du commerce. */
  photo?: string;
  /** La même, portée par la personne qui hésite, quand l'essayage a pu se faire. */
  essai?: string;
  /** Pour une sortie : quand elle a lieu, tel qu'elle l'annonce (« Ce soir, 19 h »). */
  quand?: string;
};

export type Duel = {
  id: string;
  /** Le rang du duel dans ce salon : 1, puis 2 après « Trouve-moi mieux »… */
  n: number;
  /** Qui l'a lancé, tel qu'il s'affiche. C'est lui qui décide. */
  par: string;
  /** La clé de son vote (voir `MOI` et `cleVotant`). */
  cleProprio: string;
  a: ObjetDuel;
  b: ObjetDuel;
  /** Le commerce dont viennent A et B. */
  commerce?: string;
  /** Le geste qui suit, dans les mots du métier : « Mettre de côté », « Réserver »… */
  action?: string;
  /** Une voix par personne, la dernière compte. */
  votes: Record<string, Cote>;
  /** Le nom affiché de chaque votant, pour son fantôme. */
  votants: Record<string, string>;
  /** Ce que le propriétaire garde, une fois le verdict vu. */
  fin?: Cote;
  /**
   * LA DEMANDE AU COMMERCE. `prete` : WhatsApp s'est ouvert avec le message
   * écrit — rien n'est encore parti. `envoyee` : il nous a dit l'avoir envoyé.
   * Jamais plus que ce qu'il a fait (voir `prevenir.ts`).
   */
  demande?: "prete" | "envoyee";
  /** LA RÉPONSE DU COMMERÇANT LUI-MÊME — et rien d'autre ne la pose. */
  reponse?: "confirme" | "refuse";
  /** L'essayage du challenger n'a pas pu se faire : on tranche sur les vraies photos. */
  essaiRate?: boolean;
  quand: string;
};

/** La clé de mon vote, sur ce téléphone. */
export const MOI = "moi";

export const autre = (c: Cote): Cote => (c === "a" ? "b" : "a");
export const lettre = (c: Cote) => (c === "a" ? "A" : "B");
export const objetDe = (d: Duel, c: Cote) => (c === "a" ? d.a : d.b);

/** Ce que le propriétaire a voté. */
export const voteProprio = (d: Duel): Cote | undefined => d.votes[d.cleProprio];

/** Les voix, celles de tout le salon et celles des autres seulement. */
export function compte(d: Duel) {
  let a = 0;
  let b = 0;
  let autresA = 0;
  let autresB = 0;
  for (const [cle, c] of Object.entries(d.votes)) {
    if (c === "a") a++;
    else b++;
    if (cle === d.cleProprio) continue;
    if (c === "a") autresA++;
    else autresB++;
  }
  return { a, b, autresA, autresB, autres: autresA + autresB, total: a + b };
}

/**
 * ═══ LE VERDICT, DIT COMME IL EST ══════════════════════════════════════════
 *
 *   · `seul`      — personne d'autre n'a voté : « Vous préférez B. »
 *   · `accord`    — le salon va dans son sens (ou ne tranche pas) : « B gagne 3–1. »
 *   · `desaccord` — ses amis préfèrent l'autre : on dit les deux, il choisit.
 *   · `egalite`   — autant de voix de chaque côté, la sienne comprise.
 *
 * Rien tant que le propriétaire n'a pas voté : c'est son hésitation.
 */
export type Verdict =
  | { genre: "seul"; gagnant: Cote; score: [number, number] }
  | { genre: "accord"; gagnant: Cote; score: [number, number] }
  | { genre: "desaccord"; proprio: Cote; groupe: Cote; score: [number, number] }
  | { genre: "egalite"; proprio: Cote; score: [number, number] };

export function verdict(d: Duel): Verdict | null {
  const p = voteProprio(d);
  if (!p) return null;
  const k = compte(d);
  const score: [number, number] = [k.a, k.b];
  if (k.autres === 0) return { genre: "seul", gagnant: p, score };
  if (k.a === k.b) return { genre: "egalite", proprio: p, score };
  if (k.autresA !== k.autresB) {
    const groupe: Cote = k.autresA > k.autresB ? "a" : "b";
    if (groupe !== p) return { genre: "desaccord", proprio: p, groupe, score };
  }
  return { genre: "accord", gagnant: p, score };
}

/** Le gagnant tel qu'il est retenu : ce qu'il a gardé, sinon ce que dit le verdict. */
export function gagnantDe(d: Duel): Cote | undefined {
  if (d.fin) return d.fin;
  const v = verdict(d);
  return v && (v.genre === "seul" || v.genre === "accord") ? v.gagnant : undefined;
}

/** « 3–1 », le gagnant d'abord. */
export function scoreLisible(d: Duel, gagnant: Cote): string {
  const k = compte(d);
  return gagnant === "a" ? `${k.a}–${k.b}` : `${k.b}–${k.a}`;
}

/** Qui mène, quand quelqu'un mène. */
export function enTeteDuDuel(d: Duel): Cote | undefined {
  const k = compte(d);
  return k.a === k.b ? undefined : k.a > k.b ? "a" : "b";
}

/** Le duel qui se joue maintenant : le dernier lancé. */
export const duelCourant = (duels: Duel[] | undefined): Duel | undefined => (duels?.length ? duels[duels.length - 1] : undefined);

// ─── LE CHALLENGER ─────────────────────────────────────────────────────────

/** Ce que le commerce a de vrai à proposer : une photo, un nom, un prix. */
export type Candidat = {
  id: string;
  nom: string;
  prix?: string;
  photo: string;
  /** Pour l'essayage : la photo de référence et ce que la pièce couvre. */
  reference?: string;
  couvre?: string;
  decrire?: string;
  decrireEn?: string;
  /** Une coupe de femme, une coupe d'homme — quand la photo le dit (voir `Piece.pour`). */
  pour?: "femme" | "homme";
  /** Une sortie : quand elle a lieu, et si c'est la fête ou un moment tranquille. */
  quand?: string;
  nature?: string;
};

/**
 * DES MOTS ENTIERS, ACCENTS COMPRIS. `\b` ne connaît que les lettres sans
 * accent : « carré » suivi d'une espace n'était pas un mot pour lui, et
 * « Carrée écaille » (une monture) en devenait un — une coupe. Le début du mot
 * se lit sans « regard en arrière » : les Safari d'avant 16.4 le refusent, et
 * tout le module tomberait avec.
 */
const mots = (alternatives: string) => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "iu");

/** La famille d'une chose, d'après son nom : une veste ne se compare pas à un jean. */
const FAMILLES: [string, RegExp][] = [
  ["dessus", mots("veste|surchemise|blouson|manteau|doudoune|parka|trench|caban|perfecto|bomber|kimono")],
  ["haut", mots("chemise|chemisier|blouse|polo|t-shirt|tee-shirt|top|marini[eè]re|d[ée]bardeur|body")],
  ["maille", mots("pull|gilet|cardigan|sweat|maille|col roul[ée]")],
  ["robe", mots("robe|combinaison")],
  ["bas", mots("jean|pantalon|chino|jupe|short|legging")],
  ["tenue", mots("costume|tailleur|ensemble")],
  ["accessoire", mots("[ée]charpe|sac|ceinture|bonnet|chapeau|foulard|bijou|collier|bracelet|boucles d['’]oreilles?")],
  ["lunettes", mots("lunettes?|monture|solaire")],
  ["coupe", mots("coupe|carr[ée]|frange|d[ée]grad[ée]|brushing|balayage|m[eè]ches|chignon|tresses?|boucles")],
  ["ongles", mots("pose|vernis|manucure|nail|ongles?|semi(-permanent)?")],
  ["fleurs", mots("bouquet|fleurs?|composition|plante")],
];

/**
 * À TABLE, TOUT EST UN PLAT : ce qui compte, c'est le moment du repas. Un
 * axoa se compare à un poulet basquaise, pas à un gâteau basque ni au pichet.
 */
const MOMENTS_DU_REPAS: [string, RegExp][] = [
  ["dessert", mots("g[âa]teau|tarte|dessert|riz au lait|caf[ée] gourmand|mousse|cr[eè]me|glace|fondant|pastis landais|cannel[ée]s?|flan")],
  ["boisson", mots("vins?|pichet|cocktails?|bi[eè]res?|verre|blanc|rouge|ros[ée]|jus|caf[ée]|th[ée]|sirop|limonade")],
  ["entree", mots("entr[ée]e|soupe|velout[ée]|garbure|[œo]euf|terrine|tapas|planche")],
  ["formule", mots("menu|formule|plateau|repas")],
];

/**
 * LA FAMILLE, DANS LES MOTS DU MÉTIER QUAND ON LE CONNAÎT. Chez un coiffeur,
 * « Boucles courtes » est une coupe, pas une paire de boucles d'oreilles ;
 * chez un lunetier, « Carrée écaille » est une monture.
 */
export function familleDe(nom: string, metier?: string): string {
  switch (metier) {
    case "coiffure":
      return "coupe";
    case "ongles":
      return "ongles";
    case "lunettes":
      return "lunettes";
    case "fleurs":
      return "fleurs";
    case "sortie":
      return "sortie";
    case "table":
    case "bar":
      return MOMENTS_DU_REPAS.find(([, re]) => re.test(nom))?.[0] ?? "plat";
  }
  return FAMILLES.find(([, re]) => re.test(nom))?.[0] ?? "autre";
}

/**
 * UNE PRESTATION N'EST PAS UN STYLE. « Coupe femme », « Coupe + barbe » sont
 * des lignes de tarif : leur photo illustre le salon, pas une coupe qu'on
 * pourrait choisir. On ne les oppose à rien.
 */
const PRESTATION = /^(coupe( (femme|homme|enfant|mixte))?|coupe (et|\+) (brushing|barbe)|brushing|shampo\S*( .*)?|soin( .*)?|remplissage|beaut[ée] des (pieds|mains)|r[ée]paration( .*)?)$/i;
export const estUnePrestation = (nom: string) => PRESTATION.test(nom.trim());

/** La teinte, quand le nom la dit. Sert à proposer une vraie alternative, pas un doublon. */
/** Accordés : « noire », « vertes », « blanche » sont les mêmes teintes. */
const TEINTES: [string, RegExp][] = [
  ["vert", mots("kaki|verte?s?|olive|sapin|for[eê]t")],
  ["clair", mots("beiges?|sable|[ée]crue?s?|cr[eè]me|camel|blanc(he)?s?|ivoire|naturel(le)?s?")],
  ["sombre", mots("noire?s?|marine|anthracite|gris(es?)? fonc[ée]e?s?|brute?s?")],
  ["bleu", mots("bleue?s?|ciel|denim|jean")],
  ["chaud", mots("brique|rouges?|bordeaux|rouille|orange|corail|terracotta|cuivr[ée]e?s?|roux|rousses?")],
  ["rose", mots("roses?|orchid[ée]e|fuchsia|lilas|violette?s?")],
  ["brun", mots("marron|chocolat|cognac|caramel|tabac|[ée]caille")],
];
export function teinteDe(nom: string): string | undefined {
  return TEINTES.find(([, re]) => re.test(nom))?.[0];
}

/** « 69 € », « à partir de 35 € » → 69, 35. */
export function prixEnNombre(prix?: string): number | undefined {
  const m = (prix ?? "").replace(/\s/g, "").match(/(\d+(?:[,.]\d+)?)/);
  if (!m) return undefined;
  const v = Number(m[1].replace(",", "."));
  return Number.isFinite(v) ? v : undefined;
}

/** « Ce soir, 19 h » → « ce soir » : le jour d'une sortie, sans l'heure. */
const jourDe = (quand?: string) => (quand ?? "").split(",")[0].trim().toLowerCase() || undefined;

/**
 * ═══ CE QUE SES DUELS PASSÉS DISENT DE LUI ═════════════════════════════════
 *
 * « Ne jamais inventer une préférence non observée. » Une issue par duel
 * tranché, gardée sur SON téléphone (voir `duel-salon.tsx`), et une
 * préférence n'existe qu'à partir de trois duels qui vont dans le même sens,
 * six fois sur dix au moins. Un seul vote ne dit rien.
 */
export type FicheIssue = { nom: string; famille: string; teinte?: string; prix?: number };
export type Issue = { gagnant: FicheIssue; perdant: FicheIssue; t: number };

export type Preferences = {
  teinte?: string;
  /** Il garde l'option la moins chère des deux… ou la plus chère. */
  prix?: "moins" | "plus";
  /** Combien de duels le disent, et sur combien : la phrase les cite. */
  preuves?: { teinte?: [number, number]; prix?: [number, number] };
};

const assez = (n: number, sur: number) => n >= 3 && sur > 0 && n / sur >= 0.6;

export function preferencesDe(h: Issue[]): Preferences {
  const p: Preferences = {};
  const preuves: NonNullable<Preferences["preuves"]> = {};
  const gagnes = new Map<string, number>();
  for (const x of h) if (x.gagnant.teinte) gagnes.set(x.gagnant.teinte, (gagnes.get(x.gagnant.teinte) ?? 0) + 1);
  for (const [t, n] of gagnes)
    if (assez(n, h.length)) {
      p.teinte = t;
      preuves.teinte = [n, h.length];
      break;
    }
  const comparables = h.filter((x) => x.gagnant.prix != null && x.perdant.prix != null && x.gagnant.prix !== x.perdant.prix);
  const moins = comparables.filter((x) => (x.gagnant.prix as number) < (x.perdant.prix as number)).length;
  const plus = comparables.length - moins;
  if (assez(moins, comparables.length)) {
    p.prix = "moins";
    preuves.prix = [moins, comparables.length];
  } else if (assez(plus, comparables.length)) {
    p.prix = "plus";
    preuves.prix = [plus, comparables.length];
  }
  if (preuves.teinte || preuves.prix) p.preuves = preuves;
  return p;
}

const TEINTES_DITES: Record<string, string> = {
  vert: "le vert",
  clair: "les tons clairs",
  sombre: "les tons foncés",
  bleu: "le bleu",
  chaud: "les tons chauds",
  rose: "le rose",
  brun: "les tons bruns",
};

/**
 * POURQUOI CE CHALLENGER, QUAND SES DUELS PASSÉS Y SONT POUR QUELQUE CHOSE —
 * dit avec les chiffres, et seulement si le challenger a vraiment ce trait.
 * Sinon rien : le Fantôme ne prétend pas le connaître.
 */
export function raisonDuChallenger(a: Pick<ObjetDuel, "prix">, b: Pick<ObjetDuel, "nom" | "prix">, prefs: Preferences): string | null {
  const t = prefs.teinte;
  if (t && prefs.preuves?.teinte && teinteDe(b.nom) === t) {
    const [n, sur] = prefs.preuves.teinte;
    return `Vous gardez souvent ${TEINTES_DITES[t] ?? t} (${n} duels sur ${sur}) : ce challenger aussi.`;
  }
  const pa = prixEnNombre(a.prix);
  const pb = prixEnNombre(b.prix);
  if (prefs.prix && prefs.preuves?.prix && pa && pb && (prefs.prix === "moins" ? pb < pa : pb > pa)) {
    const [n, sur] = prefs.preuves.prix;
    return `Vous gardez souvent l’option la ${prefs.prix === "moins" ? "moins chère" : "plus chère"} (${n} duels sur ${sur}) : ce challenger l’est.`;
  }
  return null;
}

/**
 * ═══ CHOISIR UN CHALLENGER — UNE OPÉRATION LÉGÈRE, SANS IA ═════════════════
 *
 * « Sélectionner plusieurs candidats potentiels avec une opération légère ;
 * les classer ; générer uniquement le challenger choisi. »
 *
 * LE CLASSEMENT EST SIMPLE ET SE LIT : même famille d'abord (une veste contre
 * une veste, un plat contre un plat, une sortie de ce soir contre une autre de
 * ce soir), même partie du corps, un prix voisin, et une teinte différente —
 * le challenger doit être une vraie alternative, pas le même article dans la
 * même couleur. Ce qui a déjà été mis en duel dans ce salon ne revient pas,
 * une prestation (« Coupe femme ») n'est pas un style, et une coupe d'homme
 * n'est pas opposée à une coupe de femme. Ses préférences n'ajoutent qu'un
 * demi-point, et seulement quand elles sont observées plusieurs fois : on ne
 * surinterprète pas un vote.
 *
 * `metier` : la famille du commerce (`familleDuDouble`), ou « sortie ».
 */
export function choisirChallenger(
  a: Pick<ObjetDuel, "id" | "nom" | "prix" | "photo" | "quand">,
  pool: Candidat[],
  deja: Set<string>,
  prefs: Preferences = {},
  metier?: string,
): Candidat | null {
  const famA = familleDe(a.nom, metier);
  const teinteA = teinteDe(a.nom);
  const prixA = prixEnNombre(a.prix);
  const chezLui = pool.find((p) => p.id === a.id);
  const couvreA = chezLui?.couvre;
  const pourA = chezLui?.pour;
  const jourA = jourDe(a.quand ?? chezLui?.quand);
  let meilleur: Candidat | null = null;
  let note = -Infinity;
  for (const p of pool) {
    if (!p.photo || p.id === a.id || deja.has(p.id) || (a.photo && p.photo === a.photo) || p.nom === a.nom) continue;
    if (estUnePrestation(p.nom)) continue;
    if (pourA && p.pour && p.pour !== pourA) continue;
    let n = 0;
    const fam = familleDe(p.nom, metier);
    if (fam === famA && fam !== "autre") n += 3;
    else if (famA === "autre" || fam === "autre") n += 0.5;
    if (couvreA && p.couvre === couvreA) n += 1;
    const prixP = prixEnNombre(p.prix);
    if (prixA && prixP) {
      const ecart = Math.abs(prixP - prixA) / prixA;
      n += ecart <= 0.4 ? 1 : ecart <= 0.8 ? 0.5 : 0;
    }
    if (jourA && jourDe(p.quand) === jourA) n += 1;
    if (chezLui?.nature && p.nature === chezLui.nature) n += 0.5;
    const t = teinteDe(p.nom);
    if (t && teinteA && t !== teinteA) n += 0.5;
    if (prefs.teinte && t === prefs.teinte) n += 0.5;
    if (prefs.prix && prixA && prixP && (prefs.prix === "moins" ? prixP < prixA : prixP > prixA)) n += 0.5;
    if (n > note) {
      note = n;
      meilleur = p;
    }
  }
  return meilleur;
}

/** La chose dont parle le salon, retrouvée parmi ce que vend le commerce. */
export function retrouverDansLePool(pool: Candidat[], o: { nom?: string; photo?: string }): Candidat | undefined {
  const nom = (o.nom ?? "").toLowerCase();
  return (
    pool.find((p) => o.photo && (p.photo === o.photo || p.reference === o.photo)) ??
    (nom ? pool.find((p) => p.nom.toLowerCase() === nom || nom.includes(p.nom.toLowerCase())) : undefined)
  );
}

/** Un candidat devenu l'un des deux côtés du duel : ce que le salon garde de lui. */
export const enObjet = (c: Candidat): ObjetDuel => ({
  id: c.id,
  nom: c.nom,
  ...(c.prix ? { prix: c.prix } : {}),
  photo: c.photo,
  ...(c.quand ? { quand: c.quand } : {}),
});

// ─── LES MOTS ──────────────────────────────────────────────────────────────

/** « une adversaire », « un adversaire » : l'article suit la chose, pas le mot. */
const FEMININS =
  /^(la |l'|une )?(veste|surchemise|chemise|chemisier|blouse|robe|jupe|doudoune|parka|marini[eè]re|combinaison|[ée]charpe|coupe|frange|couleur|pose|manucure|table|soir[ée]e|formule|tarte|salade|pizza|composition|plante|monture|paire|tenue|pi[eè]ce|bougie|terrasse|nocturne|garbure|lasagnes|tourte|part|boucles|carr[ée]e)\b/i;
export const estFeminin = (nom: string) => {
  const t = nom.trim();
  if (/^une\s/i.test(t)) return true;
  if (/^(un|le)\s/i.test(t)) return false;
  return FEMININS.test(t);
};

/**
 * ═══ LE GESTE QUI SUIT, DANS LES MOTS DE CHAQUE MÉTIER ════════════════════
 *
 * Le bouton dit `Duel.action` (« Mettre de côté », « Réserver »,
 * « Rendez-vous », « Commander », « J'y vais ») ; tout le reste en découle :
 * le message envoyé, ce que le commerçant peut répondre, ce que le salon
 * affiche ensuite. Un rendez-vous confirmé n'est pas une « mise de côté », et
 * un restaurant qui ne peut pas n'a pas « plus de stock » : il est complet.
 *
 * UNE SORTIE N'A PERSONNE À QUI DEMANDER. « J'y vais » est sa décision à lui,
 * dite au salon : c'est vrai dès qu'il l'a dit, et rien d'autre ne l'est.
 */
export type GenreAction = "cote" | "table" | "rdv" | "commande" | "sortie";

export function genreDAction(action?: string): GenreAction {
  const a = (action ?? "").toLowerCase();
  if (/j['’]y vais|on y va/.test(a)) return "sortie";
  if (/rendez-vous/.test(a)) return "rdv";
  if (/r[ée]serv/.test(a)) return "table";
  if (/command/.test(a)) return "commande";
  return "cote";
}

export type MotsAction = {
  /** Le bouton du résultat. */
  bouton: string;
  emoji: string;
  /** Ce que l'écran affiche quand le commerçant a dit oui… */
  confirme: string;
  /** …et quand il a dit non. */
  refuse: string;
  /** Le titre de la carte, une fois confirmé. */
  titreConfirme: string;
  /** La phrase, quand il a dit non : « {Le restaurant} est complet. » */
  refusDe: (chez: string) => string;
  /** Les deux boutons du commerçant. */
  oui: string;
  non: string;
  /** Sur sa page : « Marie aimerait … » — la suite de la phrase. */
  demande: string;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const MOTS_ACTION: Record<GenreAction, MotsAction> = {
  cote: {
    bouton: "Mettre de côté",
    emoji: "🛍️",
    confirme: "Mise de côté confirmée",
    refuse: "Plus disponible",
    titreConfirme: "C’est mis de côté !",
    refusDe: (chez) => `${cap(chez)} ne l’a plus.`,
    oui: "C’est mis de côté",
    non: "Plus disponible",
    demande: "que vous lui mettiez de côté",
  },
  table: {
    bouton: "Réserver",
    emoji: "📅",
    confirme: "Réservation confirmée",
    refuse: "Complet",
    titreConfirme: "C’est réservé !",
    refusDe: (chez) => `${cap(chez)} est complet.`,
    oui: "C’est réservé",
    non: "Complet",
    demande: "réserver une table chez vous",
  },
  rdv: {
    bouton: "Prendre rendez-vous",
    emoji: "📅",
    confirme: "Rendez-vous accepté",
    refuse: "Pas de créneau",
    titreConfirme: "C’est d’accord !",
    refusDe: (chez) => `${cap(chez)} n’a pas de créneau pour l’instant.`,
    oui: "C’est d’accord",
    non: "Pas de créneau",
    demande: "prendre rendez-vous",
  },
  commande: {
    bouton: "Commander",
    emoji: "🛍️",
    confirme: "Commande confirmée",
    refuse: "Pas possible",
    titreConfirme: "C’est commandé !",
    refusDe: (chez) => `${cap(chez)} ne peut pas le faire.`,
    oui: "C’est noté",
    non: "Pas possible",
    demande: "vous commander",
  },
  sortie: {
    bouton: "J’y vais",
    emoji: "🎟️",
    confirme: "Vous y allez",
    refuse: "",
    titreConfirme: "C’est décidé !",
    refusDe: () => "",
    oui: "",
    non: "",
    demande: "",
  },
};

export const motsDeLAction = (action?: string) => MOTS_ACTION[genreDAction(action)];

/**
 * LE MESSAGE AU COMMERCE, DANS LES MOTS DE SON MÉTIER.
 *
 * On DEMANDE, on ne déclare pas : « pourriez-vous me la mettre de côté ? » et
 * pas « je la prends ». Le commerçant reste libre, et sa réponse — par le
 * lien, quand il y en a un — est la seule chose qui fera dire « confirmé ».
 */
export function messageAuCommerce(o: {
  action?: string;
  objet: Pick<ObjetDuel, "nom" | "prix">;
  prenom?: string;
  /** Le lien où il répond d'un appui (vraie ville seulement). */
  lien?: string;
}): string {
  const quoi = `« ${o.objet.nom} »${o.objet.prix ? ` (${o.objet.prix})` : ""}`;
  const signature = o.prenom ? ` — ${o.prenom}` : "";
  let corps: string;
  switch (genreDAction(o.action)) {
    case "rdv":
      corps = `Bonjour, je voudrais prendre rendez-vous pour ${quoi}, mon choix sur ClikMe. Quand auriez-vous un créneau ?`;
      break;
    case "table":
      corps = `Bonjour, nous aimerions réserver une table : on a choisi ${quoi} sur ClikMe. Quand auriez-vous de la place ?`;
      break;
    case "commande":
      corps = `Bonjour, je voudrais commander ${quoi}, mon choix sur ClikMe. Quand pourrais-je passer le chercher ?`;
      break;
    default:
      corps = `Bonjour, pourriez-vous me mettre de côté ${quoi} ? C'est mon choix sur ClikMe, je passe très vite.`;
  }
  return `${corps}${signature}${o.lien ? `\n\nRépondre en un appui : ${o.lien}` : ""}`;
}

/** Ce que l'écran dit de la demande, et rien de plus que ce qui s'est passé. */
export function etatDeLaDemande(d: Duel): { mot: string; ton: "attente" | "envoyee" | "confirme" | "refuse" } | null {
  const m = motsDeLAction(d.action);
  if (genreDAction(d.action) === "sortie") return d.demande === "envoyee" ? { mot: m.confirme, ton: "confirme" } : null;
  if (d.reponse === "confirme") return { mot: m.confirme, ton: "confirme" };
  if (d.reponse === "refuse") return { mot: m.refuse, ton: "refuse" };
  if (d.demande === "envoyee") return { mot: "Demande envoyée", ton: "envoyee" };
  if (d.demande === "prete") return { mot: "Message prêt dans WhatsApp", ton: "attente" };
  return null;
}
