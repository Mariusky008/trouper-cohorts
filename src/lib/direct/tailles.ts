// 📏 LES TAILLES QU'IL LUI RESTE — et c'est un tout autre objet que les tailles
// qu'il vend.
//
// ═══ LA RÈGLE QUI DÉCIDE DE TOUT LE FICHIER ═════════════════════════════════
//
// ON AFFICHE CE QUI RESTE, JAMAIS CE QUI EXISTE. « Tailles 36 à 44 » sur une
// vitrine ne veut rien dire : c'est la plage du fabricant, elle est vraie le
// jour de la livraison et fausse le surlendemain. Ce qui fait traverser la
// ville, c'est « il en reste une, et c'est une 38 » — une phrase que seul le
// commerçant peut dire, et que personne ne dit aujourd'hui nulle part.
//
// C'est aussi ce qui distingue ce champ de `taille` sur un modèle (voir
// `Piece`/`Modele` dans `fantomes.ts`) : là-bas, c'est la taille que porte
// CELLE QUI MONTRE la pièce — « ça tombe comme ça sur une M ». Ici, c'est
// l'état du portant. Les deux répondent à deux questions différentes et il ne
// faut surtout pas les confondre dans un même affichage.
//
// ═══ POURQUOI ÇA SE PÉRIME, ET CE QU'ON EN FAIT ═════════════════════════════
//
// UN STOCK DÉCLARÉ NE RESTE PAS VRAI. Le commerçant coche ses tailles un mardi
// d'arrivage ; trois semaines plus tard, la déclaration est un souvenir. Or
// c'est exactement le genre d'information sur laquelle quelqu'un se déplace —
// et une personne qui traverse la ville pour une 38 qui est partie depuis
// quinze jours n'y retourne pas.
//
// ON NE L'EFFACE PAS, ON ARRÊTE D'AFFIRMER. Effacer punirait le commerçant qui
// a pris la peine de remplir ; continuer à affirmer punirait son client. Au-delà
// de QUINZE JOURS, la liste reste affichée mais elle est datée en toutes
// lettres — « indiqué il y a trois semaines » — et l'écran cesse de la
// présenter comme un fait d'aujourd'hui. C'est la même règle que partout
// ailleurs dans ce produit : sans chiffre sûr, on se tait ; avec un chiffre
// vieux, on dit son âge.
//
// ═══ CE QUE CE FICHIER N'EST PAS ════════════════════════════════════════════
//
// Pas un stock, pas un inventaire, pas un dos. Une déclaration au pouce, rangée
// dans le navigateur comme les remises et les mises en avant. Le jour où il y a
// un serveur, c'est la forme de `TaillesPiece` qui part — rien d'autre.

/* ═══ LES ÉCHELLES ══════════════════════════════════════════════════════════

   TROIS, ET PAS UNE DE PLUS. Le prêt-à-porter féminin compte en chiffres, le
   reste en lettres, et une écharpe n'a pas de taille du tout. Proposer les
   pointures, les tours de cou et les longueurs d'entrejambe transformerait le
   geste de dix secondes en formulaire — c'est-à-dire en geste qu'on ne fait
   pas.

   LE COMMERÇANT NE CHOISIT PAS SON ÉCHELLE, IL TAPE CE QU'IL A. Une question
   de plus avant la première pastille, c'est un abandon de plus ; les trois
   rangées sont là, il touche dans celle qui le concerne. */
export type CleEchelle = "chiffres" | "lettres" | "unique";

export const ECHELLES: { cle: CleEchelle; label: string; tailles: string[] }[] = [
  { cle: "chiffres", label: "En chiffres", tailles: ["34", "36", "38", "40", "42", "44", "46", "48"] },
  { cle: "lettres", label: "En lettres", tailles: ["XS", "S", "M", "L", "XL", "XXL"] },
  { cle: "unique", label: "Sans taille", tailles: ["Taille unique"] },
];

/**
 * ═══ QUI A DES TAILLES, ET QUI N'EN A PAS ══════════════════════════════════
 *
 * UNE SEULE BRANCHE, ET C'EST VOLONTAIREMENT PEU. Une coupe de cheveux, un
 * bouquet, une pose d'ongles, une assiette n'ont pas de taille ; poser la
 * question au fleuriste, c'est lui apprendre que cet écran contient des blocs
 * qui ne le concernent pas, et c'est ainsi qu'on cesse de lire un écran.
 *
 * LES MONTURES ET LES POINTURES NE SONT PAS ICI, et pas par oubli : on ne
 * choisit pas des lunettes par leur taille, et une pointure est une autre
 * échelle qu'il faudrait dessiner en entier. Le jour où un lunetier ou un
 * chausseur le demande, c'est une quatrième échelle et une branche de plus —
 * pas un champ libre.
 */
export const BRANCHES_A_TAILLE = ["mode"];

export function seTaille(branche: string | undefined): boolean {
  return !!branche && BRANCHES_A_TAILLE.includes(branche);
}

/** Toutes les tailles connues, dans l'ordre des échelles. */
export const TOUTES_LES_TAILLES: string[] = ECHELLES.flatMap((e) => e.tailles);

/** Le rang d'une taille sur son échelle. `-1` : on ne la connaît pas. */
export function rangDeLaTaille(t: string): number {
  return TOUTES_LES_TAILLES.indexOf(t);
}

/**
 * REMETTRE UNE LISTE DANS L'ORDRE DE L'ÉCHELLE.
 *
 * Il coche 42 puis 36 parce que c'est l'ordre dans lequel il les a en main ;
 * « Tailles 42, 36 » se lit comme une erreur de saisie, et ça l'est. Ce qu'on
 * ne connaît pas reste à la fin, dans l'ordre où c'est arrivé.
 */
export function ordonner(tailles: string[]): string[] {
  return [...new Set(tailles)].sort((a, b) => {
    const ra = rangDeLaTaille(a);
    const rb = rangDeLaTaille(b);
    if (ra < 0 && rb < 0) return 0;
    if (ra < 0) return 1;
    if (rb < 0) return -1;
    return ra - rb;
  });
}

/**
 * SUR QUELLE ÉCHELLE IL COMPTE, D'APRÈS CE QU'IL A DÉJÀ COCHÉ.
 *
 * LE PREMIER APPUI DÉCIDE, ET LES AUTRES RANGÉES DISPARAISSENT. Une pièce est
 * chiffrée ou lettrée, jamais les deux ; garder les quinze pastilles à l'écran
 * après le premier appui, c'est laisser croire qu'on peut cocher « 38 » et
 * « M » pour la même robe. `null` : rien n'est coché, on montre tout.
 */
export function echelleEnCours(restantes: string[]): CleEchelle | null {
  for (const e of ECHELLES) if (restantes.some((t) => e.tailles.includes(t))) return e.cle;
  return null;
}

/* ═══ CE QUI EST DÉCLARÉ, ET DEPUIS QUAND ═══════════════════════════════════ */

export type TaillesPiece = {
  /** Le commerce. Deux boutiques partagent le même mur : la pièce seule ne suffit pas. */
  carte: string;
  /** L'identifiant de la pièce dans sa collection. */
  piece: string;
  /** CE QU'IL LUI RESTE. Vide = il a tout décoché, c'est-à-dire « plus rien ». */
  restantes: string[];
  /** Le jour de la déclaration, en clair, dans le fuseau du téléphone. */
  maj: string;
};

/** Ce qu'un écran reçoit pour une pièce. `null` quand rien n'a été déclaré. */
export type Tailles = {
  restantes: string[];
  /** Depuis combien de jours c'est déclaré. */
  jours: number;
  /** Faux au-delà de quinze jours : la liste s'affiche, mais datée. */
  aJour: boolean;
};

/** Au-delà, on continue de montrer et on arrête d'affirmer. Voir l'en-tête. */
export const JOURS_DE_CONFIANCE = 15;

const CLE = "clikme-tailles-v1";
const CLE_MOI = "clikme-ma-taille-v1";
const abonnes = new Set<() => void>();
let cache: TaillesPiece[] | null = null;

export const AUCUNE_TAILLE: TaillesPiece[] = [];

function ceJour(): string {
  return new Date().toLocaleDateString("fr-CA");
}

function joursDepuis(jour: string): number {
  const d = Date.parse(`${jour}T00:00:00`);
  if (Number.isNaN(d)) return 0;
  const aujourdhui = Date.parse(`${ceJour()}T00:00:00`);
  return Math.max(0, Math.round((aujourdhui - d) / 86_400_000));
}

export function chargerTailles(): TaillesPiece[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNE_TAILLE;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    cache = Array.isArray(l) && l.length ? (l as TaillesPiece[]) : AUCUNE_TAILLE;
  } catch {
    cache = AUCUNE_TAILLE;
  }
  return cache;
}

/** Le même tableau à chaque appel : c'est ce que demande le rendu serveur. */
export function taillesVides(): TaillesPiece[] {
  return AUCUNE_TAILLE;
}

export function abonnerTailles(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

function ecrire(l: TaillesPiece[]) {
  cache = l.length ? l : AUCUNE_TAILLE;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(l));
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

/**
 * CE QU'IL DÉCLARE POUR UNE PIÈCE — et la date part avec, toujours.
 *
 * UNE DÉCLARATION VIDE EST UNE DÉCLARATION. « Je n'ai plus rien dans cette
 * pièce » est une information, et c'est même la plus utile de toutes : elle
 * évite le déplacement pour rien. On la garde donc en ligne, avec sa date,
 * plutôt que de la confondre avec « il n'a rien rempli ».
 */
export function declarerTailles(carte: string, piece: string, restantes: string[]) {
  const autres = chargerTailles().filter((x) => !(x.carte === carte && x.piece === piece));
  ecrire([...autres, { carte, piece, restantes: ordonner(restantes), maj: ceJour() }]);
}

/** Retirer la déclaration : la pièce redevient muette, elle ne dit pas « zéro ». */
export function retirerLesTailles(carte: string, piece: string) {
  ecrire(chargerTailles().filter((x) => !(x.carte === carte && x.piece === piece)));
}

/**
 * ═══ CE QU'ON SAIT DES TAILLES D'UNE PIÈCE ═════════════════════════════════
 *
 * DEUX SOURCES, ET LA PLUS RÉCENTE GAGNE. Le catalogue porte ce qui a été
 * saisi à l'import (`Piece.tailles`) ; l'écran du commerçant porte ce qu'il a
 * coché depuis. Une déclaration faite à la main est forcément postérieure à
 * l'import, donc elle remplace — jamais elle ne complète, sans quoi une taille
 * décochée reviendrait toute seule par la porte du catalogue.
 *
 * LE CATALOGUE EST RÉPUTÉ À JOUR. Il n'a pas de date : lui donner un âge
 * inventé serait exactement le mensonge que ce fichier existe pour éviter.
 */
export function taillesDeLaPiece(
  carte: string,
  piece: { id: string; tailles?: string[] },
  declarees: TaillesPiece[],
): Tailles | null {
  const sienne = declarees.find((x) => x.carte === carte && x.piece === piece.id);
  if (sienne) {
    const jours = joursDepuis(sienne.maj);
    return { restantes: sienne.restantes, jours, aJour: jours <= JOURS_DE_CONFIANCE };
  }
  if (piece.tailles && piece.tailles.length > 0) {
    return { restantes: ordonner(piece.tailles), jours: 0, aJour: true };
  }
  return null;
}

/* ═══ CE QUE ÇA DONNE EN TOUTES LETTRES ═════════════════════════════════════ */

/**
 * LA PHRASE DES TAILLES.
 *
 * TROIS FORMES, ET C'EST LA LONGUEUR DE LA LISTE QUI DÉCIDE :
 *
 *   · rien          — « Il n'en reste plus » : la seule qui fasse gagner un
 *                     déplacement, donc celle qu'on ne cache pas.
 *   · une seule     — « Taille 38 ». C'est la phrase qui fait venir.
 *   · une suite     — « Tailles 36 à 42 », quand elles se suivent sur
 *                     l'échelle : c'est ainsi qu'un commerçant le dit.
 *   · des trous     — « Tailles 36, 40 et 44 ». On les nomme, parce que la
 *                     plage mentirait : « 36 à 44 » laisserait croire qu'il y
 *                     a du 38, et c'est le déplacement pour rien.
 *
 * ON NE DIT JAMAIS COMBIEN DE PIÈCES. Une seule taille restante ne veut pas
 * dire une seule pièce — il peut en avoir trois en 38. « Dernière pièce » est
 * une affirmation que seul le commerçant peut faire, et il a sa pastille pour
 * ça (voir `RAISONS` dans `mise-en-avant.ts`).
 */
export function phraseDesTailles(t: Tailles): string {
  const l = t.restantes;
  if (l.length === 0) return "Il n’en reste plus";
  if (l.length === 1) return l[0] === "Taille unique" ? "Taille unique" : `Taille ${l[0]}`;

  const rangs = l.map(rangDeLaTaille);
  const continue_ = rangs.every((r, i) => i === 0 || (r >= 0 && rangs[i - 1] >= 0 && r === rangs[i - 1] + 1));
  if (continue_) return `Tailles ${l[0]} à ${l[l.length - 1]}`;

  const tete = l.slice(0, -1).join(", ");
  return `Tailles ${tete} et ${l[l.length - 1]}`;
}

/**
 * L'ÂGE DE LA DÉCLARATION, et seulement quand il compte.
 *
 * Tant qu'elle est fraîche, la dater l'affaiblirait : « indiqué aujourd'hui »
 * fait douter d'une information dont personne ne doutait. Elle n'apparaît donc
 * qu'au moment où elle change la lecture.
 */
export function noteDeFraicheur(t: Tailles): string | null {
  if (t.aJour) return null;
  const semaines = Math.round(t.jours / 7);
  if (semaines < 2) return "Indiqué il y a une semaine";
  if (semaines < 9) return `Indiqué il y a ${semaines} semaines`;
  return "Indiqué il y a plus de deux mois";
}

/* ═══ MA TAILLE ═════════════════════════════════════════════════════════════

   UNE SEULE, CHOISIE UNE FOIS, GARDÉE DANS LE TÉLÉPHONE. C'est la seule donnée
   personnelle de tout ce parcours, et elle ne part nulle part : elle sert à
   trier une grille, pas à profiler quelqu'un. Même règle que `alertes-looks.ts`
   et `pieces-gardees.ts`.

   PAS DE MENSURATIONS, PAS DE PROFIL. « Je fais du 38 » suffit à répondre à la
   seule question qui empêche d'acheter sans essayer ; un tour de poitrine ne
   servirait qu'à nous, et on ne demande rien qui ne serve qu'à nous. */

const abonnesMoi = new Set<() => void>();
let maTailleCache: string | null | undefined;

export function maTaille(): string | null {
  if (maTailleCache !== undefined) return maTailleCache;
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CLE_MOI);
    maTailleCache = v && TOUTES_LES_TAILLES.includes(v) ? v : null;
  } catch {
    maTailleCache = null;
  }
  return maTailleCache;
}

/** Le rendu serveur ne connaît personne : il ne sait pas ma taille. */
export function maTailleVide(): string | null {
  return null;
}

export function abonnerMaTaille(f: () => void) {
  abonnesMoi.add(f);
  return () => {
    abonnesMoi.delete(f);
  };
}

export function choisirMaTaille(t: string | null) {
  maTailleCache = t;
  try {
    if (t) window.localStorage.setItem(CLE_MOI, t);
    else window.localStorage.removeItem(CLE_MOI);
  } catch {
    /* Stockage refusé : le choix vaut pour la session. */
  }
  abonnesMoi.forEach((f) => f());
}

/**
 * EST-CE QU'ELLE EXISTE DANS MA TAILLE ?
 *
 * `null` N'EST PAS `false`, ET C'EST TOUTE LA DIFFÉRENCE. Une pièce dont les
 * tailles ne sont pas déclarées n'est pas « pas à ma taille » : on n'en sait
 * rien. La cacher punirait le commerçant qui n'a pas encore rempli, et
 * priverait le client d'une pièce qui lui allait peut-être. Les écrans traitent
 * donc trois cas, pas deux — oui, non, et on ne sait pas.
 */
export function aMaTaille(t: Tailles | null, mienne: string | null): boolean | null {
  if (!mienne || !t) return null;
  return t.restantes.includes(mienne);
}
