/**
 * 🏆 LA COLLECTION DE FIGURINES D'UN COMMERCE — « Chaque fois que je vais chez Bergine, je gagne sa figurine de la
 * saison ; à 10, j'ai la figurine d'or. » (`docs/figurines.md`, section 9.)
 *
 * LA FIGURINE DU COMMERÇANT REMPLACE LES PIÈCES COMME RÉCOMPENSE VISIBLE : le client a son fantôme (c'est lui), le
 * commerçant a sa figurine (c'est elle qu'on gagne). Les pièces deviennent des paliers de la collection.
 *
 * LES RÈGLES, ET SEULEMENT ICI :
 *   · 10 FIGURINES PAR COLLECTION : 4 saisons, 4 temps forts, 2 éditions rares ;
 *   · UNE FIGURINE = UNE VISITE VALIDÉE AU COMPTOIR (`clik_visite`), un jour = une figurine au plus ; ce jour-là, la
 *     plus rare d'abord : une édition rare si le commerce avait annoncé une place libre (un bon plan publié ce jour),
 *     sinon le temps fort en cours, sinon la saison ;
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

export type SorteEdition = "saison" | "temps-fort" | "rare";
export type EtatCase = "gagnee" | "en-cours" | "a-venir" | "manquee" | "rare";

type EditionDatee = {
  cle: string;
  nom: string;
  emoji: string;
  sorte: "saison" | "temps-fort";
  debut: string;
  fin: string;
};

/** Les éditions datées (mois-jour ; une fenêtre peut passer le 31 décembre). */
export const EDITIONS_DATEES: EditionDatee[] = [
  {
    cle: "hiver",
    nom: "Hiver",
    emoji: "❄️",
    sorte: "saison",
    debut: "12-21",
    fin: "03-19",
  },
  {
    cle: "saint-valentin",
    nom: "Saint-Valentin",
    emoji: "💘",
    sorte: "temps-fort",
    debut: "02-07",
    fin: "02-14",
  },
  {
    cle: "printemps",
    nom: "Printemps",
    emoji: "🌸",
    sorte: "saison",
    debut: "03-20",
    fin: "06-20",
  },
  {
    cle: "musique",
    nom: "Fête de la musique",
    emoji: "🎶",
    sorte: "temps-fort",
    debut: "06-14",
    fin: "06-21",
  },
  {
    cle: "ete",
    nom: "Été",
    emoji: "☀️",
    sorte: "saison",
    debut: "06-21",
    fin: "09-22",
  },
  {
    cle: "automne",
    nom: "Automne",
    emoji: "🍂",
    sorte: "saison",
    debut: "09-23",
    fin: "12-20",
  },
  {
    cle: "halloween",
    nom: "Halloween",
    emoji: "🎃",
    sorte: "temps-fort",
    debut: "10-24",
    fin: "10-31",
  },
  {
    cle: "noel",
    nom: "Noël",
    emoji: "🎄",
    sorte: "temps-fort",
    debut: "12-01",
    fin: "12-24",
  },
];
export const RARES = 2;
export const TOTAL_COLLECTION = EDITIONS_DATEES.length + RARES;

/** Les paliers de la collection (voir l'en-tête : ils disent vrai). */
export const PALIERS_COLLECTION = [
  {
    n: 3,
    emoji: "🥈",
    titre: "Prévenu plus tôt",
    dit: "ses bons plans avant les autres",
  },
  {
    n: 6,
    emoji: "🥇",
    titre: "Prévenu en premier",
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

/** La première fenêtre de cette édition qui finit le jour `depuis` ou après. */
export function fenetre(
  e: EditionDatee,
  depuis: string,
): { debut: string; fin: string } {
  const an = +depuis.slice(0, 4);
  for (let y = an - 1; y <= an + 1; y++) {
    const debut = `${y}-${e.debut}`;
    const fin = `${e.fin < e.debut ? y + 1 : y}-${e.fin}`;
    if (fin >= depuis) return { debut, fin };
  }
  return {
    debut: `${an + 1}-${e.debut}`,
    fin: `${e.fin < e.debut ? an + 2 : an + 1}-${e.fin}`,
  };
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
    // le temps fort en cours d'abord (sa fenêtre est courte), puis la saison
    const e = [...EDITIONS_DATEES]
      .sort((a, b) =>
        a.sorte === b.sorte ? 0 : a.sorte === "temps-fort" ? -1 : 1,
      )
      .find(
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
