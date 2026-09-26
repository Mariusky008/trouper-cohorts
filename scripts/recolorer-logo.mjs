// 🎨 LE LOGO PREND LES COULEURS DE L'APPLICATION
//
// ═══ POURQUOI CE SCRIPT EXISTE ═════════════════════════════════════════════
//
// « Ce sont les logos Clikme, mais nous avons fait une charte graphique
// différente depuis quelque temps, avec des couleurs différentes sur l'app de
// démo. Peux-tu prendre les couleurs dominantes de l'app de démo et refaire les
// couleurs du logo Clikme, et les appliquer partout où il y a le logo ? »
//
// LES COULEURS NE SONT PAS CHOISIES, ELLES SONT RELEVÉES. Comptées dans les six
// feuilles de l'écran de démarrage — `styles-choix.tsx` et les cinq
// `styles-parcours-*.tsx` — qui SONT la charte d'aujourd'hui :
//
//   · #FF2E9A — 72 déclarations à elles six. De très loin la plus utilisée :
//     le titre, le bouton qui engage, le cadre de la bulle, l'onglet actif.
//   · #FF4FB0 — le rose clair, une fois par feuille. Il n'existe que pour
//     faire les dégradés avec le premier, jamais seul.
//   · #06060A — le fond, un noir neutre.
//
// ═══ ET J'AVAIS RELEVÉ LA MAUVAISE PALETTE ═══════════════════════════════
//
// PREMIÈRE VERSION DE CE FICHIER : le vert menthe #3DE2A6, compté dans
// `apercu-habitant.tsx`. Le compte était juste et la conclusion fausse — cette
// feuille-là porte les écrans du Direct, pas l'écran de démarrage, et c'est
// l'écran de démarrage qu'il venait de refaire en rose. J'avais mesuré ce qui
// était facile à mesurer plutôt que ce qu'il montrait du doigt.
//
// L'APPLICATION PORTE DONC ENCORE DEUX CHARTES : le rose à l'entrée, le vert
// derrière. Ce fichier suit celle de l'entrée, parce que c'est celle qu'il
// vient d'écrire et celle qu'on voit en premier.
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

const ACCENT = [0xff, 0x2e, 0x9a];
const ENCRE = [0x06, 0x06, 0x0a];

/**
 * VRAI POUR LE CURSEUR, QUELLE QU'AIT ÉTÉ SA COULEUR.
 *
 * La première version cherchait « du vert », et elle ne trouvait plus rien dès
 * qu'elle avait tourné une fois : elle avait elle-même repeint le curseur. Une
 * règle qui ne marche qu'au premier passage est une règle qu'il faut réécrire à
 * chaque changement de charte.
 *
 * ON DÉCRIT DONC LE DESSIN, PAS LA COULEUR : le mot-marque n'a que deux
 * aplats — une encre et un accent — plus le blanc de la version claire. Tout ce
 * qui n'est ni sombre ni blanc EST le curseur, aujourd'hui comme après.
 */
const estAccent = (r, g, b) => Math.max(r, g, b) >= 110 && Math.min(r, g, b) <= 210;
/** Vrai pour l'encre du mot : sombre, quelle que soit sa nuance. */
const estEncre = (r, g, b) => Math.max(r, g, b) < 110;

async function recolorer(entree, sortie, { encre = true } = {}) {
  const { data, info } = await sharp(entree).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let verts = 0;
  let encres = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (estAccent(r, g, b)) {
      [data[i], data[i + 1], data[i + 2]] = ACCENT;
      verts++;
    } else if (encre && estEncre(r, g, b)) {
      [data[i], data[i + 1], data[i + 2]] = ENCRE;
      encres++;
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(sortie);
  console.log(`  ${sortie.padEnd(42)} ${info.width}×${info.height} — ${verts} px d'accent, ${encres} px d'encre`);
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
   l'encre sombre la rendrait invisible sur le fond où elle sert. Seul le
   curseur change. */
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
