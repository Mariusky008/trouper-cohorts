/**
 * 🔀 D'OÙ L'APPLICATION TIRE SES COMMERCES — la démonstration, ou une vraie ville.
 *
 * « La véritable app devra être répliquée au niveau UX, UI et fonctionnalités
 * sur clikme.fr/ville/dax. » L'application (`apercu-habitant.tsx` et la
 * vingtaine d'écrans qu'elle ouvre) lit ses commerces par `toutesLesCartes()`
 * et ses événements par `evenementsDeLaVille()`, à des dizaines d'endroits.
 * Plutôt que de lui faire porter une seconde liste jusque dans chaque écran,
 * ces deux fonctions consultent ici une SOURCE : vide, c'est la démonstration ;
 * posée, ce sont les commerçants de la ville — voir `ville-reelle.ts`.
 *
 * ELLE N'EST POSÉE QUE DANS LE NAVIGATEUR, et c'est la garantie qui compte. Le
 * serveur sert les pages de tout le monde à la fois : une liste posée là pour
 * Dax se serait retrouvée dans la démonstration de quelqu'un d'autre. Côté
 * navigateur, un onglet n'ouvre qu'une page à la fois, et `/ville/<ville>`
 * retire sa source en partant (`VilleReelleApp`).
 *
 * FICHIER PARTAGÉ.
 */
import type { CarteAutour, EvenementVille } from "./apercu-habitant";

type Source = { cartes: CarteAutour[]; evenements: EvenementVille[] };

let source: Source | null = null;

/** Poser (ou retirer, avec `null`) la vraie ville. Sans effet côté serveur. */
export function poserLaSource(s: Source | null): void {
  if (typeof window === "undefined") return;
  source = s;
}

export const cartesDeLaSource = (): CarteAutour[] | null => source?.cartes ?? null;
export const evenementsDeLaSource = (): EvenementVille[] | null => source?.evenements ?? null;
