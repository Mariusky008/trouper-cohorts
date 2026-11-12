/**
 * 🔀 L'INTERRUPTEUR « UNIVERS POUR TOUS » — le feu vert du propriétaire, le 12 novembre 2026 : « Le feu vert pour ouvrir
 * tout cela à tout le monde : nouvel accueil et nouveau menu, figurines actuelles refaites, Pablito au nouveau style :
 * OUI ». Tout se construit derrière cet interrupteur, éteint ; on l'allume dans une dernière PR, une fois tout essayé.
 *
 *   · ÉTEINT : les adresses du chantier (`/univers`, `/univers/figurine`, `/univers/conversation`, `/univers/monde` et
 *     leurs routes) restent réservées au propriétaire (une session d'administrateur) ; l'appli d'aujourd'hui ne change pas.
 *   · ALLUMÉ : chacun y entre avec SA figurine (son cookie d'habitant) ; sa figurine du nouveau style devient celle de
 *     l'appli (`pont-univers-serveur.ts`) ; le menu de `/collection` change (« Mon univers ») ; Pablito passe au
 *     nouveau style, une fois sa figurine adoptée depuis l'admin (`pablito-univers-serveur.ts`).
 *
 * Les essais l'allument avec `CLIKME_UNIVERS_POUR_TOUS=1` (la même variable, posée chez l'hébergeur, l'allumerait aussi).
 *
 * FICHIER SERVEUR.
 */
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { UNIVERS_POUR_TOUS } from "./univers-interrupteur";

/** L'interrupteur lui-même : `univers-interrupteur.ts` (`false` tant que le propriétaire n'a pas tout vu). */
export { UNIVERS_POUR_TOUS };

/** Allumé pour tout le monde ? */
export const universPourTous = (): boolean => UNIVERS_POUR_TOUS || process.env.CLIKME_UNIVERS_POUR_TOUS === "1";

/** Peut-il entrer dans le chantier « Univers » ? Tout le monde quand c'est allumé ; sinon le propriétaire seul. */
export async function universPermis(): Promise<boolean> {
  return universPourTous() || (await isCurrentUserAdmin());
}
