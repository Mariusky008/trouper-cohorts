/**
 * 🏠 « CHOISIS TA PIÈCE », CÔTÉ SERVEUR (`choisis-ta-piece.ts` ; le lot M3) : qui voit déjà le nouveau parcours.
 *
 * FICHIER SERVEUR.
 */
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { MA_MAISON_CATALOGUE } from "./ma-maison";

/**
 * Le nouveau parcours (« Choisis ta pièce ») : tout le monde quand l'interrupteur est allumé ; d'ici là, l'administrateur
 * qui le demande (`?piece=1` sur `/univers/figurine` et `/univers`) — son parcours habituel ne change pas.
 */
export async function choisirSaPiecePermis(demande: unknown): Promise<boolean> {
  return MA_MAISON_CATALOGUE || (demande === "1" && (await isCurrentUserAdmin()));
}

/** Pablito ne fabrique plus d'univers : seulement une fois l'interrupteur allumé (l'administrateur peut encore essayer). */
export const creationArretee = (): boolean => MA_MAISON_CATALOGUE;
