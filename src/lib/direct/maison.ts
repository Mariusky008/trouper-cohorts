// 🏠 MA MAISON — l'endroit où ClikMe apprend qui je suis, pour aller chercher
// dans ma ville ce qui pourrait me plaire.
//
// « Plus Ma Maison me ressemble, plus ClikMe sait ce que ma ville peut
// m'apporter. » Ce n'est ni un profil, ni une liste de favoris : sept pièces
// qui se remplissent pendant qu'on vit l'application, presque jamais par un
// formulaire.
//
// TROIS SORTES DE SAVOIR, JAMAIS MÉLANGÉES (le brief, §29) :
//   · CE QUE VOUS M'AVEZ DIT   — un choix fait exprès (« Je ne mange pas de porc ») ;
//   · CE QUE J'AI REMARQUÉ     — un geste (une veste mise de côté, un duel gagné) ;
//   · CE QUE JE CROIS          — une tendance tirée des gestes, jamais d'un seul :
//                                trois dans le même sens au moins, et six sur dix.
// Une déduction n'est pas une vérité : « Ce n'est pas moi » l'efface pour de bon.
//
// FICHIER PARTAGÉ : rien ici ne touche au navigateur ni au serveur. La copie du
// téléphone et la synchronisation vivent dans `maison-memoire.ts`.
import { familleDe, teinteDe, type Issue } from "@/lib/direct/duel";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import type { Preuve, Surprise } from "@/lib/direct/surprises";

// ─── LES SEPT PIÈCES ───────────────────────────────────────────────────────

export type ClePiece = "dressing" | "miroir" | "cuisine" | "sorties" | "interieur" | "librairie" | "bienetre";

export type ChoixPiece = { titre: string; options: { cle: string; mot: string }[] };

export type PieceMaison = {
  cle: ClePiece;
  nom: string;
  /** Ce qu'elle garde, en trois mots, sous le nom. */
  sous: string;
  icone: string;
  /** LA PHOTO DE LA PIÈCE — une vraie pièce de maison, le soir, dans la lumière ClikMe. */
  photo: string;
  /** Comment elle se remplit, sans formulaire — dit quand elle est vide. */
  remplit: string;
  /** Ce que ça débloque : la raison de la remplir, dite AVANT l'effort. */
  debloque: string;
  /**
   * PIÈCE ENCORE ENDORMIE : un petit geste, et ce qu'il débloque — « Gardez 3
   * pièces → je chercherai en ville ce qui va avec ». Jamais seulement éteinte.
   */
  reveil: { action: string; gain: string };
  /** PIÈCE QUI APPREND : ce qu'elle fait déjà pour vous, en quelques mots. */
  apport: string;
  /**
   * LA MISSION DU FANTÔME, en haut de la pièce — ce qu'il VA faire, pas ce
   * qu'il stocke : « Je pars voir ce qui va avec. » `vide` : quand la pièce ne
   * sait encore rien, le petit geste et ce qu'il déclenchera.
   */
  mission: { active: string; vide: string };
  /** Le seul choix qu'on y propose, quand il rend service tout de suite. */
  choix?: ChoixPiece;
  /** Ce qu'on pourra y déposer soi-même, aux étapes suivantes — dit honnêtement « bientôt ». */
  bientot?: string;
  /** Le métier du Direct qu'ouvre « Découvrir » depuis la pièce. */
  branche: string;
  /** SUR SA CARTE, À L'ENTRÉE : ce qu'elle fait pour vous, en une phrase (la maquette). */
  promesse: string;
  /** L'étiquette de couleur sous la phrase : « Mode », « Beauté », « Food »… */
  etiquette: string;
  /** Sa couleur : l'anneau de son pictogramme et son étiquette. */
  teinte: string;
};

export const PIECES: PieceMaison[] = [
  {
    cle: "dressing",
    nom: "Mon Dressing",
    sous: "Mes vêtements et mes looks",
    icone: "👔",
    photo: "/direct/maison/piece-dressing.webp",
    remplit: "Les vêtements que vous mettez de côté dans les boutiques arrivent ici. Bientôt, les vôtres en photo.",
    debloque: "Je vous dirai avec quoi porter les nouveautés des boutiques de la ville.",
    reveil: { action: "Gardez 3 vêtements qui vous plaisent", gain: "je chercherai ce qui va avec" },
    apport: "je cherche ce qui va avec",
    mission: { active: "Je pars voir ce qui va avec.", vide: "Gardez 3 vêtements qui vous plaisent : je partirai voir ce qui va avec." },
    bientot: "Bientôt : vos propres vêtements en photo, pour des looks avec ce que vous avez déjà.",
    branche: "mode",
    promesse: "Je cherche ce qui va avec vos vêtements.",
    etiquette: "Mode",
    teinte: "#E2B884",
  },
  {
    cle: "miroir",
    nom: "Mon Miroir",
    sous: "Coiffure, ongles, soins",
    icone: "✨",
    photo: "/direct/maison/piece-miroir.webp",
    remplit: "Les coupes et les poses que vous essayez ou départagez arrivent ici.",
    debloque: "Une nouvelle coupe qui ressemble à celles que vous aimez ? Je vous la montrerai sur vous.",
    reveil: { action: "Essayez une coupe", gain: "je vous montrerai les nouvelles sur vous" },
    apport: "je guette les coupes pour vous",
    mission: { active: "Je guette les nouvelles coupes qui vous ressemblent.", vide: "Essayez une coupe : je guetterai les nouvelles, pour vous les montrer sur vous." },
    bientot: "Bientôt : votre photo, gardée ici, pour ne plus la reprendre à chaque essai.",
    branche: "coiffeur",
    promesse: "Je garde les coupes et essais qui vous vont.",
    etiquette: "Beauté",
    teinte: "#FC86A8",
  },
  {
    cle: "cuisine",
    nom: "Ma Cuisine",
    sous: "Mes goûts et mes envies",
    icone: "🍝",
    photo: "/direct/maison/piece-cuisine.webp",
    remplit: "Rien à remplir : j'apprends des plats qui vous font envie.",
    debloque: "Chaque midi, les plats du jour qui vous ressemblent.",
    reveil: { action: "Dites-moi ce qui vous fait envie", gain: "je trouverai vos plats du jour" },
    apport: "je repère les plats du jour",
    mission: { active: "À midi, je regarderai les plats du jour.", vide: "Dites-moi ce qui vous fait envie : à midi, je regarderai les plats du jour." },
    choix: {
      titre: "Je ne mange pas de…",
      options: [
        { cle: "viande", mot: "Viande" },
        { cle: "porc", mot: "Porc" },
        { cle: "poisson", mot: "Poisson" },
        { cle: "gluten", mot: "Gluten" },
        { cle: "lactose", mot: "Lactose" },
        { cle: "fruits-a-coque", mot: "Fruits à coque" },
      ],
    },
    branche: "restaurant",
    promesse: "Je repère les plats et envies faits pour vous.",
    etiquette: "Food",
    teinte: "#FC9023",
  },
  {
    cle: "sorties",
    nom: "Mes Sorties",
    sous: "Bars, soirées, activités",
    icone: "🍸",
    photo: "/direct/maison/piece-sorties.webp",
    remplit: "Les soirées que vous choisissez m'apprennent ce qui vous fait sortir.",
    debloque: "Le soir venu, les idées qui devraient vous ressembler.",
    reveil: { action: "Choisissez une soirée", gain: "je vous dirai quoi faire ce soir" },
    apport: "je prépare vos soirées",
    mission: { active: "Ce soir, je regarderai ce qui se passe en ville.", vide: "Choisissez une soirée : ce soir, je regarderai ce qui se passe en ville." },
    choix: {
      titre: "Ce qui me fait sortir",
      options: [
        { cle: "terrasse", mot: "Terrasse" },
        { cle: "musique", mot: "Musique live" },
        { cle: "verre", mot: "Un verre au calme" },
        { cle: "fete", mot: "Faire la fête" },
        { cle: "decouvrir", mot: "Découvrir" },
        { cle: "amis", mot: "Entre amis" },
      ],
    },
    branche: "bar",
    promesse: "Je trouve quoi faire ce soir selon vos envies.",
    etiquette: "Sorties",
    teinte: "#C685FC",
  },
  {
    cle: "interieur",
    nom: "Mon Intérieur",
    sous: "Ma déco, mon chez-moi",
    icone: "🛋️",
    photo: "/direct/maison/piece-interieur.webp",
    remplit: "Les fleurs, les objets et les créateurs qui vous plaisent arrivent ici. Bientôt, une photo de votre salon.",
    debloque: "Je vous montrerai ce qui irait chez vous.",
    reveil: { action: "Gardez un bouquet ou un objet", gain: "je trouverai ce qui ira chez vous" },
    apport: "je repère ce qui irait chez vous",
    mission: { active: "Je pars chercher ce qui irait chez vous.", vide: "Gardez un bouquet ou un objet : je partirai chercher ce qui irait chez vous." },
    bientot: "Bientôt : une photo de votre salon, pour voir les nouveautés chez vous.",
    choix: {
      titre: "Chez moi, c'est plutôt…",
      options: [
        { cle: "bois", mot: "Bois et naturel" },
        { cle: "minimaliste", mot: "Épuré" },
        { cle: "boheme", mot: "Bohème" },
        { cle: "colore", mot: "Coloré" },
        { cle: "industriel", mot: "Industriel" },
      ],
    },
    branche: "fleuriste",
    promesse: "Je repère ce qui irait bien chez vous.",
    etiquette: "Déco",
    teinte: "#CDEA8C",
  },
  {
    cle: "librairie",
    nom: "Ma Librairie",
    sous: "Mes livres et mes envies de lecture",
    icone: "📚",
    photo: "/direct/maison/piece-librairie.webp",
    remplit: "Les livres et les librairies que vous gardez arrivent ici.",
    debloque: "Les nouveautés du libraire qui ressemblent à ce que vous aimez.",
    reveil: { action: "Dites-moi ce que vous lisez", gain: "je guetterai les nouveautés" },
    apport: "je guette les nouveautés",
    mission: { active: "Je guette les nouveautés du libraire pour vous.", vide: "Dites-moi ce que vous aimez lire, je vais guetter les nouveautés." },
    choix: {
      titre: "Ce que j'aime lire",
      options: [
        { cle: "romans", mot: "Romans" },
        { cle: "polars", mot: "Polars" },
        { cle: "bd", mot: "BD" },
        { cle: "essais", mot: "Essais" },
        { cle: "jeunesse", mot: "Jeunesse" },
        { cle: "cuisine", mot: "Cuisine" },
      ],
    },
    branche: "librairie",
    promesse: "Je vous montre les livres et nouveautés qui vous ressemblent.",
    etiquette: "Livres",
    teinte: "#FDBD57",
  },
  {
    cle: "bienetre",
    nom: "Mon Bien\u2011être",
    sous: "Sport, yoga, détente",
    icone: "🧘",
    photo: "/direct/maison/piece-bienetre.webp",
    remplit: "Les séances que vous réservez et les lieux que vous gardez arrivent ici.",
    debloque: "Un créneau libre près de chez vous, quand il vous ressemble.",
    reveil: { action: "Dites-moi ce que vous cherchez", gain: "je trouverai le bon créneau" },
    apport: "je repère les bons créneaux",
    mission: { active: "Je guette un créneau libre près de chez vous.", vide: "Dites-moi ce que vous cherchez : je guetterai un créneau près de chez vous." },
    choix: {
      titre: "Ce que je cherche",
      options: [
        { cle: "dormir", mot: "Mieux dormir" },
        { cle: "bouger", mot: "Bouger" },
        { cle: "souffler", mot: "Souffler" },
        { cle: "forme", mot: "Me remettre en forme" },
        { cle: "soin", mot: "Prendre soin de moi" },
      ],
    },
    branche: "artisan",
    promesse: "Je trouve les idées qui vous font du bien.",
    etiquette: "Bien-être",
    teinte: "#6FE9D0",
  },
];

export const pieceParCle = (cle: ClePiece): PieceMaison => PIECES.find((p) => p.cle === cle) ?? PIECES[0];

/** LA PIÈCE D'UN COMMERCE, d'après sa famille. Le tatoueur va au miroir. */
export function pieceDeLaFamille(f: FamilleDouble | string | undefined): ClePiece | undefined {
  switch (f) {
    case "mode":
    case "lunettes":
      return "dressing";
    case "coiffure":
    case "ongles":
    case "seance":
      return "miroir";
    case "table":
      return "cuisine";
    case "bar":
      return "sorties";
    case "fleurs":
    case "createur":
      return "interieur";
    case "librairie":
      return "librairie";
  }
  return undefined;
}

// ─── LA MÉMOIRE ────────────────────────────────────────────────────────────

/**
 * UN GESTE REMARQUÉ. `traits` dit ce qu'il révèle (« teinte:vert »,
 * « cuisine:italien ») ; `sens` s'il va pour (+1) ou contre (-1). L'identifiant
 * est STABLE (tiré de ce qui l'a produit) : le même geste revu deux fois reste
 * un seul signal, et la copie du serveur se fusionne sans doublon.
 */
export type Signal = {
  id: string;
  piece: ClePiece;
  /** Ce qu'on montre : « Veste cirée kaki ». */
  quoi: string;
  /** D'où il vient, dit simplement : « Mise de côté chez Un prêt-à-porter homme ». */
  d: string;
  sens: 1 | -1;
  traits: string[];
  image?: string;
  t: number;
};

/** Un choix daté : le plus récent l'emporte entre le téléphone et le serveur. */
export type Date_<T> = { v: T; t: number };

export type Memoire = {
  v: 1;
  /** CE QUE VOUS M'AVEZ DIT — les choix de chaque pièce. */
  choix: Partial<Record<ClePiece, Date_<string[]>>>;
  /** « Ce n'est pas moi » : ces traits ne seront plus jamais déduits, pour cette pièce. */
  refus: Partial<Record<ClePiece, Date_<string[]>>>;
  /** Une pièce en pause n'apprend plus rien et ne propose plus rien. */
  pauses: Partial<Record<ClePiece, Date_<boolean>>>;
  /** Vider une pièce : les gestes d'avant ne comptent plus. */
  videes: Partial<Record<ClePiece, number>>;
  /** CE QUE J'AI REMARQUÉ — gardé ici pour survivre au téléphone effacé. */
  signaux: Signal[];
  /** LES SURPRISES DU JOUR — ce que le Fantôme a rapporté de la ville (`surprises.ts`). */
  jour?: JourDeSurprises;
  /** Ce qui a déjà été montré, et quand : pas deux fois la même chose dans la semaine. */
  montrees: { k: string; t: number }[];
  maj: number;
};

/**
 * LA TOURNÉE DU JOUR. Tirée une fois (et complétée si la Maison en apprend
 * plus dans la journée), gardée telle quelle : on peut la revoir le soir, et
 * le deuxième téléphone voit la même.
 */
export type JourDeSurprises = {
  /** « 2026-10-10 », à l'heure du téléphone. */
  date: string;
  liste: Surprise[];
  /** Les surprises déjà ouvertes. */
  vues: string[];
  /** ❤️ (1) ou 👎 (-1), par surprise. */
  avis: Record<string, 1 | -1>;
};

export const MEMOIRE_VIDE: Memoire = { v: 1, choix: {}, refus: {}, pauses: {}, videes: {}, signaux: [], montrees: [], maj: 0 };
/** Assez pour une semaine de surprises : au-delà, elles peuvent revenir. */
export const MONTREES_MAX = 80;

/** Au-delà, les plus anciens s'en vont : la Maison retient, elle n'archive pas. */
export const SIGNAUX_MAX = 300;

const CLES = new Set<string>(PIECES.map((p) => p.cle));
const estCle = (v: unknown): v is ClePiece => typeof v === "string" && CLES.has(v);
const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const chaine = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/**
 * RELIRE UNE MÉMOIRE VENUE D'AILLEURS (le serveur, un vieux téléphone) : tout ce
 * qui n'a pas la bonne forme tombe, rien ne fait planter la Maison.
 */
export function lireMemoire(x: unknown): Memoire {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const datees = <T>(v: unknown, lire: (w: unknown) => T | undefined) => {
    const r: Partial<Record<ClePiece, Date_<T>>> = {};
    for (const [k, w] of Object.entries((v && typeof v === "object" ? v : {}) as Record<string, unknown>)) {
      const d = (w ?? {}) as Record<string, unknown>;
      const val = lire(d.v);
      if (estCle(k) && val !== undefined) r[k] = { v: val, t: nombre(d.t) };
    }
    return r;
  };
  const liste = (w: unknown) => (Array.isArray(w) ? w.filter((s) => typeof s === "string").map((s) => s.slice(0, 40)).slice(0, 20) : undefined);
  const videes: Partial<Record<ClePiece, number>> = {};
  for (const [k, w] of Object.entries((o.videes && typeof o.videes === "object" ? o.videes : {}) as Record<string, unknown>)) {
    if (estCle(k) && nombre(w)) videes[k] = nombre(w);
  }
  const signaux: Signal[] = [];
  for (const s of Array.isArray(o.signaux) ? o.signaux : []) {
    const r = (s ?? {}) as Record<string, unknown>;
    if (!estCle(r.piece) || !r.id) continue;
    signaux.push({
      id: chaine(r.id, 160),
      piece: r.piece,
      quoi: chaine(r.quoi, 120),
      d: chaine(r.d, 120),
      sens: r.sens === -1 ? -1 : 1,
      traits: Array.isArray(r.traits) ? r.traits.filter((t) => typeof t === "string").map((t) => t.slice(0, 40)).slice(0, 8) : [],
      image: typeof r.image === "string" && r.image.length < 600 ? r.image : undefined,
      t: nombre(r.t),
    });
  }
  const montrees: { k: string; t: number }[] = [];
  for (const x of Array.isArray(o.montrees) ? o.montrees : []) {
    const r = (x ?? {}) as Record<string, unknown>;
    if (typeof r.k === "string" && r.k) montrees.push({ k: r.k.slice(0, 200), t: nombre(r.t) });
  }
  return {
    v: 1,
    choix: datees(o.choix, liste),
    refus: datees(o.refus, liste),
    pauses: datees(o.pauses, (w) => (typeof w === "boolean" ? w : undefined)),
    videes,
    signaux: signaux.sort((a, b) => b.t - a.t).slice(0, SIGNAUX_MAX),
    jour: lireJour(o.jour),
    montrees: montrees.sort((a, b) => b.t - a.t).slice(0, MONTREES_MAX),
    maj: nombre(o.maj),
  };
}

/** Une image de la ville : un chemin du site ou une adresse https, rien d'autre. */
const image = (v: unknown) => (typeof v === "string" && v.length < 600 && /^(\/(?!\/)|https:\/\/)/.test(v) ? v : "");
const heure = (v: unknown) => (typeof v === "number" && v >= 0 && v <= 30 ? v : undefined);

function lireSurprise(x: unknown): Surprise | undefined {
  const r = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const photo = image(r.photo);
  if (!estCle(r.piece) || !r.id || !r.objet || !r.carte || !r.titre || !photo) return undefined;
  const a = (r.action ?? {}) as Record<string, unknown>;
  const preuves: Preuve[] = [];
  for (const p of Array.isArray(r.preuves) ? r.preuves.slice(0, 8) : []) {
    const q = (p ?? {}) as Record<string, unknown>;
    if ((q.sorte === "dit" || q.sorte === "remarque" || q.sorte === "crois") && q.texte) preuves.push({ sorte: q.sorte, texte: chaine(q.texte, 200) });
  }
  const optionnelle = (v: unknown, n: number) => (typeof v === "string" && v ? v.slice(0, n) : undefined);
  return {
    id: chaine(r.id, 220),
    objet: chaine(r.objet, 200),
    piece: r.piece,
    carte: chaine(r.carte, 120),
    lieu: chaine(r.lieu, 120),
    distance: optionnelle(r.distance, 30),
    titre: chaine(r.titre, 160),
    annonce: optionnelle(r.annonce, 160),
    photo,
    prix: optionnelle(r.prix, 40),
    quand: chaine(r.quand, 30),
    de: heure(r.de),
    fin: heure(r.fin),
    raison: chaine(r.raison, 240),
    preuves,
    traits: Array.isArray(r.traits) ? r.traits.filter((t) => typeof t === "string").map((t) => t.slice(0, 40)).slice(0, 8) : [],
    trait: optionnelle(r.trait, 40),
    action: { mot: chaine(a.mot, 40) || "Voir", onglet: optionnelle(a.onglet, 30) },
    score: nombre(r.score),
  };
}

function lireJour(x: unknown): JourDeSurprises | undefined {
  const o = (x && typeof x === "object" ? x : null) as Record<string, unknown> | null;
  if (!o || typeof o.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return undefined;
  const liste = (Array.isArray(o.liste) ? o.liste : []).map(lireSurprise).filter((s): s is Surprise => !!s).slice(0, 6);
  const ids = new Set(liste.map((s) => s.id));
  const avis: Record<string, 1 | -1> = {};
  for (const [k, v] of Object.entries((o.avis && typeof o.avis === "object" ? o.avis : {}) as Record<string, unknown>)) if (ids.has(k) && (v === 1 || v === -1)) avis[k] = v;
  return { date: o.date, liste, vues: (Array.isArray(o.vues) ? o.vues : []).filter((v): v is string => typeof v === "string" && ids.has(v)), avis };
}

/**
 * DEUX TOURNÉES, UN JOUR. Le jour le plus récent l'emporte ; le même jour, les
 * deux listes se rejoignent (trois au plus, celles déjà ouvertes d'abord), et
 * ce qui a été vu ou aimé d'un côté l'est des deux.
 */
function fusionnerJours(a?: JourDeSurprises, b?: JourDeSurprises): JourDeSurprises | undefined {
  if (!a || !b) return a ?? b;
  if (a.date !== b.date) return a.date > b.date ? a : b;
  const vues = [...new Set([...a.vues, ...b.vues])];
  const parId = new Map<string, Surprise>();
  for (const s of [...a.liste, ...b.liste]) if (!parId.has(s.id)) parId.set(s.id, s);
  const liste = [...parId.values()].sort((x, y) => Number(vues.includes(y.id)) - Number(vues.includes(x.id))).slice(0, 3);
  const ids = new Set(liste.map((s) => s.id));
  const avis = Object.fromEntries(Object.entries({ ...a.avis, ...b.avis }).filter(([k]) => ids.has(k))) as Record<string, 1 | -1>;
  return { date: a.date, liste, vues: vues.filter((v) => ids.has(v)), avis };
}

/**
 * DEUX COPIES, UNE MAISON. Le choix le plus récent l'emporte pièce par pièce ;
 * les signaux s'additionnent (le même identifiant reste un seul signal) ; une
 * pièce vidée l'est depuis la date la plus tardive des deux.
 */
export function fusionnerMemoires(a: Memoire, b: Memoire): Memoire {
  const datees = <T>(x: Partial<Record<ClePiece, Date_<T>>>, y: Partial<Record<ClePiece, Date_<T>>>) => {
    const r: Partial<Record<ClePiece, Date_<T>>> = { ...x };
    for (const [k, v] of Object.entries(y) as [ClePiece, Date_<T>][]) if (!r[k] || v.t > r[k]!.t) r[k] = v;
    return r;
  };
  const videes: Partial<Record<ClePiece, number>> = { ...a.videes };
  for (const [k, t] of Object.entries(b.videes) as [ClePiece, number][]) videes[k] = Math.max(videes[k] ?? 0, t);
  const parId = new Map<string, Signal>();
  for (const s of [...a.signaux, ...b.signaux]) {
    const deja = parId.get(s.id);
    if (!deja || s.t > deja.t) parId.set(s.id, s);
  }
  const montrees = new Map<string, number>();
  for (const x of [...a.montrees, ...b.montrees]) montrees.set(x.k, Math.max(montrees.get(x.k) ?? 0, x.t));
  return {
    v: 1,
    choix: datees(a.choix, b.choix),
    refus: datees(a.refus, b.refus),
    pauses: datees(a.pauses, b.pauses),
    videes,
    signaux: [...parId.values()].sort((x, y) => y.t - x.t).slice(0, SIGNAUX_MAX),
    jour: fusionnerJours(a.jour, b.jour),
    montrees: [...montrees].map(([k, t]) => ({ k, t })).sort((x, y) => y.t - x.t).slice(0, MONTREES_MAX),
    maj: Math.max(a.maj, b.maj),
  };
}

// ─── CE QUE LES GESTES RÉVÈLENT ────────────────────────────────────────────

const mots = (alternatives: string) => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "iu");

/**
 * LA CUISINE D'UN PLAT, D'APRÈS SON NOM. Plusieurs à la fois : des lasagnes
 * sont italiennes ET mijotées. Ce n'est pas un classement de restaurants, c'est
 * ce qui fera dire au Fantôme « ça ressemble aux plats que vous aimez ».
 */
const CUISINES: [string, RegExp][] = [
  ["italien", mots("lasagnes?|p[âa]tes|pizzas?|risotto|tiramisu|gnocchis?|carbonara|bolognaise|burrata|penne|tagliatelles?|ravioles?|raviolis?")],
  ["basque", mots("axoa|piperade|basquaise|ttoro|chipirons?|garbure|magret|confit|landais|g[âa]teau basque|jambon de bayonne|ossau")],
  ["asiatique", mots("sushis?|ramen|wok|pad tha[ïi]|curry|bo bun|nems?|gyozas?|tha[ïi]|japonais|vietnamien|poke")],
  ["poisson", mots("poissons?|saumon|cabillaud|thon|merlu|moules|crevettes|gambas|dorade|bar|calamars?|fruits de mer|hu[îi]tres")],
  ["viande", mots("b[œo]euf|entrec[ôo]te|burgers?|poulet|porc|agneau|veau|c[ôo]te|bavette|tartare|canard|saucisse")],
  ["vegetal", mots("v[ée]g[ée]tarien(ne)?|v[ée]g[ée]|veggie|l[ée]gumes|tofu|falafels?|bouddha bowl|salade")],
  ["mijote", mots("mijot[ée]e?s?|brais[ée]e?s?|blanquette|bourguignon|daube|navarin|pot-au-feu|axoa|basquaise|confit|lasagnes?")],
  ["sucre", mots("g[âa]teau|tarte|dessert|fondant|mousse|cr[eè]me|glace|cannel[ée]s?|flan|pastis landais|cookie|brioche")],
];
export const cuisinesDe = (nom: string): string[] => CUISINES.filter(([, re]) => re.test(nom)).map(([k]) => k);

/** Les traits d'une chose mise de côté ou départagée, selon sa pièce. */
export function traitsDe(nom: string, piece: ClePiece, famille?: string): string[] {
  if (piece === "cuisine") return cuisinesDe(nom).map((c) => `cuisine:${c}`);
  const t: string[] = [];
  const teinte = teinteDe(nom);
  if (teinte) t.push(`teinte:${teinte}`);
  const f = famille && famille !== "autre" ? famille : familleDe(nom);
  if (f && f !== "autre") t.push(`famille:${f}`);
  return t;
}

const MOTS_TRAITS: Record<string, string> = {
  "teinte:vert": "le vert et le kaki",
  "teinte:clair": "les teintes claires",
  "teinte:sombre": "les teintes sombres",
  "teinte:bleu": "le bleu",
  "teinte:chaud": "les couleurs chaudes",
  "teinte:rose": "le rose et le violet",
  "teinte:brun": "le marron et le cognac",
  "famille:dessus": "les vestes",
  "famille:haut": "les chemises et les hauts",
  "famille:maille": "la maille",
  "famille:robe": "les robes",
  "famille:bas": "les pantalons",
  "famille:coupe": "les coupes",
  "famille:ongles": "les poses d'ongles",
  "famille:lunettes": "les lunettes",
  "famille:fleurs": "les fleurs",
  "cuisine:italien": "la cuisine italienne",
  "cuisine:basque": "la cuisine basque et landaise",
  "cuisine:asiatique": "la cuisine asiatique",
  "cuisine:poisson": "le poisson",
  "cuisine:viande": "la viande",
  "cuisine:vegetal": "les plats végétariens",
  "cuisine:mijote": "les plats mijotés",
  "cuisine:sucre": "les desserts",
  "ambiance:fete": "faire la fête",
  "ambiance:amis": "sortir entre amis",
  "ambiance:musique": "la musique",
  "ambiance:verre": "un verre au calme",
  "ambiance:decouvrir": "découvrir",
  "ambiance:monde": "rencontrer du monde",
  "ambiance:rencontre": "faire des rencontres",
  "prix:moins": "l'option la moins chère",
  "prix:plus": "l'option la plus soignée",
};
export const motDuTrait = (t: string) => MOTS_TRAITS[t] ?? t.split(":")[1] ?? t;

/** Ce qui compte d'une pièce : ses gestes depuis qu'on l'a vidée. */
export function signauxDe(m: Memoire, piece: ClePiece): Signal[] {
  const depuis = m.videes[piece] ?? 0;
  return m.signaux.filter((s) => s.piece === piece && s.t > depuis);
}

export type Gout = { trait: string; mot: string; pour: number; sur: number };

/**
 * CE QUE JE CROIS — jamais tiré d'un seul geste. Trois gestes au moins qui
 * vont dans le même sens, et six sur dix de ceux qui en parlent : la même
 * règle que les préférences des duels (`preferencesDe`). Un trait refusé
 * (« Ce n'est pas moi ») ne revient plus.
 */
export function goutsDe(m: Memoire, piece: ClePiece): Gout[] {
  const refuses = new Set(m.refus[piece]?.v ?? []);
  const pour = new Map<string, number>();
  const sur = new Map<string, number>();
  for (const s of signauxDe(m, piece)) {
    for (const t of s.traits) {
      sur.set(t, (sur.get(t) ?? 0) + 1);
      if (s.sens > 0) pour.set(t, (pour.get(t) ?? 0) + 1);
    }
  }
  const gouts: Gout[] = [];
  for (const [trait, p] of pour) {
    const n = sur.get(trait) ?? p;
    if (p >= 3 && p / n >= 0.6 && !refuses.has(trait)) gouts.push({ trait, mot: motDuTrait(trait), pour: p, sur: n });
  }
  return gouts.sort((a, b) => b.pour - a.pour).slice(0, 4);
}

// ─── CE QUE L'APPLICATION SAIT DÉJÀ ────────────────────────────────────────
//
// La Maison n'arrive jamais vide (le brief, §8) : avant elle, l'application
// gardait déjà des pièces mises de côté, des duels, des commerces suivis, des
// envies de soirée. Ces fonctions les relisent en signaux, sans rien demander.

/** Les pièces mises de côté (`pieces-gardees.ts`). */
export function signauxDesGardees(
  gardees: { carte: string; lieu: string; piece: string; nom: string; image?: string; quand: number }[],
  familleDuCommerce: (carte: string) => FamilleDouble | undefined,
): Signal[] {
  const r: Signal[] = [];
  for (const g of gardees) {
    const fam = familleDuCommerce(g.carte);
    const piece = pieceDeLaFamille(fam) ?? (familleDe(g.nom) === "coupe" ? "miroir" : "dressing");
    r.push({
      id: `garde|${g.carte}|${g.piece}`,
      piece,
      quoi: g.nom,
      d: `Mise de côté chez ${g.lieu}`,
      sens: 1,
      traits: traitsDe(g.nom, piece, fam === "coiffure" ? "coupe" : fam === "ongles" ? "ongles" : undefined),
      image: g.image,
      t: g.quand,
    });
  }
  return r;
}

const PIECE_DU_DUEL: Record<string, ClePiece> = {
  coupe: "miroir",
  ongles: "miroir",
  sortie: "sorties",
  plat: "cuisine",
  entree: "cuisine",
  dessert: "cuisine",
  boisson: "cuisine",
  formule: "cuisine",
  fleurs: "interieur",
};

/** Les duels tranchés (`clikme-duels-v1`) : le gagnant pour, le perdant contre. */
export function signauxDesDuels(h: Issue[]): Signal[] {
  const r: Signal[] = [];
  for (const i of h) {
    const piece = PIECE_DU_DUEL[i.gagnant.famille] ?? "dressing";
    const prix =
      i.gagnant.prix !== undefined && i.perdant.prix !== undefined && i.gagnant.prix !== i.perdant.prix
        ? [`prix:${i.gagnant.prix < i.perdant.prix ? "moins" : "plus"}`]
        : [];
    r.push({
      id: `duel|${i.t}|g`,
      piece,
      quoi: i.gagnant.nom,
      d: `A gagné un duel contre ${i.perdant.nom}`,
      sens: 1,
      traits: [...traitsDe(i.gagnant.nom, piece, i.gagnant.famille), ...prix],
      t: i.t,
    });
    r.push({
      id: `duel|${i.t}|p`,
      piece,
      quoi: i.perdant.nom,
      d: `A perdu un duel contre ${i.gagnant.nom}`,
      sens: -1,
      traits: traitsDe(i.perdant.nom, piece, i.perdant.famille),
      t: i.t - 1,
    });
  }
  return r;
}

/** Les commerces suivis (`suivis.ts`) : un lieu qu'on veut revoir. */
export function signauxDesSuivis(
  commerces: { id: string; nom: string; famille: FamilleDouble; photo?: string }[],
  t: number,
): Signal[] {
  const r: Signal[] = [];
  for (const c of commerces) {
    const piece = pieceDeLaFamille(c.famille);
    if (!piece) continue;
    r.push({ id: `suivi|${c.id}`, piece, quoi: c.nom, d: "Vous suivez ce lieu", sens: 1, traits: [], image: c.photo, t });
  }
  return r;
}

/** Les envies posées sur une soirée (`soiree-envies.ts`) : « Tu viens pour… ». */
export function signauxDesEnvies(envies: Record<string, { envies: string[]; at: number }>, nomDe: (soiree: string) => string | undefined): Signal[] {
  const r: Signal[] = [];
  for (const [soiree, e] of Object.entries(envies)) {
    if (!e.envies?.length) continue;
    const nom = nomDe(soiree) ?? "Une soirée";
    r.push({
      id: `envie|${soiree}`,
      piece: "sorties",
      quoi: nom,
      d: "Vous y alliez pour " + e.envies.length + (e.envies.length > 1 ? " raisons" : " raison"),
      sens: 1,
      traits: e.envies.map((k) => `ambiance:${k}`),
      t: e.at,
    });
  }
  return r;
}

// ─── CE QU'ON VOIT DE CHAQUE PIÈCE ─────────────────────────────────────────

export type EtatPiece = {
  piece: PieceMaison;
  enPause: boolean;
  /** Ce que vous m'avez dit (les choix cochés). */
  dit: string[];
  /** Ce que j'ai remarqué, le plus récent devant. */
  remarque: Signal[];
  /** Ce que je crois. */
  crois: Gout[];
  /** Allumée dès qu'elle sait quelque chose de vous. */
  allumee: boolean;
  /** Sous le nom, sur l'entrée : ce qu'elle sait, ou le geste qui la réveille. */
  ligne: string;
  /** Et ce que ça vous apporte : « → je cherche ce qui va avec ». */
  suite: string;
};

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

export function etatDe(m: Memoire, piece: PieceMaison): EtatPiece {
  const enPause = m.pauses[piece.cle]?.v === true;
  const dit = m.choix[piece.cle]?.v ?? [];
  const remarque = signauxDe(m, piece.cle).filter((s) => s.sens > 0);
  const crois = goutsDe(m, piece.cle);
  const allumee = !enPause && (dit.length > 0 || remarque.length > 0);
  let ligne: string;
  let suite = `→ ${piece.apport}`;
  if (enPause) {
    ligne = "En pause";
    suite = "→ touchez pour me réveiller";
  } else if (crois.length) ligne = `Vous aimez ${crois[0].mot}`;
  else if (remarque.length) ligne = `${pluriel(remarque.length, "chose gardée", "choses gardées")} pour vous`;
  else if (dit.length) ligne = `${pluriel(dit.length, "chose", "choses")} que vous m'avez ${dit.length > 1 ? "dites" : "dite"}`;
  else {
    ligne = piece.reveil.action;
    suite = `→ ${piece.reveil.gain}`;
  }
  return { piece, enPause, dit, remarque, crois, allumee, ligne, suite };
}

/**
 * « 4 PIÈCES COMMENCENT À VOUS CONNAÎTRE » — pas « vous connaissent » : elles
 * apprennent, elles ne savent pas tout.
 */
export function phraseDesPieces(n: number): string {
  if (n <= 0) return "ClikMe ne vous connaît pas encore";
  return n === 1 ? "1 endroit de votre Maison commence à vous connaître" : `${n} endroits de votre Maison commencent à vous connaître`;
}

/**
 * LA MÊME MAISON N'EST PAS LA MÊME À 11 H 30 ET À 20 H 30 (le brief, §35).
 * Le matin, le miroir et le café ; à midi, la cuisine ; l'après-midi, le
 * dressing ; le soir, les sorties.
 */
export function ordreSelonLHeure(heure: number): ClePiece[] {
  if (heure >= 5 && heure < 11) return ["miroir", "bienetre", "cuisine", "dressing", "librairie", "interieur", "sorties"];
  if (heure >= 11 && heure < 14) return ["cuisine", "dressing", "miroir", "sorties", "librairie", "interieur", "bienetre"];
  if (heure >= 14 && heure < 18) return ["dressing", "miroir", "interieur", "librairie", "bienetre", "cuisine", "sorties"];
  return ["sorties", "cuisine", "dressing", "miroir", "librairie", "interieur", "bienetre"];
}

/**
 * CE QUE LE FANTÔME DIT EN OUVRANT LA PORTE. Vrai, toujours : il ne parle de
 * ce qu'il a rangé que s'il a rangé quelque chose.
 */
export function motDuFantome(etats: EtatPiece[]): { titre: string; texte: string } {
  const pleines = etats.filter((e) => e.allumee);
  if (!pleines.length)
    return {
      titre: "Bienvenue chez vous",
      texte: "Montrez-moi un peu de vous, je vais voir ce que la ville a pour vous.",
    };
  // PAS D'INVENTAIRE (« 1 chose dans Mon Miroir, 2 dans Ma Cuisine… ») : les
  // cartes le montrent déjà. Une phrase, puis les endroits de la Maison.
  return { titre: "Je commence à vous connaître.", texte: "" };
}
