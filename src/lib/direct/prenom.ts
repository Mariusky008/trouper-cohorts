/**
 * 🙂 UN PRÉNOM QUI PEUT SE MONTRER — à côté de son fantôme, dans les vitrines, avec son numéro.
 *
 * Il s'affiche devant le commerce, chez le commerçant (son carnet) et dans la vidéo du lendemain :
 * pas de lien, pas de numéro de téléphone, pas de gros mot. Des lettres, des espaces, un trait
 * d'union, une apostrophe (« Jean-Marie », « N’Golo », « Anne-Sophie »).
 *
 * LES GROS MOTS SE CHERCHENT MOT À MOT, sans les accents : « Constance » ne contient pas « con ».
 *
 * FICHIER PARTAGÉ (navigateur et serveur).
 */
const GROS_MOTS = new Set([
  "abruti", "batard", "bite", "bouffon", "branleur", "chatte", "chier", "con", "conasse", "connard", "connasse", "conne",
  "couille", "couilles", "cul", "debile", "encule", "enculee", "fdp", "hitler", "merde", "nazi", "nique", "niquer", "ntm",
  "pd", "pede", "porno", "pouffiasse", "pute", "putain", "salaud", "salope", "sexe", "teub", "zob",
]);

const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Pourquoi ce prénom ne peut pas se montrer (`null` : il peut). Un prénom vide passe : il est facultatif ici. */
export function prenomRefuse(prenom: string): string | null {
  const p = prenom.trim();
  if (!p) return null;
  // Le point sert aux initiales (« J.-P. ») ; suivi de deux lettres, c'est une adresse de site (« pub.fr »).
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u.test(p) || /\.\p{L}{2,}/u.test(p)) return "Écris seulement ton prénom, en lettres.";
  const mots = sansAccents(p).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (mots.some((m) => GROS_MOTS.has(m))) return "Ce prénom ne peut pas s’afficher dans les vitrines.";
  return null;
}
