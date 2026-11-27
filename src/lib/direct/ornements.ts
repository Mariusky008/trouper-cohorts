/**
 * 🔥🎧❤️ « ELLE CHANGE TOUTE SEULE » (le chantier « Ma figurine », juste après le lot 1 ; `docs/univers/ma-figurine.md`,
 * section 3). Le propriétaire, le 25 novembre 2026, devant la maquette : « oui ok si c'est pas trop coûteux ».
 *
 * Des détails posés PAR-DESSUS sa figurine, comme sa tête du jour : aucune nouvelle image à fabriquer. Toujours d'après
 * de vraies données (jamais de chiffre inventé) :
 *   · 🔥 SA SÉRIE : ses jours de suite sur ClikMe (`presence.json`, déjà comptés pour sa figurine du mois) ; à 7, une
 *     auréole dorée ; un jour manqué, elle repart de zéro ;
 *   · 🎧 SA PASSION DU MOMENT : le salon où il va le plus (ce mois-ci), sinon sa première passion — un casque pour la
 *     musique, une écharpe pour le foot… ;
 *   · ❤️ SON DERNIER SOUVENIR avec un proche (une surprise ouverte, une vidéo vue ensemble) : un petit cœur épinglé, avec le
 *     prénom de qui le lui a offert, quinze jours.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */
import type { IdTheme } from "./decouvrir";
import type { Zone } from "./pieces-duo";

/** Où se pose un accessoire : sur sa tête, à son cou, ou un badge épinglé sur sa poitrine. */
export type SorteAccessoire = "casque" | "casque-micro" | "toque" | "oreilles" | "couronne" | "bandeau" | "echarpe" | "badge";
export type Accessoire = { theme: IdTheme; sorte: SorteAccessoire; e: string; nom: string };

/**
 * 🎧 Les accessoires ne sont plus posés sur sa figurine (marius, 27 novembre 2026 : « terriblement mauvais », mal placés,
 * et impossibles à enlever). Les remettre seulement s'ils deviennent optionnels et bien dessinés, maquette validée d'abord.
 */
export const ACCESSOIRES_PORTES = false;

/** L'accessoire de chaque passion. */
export const ACCESSOIRES: Record<IdTheme, Omit<Accessoire, "theme">> = {
  musique: { sorte: "casque", e: "🎧", nom: "Le casque de la musique" },
  jeux: { sorte: "casque-micro", e: "🎮", nom: "Le casque des jeux vidéo" },
  cuisine: { sorte: "toque", e: "👨‍🍳", nom: "La toque de la cuisine" },
  animaux: { sorte: "oreilles", e: "🐾", nom: "Les oreilles des animaux" },
  mode: { sorte: "couronne", e: "👑", nom: "La couronne de la mode" },
  manga: { sorte: "bandeau", e: "🍥", nom: "Le bandeau du manga" },
  foot: { sorte: "echarpe", e: "⚽", nom: "L’écharpe du foot" },
  series: { sorte: "badge", e: "🍿", nom: "Le badge des séries" },
  tele: { sorte: "badge", e: "⭐", nom: "Le badge de la télé" },
  humour: { sorte: "badge", e: "😂", nom: "Le badge de l’humour" },
  revisions: { sorte: "badge", e: "📚", nom: "Le badge des révisions" },
  parents: { sorte: "badge", e: "👶", nom: "Le badge des jeunes parents" },
};
export const accessoireDe = (theme: IdTheme | string | null | undefined): Accessoire | null => {
  const a = theme ? ACCESSOIRES[theme as IdTheme] : undefined;
  return a ? { theme: theme as IdTheme, ...a } : null;
};

/** La flamme se montre à partir de 2 jours de suite ; l'auréole, à 7. */
export const SERIE_MIN = 2;
export const SERIE_AUREOLE = 7;
/** Le cœur d'un souvenir reste quinze jours. */
export const COEUR_JOURS = 15;
/** La passion du moment : les salons des trente derniers jours. */
export const PASSION_JOURS = 30;

/** Un souvenir : une surprise ouverte (« offert par Sam ») ou une vidéo vue ensemble (« vu avec Sam »). */
export type CoeurSouvenir = { prenom: string; sorte: "surprise" | "ensemble" };

/**
 * Ce qu'elle porte toute seule. `boite` : la boîte de sa tête dans sa figurine (de 0 à 1), pour poser les détails ; sans
 * elle (une figurine de l'ancien style), seuls la flamme et le cœur se montrent.
 */
export type Ornements = { serie?: number; accessoire?: Accessoire; coeur?: CoeurSouvenir; boite?: Zone };

export const aDesOrnements = (o: Ornements | null | undefined): o is Ornements => Boolean(o && ((o.serie ?? 0) >= SERIE_MIN || o.accessoire || o.coeur));

/** 🔥 Ses jours de suite, finissant aujourd'hui (ou hier : la flamme tient jusqu'à minuit). `jours` : « 2026-11-25 ». */
export function serieDeJours(jours: readonly string[], aujourdhui: string): number {
  const vus = new Set(jours);
  const veille = (j: string) => {
    const d = new Date(`${j}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };
  let j = vus.has(aujourdhui) ? aujourdhui : veille(aujourdhui);
  let n = 0;
  while (vus.has(j)) {
    n++;
    j = veille(j);
  }
  return n;
}

export const PHRASES_ORNEMENTS = {
  titre: "✨ Ce qu’elle porte toute seule",
  serie: (n: number) => `🔥 ${n} jours de suite`,
  aureole: "😇 Son auréole : 7 jours de suite",
  serieDit: (n: number) => (n >= SERIE_AUREOLE ? `Tu viens depuis ${n} jours de suite : son auréole brille.` : `Tu viens depuis ${n} jours de suite. À ${SERIE_AUREOLE}, une auréole.`),
  passionDit: (nomSalon: string) => `Ta passion du moment : ${nomSalon}.`,
  coeur: (c: CoeurSouvenir) => (c.sorte === "surprise" ? `🎁 offert par ${c.prenom}` : `❤️ vu avec ${c.prenom}`),
  coeurDit: (c: CoeurSouvenir) => (c.sorte === "surprise" ? `Une surprise de ${c.prenom}, ouverte.` : `Une vidéo vue avec ${c.prenom}.`),
  rien: "Elle change toute seule avec ce que tu vis : viens plusieurs jours de suite, va dans les salons de tes passions, garde des souvenirs avec tes proches.",
} as const;
