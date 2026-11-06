/**
 * 🃏 SA CARTE DE PERSONNAGE — 4 novembre 2026 (« la carte de personnage : le questionnaire, la fiche écrite par l'IA et
 * des caractéristiques qui montent avec les visites »). Sept questions amusantes, ce qu'il aime, sa phrase fétiche :
 * l'IA en écrit une fiche drôle et bienveillante (son titre, son portrait, son super-pouvoir, son point faible, sa
 * façon de parler). Ses six caractéristiques, elles, ne sont PAS écrites par l'IA : elles se calculent ici, d'après ses
 * réponses ET ses cadeaux de ClikMe (une étape franchie dans l'app, un cadeau — plus ses achats depuis le 5 novembre
 * 2026) — c'est ce qui les fait monter, et ce qui fait revenir.
 *
 * C'est aussi la base de la rencontre du jour (sa façon de parler, ce qu'il aime) : `docs/figurines.md`.
 *
 * RIEN DE SENSIBLE : ni santé, ni religion, ni orientation, ni opinions, ni où il est allé et quand ; ses goûts sont
 * pris dans une liste de loisirs.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import { CADEAUX_VIDES, prochaineEtape, type Cadeaux, type CleEtape } from "./etapes";

export const QUESTIONS = [
  { cle: "elan", q: "Face à une nouvelle idée, tu…", a: { emoji: "🚀", dit: "Fonces" }, b: { emoji: "🧐", dit: "Prends ton temps" } },
  { cle: "ton", q: "Entre amis, tu es plutôt…", a: { emoji: "😂", dit: "Le clown" }, b: { emoji: "🤓", dit: "Le sérieux" } },
  { cle: "jeu", q: "Au jeu, tu es…", a: { emoji: "🏆", dit: "Là pour gagner" }, b: { emoji: "😎", dit: "Là pour rire" } },
  { cle: "sort", q: "Côté chance, tu es…", a: { emoji: "🍀", dit: "Né sous une bonne étoile" }, b: { emoji: "🙈", dit: "Roi des gaffes" } },
  { cle: "tete", q: "Avant d’agir, tu…", a: { emoji: "💭", dit: "Réfléchis" }, b: { emoji: "⚡", dit: "Agis tout de suite" } },
  { cle: "gout", q: "Ton péché mignon…", a: { emoji: "🍰", dit: "Le sucré" }, b: { emoji: "🧀", dit: "Le salé" } },
  { cle: "rythme", q: "Tu es plutôt…", a: { emoji: "🌅", dit: "Du matin" }, b: { emoji: "🌙", dit: "Du soir" } },
] as const;
export type CleQuestion = (typeof QUESTIONS)[number]["cle"];
export type Reponses = Record<CleQuestion, "a" | "b">;

export const GOUTS = [
  { cle: "cuisine", emoji: "🍝", nom: "Cuisine" },
  { cle: "sport", emoji: "⚽", nom: "Sport" },
  { cle: "musique", emoji: "🎶", nom: "Musique" },
  { cle: "cinema", emoji: "🎬", nom: "Cinéma" },
  { cle: "lecture", emoji: "📚", nom: "Lecture" },
  { cle: "nature", emoji: "🌿", nom: "Nature" },
  { cle: "voyages", emoji: "✈️", nom: "Voyages" },
  { cle: "jeux", emoji: "🎲", nom: "Jeux" },
  { cle: "mode", emoji: "👗", nom: "Mode" },
  { cle: "bricolage", emoji: "🔨", nom: "Bricolage" },
  { cle: "animaux", emoji: "🐾", nom: "Animaux" },
  { cle: "sorties", emoji: "🎉", nom: "Sorties" },
] as const;
export type CleGout = (typeof GOUTS)[number]["cle"];
export const GOUTS_MAX = 3;
export const PHRASE_MAX = 80;

export const CARACTERISTIQUES = [
  { cle: "audace", emoji: "🚀", nom: "Audace" },
  { cle: "humour", emoji: "😂", nom: "Humour" },
  { cle: "mauvaiseFoi", emoji: "😤", nom: "Mauvaise foi" },
  { cle: "chance", emoji: "🍀", nom: "Chance" },
  { cle: "curiosite", emoji: "🧭", nom: "Curiosité" },
  { cle: "fidelite", emoji: "💖", nom: "Fidélité" },
] as const;
export type CleCaracteristique = (typeof CARACTERISTIQUES)[number]["cle"];

/**
 * 🎁 CE QUI LA FAIT PROGRESSER : SES CADEAUX DE CLIKME (`etapes.ts`) — un à chaque étape franchie dans l'app ; plus ses
 * achats (5 novembre 2026, le patron : « ça ressemble trop à de l'achat forcé »).
 */
export type Progres = Cadeaux;
export const PROGRES_VIDE: Progres = CADEAUX_VIDES;

const borne = (n: number) => Math.max(1, Math.min(99, Math.round(n)));

/** CE QUE CHAQUE ÉTAPE FAIT MONTER : la sienne (un message fait rire, un ami rend fidèle, un inconnu demande de l'audace…). */
export const BONUS_ETAPE: Record<CleEtape, Partial<Record<CleCaracteristique, number>>> = {
  figurine: { audace: 8 },
  carte: { curiosite: 6 },
  message: { humour: 10 },
  rencontre: { curiosite: 8 },
  questions: { curiosite: 6, mauvaiseFoi: 4 },
  ami: { fidelite: 12 },
  membre: { audace: 12 },
  fidele: { fidelite: 10 },
  souvenirs: { chance: 12 },
  duo: { humour: 6, audace: 4 },
};

/**
 * SES SIX CARACTÉRISTIQUES : ses réponses donnent la base ; ses étapes les font monter (`BONUS_ETAPE`). Ses cadeaux
 * d'avant (ce que ses figurines lui avaient ouvert) comptent pour sa fidélité.
 */
export function caracteristiques(r: Reponses, p: Progres, gouts: readonly string[] = []): Record<CleCaracteristique, number> {
  const plus = (c: CleCaracteristique) => p.etapes.reduce((n, e) => n + (BONUS_ETAPE[e]?.[c] ?? 0), 0);
  const avant = Math.max(0, p.cadeaux - p.etapes.length);
  return {
    audace: borne(30 + (r.elan === "a" ? 25 : 0) + (r.tete === "b" ? 15 : 0) + plus("audace")),
    humour: borne((r.ton === "a" ? 62 : 30) + (r.jeu === "b" ? 8 : 0) + plus("humour")),
    mauvaiseFoi: borne((r.jeu === "a" ? 58 : 22) + (r.sort === "b" ? 8 : 0) + plus("mauvaiseFoi")),
    chance: borne((r.sort === "a" ? 50 : 25) + plus("chance")),
    curiosite: borne(25 + gouts.length * 4 + plus("curiosite")),
    fidelite: borne(15 + plus("fidelite") + avant * 4),
  };
}

/** Son niveau : un de plus à chaque cadeau de ClikMe. */
export const niveauDe = (p: Progres) => Math.min(99, 1 + p.cadeaux);
/** Le cadre de sa carte : bronze, argent (3 cadeaux), or (6). */
export const rangDe = (p: Progres): "bronze" | "argent" | "or" => (p.cadeaux >= 6 ? "or" : p.cadeaux >= 3 ? "argent" : "bronze");
/** Ce que sa prochaine étape lui rapportera (pour donner envie de la franchir). */
export function prochainCadeau(p: Progres) {
  const e = prochaineEtape(p.etapes);
  if (!e) return null;
  return { etape: e, monte: Object.entries(BONUS_ETAPE[e.cle]).map(([c, plus]) => ({ ...CARACTERISTIQUES.find((x) => x.cle === c)!, plus: plus as number })) };
}

/** La fiche, écrite par l'IA (ou, sans elle, composée ici). */
export type Fiche = { titre: string; portrait: string; pouvoir: string; faiblesse: string; facon: string };

export type CartePersonnage = {
  prenom: string;
  /** Sa figurine (s'il l'a), sinon son fantôme. */
  image: string;
  /** Sa figurine à lui (un fond plein), ou son fantôme (détouré). */
  figurine: boolean;
  reponses: Reponses;
  gouts: CleGout[];
  phrase: string;
  fiche: Fiche;
  par: "ia" | "local";
  valeurs: Record<CleCaracteristique, number>;
  niveau: number;
  rang: "bronze" | "argent" | "or";
  /** Son lien de partage (`/carte/<id>`), s'il l'a partagée. */
  lien?: string;
};

/** Ses réponses, propres : les sept, en « a » ou « b » ; sinon `null`. */
export function reponsesValides(x: unknown): Reponses | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const r = {} as Reponses;
  for (const { cle } of QUESTIONS) {
    if (o[cle] !== "a" && o[cle] !== "b") return null;
    r[cle] = o[cle] as "a" | "b";
  }
  return r;
}
export const goutsValides = (x: unknown): CleGout[] =>
  [...new Set(Array.isArray(x) ? x : [])].filter((g): g is CleGout => GOUTS.some((v) => v.cle === g)).slice(0, GOUTS_MAX);
export const phraseValide = (x: unknown): string =>
  String(x ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PHRASE_MAX);

const choix = (r: Reponses, cle: CleQuestion) => {
  const q = QUESTIONS.find((x) => x.cle === cle)!;
  return r[cle] === "a" ? q.a.dit : q.b.dit;
};

/** Ses réponses en mots (pour la consigne de l'IA, et pour la fiche locale). */
export function reponsesEnMots(r: Reponses): string[] {
  return QUESTIONS.map((q) => `${q.q.replace(/…$/, "")} : ${choix(r, q.cle).toLowerCase()}`);
}

/**
 * LA FICHE SANS L'IA (pas de clé, ou une réponse refusée) : composée à partir de ses réponses — moins drôle, toujours
 * juste.
 */
export function ficheLocale(prenom: string, r: Reponses, gouts: readonly CleGout[]): Fiche {
  const fonceur = r.elan === "a";
  const drole = r.ton === "a";
  // (des titres qui vont à tout le monde : on ne devine jamais le genre d'après un prénom)
  const titre = `${fonceur ? "La Tornade" : "La Tête froide"} ${drole ? "qui fait rire" : "au grand cœur"}`;
  const aime = gouts.map((g) => GOUTS.find((x) => x.cle === g)!.nom.toLowerCase());
  return {
    titre,
    portrait: `${prenom || "Ce personnage"} ${fonceur ? "fonce d’abord et réfléchit ensuite" : "prend le temps de bien faire"}, ${drole ? "toujours le mot pour rire" : "avec un sérieux qui rassure"}${aime.length ? `, et ne dit jamais non à ${aime.join(", ")}` : ""}.`,
    pouvoir: r.sort === "a" ? "Tomber pile au bon moment" : r.jeu === "a" ? "Ne jamais lâcher" : "Mettre tout le monde à l’aise",
    faiblesse: r.gout === "a" ? "Le dessert, toujours le dessert" : "L’apéro qui s’éternise",
    facon: `${drole ? "De l’humour à revendre" : "Du calme et de la bienveillance"}, ${r.tete === "b" ? "des phrases courtes et directes" : "le temps d’expliquer"}, ${r.rythme === "a" ? "en forme dès le matin" : "en forme surtout le soir"}.`,
  };
}

export const idCarteValide = (id: string) => /^[a-z0-9]{12}$/.test(id);
export const lienCarte = (id: string) => `/carte/${id}`;
/** Le texte qui part avec le lien de sa carte. */
export const texteDeLaCarte = (prenom: string, titre: string) => `${prenom ? `${prenom}, ` : ""}${titre} 🃏 Découvre mon personnage ClikMe :`;
