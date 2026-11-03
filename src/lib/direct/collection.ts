/**
 * 🏆 LA COLLECTION DE FIGURINES D'UN COMMERCE — « Chaque fois que je vais chez Bergine, je gagne sa figurine de la
 * saison ; à 10, j'ai la figurine d'or. » (`docs/figurines.md`, section 9.)
 *
 * LA FIGURINE DU COMMERÇANT REMPLACE LES PIÈCES COMME RÉCOMPENSE VISIBLE : le client a son fantôme (c'est lui), le
 * commerçant a sa figurine (c'est elle qu'on gagne). Les pièces deviennent des paliers de la collection.
 *
 * LES RÈGLES, ET SEULEMENT ICI :
 *   · UNE ÉDITION PAR MOIS (novembre 2026 — « plus simple pour se repérer qu'avec des saisons ») : douze figurines du
 *     mois, chacune avec son thème (Galette des rois en janvier… Halloween en octobre, Noël en décembre), et deux
 *     éditions rares ;
 *   · LA FIGURINE D'OR À 10 (`TOTAL_COLLECTION`) sur ces quatorze : on peut en manquer quatre ;
 *   · UNE FIGURINE = UNE VISITE VALIDÉE AU COMPTOIR (`clik_visite`), un jour = une figurine au plus ; ce jour-là, la
 *     plus rare d'abord : une édition rare si le commerce avait annoncé une place libre (un bon plan publié ce jour),
 *     sinon la figurine du mois ;
 *   · UNE ÉDITION MANQUÉE EST MANQUÉE : pas de rattrapage, jamais d'achat — c'est la vraie rareté ;
 *   · SA COLLECTION COMMENCE À SA PREMIÈRE VISITE et dure le temps de passer une fois par chaque édition (douze mois) :
 *     on peut la commencer n'importe quel jour et la finir. Après, une nouvelle collection commence.
 *
 * LES PALIERS DISENT VRAI : 3 figurines, c'est au moins 3 visites, donc la pièce d'argent (« plus tôt ») ; 6, au moins
 * 5, donc l'or (« en premier ») — voir `PALIERS` dans `famille.ts`. Le cadeau de la collection complète, seulement
 * s'il l'a choisi lui-même : on n'invente jamais une offre pour un commerçant.
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */

export type SorteEdition = "mois" | "rare";
export type EtatCase = "gagnee" | "en-cours" | "a-venir" | "manquee" | "rare";

type EditionDatee = {
  cle: string;
  nom: string;
  emoji: string;
  sorte: "mois";
  debut: string;
  /** Le dernier jour du mois (« 02-29 » : le 28 les années non bissextiles — voir `finEnAnnee`). */
  fin: string;
};

/** Les éditions datées : une par mois, du premier au dernier jour (mois-jour). */
const mois = (cle: string, nom: string, emoji: string, mm: string, dernier: string): EditionDatee => ({
  cle,
  nom,
  emoji,
  sorte: "mois",
  debut: `${mm}-01`,
  fin: `${mm}-${dernier}`,
});
export const EDITIONS_DATEES: EditionDatee[] = [
  mois("galette", "Galette des rois", "👑", "01", "31"),
  mois("saint-valentin", "Saint-Valentin", "💘", "02", "29"),
  mois("printemps", "Printemps", "🌸", "03", "31"),
  mois("paques", "Pâques", "🐣", "04", "30"),
  mois("fete-des-meres", "Fête des mères", "💐", "05", "31"),
  mois("musique", "Fête de la musique", "🎶", "06", "30"),
  mois("ete", "Été", "☀️", "07", "31"),
  mois("vacances", "Vacances", "🏖️", "08", "31"),
  mois("rentree", "Rentrée", "🎒", "09", "30"),
  mois("halloween", "Halloween", "🎃", "10", "31"),
  mois("automne", "Automne", "🍂", "11", "30"),
  mois("noel", "Noël", "🎄", "12", "31"),
];
export const RARES = 2;
/** Les cases de l'étagère : les douze du mois et les deux rares. */
export const CASES_COLLECTION = EDITIONS_DATEES.length + RARES;
/** LA FIGURINE D'OR : à 10 figurines gagnées dans la collection (sur quatorze) — le chiffre que toutes les pages disent. */
export const TOTAL_COLLECTION: number = 10;

/** Les paliers de la collection (voir l'en-tête : ils disent vrai). */
export const PALIERS_COLLECTION = [
  {
    n: 3,
    emoji: "🥈",
    titre: "Au courant plus tôt",
    dit: "ses bons plans avant les autres",
  },
  {
    n: 6,
    emoji: "🥇",
    titre: "Au courant en premier",
    dit: "ses places libres, en premier",
  },
  {
    n: TOTAL_COLLECTION,
    emoji: "🏆",
    titre: "La figurine d’or",
    dit: "numérotée, rien que pour toi",
  },
] as const;

export type CaseCollection = {
  cle: string;
  nom: string;
  emoji: string;
  sorte: SorteEdition;
  /** Sa fenêtre (« AAAA-MM-JJ ») ; absente pour une édition rare (elle vient avec un creux). */
  debut?: string;
  fin?: string;
  etat: EtatCase;
  /** Le jour où il l'a gagnée. */
  le?: string;
  /** Une édition rare : son numéro chez ce commerce (la 7e gagnée : n° 7). */
  numero?: number;
  /** En cours : les jours qui restent, aujourd'hui compris. */
  reste?: number;
};

export type Collection = {
  /** Le premier jour de cette collection (sa première visite ; aujourd'hui s'il n'est pas encore venu). */
  debut: string;
  /** La combientième collection chez ce commerce (1 : la première). */
  numero: number;
  cases: CaseCollection[];
  gagnees: number;
  total: number;
  /** La figurine à gagner maintenant (ou la prochaine à venir) — sa `cle`. */
  prochaine: string | null;
  complete: boolean;
  /** La figurine d'or de cette collection : son numéro chez ce commerce (le 3e à finir sa collection : n° 3). */
  or?: number;
  /** Ses figurines d'or : une par collection complète chez ce commerce (celle-ci comprise). */
  trophees: { le: string; numero?: number; remis?: string }[];
  /** Le cadeau de cette collection complète, remis au comptoir (le jour, ISO) — voir `remettreCadeau`. */
  remis?: string;
};

// ─── les jours (« AAAA-MM-JJ », heure de Paris, comme `jourParis`) ─────────────────────────────
const jourEnMs = (j: string) =>
  Date.UTC(+j.slice(0, 4), +j.slice(5, 7) - 1, +j.slice(8, 10));
const ecart = (a: string, b: string) =>
  Math.round((jourEnMs(b) - jourEnMs(a)) / 86_400_000);
const dans = (j: string, a: string, b: string) => j >= a && j <= b;

/** Le dernier jour de l'édition, l'année `y` (« AAAA-MM-JJ ») : février finit le 28 les années non bissextiles. */
export function finEnAnnee(e: EditionDatee, y: number): string {
  const an = e.fin < e.debut ? y + 1 : y;
  const bissextile = (an % 4 === 0 && an % 100 !== 0) || an % 400 === 0;
  return `${an}-${e.fin === "02-29" && !bissextile ? "02-28" : e.fin}`;
}

/** La première fenêtre de cette édition qui finit le jour `depuis` ou après. */
export function fenetre(
  e: EditionDatee,
  depuis: string,
): { debut: string; fin: string } {
  const an = +depuis.slice(0, 4);
  for (let y = an - 1; y <= an + 1; y++) {
    const debut = `${y}-${e.debut}`;
    const fin = finEnAnnee(e, y);
    if (fin >= depuis) return { debut, fin };
  }
  return { debut: `${an + 1}-${e.debut}`, fin: finEnAnnee(e, an + 1) };
}

type Gain = { cle: string; le: string; rare: boolean };

/** Une collection, de son premier jour à la fin de sa dernière fenêtre : ce qu'il y gagne, jour après jour. */
function remplir(debut: string, jours: string[], creux: Set<string>) {
  const fenetres = new Map(
    EDITIONS_DATEES.map((e) => [e.cle, fenetre(e, debut)]),
  );
  const fin = [...fenetres.values()].reduce(
    (m, f) => (f.fin > m ? f.fin : m),
    debut,
  );
  const gains: Gain[] = [];
  const pris = new Set<string>();
  let rares = 0;
  for (const j of jours) {
    if (j < debut || j > fin) continue;
    if (creux.has(j) && rares < RARES) {
      rares++;
      gains.push({ cle: `rare-${rares}`, le: j, rare: true });
      continue;
    }
    // la figurine du mois (une seule édition par jour : les mois ne se chevauchent pas)
    const e = EDITIONS_DATEES.find(
        (x) =>
          !pris.has(x.cle) &&
          dans(j, fenetres.get(x.cle)!.debut, fenetres.get(x.cle)!.fin),
      );
    if (!e) continue;
    pris.add(e.cle);
    gains.push({ cle: e.cle, le: j, rare: false });
  }
  return { fenetres, fin, gains };
}

/**
 * SES COLLECTIONS CHEZ UN COMMERCE, D'APRÈS SES VISITES : la collection en cours (la dernière commencée), et les jours
 * où il a gagné une édition rare ou fini une collection (pour les numéroter parmi toute la famille).
 * `visites` : ses jours de visite validée ; `creux` : les jours où le commerce a annoncé une place libre.
 */
export function parcourirCollections(
  visites: string[],
  creux: Set<string>,
  aujourdhui: string,
) {
  const jours = [...new Set(visites.map((v) => v.slice(0, 10)))]
    .filter((j) => j <= aujourdhui)
    .sort();
  const rares: string[] = [];
  const finies: string[] = [];
  let debut = jours[0] ?? aujourdhui;
  let numero = 1;
  for (;;) {
    const r = remplir(debut, jours, creux);
    for (const g of r.gains) if (g.rare) rares.push(g.le);
    if (r.gains.length >= TOTAL_COLLECTION)
      finies.push(r.gains[r.gains.length - 1].le);
    const suivant = jours.find((j) => j > r.fin);
    if (r.fin >= aujourdhui) return { debut, numero, ...r, rares, finies };
    // sa collection est finie (toutes ses fenêtres passées) : la suivante commence à sa prochaine visite — en
    // attendant, on lui montre celle qui commencerait aujourd'hui
    debut = suivant ?? aujourdhui;
    numero++;
    if (!suivant)
      return { debut, numero, ...remplir(debut, [], creux), rares, finies };
  }
}

/** Sa collection en cours, prête à montrer. `numeroRare` / `numeroOr` : son rang dans la famille (voir le serveur). */
export function collectionDe(
  visites: string[],
  creux: Set<string>,
  aujourdhui: string,
  numeroRare: (jour: string) => number | undefined = () => undefined,
  numeroOr: (jour: string) => number | undefined = () => undefined,
): Collection {
  const p = parcourirCollections(visites, creux, aujourdhui);
  const gain = new Map(p.gains.map((g) => [g.cle, g]));
  const cases: CaseCollection[] = EDITIONS_DATEES.map((e) => {
    const f = p.fenetres.get(e.cle)!;
    const g = gain.get(e.cle);
    const base = {
      cle: e.cle,
      nom: e.nom,
      emoji: e.emoji,
      sorte: e.sorte,
      debut: f.debut,
      fin: f.fin,
    } as const;
    if (g) return { ...base, etat: "gagnee", le: g.le };
    if (dans(aujourdhui, f.debut, f.fin))
      return { ...base, etat: "en-cours", reste: ecart(aujourdhui, f.fin) + 1 };
    if (f.debut > aujourdhui) return { ...base, etat: "a-venir" };
    return { ...base, etat: "manquee" };
  });
  // dans l'ordre du calendrier, depuis le début de sa collection
  cases.sort((a, b) => (a.debut ?? "").localeCompare(b.debut ?? ""));
  for (let k = 1; k <= RARES; k++) {
    const g = gain.get(`rare-${k}`);
    cases.push({
      cle: `rare-${k}`,
      nom: "Édition rare",
      emoji: "✨",
      sorte: "rare",
      etat: g ? "gagnee" : "rare",
      ...(g ? { le: g.le, numero: numeroRare(g.le) } : {}),
    });
  }
  const gagnees = p.gains.length;
  const complete = gagnees >= TOTAL_COLLECTION;
  const enCours = cases
    .filter((c) => c.etat === "en-cours")
    .sort((a, b) => (a.reste ?? 99) - (b.reste ?? 99))[0];
  const aVenir = cases
    .filter((c) => c.etat === "a-venir")
    .sort((a, b) => (a.debut ?? "").localeCompare(b.debut ?? ""))[0];
  const derniere = p.gains[p.gains.length - 1]?.le;
  return {
    debut: p.debut,
    numero: p.numero,
    cases,
    gagnees,
    total: TOTAL_COLLECTION,
    prochaine: complete ? null : ((enCours ?? aVenir)?.cle ?? null),
    complete,
    ...(complete && derniere ? { or: numeroOr(derniere) } : {}),
    trophees: p.finies.map((le) => ({ le, numero: numeroOr(le) })),
  };
}

export type EditionDuMoment = {
  cle: string;
  nom: string;
  emoji: string;
  debut: string;
  fin: string;
  /** Les jours qui restent, aujourd'hui compris (en cours) ; ou avant qu'elle commence (à venir). */
  jours: number;
};

/**
 * L'édition qu'on gagne en venant aujourd'hui (celle du mois), et celle qui commence ensuite — pour `/collection`, et
 * pour la figurine du mois du commerçant (`figurine-pro-serveur.ts`).
 */
export function editionsDuMoment(aujourdhui: string): {
  maintenant: EditionDuMoment | null;
  ensuite: EditionDuMoment | null;
} {
  const toutes = EDITIONS_DATEES.map((e) => ({ e, f: fenetre(e, aujourdhui) }));
  const decrire = ({ e, f }: (typeof toutes)[number], jours: number): EditionDuMoment => ({
    cle: e.cle,
    nom: e.nom,
    emoji: e.emoji,
    debut: f.debut,
    fin: f.fin,
    jours,
  });
  const enCours = toutes.find(({ f }) => dans(aujourdhui, f.debut, f.fin));
  const aVenir = toutes
    .filter(({ f }) => f.debut > aujourdhui)
    .sort((a, b) => a.f.debut.localeCompare(b.f.debut))[0];
  return {
    maintenant: enCours ? decrire(enCours, ecart(aujourdhui, enCours.f.fin) + 1) : null,
    ensuite: aVenir ? decrire(aVenir, ecart(aujourdhui, aVenir.f.debut)) : null,
  };
}

/** Le palier suivant de la collection (`null` : complète). */
export const palierSuivant = (gagnees: number) =>
  PALIERS_COLLECTION.find((p) => gagnees < p.n) ?? null;

/** « 20 décembre », « 7 février ». */
export function jourEnClair(j: string): string {
  const mois = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return `${+j.slice(8, 10) === 1 ? "1er" : +j.slice(8, 10)} ${mois[+j.slice(5, 7) - 1]}`;
}
