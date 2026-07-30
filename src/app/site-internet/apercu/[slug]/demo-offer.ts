"use client";

// L'annonce que le commerçant vient d'écrire dans la maquette.
//
// La démo promet : « dites une phrase, elle s'affiche partout sur votre site ».
// Quatre endroits le montrent — le bandeau du haut, le catalogue, l'aperçu de
// notification, et le collectif. Chacun affichait son propre exemple figé, si
// bien que l'annonce réellement écrite n'apparaissait nulle part.
//
// Un seul canal, donc : l'Action Flash publie ici, les quatre surfaces écoutent.
// Rien n'est enregistré côté serveur — c'est une simulation, et elle ne dure que
// le temps de la visite (sessionStorage, pour survivre à un rechargement).
import { useSyncExternalStore } from "react";

const EVT = "mqc:demo-offer";
const KEY = "popey-demo-offer";

/** L'annonce en cours dans cette session de démo, ou "" si aucune. */
export function currentDemoOffer(): string {
  try {
    return window.sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

/** Appelé quand le commerçant publie son annonce dans la maquette. */
export function publishDemoOffer(text: string): void {
  const t = String(text || "").trim();
  if (!t) return;
  try {
    window.sessionStorage.setItem(KEY, t);
  } catch {
    /* mode privé : l'évènement suffit pour la visite en cours */
  }
  try {
    window.dispatchEvent(new CustomEvent(EVT, { detail: t }));
  } catch {
    /* best-effort */
  }
}

function subscribe(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

/**
 * Le texte à afficher : l'annonce du commerçant si elle existe, sinon l'exemple
 * du métier. Les composants s'y abonnent et se remettent à jour tout seuls.
 *
 * `fallback` reste affiché tant qu'il n'a rien écrit — la démo doit montrer à
 * quoi ça ressemble avant qu'il essaie.
 */
export function useDemoOffer(fallback?: string): string | undefined {
  // useSyncExternalStore plutôt qu'un effet : pas de différence d'hydratation
  // (le serveur ne connaît pas sessionStorage) et pas de rendu intermédiaire.
  const live = useSyncExternalStore(subscribe, currentDemoOffer, () => "");
  return live || fallback;
}
