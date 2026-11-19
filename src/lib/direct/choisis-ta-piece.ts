/**
 * 🏠 « CHOISIS TA PIÈCE » — L'INSCRIPTION (`docs/univers/ma-maison.md`, section 3 ; le lot M3).
 *
 * Avant : le selfie, la figurine, la conversation avec Pablito, l'univers fabriqué (une minute). Désormais : le selfie, la
 * figurine assise, **« Choisis ta pièce »** (les neuf du catalogue, dans l'ordre de l'âge : `ma-maison.ts`), et on
 * arrive chez soi, tout de suite. Pablito accueille toujours, mais ne fabrique plus rien.
 *
 * Derrière l'interrupteur `MA_MAISON_CATALOGUE`, allumé le 19 novembre 2026 : pour tout le monde, et le choix se fait
 * dans l'onglet « Ma maison » de l'appli. Freiné (`CLIKME_MA_MAISON=0`, `interrupteurs-serveur.ts`), l'administrateur
 * l'essaie sur son téléphone d'habitant en le demandant (`/univers/figurine?piece=1`, `/univers?piece=1`), et choisit sa
 * pièce à l'adresse d'essai `/univers/maison` ; tous les autres, et lui sans `?piece=1`, gardent le parcours d'avant.
 *
 * Partagé (l'écran et le serveur).
 */
/** Où l'on choisit sa pièce (et où l'on arrive chez soi) : l'onglet « Ma maison », ou l'adresse d'essai (freiné). */
export const adresseChoisirPiece = (catalogue: boolean) => (catalogue ? "/collection#maison" : "/univers/maison");

/** Les mots du parcours (à l'écran seulement : Pablito n'a pas d'enregistrement pour eux). */
export const TEXTES_PIECE = {
  /** après « C'est moi ! » */
  suite: "Maintenant, choisis ta pièce : ta figurine y sera chez elle.",
  bouton: "🏠 Choisis ta pièce",
  /** l'accueil `/univers`, la figurine faite, pas encore de pièce */
  accueilTitre: "Ta pièce t’attend",
  accueilTexte: "Neuf pièces, tout autour de toi. Choisis celle où ta figurine sera chez elle : tu pourras en changer quand tu veux.",
  /** l'accueil `/univers`, sans figurine */
  sansFigurine: "D’abord ta figurine, assise dans son fauteuil. Ensuite, tu choisis ta pièce.",
  /** la carte, pour ceux qui ont déjà un univers fabriqué (une fois, dans « Ma maison ») */
  carteTitre: "Nouveau : choisis ta pièce",
  carteTexte: "Une pièce tout autour de toi, où ta figurine est chez elle, et qui se remplit avec ce que tu gardes dans tes conversations. Ton univers reste à toi tant que tu n’as pas choisi.",
  carteOui: "Choisir ma pièce",
  carteNon: "Plus tard",
  /** (après « Plus tard » : un lien discret, sous son univers) */
  carteLien: "🏠 Choisir une pièce",
  /** le refus du serveur, quand Pablito ne fabrique plus */
  plusDeCreation: "Pablito ne fabrique plus d’univers : choisis ta pièce.",
} as const;

/** Le chemin de l'inscription, dans la bienvenue (les étapes montrées, sans voix). */
export const cheminInscription = (catalogue: boolean): readonly { e: string; t: string }[] =>
  catalogue
  ? [
      { e: "📸", t: "Ton selfie" },
      { e: "🧸", t: "Ta figurine" },
      { e: "🏠", t: "Ta pièce" },
      { e: "💬", t: "Tes proches" },
    ]
  : [
      { e: "📸", t: "Ton selfie" },
      { e: "🧸", t: "Ta figurine" },
      { e: "💬", t: "5 minutes avec Pablito" },
      { e: "🌍", t: "Ton univers" },
    ];
