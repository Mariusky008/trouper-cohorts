/**
 * ⚡ LA DERNIÈRE FOIS, TOUT DE SUITE (15 novembre 2026, le propriétaire : « quand j'ouvre l'app c'est très très long à
 * charger […] il faudrait que ce soit quasi instantané, autrement les gens ne vont plus venir ») : ce que l'écran a
 * montré la dernière fois est gardé sur CE téléphone ; à l'ouverture, il se montre aussitôt, pendant que le serveur
 * répond — et sa réponse le remplace dès qu'elle arrive.
 *
 * (21 novembre 2026, le propriétaire : « j'aimerais que ça soit quasi automatique quand j'arrive sur l'application et
 * quand je change de page, comme WhatsApp ») :
 *   · gardé plus longtemps — 20 heures pour ce qui montre des images signées (elles valent au moins 24 heures :
 *     `SIGNEE_AU_MOINS_S`), trois jours pour le reste (des adresses stables) ; avant : 45 minutes, la mémoire était
 *     presque toujours périmée à l'ouverture suivante ;
 *   · rangé PAR COMPTE (`poserProprietaire`, une empreinte de lui donnée par la page) : un autre compte sur ce téléphone
 *     ne voit jamais ce que voyait le premier ; sans empreinte, rien n'est lu ni gardé ;
 *   · tous les onglets : sa figurine, Découvrir (sa télé du jour, les salons, ses vidéos déjà vues, les maisons à
 *     visiter), Messages, Ma maison ; et ceux qu'il n'a pas encore ouverts se préparent en douce (`prechauffer`) : changer
 *     d'onglet montre tout de suite.
 *
 * Rien ne part d'ici : c'est ce que ce téléphone avait déjà reçu. Un navigateur qui refuse le stockage : rien ne change.
 */
const VINGT_HEURES = 20 * 3600_000;
const TROIS_JOURS = 3 * 24 * 3600_000;
let proprietaire = "";

/** (la page : l'empreinte du compte de ce téléphone — vide sans compte) */
export function poserProprietaire(qui: string): void {
  proprietaire = /^[0-9a-f]{8,32}$/.test(qui) ? qui : "";
}
const cleDe = (cle: string) => (proprietaire ? `${cle}:${proprietaire}` : "");

/** Ce que cet écran a montré la dernière fois (rien : trop vieux, un autre compte, ou jamais). */
export function lireMemoire<T>(cle: string, duree = dureeDe(cle)): T | null {
  const k = cleDe(cle);
  if (!k) return null;
  try {
    const x = JSON.parse(window.localStorage.getItem(k) ?? "null") as { le?: number; v?: T } | null;
    return x && typeof x.le === "number" && Date.now() - x.le < duree && x.v != null ? x.v : null;
  } catch {
    return null;
  }
}
/** Quand il l'a gardé (0 : rien). */
export function ageMemoire(cle: string): number {
  const k = cleDe(cle);
  if (!k) return Infinity;
  try {
    const x = JSON.parse(window.localStorage.getItem(k) ?? "null") as { le?: number } | null;
    return x && typeof x.le === "number" ? Date.now() - x.le : Infinity;
  } catch {
    return Infinity;
  }
}

export function ecrireMemoire(cle: string, v: unknown): void {
  const k = cleDe(cle);
  if (!k) return;
  try {
    if (v == null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, JSON.stringify({ le: Date.now(), v }));
  } catch {
    /* (stockage plein ou refusé : la prochaine ouverture attendra le serveur, comme avant) */
  }
}

/**
 * 🔥 Préparer en douce un écran qu'il n'a pas encore ouvert : sa route, lue une fois (si la mémoire a plus de deux
 * minutes), gardée pour quand il touchera l'onglet. `garder` : ce qu'on garde de la réponse (rien : on ne garde pas).
 */
export async function prechauffer<T>(cle: string, url: string, garder: (j: Record<string, unknown>) => T | null | undefined): Promise<void> {
  if (!proprietaire || ageMemoire(cle) < 2 * 60_000) return;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return;
    const v = garder((await r.json()) as Record<string, unknown>);
    if (v != null) ecrireMemoire(cle, v);
  } catch {
    /* (pas de réseau : l'onglet chargera en s'ouvrant, comme avant) */
  }
}

/** Les clés gardées (une version : un autre format, on repart de zéro). */
export const MEMOIRE_ETAT = "clikme-memoire-etat-2";
export const MEMOIRE_PROCHES = "clikme-memoire-proches-2";
export const MEMOIRE_TELE = "clikme-memoire-tele-1";
export const MEMOIRE_SALONS = "clikme-memoire-salons-1";
export const MEMOIRE_MAISONS = "clikme-memoire-maisons-publiques-1";
export const MEMOIRE_REVOIR = "clikme-memoire-revoir-1";
export const MEMOIRE_MAISON = "clikme-memoire-ma-maison-1";
/** (ce qui montre des images signées : 20 heures ; le reste : trois jours) */
const SIGNEES = new Set([MEMOIRE_ETAT, MEMOIRE_PROCHES]);
function dureeDe(cle: string): number {
  return SIGNEES.has(cle) ? VINGT_HEURES : TROIS_JOURS;
}
