/**
 * 🎁 LES CONSOS OFFERTES — le geste du bar quand la soirée est calme.
 *
 * « Le commerçant lance "3 consos offertes" dans le salon de sa soirée ; seuls
 * les fantômes qui ont dit "Je compte venir" participent, par tirage au sort
 * plutôt qu'au plus rapide ; chaque gagnant reçoit un code valable 30 à 45
 * minutes, que le bar valide d'un appui ; une seule par personne et par soirée ;
 * le commerçant voit combien sont vraiment venus grâce à ça. »
 *
 * LE TIRAGE AU SORT ET NON LE PLUS RAPIDE : un « premier arrivé » récompense
 * celui qui guette les notifications, pas celui qui avait prévu de venir. Seuls
 * ceux qui ont dit qu'ils venaient participent — c'est ce qui écarte les
 * chasseurs de gratuit.
 *
 * DANS LA DÉMONSTRATION, TOUT VIT SUR LE TÉLÉPHONE, et le tirage est accéléré
 * (quelques secondes au lieu de quelques minutes) pour qu'on le voie pendant
 * qu'on le montre à un bar. Celui qui montre la démo et a dit « Je compte
 * venir » fait partie des gagnants : c'est ce qu'il vient montrer.
 */
import { QUOI_CONSO_PAR_DEFAUT } from "@/lib/site-internet/consos-offertes";

export type Gagnant = { nom: string; code: string; moi?: boolean; valide?: number };
export type Cadeau = {
  id: string;
  soiree: string;
  /** Combien sont offertes. */
  nombre: number;
  /** « Une boisson au choix, avec ou sans alcool ». */
  quoi: string;
  /** Validité du code, en minutes. */
  duree: number;
  lanceLe: number;
  /** Quand le tirage a lieu. */
  tirageLe: number;
  /** Combien comptaient venir au moment du tirage. */
  participants?: number;
  gagnants: Gagnant[] | null;
  /** Le gagnant (moi) a vu son ticket : le grand écran ne revient pas. */
  vu?: boolean;
};

export { QUOI_CONSO_PAR_DEFAUT as QUOI_PAR_DEFAUT } from "@/lib/site-internet/consos-offertes";
/** Le tirage de la démonstration, accéléré. */
export const ATTENTE_TIRAGE_MS = 10000;

const CLE = "clikme-cadeaux-v1";
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

/** Le bar lance ses consos : le tirage aura lieu dans quelques secondes. */
export function lancerCadeau(soiree: string, o: { nombre: number; quoi: string; duree: number }): Cadeau {
  const maintenant = Date.now();
  const c: Cadeau = {
    id: `c${maintenant.toString(36)}`,
    soiree,
    nombre: Math.max(1, Math.min(5, Math.round(o.nombre))),
    quoi: o.quoi.trim().slice(0, 80) || QUOI_CONSO_PAR_DEFAUT,
    duree: o.duree === 30 ? 30 : 45,
    lanceLe: maintenant,
    tirageLe: maintenant + ATTENTE_TIRAGE_MS,
    gagnants: null,
  };
  garder({ ...chargerCadeaux(), [soiree]: c });
  return c;
}

const code = () => `CLK-${String(1000 + Math.floor(Math.random() * 9000))}`;

/**
 * LE TIRAGE ATTEND CELUI QUI EST EN TRAIN DE DIRE QU'IL VIENT : tant que la
 * feuille « Tu viens pour… » est ouverte, il est retenu. Tenu ici et non dans
 * l'écran, parce que plusieurs écrans de la même soirée peuvent vivre en même
 * temps et que n'importe lequel peut tirer.
 */
const retenus = new Map<string, number>();
const retenusJusqua = new Map<string, number>();
export function retenirTirage(soiree: string) {
  retenus.set(soiree, (retenus.get(soiree) ?? 0) + 1);
  return () => {
    const n = (retenus.get(soiree) ?? 1) - 1;
    if (n > 0) retenus.set(soiree, n);
    else retenus.delete(soiree);
    // LA FEUILLE REFERMÉE, LE CHEMIN EST FAIT : plus besoin d'attendre.
    retenusJusqua.delete(soiree);
  };
}
/** Le temps de choisir son fantôme, avant même la feuille : au plus quelques secondes. */
export function retenirTiragePour(soiree: string, ms: number) {
  retenusJusqua.set(soiree, Date.now() + ms);
}

/** Le tirage, parmi ceux qui comptent venir. Une fois par lancement. */
export function tirer(soiree: string, candidats: { nom: string; moi?: boolean }[]) {
  const c = chargerCadeaux()[soiree];
  if (!c || c.gagnants || retenus.has(soiree) || (retenusJusqua.get(soiree) ?? 0) > Date.now()) return;
  const moi = candidats.find((x) => x.moi);
  const autres = candidats.filter((x) => !x.moi).sort(() => Math.random() - 0.5);
  const elus = [...(moi ? [moi] : []), ...autres].slice(0, c.nombre);
  garder({
    ...chargerCadeaux(),
    [soiree]: { ...c, participants: candidats.length, gagnants: elus.map((x) => ({ nom: x.nom, code: code(), ...(x.moi ? { moi: true } : {}) })) },
  });
}

/** Le bar valide un code d'un appui : la personne est venue. */
export function validerCode(soiree: string, codeAValider: string): boolean {
  const c = chargerCadeaux()[soiree];
  if (!c?.gagnants) return false;
  const g = c.gagnants.find((x) => x.code === codeAValider.trim().toUpperCase());
  if (!g || g.valide || Date.now() > c.tirageLe + c.duree * 60_000) return false;
  garder({ ...chargerCadeaux(), [soiree]: { ...c, gagnants: c.gagnants.map((x) => (x === g ? { ...x, valide: Date.now() } : x)) } });
  return true;
}

export function ticketVu(soiree: string) {
  const c = chargerCadeaux()[soiree];
  if (c) garder({ ...chargerCadeaux(), [soiree]: { ...c, vu: true } });
}

/** Une nouvelle soirée pour la démonstration : on efface le lancement. */
export function oublierCadeau(soiree: string) {
  const n = { ...chargerCadeaux() };
  delete n[soiree];
  garder(n);
}
