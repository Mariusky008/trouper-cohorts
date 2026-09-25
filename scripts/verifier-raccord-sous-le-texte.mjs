// 🩹 LE RACCORD DE LA PHOTO PASSE DERRIÈRE LE TEXTE, JAMAIS DEVANT.
//
// ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
//
// « Ah mais non je ne veux surtout pas qu'il y ait des démarcations comme sur
// les photos que tu viens de m'envoyer. Regarde tout ce qu'on a modifié au
// pixel près sur photo 1 et tu verras que sur photo 2 pas grand-chose n'a été
// modifié, ou très mal modifié en l'occurrence. »
//
// IL AVAIT RAISON, ET LA CAUSE TENAIT EN UN CHIFFRE. Le fondu qui dissout le
// bas de la photo dans la couleur du fond — .cd-raccord — portait z-index:1.
// Le titre, le prix et le sous-titre, eux, n'en portent aucun. Un dégradé qui
// finit OPAQUE, posé par-dessus du texte blanc, le repeint de sa couleur de
// fond : sur trois des huit annonces, le titre disparaissait sous le raccord
// et il ne restait que le creux que ses ombres avaient laissé autour de lui.
//
// LE DÉFAUT NE RESSEMBLAIT PAS À SA CAUSE, et c'est ce qui le rend dangereux.
// Il avait l'air d'un problème de contraste — un titre gris sur un fond gris —
// et j'ai cherché deux fois du côté de la couleur, des ombres et du grain
// avant de demander au navigateur QUI était au-dessus. C'est elementFromPoint
// qui a répondu : .cd-raccord, au premier signe de « Retouches offertes ».
//
// ═══ CE QUI SE VÉRIFIE ═════════════════════════════════════════════════════
//
// QUE .cd-raccord NE MONTE PAS. Le balisage le place déjà après la photo et le
// voile, donc au-dessus d'eux, et avant le bas de la carte, donc en dessous du
// texte : l'ordre du fichier suffit. Toute valeur de z-index supérieure à zéro
// casse cet équilibre — c'est exactement ce qui s'était produit.
//
// ON NE VÉRIFIE PAS LE RENDU, ON VÉRIFIE LA RÈGLE. Une garde qui ouvrirait un
// navigateur pour mesurer huit cartes serait plus juste et ne tournerait
// jamais ; celle-ci tourne en vingt millisecondes à chaque build.

import fs from "node:fs";

const FICHIER = "src/components/direct/carte-swipe.tsx";
const src = fs.readFileSync(FICHIER, "utf8");

const fautes = [];

// ─── LE BLOC DU RACCORD ───────────────────────────────────────────────────
// On isole la règle .cd-raccord{...} et on lit son z-index. Sans bloc, la
// garde se tait : le raccord peut disparaître un jour, et ce sera un choix,
// pas une régression que ce fichier doive deviner.
const bloc = src.match(/\.cd-raccord\s*\{([^}]*)\}/);
if (bloc) {
  const z = bloc[1].match(/z-index\s*:\s*(-?\d+)/);
  if (!z) {
    fautes.push(
      ".cd-raccord n'a plus de z-index explicite. Ce n'est pas une faute en " +
        "soi, mais l'oubli qui suit en est une : écrire z-index:0 dit que le " +
        "raccord reste DERRIÈRE le texte, et le dit au prochain qui lira.",
    );
  } else if (Number(z[1]) > 0) {
    fautes.push(
      `.cd-raccord porte z-index:${z[1]}. Il repeint alors le titre et le prix ` +
        "de la couleur du fond : c'est le défaut des « démarcations ». Le " +
        "raccord se place par l'ordre du balisage, pas par un z-index.",
    );
  }
} else {
  console.log("ℹ .cd-raccord n'existe plus : rien à vérifier.");
}

// ─── ET LA PHOTO NE SE DIMENSIONNE PAS SUR UNE VARIABLE EN POURCENTAGE ────
// Même famille de défaut, même journée : background-size:auto var(--cd-photo-h)
// paraît juste et ne l'est pas. Un pourcentage de HAUTEUR se compte sur la
// carte ; un pourcentage de TAILLE DE FOND se compte sur l'élément. La photo
// se dessinait donc à 69 % de sa propre boîte, laissant deux bandes de fond nu
// sur les côtés et un trait net sous le sujet.
if (/background-size\s*:\s*auto\s+var\(--cd-photo-h/.test(src)) {
  fautes.push(
    "background-size:auto var(--cd-photo-h) : la variable est un pourcentage, " +
      "et une taille de fond en pourcentage se compte sur l'élément, pas sur " +
      "la carte. La photo rétrécit dans sa propre boîte et laisse des bandes. " +
      "Utiliser cover : partDeLaPhoto a déjà donné à la boîte le rapport de " +
      "l'image.",
  );
}

if (fautes.length) {
  console.error("✗ " + FICHIER);
  for (const f of fautes) console.error("  • " + f);
  process.exit(1);
}
console.log("✓ Le raccord reste derrière le texte, et la photo remplit sa boîte.");
