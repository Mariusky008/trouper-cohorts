/**
 * 🔀 « MA MAISON » ET « LE SALON DU DUO », POUR TOUT LE MONDE — allumés le 19 novembre 2026 (le propriétaire, après une
 * nouvelle inscription : « après la figurine je n'arrive pas au choix de mon “ma maison”, je suis encore sur l'ancien
 * concept d'univers » ; « Messagerie : c'est l'ancienne version aussi »).
 *
 * Les interrupteurs eux-mêmes : `MA_MAISON_CATALOGUE` (`ma-maison.ts`) et `SALON_DU_DUO` (`salon-interrupteur.ts`).
 * Comme pour « Univers pour tous » (`univers-pour-tous.ts`), le serveur peut les FREINER sans déployer :
 * `CLIKME_MA_MAISON` et `CLIKME_SALON_DU_DUO` — « 0 » éteint, « 1 » allume, sinon l'interrupteur. Les écrans reçoivent
 * la valeur du serveur (les pages la leur passent). Les essais d'avant tournent freinés (« 0 », la CI et le serveur
 * d'essai) ; ceux du nouveau parcours l'essaient comme avant (`?piece=1`, `?salon=1`).
 *
 * FICHIER SERVEUR.
 */
import { MA_MAISON_CATALOGUE } from "./ma-maison";
import { SALON_DU_DUO } from "./salon-interrupteur";

const lu = (nom: string, sinon: boolean): boolean => {
  const f = String(process.env[nom] ?? "").trim();
  return f === "0" ? false : f === "1" ? true : sinon;
};

/** 🏠 Le catalogue des pièces, l'inscription « Choisis ta pièce », l'onglet « Ma maison » : pour tout le monde ? */
export const maisonPourTous = (): boolean => lu("CLIKME_MA_MAISON", MA_MAISON_CATALOGUE);

/** 🛋️ Les conversations dans le salon du duo, pour tout le monde ? (un téléphone peut toujours choisir : `?salon=0/1`) */
export const salonPourTous = (): boolean => lu("CLIKME_SALON_DU_DUO", SALON_DU_DUO);

/**
 * 🛋️ Les salons ouverts de Découvrir (lots D3 et D4, 20 novembre 2026) : allumés ; `CLIKME_SALONS_OUVERTS=0` les ferme
 * sans déployer (les cartes disparaissent de l'accueil, on ne peut plus y entrer).
 */
export const salonsOuverts = (): boolean => lu("CLIKME_SALONS_OUVERTS", true);
