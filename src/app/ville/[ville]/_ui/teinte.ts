// LE REPLI QUAND IL N'Y A PAS DE PHOTO.
//
// Une seule vérité pour les deux écrans qui montrent des annonces en grand :
// le fil et « À saisir ». Chacun avait son propre repli — le fil un aplat
// teinté, le swipe un dégradé sable fixe — et deux annonces du même commerce
// n'avaient donc pas la même couleur selon l'écran d'où on les regardait.
//
// POURQUOI PAS UNE JOLIE PHOTO GÉNÉRIQUE : parce qu'une image qui ne montre pas
// ce que l'annonce annonce est un mensonge par juxtaposition. Une photo de
// vitrine posée à côté d'un plat qu'elle ne montre pas coûte plus cher que pas
// d'image du tout — elle apprend à l'habitant que les images d'ici ne veulent
// rien dire. Un carton propre au nom du commerce, lui, ne promet rien.
//
// La couleur est DÉRIVÉE DU NOM, donc stable : tirée au hasard, elle changerait
// à chaque rendu et le commerce n'aurait jamais d'identité visuelle.

/** Cinq fonds sombres seulement : le nom s'y écrit en blanc, et il doit rester
 *  lisible sur les cinq. */
const TEINTES = [
  "linear-gradient(150deg,#3B5140,#16231B)",
  "linear-gradient(150deg,#4A4130,#1F1B14)",
  "linear-gradient(150deg,#3A4A52,#161F23)",
  "linear-gradient(150deg,#4E3B3B,#211818)",
  "linear-gradient(150deg,#404A34,#1A2016)",
];

export function teinte(nom: string): string {
  let h = 0;
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) >>> 0;
  return TEINTES[h % TEINTES.length];
}

/** Le monogramme du repli : une ou deux lettres, jamais plus.
 *
 *  Le repli portait le NOM EN ENTIER, en gros, au milieu du visuel. Deux
 *  défauts, et le second est le vrai : il chevauchait la pastille et le titre
 *  posés en bas de l'image, et il répétait un nom déjà écrit trois lignes plus
 *  bas. Un fond n'a pas à redire ce que le premier plan dit déjà — il occupe la
 *  place, discrètement, et il se tait. */
export function initiales(nom: string): string {
  const mots = String(nom)
    .split(/[\s'’-]+/)
    // « Chez », « Le », « La » ne distinguent rien : la moitié des commerces
    // d'une ville commenceraient par la même lettre.
    .filter((m) => m.length > 1 && !/^(chez|le|la|les|du|de|des|aux?)$/i.test(m));
  if (!mots.length) return "·";
  return mots.slice(0, 2).map((m) => m[0].toUpperCase()).join("");
}
