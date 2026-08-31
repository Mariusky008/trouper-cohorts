// CE QU'IL A DÉJÀ PUBLIÉ — et les deux choses très différentes qu'on en fait.
//
// ─── LA QUESTION POSÉE ─────────────────────────────────────────────────────
//
// « Est-ce que le commerçant peut stocker ces annonces quelque part pour qu'on
// puisse les consulter et lui demander s'il a encore ce produit ? Puisqu'on les
// stocke déjà pour les analyses. » Oui — mais pas sous la forme d'une archive,
// et la distinction décide de tout.
//
// ─── NON À « SES ANNONCES PASSÉES » ────────────────────────────────────────
//
// C'est un cimetière. Personne ne feuillette le plat du jour de mardi dernier,
// et une page pleine de choses périmées fait paraître MORT un produit dont
// toute la promesse est d'être vivant. Le jour où l'on ouvre « ses annonces »
// et qu'on tombe sur douze offres expirées, on a appris que ClikMe est un
// endroit où les choses meurent.
//
// ─── OUI À « CE QU'IL FAIT D'HABITUDE » ────────────────────────────────────
//
// C'est la même donnée, retournée. La question que les gens se posent n'est pas
// « qu'a-t-il fait le 12 » mais EST-CE QU'IL REFAIT ÇA, ET QUAND. Et ça,
// l'historique sait y répondre : « la garbure, plutôt le jeudi », « vu quatre
// fois ce mois-ci ». On CALCULE à partir de l'historique, on ne l'affiche pas.
//
// Ça rend vrai deux choses qui existent déjà mais qui sont écrites à la main :
// le catalogue (« ce qu'il propose d'habitude ») et « faites-le revenir ».
// Demain elles se déduisent de ce qu'il a réellement publié.
//
// ─── ET LA VRAIE VALEUR EST DE SON CÔTÉ À LUI ──────────────────────────────
//
// « REMETTRE CELLE-LÀ AUJOURD'HUI. » Un appui, et son annonce d'il y a trois
// jours repart. C'est ce qui lui fait gagner du temps TOUS LES MATINS — donc ce
// qui l'accroche — et c'est aussi ce qui rend le récapitulatif utile : « votre
// garbure du jeudi marche deux fois mieux que celle du mardi » ne sert à rien
// si remettre la garbure demande de tout retaper.

import type { CarteAutour, MomentJour } from "@/lib/direct/apercu-habitant";

/**
 * UNE ANNONCE DÉJÀ PARUE.
 *
 * `ilYa` EST UN NOMBRE DE JOURS, PAS UNE DATE ÉCRITE. Une date en dur dans une
 * fixture vieillit : la maquette dirait « jeudi 28 août » six mois plus tard.
 * Un décalage se recalcule, et le jour de la semaine avec — ce qui est
 * précisément ce dont `ceQuiRevient` a besoin.
 */
export type AnnoncePassee = {
  /** À combien de jours d'aujourd'hui. 1 = hier. */
  ilYa: number;
  titre: string;
  prix?: string;
  /**
   * CE QUE ÇA A PRODUIT. Deux chiffres, pas douze : combien l'ont vue, et
   * combien sont passés à l'acte. Un tableau de bord de commerçant qui affiche
   * un taux de conversion ne se relit jamais.
   */
  vues?: number;
  pris?: number;
};

const JOURS = [
  "dimanche", "lundi", "mardi", "mercredi",
  "jeudi", "vendredi", "samedi",
];

/** Le jour de la semaine d'une annonce parue il y a `ilYa` jours. */
function jourDe(ilYa: number): string {
  const d = new Date();
  d.setDate(d.getDate() - ilYa);
  return JOURS[d.getDay()];
}

/** « il y a 3 jours », « hier », « la semaine dernière ». */
export function quandCetait(ilYa: number): string {
  if (ilYa <= 0) return "aujourd’hui";
  if (ilYa === 1) return "hier";
  if (ilYa < 7) return `${jourDe(ilYa)} dernier`;
  if (ilYa < 14) return "la semaine dernière";
  return `il y a ${Math.round(ilYa / 7)} semaines`;
}

export type Habitude = {
  titre: string;
  /** Combien de fois sur la période retenue. */
  fois: number;
  /** Le jour, s'il y en a un qui domine vraiment. Sinon vide. */
  jour?: string;
  prix?: string;
};

/**
 * CE QUI REVIENT — déduit, jamais déclaré.
 *
 * DEUX SEUILS, ET ILS SONT LÀ POUR NE PAS MENTIR.
 *
 *   · TROIS FOIS MINIMUM pour qu'on parle d'habitude. Deux fois, c'est une
 *     coïncidence, et « il fait ça d'habitude » sur deux occurrences est le
 *     genre de phrase qui fait perdre la confiance d'un seul coup.
 *   · DEUX TIERS SUR LE MÊME JOUR pour oser nommer le jour. En dessous, on dit
 *     combien de fois et on se tait sur le quand — la règle des dégradations du
 *     produit : jamais un chiffre qu'on n'a pas.
 */
export function ceQuiRevient(passees: AnnoncePassee[] = []): Habitude[] {
  const par = new Map<string, AnnoncePassee[]>();
  for (const a of passees) {
    const l = par.get(a.titre) ?? [];
    l.push(a);
    par.set(a.titre, l);
  }
  const out: Habitude[] = [];
  for (const [titre, l] of par) {
    if (l.length < 3) continue;
    const compte = new Map<string, number>();
    for (const a of l) {
      const j = jourDe(a.ilYa);
      compte.set(j, (compte.get(j) ?? 0) + 1);
    }
    let jour: string | undefined;
    for (const [j, n] of compte) {
      if (n / l.length >= 2 / 3) jour = j;
    }
    out.push({ titre, fois: l.length, jour, prix: l[0].prix });
  }
  return out.sort((a, b) => b.fois - a.fois);
}

/**
 * CE QU'IL PEUT REMETTRE — chaque annonce une seule fois.
 *
 * LE DÉFAUT, VU SUR LA CAPTURE : la liste affichait « La fournée de 17 h »
 * quatre fois de suite et « Pain de campagne » trois. C'est exact — il l'a
 * publiée quatre fois — et parfaitement inutile : il n'a pas besoin de choisir
 * LAQUELLE des quatre fournées identiques remettre. Une liste de huit lignes
 * qui en contient deux distinctes se parcourt sans rien y trouver.
 *
 * ON GARDE LA PLUS RÉCENTE, avec ses chiffres : ce sont les derniers, donc les
 * seuls qui renseignent sur ce que ça donne aujourd'hui.
 */
export function aRemettre(passees: AnnoncePassee[] = []): AnnoncePassee[] {
  const vues = new Map<string, AnnoncePassee>();
  for (const a of [...passees].sort((x, y) => x.ilYa - y.ilYa)) {
    if (!vues.has(a.titre)) vues.set(a.titre, a);
  }
  return [...vues.values()];
}

/** « La garbure landaise, plutôt le jeudi · 4 fois ce mois-ci ». */
export function phraseHabitude(h: Habitude): string {
  const q = h.jour ? `plutôt le ${h.jour}` : "sans jour fixe";
  return `${q} · ${h.fois} fois ce mois-ci`;
}

// ═══════════════════════════════════════════════════════════════════════════
// REMETTRE UNE ANNONCE AUJOURD'HUI
// ═══════════════════════════════════════════════════════════════════════════
//
// LE GESTE QUI L'ACCROCHE, ET IL EST PLUS IMPORTANT QUE L'ARCHIVE PUBLIQUE.
// Un boulanger republie à peu près la même chose trois jours sur cinq. Lui
// demander de la retaper chaque matin, c'est lui demander d'arrêter au bout de
// trois semaines. Un appui, et c'est reparti.
//
// SANS SERVEUR, ÇA VIT DANS LE NAVIGATEUR — comme la préparation et les
// suivis. Ce qui est déjà juste et qu'on gardera : le geste, sa place, et le
// fait que la carte remise apparaisse tout de suite dans le paquet.

const CLE = "clikme-remises-v1";
const abonnes = new Set<() => void>();

export type Remise = {
  /** Le commerce concerné. */
  carte: string;
  titre: string;
  prix?: string;
  /** Le jour où on l'a remise, pour qu'elle tombe à minuit. */
  jour: string;
};

export const AUCUNE_REMISE: Remise[] = [];
let cache: Remise[] | null = null;

function ceJour(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * CE QUI EST REMIS AUJOURD'HUI, ET RIEN D'AUTRE.
 *
 * Une annonce remise hier n'a aucune raison d'être encore là ce matin : c'est
 * tout le principe du produit — une annonce par jour, qui tombe à minuit. Le
 * filtre est ici plutôt qu'à l'écriture pour que ça reste vrai même si
 * l'application est restée ouverte toute la nuit.
 */
export function chargerRemises(): Remise[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNE_REMISE;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    const dujour = Array.isArray(l)
      ? (l as Remise[]).filter((r) => r.jour === ceJour())
      : [];
    cache = dujour.length ? dujour : AUCUNE_REMISE;
  } catch {
    cache = AUCUNE_REMISE;
  }
  return cache;
}

export function remisesVides(): Remise[] {
  return AUCUNE_REMISE;
}

export function abonnerRemises(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

export function remettreAujourdhui(carte: string, a: AnnoncePassee) {
  const v = chargerRemises();
  if (v.some((r) => r.carte === carte && r.titre === a.titre)) return;
  const neuf = [...v, { carte, titre: a.titre, prix: a.prix, jour: ceJour() }];
  cache = neuf;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(neuf));
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

export function retirerRemise(carte: string, titre: string) {
  const v = chargerRemises().filter((r) => !(r.carte === carte && r.titre === titre));
  cache = v.length ? v : AUCUNE_REMISE;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v));
  } catch {
    /* idem */
  }
  abonnes.forEach((f) => f());
}

/**
 * LA CARTE, AVEC CE QU'IL VIENT DE REMETTRE.
 *
 * ELLE PASSE EN TÊTE DE SA JOURNÉE, et c'est la seule chose qui compte : il
 * vient d'appuyer, il doit la voir. Une annonce remise qui apparaîtrait
 * cinquième dans son propre programme ferait douter que le bouton ait marché.
 */
export function avecLesRemises(c: CarteAutour, remises: Remise[]): CarteAutour {
  const a = remises.filter((r) => r.carte === c.id);
  if (!a.length) return c;
  const neufs: MomentJour[] = a.map((r) => ({
    de: 0,
    a: 24,
    quand: "aujourd’hui",
    icone: "🔁",
    titre: r.titre,
    prix: r.prix,
    envies: [],
  }));
  return { ...c, moments: [...neufs, ...c.moments] };
}
