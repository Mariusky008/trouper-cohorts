// 🤍 LES PIÈCES MISES DE CÔTÉ — la poche du cœur, en haut à droite
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// « Quand j'appuie sur "je le mets de côté", le cœur part, mais je ne retrouve
// pas cet article dans le cœur en haut à droite. »
//
// LE GESTE ÉTAIT UNE PROMESSE SANS ADRESSE. Le cœur s'envolait vers le coin,
// ce qui dit très clairement « c'est rangé là-bas » — et il n'y avait rien
// là-bas. `onFavori` existait déjà, mais il garde une CARTE : l'annonce du
// commerce, pas la pièce qu'on vient d'essayer. Le jour où l'on ouvre la
// poche, on y trouvait la friperie et pas la doudoune kaki.
//
// UNE ANIMATION QUI MENT COÛTE PLUS CHER QUE PAS D'ANIMATION. Elle apprend un
// endroit, et l'endroit est vide : la fois suivante, on n'appuie plus.
//
// ═══ CE QU'ON GARDE, ET RIEN DE PLUS ════════════════════════════════════════
//
// De quoi redessiner la ligne d'une poche — la pièce, son prix, sa photo, et
// le commerce où elle est — plus le rendu quand il existe, parce que c'est
// SOI qu'on veut revoir et pas le mannequin du catalogue. Aucun profil, aucune
// mesure : même règle que `alertes-looks.ts`, avec lequel ce fichier partage
// sa mécanique de magasin abonnable.

export type PieceGardee = {
  /** Le commerce où elle se trouve : c'est là qu'on ira la chercher. */
  carte: string;
  /** Le nom du lieu, pour l'écrire sans avoir à le rechercher. */
  lieu: string;
  /** L'identifiant de la pièce chez ce commerçant. */
  piece: string;
  nom: string;
  prix?: string;
  /**
   * LA PHOTO QU'ON MONTRE. C'est le RENDU quand il existe — on se souvient de
   * la pièce sur soi, pas du mannequin — et la photo du catalogue sinon.
   */
  image?: string;
  /** Ce qu'on en a pensé, de un à cinq. Zéro : on n'a pas noté. */
  note: number;
  /** Quand on l'a mise de côté. C'est l'ordre de la poche : le plus récent devant. */
  quand: number;
};

const CLE = "clikme-pieces-gardees-v1";
const abonnes = new Set<() => void>();
let cache: PieceGardee[] | null = null;

export const AUCUNE_PIECE: PieceGardee[] = [];

export function chargerPiecesGardees(): PieceGardee[] {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNE_PIECE;
  try {
    const brut = window.localStorage.getItem(CLE);
    const l = brut ? JSON.parse(brut) : null;
    cache = Array.isArray(l) && l.length ? (l as PieceGardee[]) : AUCUNE_PIECE;
  } catch {
    cache = AUCUNE_PIECE;
  }
  return cache;
}

/** Le même tableau à chaque appel : c'est ce que demande le rendu serveur. */
export function piecesGardeesVides(): PieceGardee[] {
  return AUCUNE_PIECE;
}

export function abonnerPiecesGardees(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

function ecrire(l: PieceGardee[]) {
  cache = l.length ? l : AUCUNE_PIECE;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(l));
  } catch {
    /* Stockage refusé : la session continue en mémoire. */
  }
  abonnes.forEach((f) => f());
}

/**
 * UNE SEULE PAR PIÈCE, ET ELLE SE RETIRE DU MÊME GESTE.
 *
 * Le cœur est un interrupteur, pas un formulaire. Garder deux fois la même
 * pièce donnerait deux lignes dans la poche — le genre de doublon qu'on ne
 * remarque qu'une fois la liste devenue illisible.
 *
 * LE PLUS RÉCENT PASSE DEVANT, parce qu'une poche se lit par le haut et que ce
 * qu'on vient d'y mettre est ce qu'on vient y chercher.
 */
export function basculerPieceGardee(p: Omit<PieceGardee, "quand">) {
  const l = chargerPiecesGardees();
  const deja = l.some((x) => x.carte === p.carte && x.piece === p.piece);
  ecrire(
    deja
      ? l.filter((x) => !(x.carte === p.carte && x.piece === p.piece))
      : [{ ...p, quand: Date.now() }, ...l],
  );
}
