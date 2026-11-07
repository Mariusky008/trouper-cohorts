/**
 * 🎭 VERS LE STUDIO — 7 novembre 2026 (on resserre sur le mème : « tout ce qu'on gagne sert à faire des mèmes »). Depuis
 * n'importe quel onglet : une réplique de sa figurine dans un épisode (« Fais-en un mème »), sa figurine du mois (« Fais-la
 * parler »)… le studio (« Créer ») s'ouvre, avec le texte écrit ou le look choisi.
 *
 * Le studio écoute l'événement ; s'il n'est pas encore là (sa figurine se fabrique), la demande l'attend le temps de la
 * visite (`sessionStorage`).
 *
 * FICHIER DU NAVIGATEUR.
 */
// (`theme` : 🔥 il répond au mème du jour — sa clé ; `ville` : la sienne, pour le bouton « visible par les gens de … »)
export type VersLeStudio = { texte?: string; look?: string; theme?: string; ville?: string };

export const EVT_VERS_LE_STUDIO = "clikme-vers-le-studio";
const CLE = "clikme-vers-le-studio-v1";

export function versLeStudio(x: VersLeStudio) {
  try {
    window.sessionStorage.setItem(CLE, JSON.stringify(x));
  } catch {
    /* rien de gardé : l'événement suffit */
  }
  window.dispatchEvent(new CustomEvent<VersLeStudio>(EVT_VERS_LE_STUDIO, { detail: x }));
  // (l'onglet « Créer » s'ouvre : `ma-collection.tsx` suit l'adresse)
  if (window.location.hash !== "#figurine") window.location.hash = "figurine";
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/** La demande qui attendait (une fois : elle est oubliée aussitôt). */
export function prendreVersLeStudio(): VersLeStudio | null {
  try {
    const brut = window.sessionStorage.getItem(CLE);
    window.sessionStorage.removeItem(CLE);
    const x = brut ? (JSON.parse(brut) as VersLeStudio) : null;
    return x && (typeof x.texte === "string" || typeof x.look === "string" || typeof x.theme === "string") ? x : null;
  } catch {
    return null;
  }
}
