// CE QUE SES JOURNÉES ONT DONNÉ — celles d'avant.
//
// ─── POURQUOI CE FICHIER EXISTE ───────────────────────────────────────────
//
// « Il va falloir rajouter en bas une barre de menu, avec l'historique des
// jours précédents, c'est-à-dire les stats, les menus. »
//
// C'est le seul retour qu'un commerçant ait jamais sur ce qu'il publie. Ni sa
// fiche Google, ni ses réseaux, ni son logiciel de caisse ne reviennent lui
// dire « mardi, tes lasagnes ont été vues par 142 personnes et il t'en restait
// six à 14 h ». Sans cette mémoire-là, chaque journée repart de zéro et rien
// ne s'apprend.
//
// ─── LA RÈGLE QUE CE FICHIER NE CASSE PAS ─────────────────────────────────
//
// UNE ANNONCE NE SURVIT PAS À SA JOURNÉE, et ça reste vrai. Ce qu'on garde ici
// n'est pas l'annonce — elle ne réapparaîtra jamais dans le paquet de la ville
// — c'est sa TRACE : ce qui a été publié, et ce que ça a fait. Le pain de la
// veille n'est plus chaud ; le souvenir qu'on en a vendu douze, si.
//
// ─── ET LA DIFFÉRENCE ENTRE CE QUI EST VRAI ET CE QUI EST MONTRÉ ──────────
//
// Les journées de démonstration sont MARQUÉES comme telles, à l'écran, une par
// une. Un commerçant qui essaie l'application doit pouvoir distinguer en une
// seconde ce qu'il a réellement fait de ce qu'on lui montre — sinon la première
// fois qu'il compare avec sa caisse, il ne croit plus rien de ce qu'on affiche.

import type { Journee } from "@/lib/direct/journee";

const CLE = "clikme.journees.v1";

/** Ce qu'une annonce laisse derrière elle une fois la journée finie. */
export type TraceMoment = {
  titre: string;
  icone: string;
  prix?: string;
  /** Ce qui restait quand la journée s'est terminée, si on le sait. */
  restant?: number;
};

/** Une journée passée, telle qu'elle se relit. */
export type JourneePassee = {
  commerce: string;
  /** `AAAA-MM-JJ`. */
  jour: string;
  moments: TraceMoment[];
  /**
   * LES CHIFFRES, OU RIEN.
   *
   * Absents pour une vraie journée : il n'y a pas de serveur, donc personne ne
   * compte les vues. Écrire un zéro reviendrait à annoncer un échec qu'on n'a
   * pas mesuré ; l'écran dit « pas encore mesuré », ce qui est la vérité.
   */
  vues?: number;
  reservations?: number;
  abonnes?: number;
  /**
   * CE QUI A LE MIEUX MARCHÉ CE JOUR-LÀ.
   *
   * « L'UX est mauvaise, les résultats ne se voient pas assez, tout se
   * ressemble. » C'était vrai, et la cause n'était pas graphique : six journées
   * qui n'affichent que trois nombres du même format SONT identiques. Il
   * manquait ce qui distingue un jour d'un autre — ce qui a marché.
   */
  phare?: string;
  /** Vrai pour les journées de démonstration : elles le disent à l'écran. */
  demo?: boolean;
};

export const AUCUNE: JourneePassee[] = [];
let cache: JourneePassee[] | null = null;

function lire(): JourneePassee[] {
  if (typeof window === "undefined") return AUCUNE;
  if (cache) return cache;
  try {
    const brut = window.localStorage.getItem(CLE);
    const v = brut ? (JSON.parse(brut) as JourneePassee[]) : [];
    cache = Array.isArray(v) ? v : [];
  } catch {
    cache = [];
  }
  return cache;
}

const abonnes = new Set<() => void>();

export function abonnerPassees(f: () => void): () => void {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

function garder(v: JourneePassee[]) {
  cache = v;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v.slice(-60)));
  } catch {
    /* Quota plein : on garde en mémoire, l'écran continue. */
  }
  abonnes.forEach((f) => f());
}

/**
 * RANGER LA JOURNÉE D'HIER AU LIEU DE LA JETER.
 *
 * Le magasin du jour effaçait purement et simplement une journée qui n'était
 * plus celle d'aujourd'hui — c'était juste tant qu'il n'y avait rien pour la
 * relire. Elle passe maintenant ici, une seule fois : on ne range pas deux fois
 * le même jour, sinon rouvrir l'application trois fois le lendemain
 * multiplierait les lignes.
 */
export function archiver(j: Journee) {
  if (typeof window === "undefined" || !j.moments.length) return;
  const v = lire();
  if (v.some((x) => x.commerce === j.commerce.id && x.jour === j.jour)) return;
  garder([
    ...v,
    {
      commerce: j.commerce.id,
      jour: j.jour,
      moments: j.moments.map((m) => ({
        titre: m.titre,
        icone: m.icone,
        prix: m.prix,
        restant: m.places,
      })),
    },
  ]);
}

/** Le jour de la semaine et la date, comme on les dit — « mardi 2 septembre ». */
export function ditLeJour(jour: string): string {
  const d = new Date(`${jour}T12:00:00`);
  if (Number.isNaN(d.getTime())) return jour;
  const s = d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    // EN FRANÇAIS LE PREMIER DU MOIS S'ÉCRIT « 1er ». Le formateur du navigateur
    // rend « mardi 1 septembre », qui se lit de travers pour un commerçant
    // français — et c'est exactement le genre de détail qui décide si un écran
    // a l'air fait par quelqu'un ou généré.
    .replace(/(^|\s)1(\s)/, "$11er$2");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * LES JOURNÉES DE DÉMONSTRATION.
 *
 * « Cette démo est faite juste pour voir qui sera intéressé, alors autant
 * montrer ce qu'on pourra leur proposer. » L'historique est précisément la
 * chose qui ne peut PAS se montrer le premier jour : il faut une semaine
 * d'usage pour qu'il existe. On en pose donc une, marquée comme telle.
 *
 * LES CHIFFRES SONT COHÉRENTS ENTRE EUX, ET C'EST CE QUI COMPTE. Un commerçant
 * regarde d'abord si l'ordre de grandeur lui parle : quelques dizaines à
 * quelques centaines de vues dans une ville de vingt mille habitants, quelques
 * réservations, un ou deux abonnés par jour. Des milliers de vues le feraient
 * sourire, et il aurait raison.
 */
const DEMO: Record<string, { titres: [string, string, string?][]; v: number; r: number; a: number; p?: string }[]> = {
  "as-resto": [
    { titres: [["Magret-frites du jour", "🍽️", "14 €"], ["Garbure maison", "🥣", "9 €"]], v: 168, r: 6, a: 4, p: "Magret-frites du jour" },
    { titres: [["Lasagnes maison", "🍽️", "13 €"]], v: 142, r: 4, a: 8, p: "Lasagnes maison" },
    { titres: [["Confit de canard", "🍽️", "16 €"], ["Dernières parts à 9 €", "⏳", "9 €"]], v: 201, r: 9, a: 3, p: "Dernières parts à 9 €" },
    { titres: [["Poulet basquaise", "🍽️", "12 €"]], v: 97, r: 2, a: 1 },
    { titres: [["Soirée tapas", "🍷"], ["Plat du jour : axoa", "🍽️", "13 €"]], v: 233, r: 11, a: 6, p: "Soirée tapas" },
  ],
  "as-coif": [
    { titres: [["Deux créneaux libres cet après-midi", "✂️"]], v: 88, r: 2, a: 2 },
    { titres: [["Désistement à 15 h", "⏳"]], v: 124, r: 3, a: 5, p: "Désistement à 15 h" },
    { titres: [["Nouvelle prestation : soin cuir chevelu", "💆", "28 €"]], v: 76, r: 1, a: 2 },
    { titres: [["Créneau de 11 h libéré", "⏳"]], v: 143, r: 4, a: 3 },
  ],
  "as-ongle": [
    { titres: [["Créneau de 15 h libre", "💅"]], v: 91, r: 3, a: 4 },
    { titres: [["Pose gel — nouvelle collection", "💅", "35 €"]], v: 118, r: 2, a: 6, p: "Pose gel — nouvelle collection" },
    { titres: [["Désistement à 10 h 30", "⏳"]], v: 64, r: 1, a: 1 },
  ],
  "as-mode": [
    { titres: [["Arrivage lin d'été", "👗"]], v: 154, r: 0, a: 7 },
    { titres: [["Dernières tailles — fin de série", "🏷️", "-40 %"]], v: 209, r: 0, a: 5, p: "Dernières tailles — fin de série" },
    { titres: [["Nouvelle collection en vitrine", "👗"]], v: 96, r: 0, a: 2 },
  ],
  "as-fleur": [
    { titres: [["Arrivage pivoines", "💐", "18 €"]], v: 131, r: 5, a: 4, p: "Arrivage pivoines" },
    { titres: [["4 bouquets à emporter ce soir", "⏳", "12 €"]], v: 87, r: 3, a: 1 },
    { titres: [["Bouquets de la Saint-Vincent", "💐", "22 €"]], v: 165, r: 6, a: 3 },
  ],
  "as-bar": [
    { titres: [["Concert ce soir — trio jazz", "🎷"]], v: 287, r: 0, a: 12, p: "Concert ce soir — trio jazz" },
    { titres: [["Terrasse ouverte", "🍷"], ["Ardoise du jour", "🧀"]], v: 112, r: 0, a: 3 },
    { titres: [["Dégustation vins nature", "🍷", "12 €"]], v: 176, r: 8, a: 6 },
  ],
};

/** Le jour d'il y a `n` jours, en `AAAA-MM-JJ`. */
function ilYaNJours(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * SES JOURNÉES, DE LA PLUS RÉCENTE À LA PLUS ANCIENNE.
 *
 * Les vraies d'abord — ce sont les siennes — puis celles de démonstration, qui
 * remontent le temps derrière. Une vraie journée ne se fait donc jamais pousser
 * hors de l'écran par une fausse.
 */
export function journeesPassees(commerce: string): JourneePassee[] {
  const vraies = lire()
    .filter((x) => x.commerce === commerce)
    .sort((a, b) => (a.jour < b.jour ? 1 : -1));
  const dejaLa = new Set(vraies.map((x) => x.jour));
  const demo = (DEMO[commerce] ?? []).map((d, i) => ({
    commerce,
    jour: ilYaNJours(i + 1 + vraies.length),
    moments: d.titres.map(([titre, icone, prix]) => ({ titre, icone, prix })),
    vues: d.v,
    reservations: d.r,
    abonnes: d.a,
    phare: d.p,
    demo: true,
  }));
  return [...vraies, ...demo.filter((d) => !dejaLa.has(d.jour))];
}

/** Ce que la semaine a donné en tout — la ligne qu'il retient. */
export function totalSemaine(v: JourneePassee[]) {
  const sept = v.slice(0, 7);
  return {
    jours: sept.length,
    vues: sept.reduce((n, x) => n + (x.vues ?? 0), 0),
    reservations: sept.reduce((n, x) => n + (x.reservations ?? 0), 0),
    abonnes: sept.reduce((n, x) => n + (x.abonnes ?? 0), 0),
    annonces: sept.reduce((n, x) => n + x.moments.length, 0),
  };
}
