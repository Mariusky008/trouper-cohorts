/**
 * 🎁 LES CADEAUX OFFERTS — le tirage, les codes, leur validation.
 *
 * NÉ AVEC LES CONSOS DU BAR : « Le commerçant lance "3 consos offertes" dans le
 * salon de sa soirée ; seuls les fantômes qui ont dit "Je compte venir"
 * participent, par tirage au sort plutôt qu'au plus rapide ; chaque gagnant
 * reçoit un code, que le commerçant valide d'un appui ; une seule par personne ;
 * il voit combien sont vraiment venus grâce à ça. »
 *
 * PUIS LE MÊME GESTE POUR TOUS LES MÉTIERS (voir `lib/site-internet/cadeau-offert.ts`
 * pour leurs mots et pour qui en est exclu). Ce qui change d'un cadeau à
 * l'autre tient en deux champs :
 *
 *   · `ou`    — où il est lancé : l'identifiant d'une soirée, ou la clé d'un
 *               salon d'Ensemble (public ou privé) ;
 *   · `parmi` — qui participe : ceux qui comptent venir (une soirée), les
 *               membres du salon, ou ceux qui ont gardé une pièce (mode, déco).
 *
 * LE TIRAGE AU SORT ET NON LE PLUS RAPIDE : un « premier arrivé » récompense
 * celui qui guette les notifications, pas celui qui était là.
 *
 * DANS LA DÉMONSTRATION, TOUT VIT SUR LE TÉLÉPHONE, et le tirage est accéléré
 * (quelques secondes au lieu de quelques minutes) pour qu'on le voie pendant
 * qu'on le montre à un commerçant. Celui qui montre la démo, s'il participe,
 * fait partie des gagnants : c'est ce qu'il vient montrer.
 */
import { PROFILS_CADEAU, type Parmi } from "@/lib/site-internet/cadeau-offert";

export type Gagnant = { nom: string; code: string; moi?: boolean; valide?: number };

/** Les mots du métier, recopiés dans le cadeau : il se lit sans connaître le commerce. */
export type MotsCadeau = { emoji: string; un: string; plusieurs: string; merci: string; sur: string };

export type Cadeau = {
  id: string;
  /** Où il est lancé : une soirée, ou la clé d'un salon. */
  ou: string;
  /** Qui offre : le nom du commerce. */
  par: string;
  parmi: Parmi;
  mots: MotsCadeau;
  /** Combien sont offerts. */
  nombre: number;
  /** « Une boisson au choix, avec ou sans alcool ». */
  quoi: string;
  /** Validité du code, en minutes. */
  duree: number;
  lanceLe: number;
  /** Quand le tirage a lieu. */
  tirageLe: number;
  /** Combien participaient au moment du tirage. */
  participants?: number;
  gagnants: Gagnant[] | null;
  /** Le gagnant (moi) a vu son ticket : le grand écran ne revient pas. */
  vu?: boolean;
};

export const MOTS_DU_BAR: MotsCadeau = (({ emoji, un, plusieurs, merci, sur }) => ({ emoji, un, plusieurs, merci, sur }))(PROFILS_CADEAU.bar);

/** Le tirage de la démonstration, accéléré. */
export const ATTENTE_TIRAGE_MS = 10000;

const CLE = "clikme-cadeaux-v2";
export const AUCUN_CADEAU: Record<string, Cadeau> = {};
let cache: Record<string, Cadeau> | null = null;
const abonnes = new Set<() => void>();

export function chargerCadeaux(): Record<string, Cadeau> {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUN_CADEAU;
  try {
    cache = JSON.parse(window.localStorage.getItem(CLE) || "{}") as Record<string, Cadeau>;
  } catch {
    cache = {};
  }
  return cache;
}
export function abonnerCadeaux(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}
function garder(n: Record<string, Cadeau>) {
  cache = n;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(n));
  } catch {
    /* refusé : il vit le temps de la visite */
  }
  abonnes.forEach((f) => f());
}

/** La fin de validité des codes. */
export const finDuCadeau = (c: Cadeau) => c.tirageLe + c.duree * 60_000;

/** Le commerçant lance son cadeau : le tirage aura lieu dans quelques secondes. */
export function lancerCadeau(
  ou: string,
  o: { nombre: number; quoi: string; duree: number; par: string; parmi: Parmi; mots: MotsCadeau },
): Cadeau {
  const maintenant = Date.now();
  const c: Cadeau = {
    id: `c${maintenant.toString(36)}`,
    ou,
    par: o.par,
    parmi: o.parmi,
    mots: o.mots,
    nombre: Math.max(1, Math.min(5, Math.round(o.nombre))),
    quoi: o.quoi.trim().slice(0, 80) || "Un cadeau",
    duree: Math.max(15, Math.min(60 * 24 * 30, Math.round(o.duree) || 45)),
    lanceLe: maintenant,
    tirageLe: maintenant + ATTENTE_TIRAGE_MS,
    gagnants: null,
  };
  garder({ ...chargerCadeaux(), [ou]: c });
  return c;
}

const code = () => `CLK-${String(1000 + Math.floor(Math.random() * 9000))}`;

/**
 * LE TIRAGE ATTEND CELUI QUI EST EN TRAIN DE DIRE QU'IL VIENT : tant que la
 * feuille « Tu viens pour… » est ouverte, il est retenu. Tenu ici et non dans
 * l'écran, parce que plusieurs écrans du même lieu peuvent vivre en même
 * temps et que n'importe lequel peut tirer.
 */
const retenus = new Map<string, number>();
const retenusJusqua = new Map<string, number>();
export function retenirTirage(ou: string) {
  retenus.set(ou, (retenus.get(ou) ?? 0) + 1);
  return () => {
    const n = (retenus.get(ou) ?? 1) - 1;
    if (n > 0) retenus.set(ou, n);
    else retenus.delete(ou);
    // LA FEUILLE REFERMÉE, LE CHEMIN EST FAIT : plus besoin d'attendre.
    retenusJusqua.delete(ou);
  };
}
/** Le temps de choisir son fantôme, avant même la feuille : au plus quelques secondes. */
export function retenirTiragePour(ou: string, ms: number) {
  retenusJusqua.set(ou, Date.now() + ms);
}

/** Le tirage, parmi ceux qui participent. Une fois par lancement. */
export function tirer(ou: string, candidats: { nom: string; moi?: boolean }[]) {
  const c = chargerCadeaux()[ou];
  if (!c || c.gagnants || retenus.has(ou) || (retenusJusqua.get(ou) ?? 0) > Date.now()) return;
  // UNE SEULE PAR PERSONNE : un nom qui revient (membre ET favori) ne compte qu'une fois.
  const vus = new Set<string>();
  const uniques = candidats.filter((x) => (vus.has(x.nom) ? false : (vus.add(x.nom), true)));
  const moi = uniques.find((x) => x.moi);
  const autres = uniques.filter((x) => !x.moi).sort(() => Math.random() - 0.5);
  const elus = [...(moi ? [moi] : []), ...autres].slice(0, c.nombre);
  garder({
    ...chargerCadeaux(),
    [ou]: { ...c, participants: uniques.length, gagnants: elus.map((x) => ({ nom: x.nom, code: code(), ...(x.moi ? { moi: true } : {}) })) },
  });
}

/** Le commerçant valide un code d'un appui : la personne est venue. */
export function validerCode(ou: string, codeAValider: string): boolean {
  const c = chargerCadeaux()[ou];
  if (!c?.gagnants) return false;
  const g = c.gagnants.find((x) => x.code === codeAValider.trim().toUpperCase());
  if (!g || g.valide || Date.now() > finDuCadeau(c)) return false;
  garder({ ...chargerCadeaux(), [ou]: { ...c, gagnants: c.gagnants.map((x) => (x === g ? { ...x, valide: Date.now() } : x)) } });
  return true;
}

export function ticketVu(ou: string) {
  const c = chargerCadeaux()[ou];
  if (c) garder({ ...chargerCadeaux(), [ou]: { ...c, vu: true } });
}

/** Une nouvelle démonstration : on efface le lancement. */
export function oublierCadeau(ou: string) {
  const n = { ...chargerCadeaux() };
  delete n[ou];
  garder(n);
}
