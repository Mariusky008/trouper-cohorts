/**
 * 🚫 CE QU'UNE FIGURINE NE DIT PAS — la démonstration de « Ma collection » se fait parler par n'importe qui, puis
 * s'envoie (4 novembre 2026) : c'est la figurine du propriétaire, et son visage part sur WhatsApp. Un premier filet,
 * simple : les insultes, les injures racistes ou homophobes, les menaces et le sexe explicite ne sont pas dits. Le reste
 * passe par « Signaler » chez celui qui reçoit.
 *
 * FICHIER PARTAGÉ : la page prévient avant d'envoyer ; le serveur refuse quoi qu'il arrive.
 */

/** Le texte à plat : minuscules, sans accents, chiffres de « leet » remis en lettres, lettres répétées réduites. */
function aPlat(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/(.)\1{2,}/g, "$1")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Des mots entiers (au pluriel et au féminin près) ; et des tournures. */
const MOTS = [
  "con+ard?s?", "con+asses?", "salopes?", "salauds?", "putes?", "encules?", "enculee?s?", "enfoire?e?s?", "batarde?s?", "niquer?", "nique",
  "ntm", "fdp", "pd", "pedes?", "tapettes?", "gouines?", "negres?", "negro", "bougnoules?", "youpins?", "bicots?", "ratons?", "chinetoques?",
  "bites?", "chattes?", "branleure?s?", "pet+asses?", "sucer?", "suceuses?", "salopards?", "trou du cul", "nazie?s?", "hitler", "violer?", "viols?",
  "mongol+s?", "attarde?e?s?", "tue toi", "suicide toi", "je vais te tuer", "creve",
];
const MOTIF = new RegExp(`(^| )(${MOTS.join("|")})( |$)`);

/** Ce texte contient-il un mot qu'une figurine ne dit pas ? */
export const motInterdit = (texte: string): boolean => MOTIF.test(aPlat(texte));
