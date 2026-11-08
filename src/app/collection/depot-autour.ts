/**
 * 📍 LE DÉPÔT QUI ATTEND SON MÈME — « Autour » (`autour.tsx`), 7 novembre 2026 : il veut répondre (ou déposer) avec un
 * mème qu'il n'a pas encore fait, « avec sa tête ». « ＋ Nouveau mème » garde son dépôt (le lieu, le mème auquel il
 * répond, son petit mot, qui le voit) et ouvre le studio pour ce lieu-là (`vers-le-studio.ts`, `autour`). Son mème prêt,
 * « 📍 Le déposer » y met le mème et revient sur « Autour », qui rouvre le dépôt, le mème déjà choisi.
 *
 * L'événement suffit quand « Autour » est déjà ouvert ; sinon, le dépôt attend le temps de la visite (`sessionStorage`).
 *
 * FICHIER DU NAVIGATEUR.
 */
import type { Endroit, Qui } from "@/lib/direct/autour";

// (`lieuDonne` : le lieu d'où il est venu, qu'on ne change pas ; `lieu` : celui qu'il avait choisi dans la liste ;
// `endroit` : un endroit de la ville qu'il avait cherché — la gare, une rue —, où son mème ira « quelque part par ici »)
export type DepotEnCours = { lieuDonne?: string; lieu?: string; endroit?: Endroit; reponseA?: string; ailleurs?: boolean; nomLieu?: string; mot?: string; qui?: Qui; meme?: string };

export const EVT_VERS_AUTOUR = "clikme-vers-autour";
const CLE = "clikme-depot-autour-v1";

function lire(): DepotEnCours | null {
  try {
    const brut = window.sessionStorage.getItem(CLE);
    const d = brut ? (JSON.parse(brut) as DepotEnCours) : null;
    return d && typeof d === "object" ? d : null;
  } catch {
    return null;
  }
}

/** Son dépôt, gardé pendant qu'il fait son mème. */
export function garderLeDepot(d: DepotEnCours) {
  try {
    window.sessionStorage.setItem(CLE, JSON.stringify(d));
  } catch {
    /* rien de gardé : il retrouvera « Autour » tel qu'il l'a laissé */
  }
}

export function oublierLeDepot() {
  try {
    window.sessionStorage.removeItem(CLE);
  } catch {
    /* rien à oublier */
  }
}

/** Son mème est prêt : il rejoint le dépôt, et « Autour » s'ouvre dessus. */
export function revenirAuDepot(meme: string) {
  const d = { ...(lire() ?? {}), meme };
  garderLeDepot(d);
  window.dispatchEvent(new CustomEvent<DepotEnCours>(EVT_VERS_AUTOUR, { detail: d }));
  if (window.location.hash !== "#autour") window.location.hash = "autour";
}

/** Le dépôt qui attendait son mème (une fois : il est oublié aussitôt). Sans mème, rien : il n'a pas fini. */
export function reprendreLeDepot(): DepotEnCours | null {
  const d = lire();
  if (!d?.meme) return null;
  oublierLeDepot();
  return d;
}
