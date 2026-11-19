/**
 * 🛋️ L'INTERRUPTEUR « LE SALON DU DUO » (`docs/univers/salon-du-duo.md`, section 9 et 11.23 ; le lot S8, la bascule).
 *
 * ÉTEINT : une conversation s'ouvre dans l'ancien écran (`src/app/collection/proches.tsx`, `Conversation`).
 * ALLUMÉ : dans le salon du duo (`src/app/salon/salon.tsx`) — par toutes les portes de l'appli : la liste « Chez moi »,
 * la notification (`/collection?parler=<clé>`), « Lui répondre », les rappels du matin, « À qui parler ? »…
 *
 * EN ATTENDANT DE L'ALLUMER POUR TOUS, un téléphone peut l'essayer : `/collection?salon=1` (une fois : le téléphone
 * s'en souvient), `/collection?salon=0` pour revenir à l'ancien écran. Chacun des deux d'une conversation peut le faire
 * sur le sien : le propriétaire le joue ainsi, à deux, sur deux vrais téléphones, avant de l'allumer.
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */

/**
 * ALLUMÉ le 19 novembre 2026 (le propriétaire : « Messagerie : c'est l'ancienne version aussi »). Le serveur peut le
 * freiner (`CLIKME_SALON_DU_DUO=0`, `interrupteurs-serveur.ts`) : l'appli reçoit sa valeur (`MaCollection`, `salon`).
 */
export const SALON_DU_DUO = true;

/** Ce que le téléphone a choisi (`?salon=1` / `?salon=0`), gardé dans `localStorage`. */
export const MEMOIRE_SALON = "clikme-salon";

/** Le salon est-il ouvert sur ce téléphone ? Le choix du téléphone d'abord (« 1 » ou « 0 »), sinon l'interrupteur (celui
 * du serveur, `pourTous`, quand l'écran l'a reçu). */
export const salonOuvert = (choixDuTelephone: string | null, pourTous: boolean = SALON_DU_DUO): boolean =>
  choixDuTelephone === "1" ? true : choixDuTelephone === "0" ? false : pourTous;
