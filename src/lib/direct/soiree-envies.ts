/**
 * 🎶 « TU VIENS POUR… » — ce que j'ai dit d'une soirée, sur ce téléphone.
 *
 * Jusqu'à deux envies parmi les sept (`INTENTIONS`), un petit mot facultatif,
 * et le choix de me montrer ou non. « Tu pourras modifier ou retirer ton
 * intention » : on la réécrit ou on l'efface, rien d'autre ne la garde.
 *
 * Dans la démonstration, elle reste sur le téléphone ; le salon public de la
 * soirée, lui, apprend seulement que je viens (une ligne dans le fil).
 */
export type MesEnvies = { envies: string[]; mot: string; visible: boolean; at: number };

const CLE = "clikme-soiree-envies-v1";
export const AUCUNES_ENVIES: Record<string, MesEnvies> = {};
let cache: Record<string, MesEnvies> | null = null;
const abonnes = new Set<() => void>();

export function chargerEnvies(): Record<string, MesEnvies> {
  if (cache) return cache;
  if (typeof window === "undefined") return AUCUNES_ENVIES;
  try {
    cache = JSON.parse(window.localStorage.getItem(CLE) || "{}") as Record<string, MesEnvies>;
  } catch {
    cache = {};
  }
  return cache;
}

export function abonnerEnvies(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

/** Pose (ou retire, avec `null`) mon intention pour une soirée. */
export function poserEnvies(soiree: string, e: MesEnvies | null) {
  const n = { ...chargerEnvies() };
  if (e) n[soiree] = { ...e, envies: e.envies.slice(0, 2) };
  else delete n[soiree];
  cache = n;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(n));
  } catch {
    /* refusé : elle vit le temps de la visite */
  }
  abonnes.forEach((f) => f());
}
