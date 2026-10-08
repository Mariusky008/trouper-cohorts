// 🏠 MA MAISON — les pièces, et les commerces adoptés qui les habitent.
//
// « Les espaces correspondent aux commerces adoptés : cuisine, dressing,
// miroir, coin lecture, etc. […] Prévoir plusieurs commerces dans une même
// catégorie. […] L'adoption enregistre un lien entre l'utilisateur et le
// commerce. Elle ne signifie pas qu'il a acheté ou visité le lieu. »
//
// ADOPTER, C'EST SUIVRE. Le cœur « Suivre » existait déjà (`suivis.ts`) : c'est
// lui qui fait entrer un commerce dans la maison. Rien ne s'en déduit d'autre —
// ni une visite, ni un achat.
//
// HUIT PIÈCES FIXES, pour que chaque métier ait la sienne (la maquette en
// dessinait quatre : le fleuriste, les créateurs, le bien-être n'avaient pas
// de place). Il y en a eu six : « il y a plus de 6 pièces dans la maison si on
// regarde tous les métiers ? » — la cuisine portait aussi les bars, et le salon
// les créateurs. Les bars ont leur cave, les créateurs leur atelier.
//
// FICHIER PARTAGÉ pour les pièces ; les partages et la présentation vivent
// dans le téléphone (fonctions marquées « navigateur »).
import { familleDuDouble, tenueDu, type FamilleDouble } from "@/lib/direct/double-metiers";

export type ClePiece = "cuisine" | "cave" | "lecture" | "dressing" | "miroir" | "salon" | "atelier" | "detente";

export type PieceMaison = {
  cle: ClePiece;
  nom: string;
  familles: FamilleDouble[];
  /** Le métier qu'on invite à découvrir quand la pièce est vide. */
  invite: string;
  /** Le métier du Direct qu'ouvre « Découvrir » depuis cette pièce vide. */
  branche?: string;
  /** Le décor et le fantôme par défaut — ceux du premier métier. */
  decor: string;
  fantome: string;
};

const DECOR: Record<ClePiece, { decor: string; fantome: string }> = {
  cuisine: { decor: "/direct/double/comptoir.jpg", fantome: "/direct/double/pied/repos.webp" },
  cave: { decor: "/direct/double/bar/decor.jpg", fantome: "/direct/double/pied/bar/repos.webp" },
  lecture: { decor: "/direct/double/librairie/decor.jpg", fantome: "/direct/double/pied/librairie/repos.webp" },
  dressing: { decor: "/direct/double/mode/decor.jpg", fantome: "/direct/double/pied/mode/repos.webp" },
  miroir: { decor: "/direct/double/coiffure/decor.jpg", fantome: "/direct/double/pied/coiffure/repos.webp" },
  salon: { decor: "/direct/double/fleurs/decor.jpg", fantome: "/direct/double/pied/fleurs/repos.webp" },
  atelier: { decor: "/direct/double/createur/decor.jpg", fantome: "/direct/double/pied/createur/repos.webp" },
  detente: { decor: "/direct/double/bien-etre/decor.jpg", fantome: "/direct/double/pied/bien-etre/repos.webp" },
};

export const PIECES: PieceMaison[] = [
  { cle: "cuisine", nom: "La cuisine", familles: ["table"], invite: "un restaurant", branche: "restaurant", ...DECOR.cuisine },
  { cle: "cave", nom: "La cave", familles: ["bar"], invite: "un bar", branche: "bar", ...DECOR.cave },
  { cle: "lecture", nom: "Le coin lecture", familles: ["librairie"], invite: "une librairie", branche: "librairie", ...DECOR.lecture },
  { cle: "dressing", nom: "Le dressing", familles: ["mode", "lunettes"], invite: "une boutique", branche: "mode", ...DECOR.dressing },
  { cle: "miroir", nom: "Le miroir", familles: ["coiffure", "ongles"], invite: "un coiffeur", branche: "coiffeur", ...DECOR.miroir },
  { cle: "salon", nom: "Le salon", familles: ["fleurs"], invite: "un fleuriste", branche: "fleuriste", ...DECOR.salon },
  { cle: "atelier", nom: "L’atelier", familles: ["createur"], invite: "un créateur", branche: "artisan", ...DECOR.atelier },
  { cle: "detente", nom: "Le coin détente", familles: ["seance"], invite: "un lieu bien-être", branche: "artisan", ...DECOR.detente },
];

type Commerce = { id: string; branche?: string | null; metier?: string | null };

/** LA PIÈCE D'UN COMMERCE. Le tatoueur va au miroir, pas au coin détente. */
export function pieceDe(c: Commerce): ClePiece {
  if (/tatou|tattoo|pierc/i.test(c.metier ?? "")) return "miroir";
  const f = familleDuDouble(c);
  return PIECES.find((p) => p.familles.includes(f))?.cle ?? "salon";
}

/** Les commerces adoptés, rangés par pièce — plusieurs par pièce si besoin. */
export function rangerLaMaison<C extends Commerce>(commerces: C[]): Record<ClePiece, C[]> {
  const m = { cuisine: [], cave: [], lecture: [], dressing: [], miroir: [], salon: [], atelier: [], detente: [] } as Record<ClePiece, C[]>;
  for (const c of commerces) m[pieceDe(c)].push(c);
  return m;
}

/** Le fantôme et le décor d'une pièce : ceux du premier commerce adopté, sinon ceux de la pièce. */
export function habillage(p: PieceMaison, premier?: Commerce): { decor: string; fantome: string } {
  const t = premier ? tenueDu(premier) : undefined;
  return {
    decor: t?.decor ?? p.decor,
    fantome: t?.enPied ? `${t.enPied}repos.webp` : p.fantome,
  };
}

// ═══ CE QUE LE TÉLÉPHONE GARDE (navigateur) ═════════════════════════════════

export type ReglagesMaison = {
  /** Une courte présentation, facultative. */
  presentation: string;
  /** Les essais partagés avec les amis — tous les autres sont privés. */
  partages: string[];
};

const CLE = "clikme-maison-v1";
const VIDE: ReglagesMaison = { presentation: "", partages: [] };
let cache: ReglagesMaison | null = null;
const abonnes = new Set<() => void>();

export function chargerMaison(): ReglagesMaison {
  if (cache) return cache;
  if (typeof window === "undefined") return VIDE;
  try {
    cache = { ...VIDE, ...(JSON.parse(window.localStorage.getItem(CLE) ?? "{}") as Partial<ReglagesMaison>) };
  } catch {
    cache = { ...VIDE };
  }
  return cache;
}

export const MAISON_VIDE = VIDE;

export function abonnerMaison(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

function garder(v: ReglagesMaison) {
  cache = v;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v));
  } catch {
    /* refusé : la visite continue en mémoire */
  }
  abonnes.forEach((f) => f());
}

export function direPresentation(texte: string) {
  garder({ ...chargerMaison(), presentation: texte.trim().slice(0, 120) });
}

/** PARTAGER UN ESSAI, C'EST UN GESTE — jamais automatique, et réversible. */
export function partagerEssai(cle: string, oui = true) {
  const m = chargerMaison();
  const partages = oui ? [...new Set([...m.partages, cle])] : m.partages.filter((x) => x !== cle);
  garder({ ...m, partages });
}
