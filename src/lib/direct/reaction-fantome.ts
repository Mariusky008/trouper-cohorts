// 👻 LE FANTÔME QU'ON A CHOISI — cinq visages, et les mots du métier.
//
// ═══ CE QUE CE FICHIER EXISTE POUR RÉPARER ════════════════════════════════
//
// « À la place de ces fantômes sans aucune personnalité, plutôt le fantôme que
// chaque personne a choisi, comme dans l'app. Le fantôme choisi pourrait être
// plus gros et se voir plus, pour bien montrer que cette personne a choisi ce
// fantôme. Et tu dois évidemment changer le wording, parce que la photo montre
// des fantômes avec le wording pour quelqu'un qui parle du menu du jour. »
//
// DEUX CHOSES ÉTAIENT CONFONDUES SOUS UN SEUL DESSIN, et c'est ce qui faisait
// qu'on ne voyait rien :
//
//   · UNE NOTE, c'est-à-dire un COMPTE — quatre sur cinq. Cinq silhouettes
//     identiques dont on en allume quatre, comme des étoiles.
//   · UNE RÉACTION, c'est-à-dire un CHOIX — « trop bon », « pas pour moi ».
//     Une personne a posé le doigt sur un visage parmi cinq.
//
// L'APPLICATION DEMANDE LA SECONDE ET DESSINAIT LA PREMIÈRE. On demande « ça
// vous fait quoi ? », on propose cinq fantômes qui ont chacun une tête — l'un
// tire la langue, un autre a les yeux en cœur, le dernier est en feu — et on
// affichait le résultat comme une rangée de pictogrammes gris tous pareils.
// Le choix de quelqu'un devenait un compte anonyme.
//
// ON MONTRE DONC LE VISAGE CHOISI, EN GRAND. Un seul, celui qu'elle a touché.
// C'est le même dessin que sur l'écran où elle a répondu, donc on reconnaît
// son geste ; et c'est assez gros pour qu'on lise l'expression, ce qui est la
// seule raison d'avoir dessiné cinq têtes différentes.
//
// ═══ ET LES MOTS CHANGENT AVEC LE MÉTIER ══════════════════════════════════
//
// « J'en veux ! » sous une coupe de cheveux ne veut rien dire, et « Trop bon »
// sous un blazer encore moins : ces cinq mots-là ont été écrits pour un plat.
// Chaque métier a donc les siens, et c'est la seule chose qui change — les cinq
// visages, eux, sont les mêmes partout, parce que c'est ce qui fait qu'on les
// reconnaît d'un écran à l'autre.
//
// LES MOTS NE S'ACCORDENT PAS. « Curieuse » demanderait de savoir qui parle, et
// le produit ne le sait pas — il n'a qu'un prénom. Chaque niveau est donc écrit
// dans une forme qui vaut pour tout le monde : « Ça m'intrigue » plutôt que
// « Curieux ». Seul le niveau 1 du restaurant garde « Pas pour moi », qui est
// déjà invariable et déjà à l'écran.

/** De un à cinq. Zéro veut dire « pas de réaction », et ne s'affiche pas. */
export type NiveauReaction = 1 | 2 | 3 | 4 | 5;

/**
 * LES CINQ VISAGES, DANS L'ORDRE DE L'ÉCHELLE.
 *
 * Les fichiers sont ceux de `avant-gout.ts` — c'est le même jeu de dessins, et
 * il ne doit y en avoir qu'un. L'émoji reste écrit : c'est le repli si l'image
 * n'arrive pas, et c'est ce qui part dans un message, où une image ne se
 * recopie pas.
 */
export const VISAGES: { cle: string; image: string; emoji: string }[] = [
  { cle: "non", image: "/direct/fantomes/avis/non.png", emoji: "😐" },
  { cle: "curieux", image: "/direct/fantomes/avis/curieux.png", emoji: "👀" },
  { cle: "faim", image: "/direct/fantomes/avis/faim.png", emoji: "😋" },
  { cle: "envie", image: "/direct/fantomes/avis/envie.png", emoji: "🤤" },
  { cle: "veux", image: "/direct/fantomes/avis/veux.png", emoji: "🔥" },
];

/** Les familles de métier qui ont leurs propres mots. */
export type FamilleReaction = "table" | "mode" | "coiffure" | "deco" | "sortie";

/**
 * LES CINQ MOTS, PAR FAMILLE. L'ordre est celui des visages.
 *
 * LA TABLE GARDE EXACTEMENT LES MOTS DE L'ÉCRAN OÙ L'ON RÉPOND — voir
 * `EMOTIONS` dans `avant-gout.ts`. Deux formulations pour la même échelle, et
 * l'une des deux ment : on ne saurait plus si « Trop bon » et « Très envie »
 * sont le même cran.
 */
export const MOTS: Record<FamilleReaction, [string, string, string, string, string]> = {
  table: ["Pas pour moi", "Curieux", "Ça me tente", "Trop bon", "J’en veux !"],
  // LE STYLE SE JUGE SUR SOI, PAS SUR LA PIÈCE. « Trop bon » devient « ça me va
  // trop bien » : ce qu'on regarde n'est plus le vêtement, c'est soi dedans.
  mode: ["Pas mon style", "Ça m’intrigue", "Ça me tente", "Ça me va trop bien", "Je la prends !"],
  // ON NE « PREND » PAS UNE COUPE, ON Y VA. Le dernier cran d'un salon, c'est
  // le rendez-vous — c'est d'ailleurs ce que le parcours propose juste après.
  coiffure: ["Pas pour moi", "Ça m’intrigue", "Ça me tente", "Ça me va trop bien", "J’y vais !"],
  // LA DÉCO SE JUGE CHEZ SOI : la question n'est pas si c'est beau, c'est si
  // ça va dans la pièce. Les deux bouts de l'échelle le disent.
  deco: ["Pas chez moi", "Ça m’intrigue", "Ça me tente", "Parfait chez moi", "Je la veux !"],
  sortie: ["Pas ce soir", "Ça m’intrigue", "Ça me tente", "Trop envie", "J’y vais !"],
};

/** Le visage d'un niveau. Hors bornes, on rend le plus proche : on ne casse pas. */
export function visageDe(niveau: number) {
  const i = Math.min(5, Math.max(1, Math.round(niveau))) - 1;
  return VISAGES[i];
}

/** Le mot d'un niveau, dans la langue du métier. */
export function motDe(niveau: number, famille: FamilleReaction = "table") {
  const i = Math.min(5, Math.max(1, Math.round(niveau))) - 1;
  return MOTS[famille][i];
}

/**
 * LA FAMILLE D'UNE BRANCHE DE COMMERCE.
 *
 * ═══ DEUX VOCABULAIRES ARRIVENT ICI, ET IL FAUT LES DEUX ══════════════════
 *
 * « "Trop bon" comme wording pour mode ou beauté n'est pas approprié. »
 *
 * ET C'ÉTAIT EXACT, SUR UN SALON DE COIFFURE. Le défaut n'était pas dans les
 * mots — la famille `coiffure` dit bien « ça me va trop bien » — il était dans
 * la TRADUCTION. Deux vocabulaires désignent le même métier dans ce produit :
 *
 *   · celui du paquet d'annonces — `coiffeur`, `fleuriste`, `artisan` ;
 *   · celui des parcours de démonstration — `coiffure`, `deco`, `sortie`.
 *
 * Cette fonction ne connaissait que le premier, et le panneau du commerçant lui
 * passe le second. `coiffure` tombait donc dans le repli, qui est `table` : un
 * salon de coiffure affichait « Trop bon ».
 *
 * LES DEUX SONT ÉCRITS, ET PAS DEVINÉS. Un `includes("coiff")` marcherait
 * jusqu'au jour où quelqu'un écrit « barbier », et le mot serait faux sans que
 * rien ne le signale.
 */
export function familleDe(branche: string | undefined): FamilleReaction {
  switch (branche) {
    case "mode":
      return "mode";
    // `coiffeur` et `ongles` viennent du paquet, `coiffure` et `beaute` des parcours.
    case "coiffeur":
    case "coiffure":
    case "ongles":
    case "beaute":
      return "coiffure";
    case "artisan":
    case "fleuriste":
    case "deco":
      return "deco";
    case "evenement":
    case "bar":
    case "sortie":
    case "sorties":
      return "sortie";
    default:
      return "table";
  }
}
