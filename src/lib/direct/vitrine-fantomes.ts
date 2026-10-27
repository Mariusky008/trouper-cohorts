/**
 * 🏪 LA VITRINE DU COMMERCE — les fantômes libérés, devant, à la porte, à table.
 *
 * C'est la vitrine du prototype « Les trois fantômes » (`outils/trois-fantomes`),
 * dans l'application. Quand quelqu'un libère son fantôme à la fin du film d'un
 * commerce, son fantôme va se placer dans la scène de ce commerce, avec ceux des
 * autres :
 *   · « J'adore la vidéo » : sur le trottoir, devant la vitrine — il applaudit ;
 *   · « Je viendrai un jour » : à la porte — il salue, son prénom s'écrit au carnet ;
 *   · « Je réserve / Je passe aujourd'hui » : il entre, il s'assoit à table.
 * Son propre fantôme est au premier rang, sur un halo rose, « Vous · Léa ».
 *
 * LES PRÉNOMS : visibles, et chacun peut cacher le sien (« Cacher mon prénom »,
 * sous la vitrine et dans Ma Maison) — décision du 26 octobre. Un prénom caché
 * laisse le fantôme et son geste, jamais le prénom.
 *
 * L'ARDOISE, sous la vitrine : l'info du moment que le commerçant écrit à son
 * comptoir (« Plus que 6 magrets ce midi ! »). Elle ne vaut que le jour même.
 *
 * Une semaine : la vitrine montre les fantômes des sept derniers jours.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import type { Cage } from "./cages";
import type { Ecusson } from "./ecussons";
import type { Grade } from "./famille";

export type FantomeVitrine = {
  /** Un identifiant pour l'écran — jamais celui de la personne. */
  id: string;
  /** Vide quand la personne a caché son prénom. */
  prenom: string;
  look: string;
  cage: Cage;
  le: string;
  /** C'est le sien. */
  moi?: boolean;
  /** 💌 Son petit mot (de la liste, ou écrit et qui a eu le 💛 — le sien, toujours). */
  mot?: string;
  /** Le commerçant a eu un coup de cœur pour son mot ; et ce qu'il lui a offert. */
  coeur?: boolean;
  cadeau?: string;
  /** 🧵 Ses écussons, cousus sur son fantôme (`lib/direct/ecussons.ts`). */
  ecussons?: Ecusson[];
  /** 👻 Sa place dans la famille de ce commerce : son numéro d'arrivée, et son palier (`lib/direct/famille.ts`). */
  numero?: number;
  grade?: Grade;
};

export type Vitrine = {
  fantomes: FantomeVitrine[];
  ardoise: string | null;
  prenomVisible: boolean;
  /** 💛 Son dernier coup de cœur (sept jours), sous l'ardoise. */
  coupDeCoeur?: { texte: string; prenom: string } | null;
  /** Il a déjà écrit son petit mot aujourd'hui. */
  ecritAujourdhui?: boolean;
};

/** Les places, en % de la scène (x, y = ses pieds) et sa taille (s), d'après le prototype. */
export const RANGS_ADORE = [
  ...[30, 18, 42, 6, 54].map((x) => ({ x, y: 97, s: 1 })),
  ...[12, 24, 36, 48, 2, 58].map((x) => ({ x, y: 86.5, s: 0.84 })),
  ...[7, 16, 25, 34, 43, 52].map((x) => ({ x, y: 77, s: 0.7 })),
];
export const PLACES_PROMIS = [
  { x: 64, y: 73, s: 0.76 },
  { x: 75, y: 75.5, s: 0.78 },
  { x: 87, y: 73.5, s: 0.76 },
  { x: 69, y: 87, s: 0.9 },
  { x: 81, y: 89, s: 0.92 },
  { x: 93, y: 86, s: 0.86 },
];
/** Assis dans la salle, derrière la vitre (x, y en % de la vitrine). */
export const SIEGES = [
  { x: 22, y: 85, s: 0.82 },
  { x: 45, y: 82, s: 0.74 },
  { x: 65, y: 86, s: 0.82 },
  { x: 84, y: 81, s: 0.72 },
  { x: 33, y: 100, s: 0.92 },
  { x: 74, y: 100, s: 0.92 },
];

export type Place = { f: FantomeVitrine; x: number; y: number; s: number; dedans: boolean };

/**
 * QUI SE VOIT, ET OÙ. Le sien d'abord, au premier rang de sa cage ; puis les plus
 * récents. Ceux qui ne tiennent pas sur le trottoir font le « +N ».
 */
export function placer(fantomes: FantomeVitrine[]): { places: Place[]; reste: number } {
  const recents = [...fantomes].sort((a, b) => Number(Boolean(b.moi)) - Number(Boolean(a.moi)) || b.le.localeCompare(a.le));
  const places: Place[] = [];
  const de = (c: Cage) => recents.filter((f) => f.cage === c);
  const adore = de("adore");
  adore.slice(0, RANGS_ADORE.length).forEach((f, k) => places.push({ f, ...RANGS_ADORE[k], dedans: false }));
  // le sien, à la porte : au premier rang (la quatrième place est devant)
  const promis = de("un-jour");
  const ordrePorte = [3, 4, 0, 1, 2, 5];
  promis.slice(0, PLACES_PROMIS.length).forEach((f, k) => places.push({ f, ...PLACES_PROMIS[ordrePorte[k]], dedans: false }));
  const table = de("aujourdhui");
  const ordreTable = [1, 0, 2, 3, 4, 5];
  table.slice(0, SIEGES.length).forEach((f, k) => places.push({ f, ...SIEGES[ordreTable[k]], dedans: true }));
  const reste = Math.max(0, adore.length - RANGS_ADORE.length) + Math.max(0, promis.length - PLACES_PROMIS.length) + Math.max(0, table.length - SIEGES.length);
  return { places, reste };
}

/** Ce que dit sa bulle quand on le touche : « 💗 a adoré la vidéo », « 📌 viendra un jour »… */
export function geste(cage: Cage, branche: string): string {
  if (cage === "adore") return "💗 a adoré la vidéo";
  if (cage === "un-jour") return "📌 viendra un jour";
  return ["restaurant", "bar", "coiffeur", "ongles"].includes(branche) ? "🍽️ a réservé aujourd’hui" : "🚶 passe aujourd’hui";
}

// ═══ LA FOULE DE LA DÉMONSTRATION ══════════════════════════════════════════
// Un commerce de la démonstration n'a pas de vrais habitants : sa vitrine se remplit
// de prénoms inventés, les mêmes toute la journée (tirés du commerce et du jour).
const PRENOMS = ["Léa", "Malik", "Martin", "Chloé", "Lucas", "Sarah", "Nathan", "Emma", "Paul", "Zoé", "Yanis", "Rose", "Jules", "Lina", "Elsa", "Noé", "Iris", "Axel", "Jade", "Victor", "Ambre", "Robin", "Nina", "Adam", "Manon", "Louis", "Anaïs", "Maël"];
const LOOKS = ["denim", "fleuri", "rebelle", "soleil", "curieux", "voyageur", "artiste", "cosy", "lecteur", "melomane", "jardinier", "flaneur"];

function hache(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** La foule inventée d'un commerce de la démonstration, pour aujourd'hui. */
export function fouleDemo(cle: string, maintenant: number): FantomeVitrine[] {
  const jour = new Date(maintenant).toISOString().slice(0, 10);
  let h = hache(`${cle}|${jour}`);
  const suivant = () => (h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0);
  const n = { adore: 9 + (suivant() % 6), "un-jour": 3 + (suivant() % 3), aujourdhui: 2 + (suivant() % 3) };
  const foule: FantomeVitrine[] = [];
  let k = 0;
  for (const cage of ["adore", "un-jour", "aujourdhui"] as Cage[]) {
    for (let i = 0; i < n[cage]; i++, k++) {
      foule.push({
        id: `demo-${k}`,
        prenom: suivant() % 5 === 0 ? "" : PRENOMS[suivant() % PRENOMS.length],
        look: LOOKS[suivant() % LOOKS.length],
        cage,
        le: new Date(maintenant - (suivant() % (36 * 60)) * 60_000).toISOString(),
        // Leur place dans la famille inventée : un numéro chacun, quelques fidèles en argent et en or.
        numero: 2 + k * 3 + (suivant() % 3),
        grade: ((r) => (r < 2 ? "or" : r < 5 ? "argent" : "bronze"))(suivant() % 10),
      });
    }
  }
  return foule;
}
