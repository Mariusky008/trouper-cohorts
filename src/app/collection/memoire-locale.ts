/**
 * ⚡ LA DERNIÈRE FOIS, TOUT DE SUITE (15 novembre 2026, le propriétaire : « quand j'ouvre l'app c'est très très long à
 * charger […] il faudrait que ce soit quasi instantané, autrement les gens ne vont plus venir ») : ce que l'écran a
 * montré la dernière fois est gardé sur CE téléphone (45 minutes : ses images signées valent une heure) ; à l'ouverture,
 * il se montre aussitôt, pendant que le serveur répond — et sa réponse le remplace dès qu'elle arrive.
 *
 * Rien ne part d'ici : c'est ce que ce téléphone avait déjà reçu. Un navigateur qui refuse le stockage : rien ne change.
 */
const DUREE = 45 * 60_000;

export function lireMemoire<T>(cle: string): T | null {
  try {
    const x = JSON.parse(window.localStorage.getItem(cle) ?? "null") as { le?: number; v?: T } | null;
    return x && typeof x.le === "number" && Date.now() - x.le < DUREE && x.v != null ? x.v : null;
  } catch {
    return null;
  }
}

export function ecrireMemoire(cle: string, v: unknown): void {
  try {
    if (v == null) window.localStorage.removeItem(cle);
    else window.localStorage.setItem(cle, JSON.stringify({ le: Date.now(), v }));
  } catch {
    /* (stockage plein ou refusé : la prochaine ouverture attendra le serveur, comme avant) */
  }
}

/** Les clés gardées (une version : un autre format, on repart de zéro). */
export const MEMOIRE_ETAT = "clikme-memoire-etat-1";
export const MEMOIRE_PROCHES = "clikme-memoire-proches-1";
