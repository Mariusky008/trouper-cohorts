// 🎨 LE LOGO PREND LES COULEURS DE L'APPLICATION
//
// ═══ POURQUOI CE SCRIPT EXISTE ═════════════════════════════════════════════
//
// « Ce sont les logos Clikme, mais nous avons fait une charte graphique
// différente depuis quelque temps, avec des couleurs différentes sur l'app de
// démo. Peux-tu prendre les couleurs dominantes de l'app de démo et refaire les
// couleurs du logo Clikme, et les appliquer partout où il y a le logo ? »
//
// LES COULEURS NE SONT PAS CHOISIES, ELLES SONT RELEVÉES. Comptées dans la
// feuille de `apercu-habitant.tsx`, qui EST l'application de démonstration :
//
//   · #3DE2A6 — 58 déclarations. C'est de loin la plus utilisée : l'accent de
//     toute action, le prix, le bouton qui engage. C'est la couleur de la
//     marque telle qu'elle est vraiment employée aujourd'hui.
//   · #04150E — 34 déclarations. Le fond, un noir très légèrement vert.
//   · #0BA97B —  9 déclarations. Le même vert en plus profond ; il sert à
//     fabriquer les dégradés sans introduire une teinte de plus.
//
// LE VERT DU LOGO ÉTAIT #0F8F5F, ET C'EST UN AUTRE VERT. Plus sombre, plus
// terne, hérité d'avant. Posé à côté d'un bouton #3DE2A6, il ne se lit pas
// comme la même marque — il se lit comme une marque qui a mal imprimé.
//
// ═══ POURQUOI UN SCRIPT PLUTÔT QU'UNE RETOUCHE ════════════════════════════
//
// PARCE QU'IL Y A NEUF FICHIERS, et qu'une retouche à la main en oublie
// toujours un — typiquement l'icône masquable d'Android, que personne ne
// regarde jamais sur un ordinateur. Le script les refait tous depuis les mêmes
// trois couleurs, et il se rejoue le jour où la charte rebouge.
//
// LES APLATS SE SUBSTITUENT SANS ABÎMER LES BORDS. Un PNG n'est pas
// prémultiplié : un pixel d'anti-crénelage porte la couleur PLEINE et une
// transparence partielle. On remplace donc la couleur et on garde la
// transparence telle quelle — le contour reste exactement aussi doux qu'avant.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const MENTHE = [0x3d, 0xe2, 0xa6];
const ENCRE = [0x04, 0x15, 0x0e];

/** Vrai pour le vert du logo : dominante verte franche. */
const estVert = (r, g, b) => g > r + 18 && g > b + 8 && g > 40;
/** Vrai pour l'encre du mot : sombre et sans teinte marquée. */
const estEncre = (r, g, b) => Math.max(r, g, b) < 110;

async function recolorer(entree, sortie, { encre = true } = {}) {
  const { data, info } = await sharp(entree).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let verts = 0;
  let encres = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (estVert(r, g, b)) {
      [data[i], data[i + 1], data[i + 2]] = MENTHE;
      verts++;
    } else if (encre && estEncre(r, g, b)) {
      [data[i], data[i + 1], data[i + 2]] = ENCRE;
      encres++;
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(sortie);
  console.log(`  ${sortie.padEnd(42)} ${info.width}×${info.height} — ${verts} px de vert, ${encres} px d'encre`);
}

/** Les icônes se REFABRIQUENT depuis leur SVG : elles en sont le rendu. */
async function depuisSvg(svg, sortie, taille) {
  const source = await readFile(svg);
  await sharp(source, { density: 400 }).resize(taille, taille).png().toFile(sortie);
  console.log(`  ${sortie.padEnd(42)} ${taille}×${taille} — refait depuis ${svg}`);
}

console.log("Le mot-marque :");
await recolorer("public/clikme-logo.png", "public/clikme-logo.png");
/* LA VERSION BLANCHE GARDE SON BLANC : son encre EST le blanc, et la passer en
   #04150E la rendrait invisible sur le fond sombre où elle sert. Seul le
   curseur change — il était déjà proche, il est maintenant exact. */
await recolorer("public/clikme-logo-blanc.png", "public/clikme-logo-blanc.png", { encre: false });

console.log("Les icônes :");
for (const [svg, sortie, taille] of [
  ["public/icon.svg", "public/icon-512.png", 1024],
  ["public/icon.svg", "public/apple-touch-icon.png", 180],
  ["public/direct/icone-autour.svg", "public/direct/icone-autour-512.png", 512],
  ["public/direct/icone-autour.svg", "public/direct/icone-autour-180.png", 180],
  ["public/direct/icone-autour.svg", "public/direct/icone-autour-masquable.png", 512],
]) {
  await depuisSvg(svg, sortie, taille);
}
await writeFile("/dev/null", "");
