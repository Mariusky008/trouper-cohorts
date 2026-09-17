// 👻 LES MASCOTTES → DU WEBP SERVABLE.
//
// « Je t'ai mis le fantôme en PNG pour chaque type de commerçant. »
//
// SES DESSINS ARRIVENT EN 1312 POINTS ET PÈSENT ENTRE 1,2 ET 1,9 MÉGAOCTET.
// Servis tels quels, le premier objet de la page commerçant coûterait deux
// mégaoctets sur un téléphone — plus que tout le reste de l'application réunie.
//
// CE SCRIPT FAIT TROIS CHOSES, ET AUCUNE N'EST NÉGOCIABLE :
//
//   · IL ROGNE AU SUJET. Les PNG portent une marge transparente variable ; sans
//     rognage, deux mascottes de la même largeur n'ont pas la même taille à
//     l'écran, et le fantôme saute d'un commerce à l'autre.
//   · IL RAMÈNE À 440 POINTS. La mascotte s'affiche entre 110 et 220 points :
//     440 la garde nette au double, y compris sur un écran à trois fois.
//   · IL PASSE EN WEBP. Cinquante kilooctets au lieu de mille cinq cents, sans
//     différence visible — mesuré sur les neuf.
//
// IL EST ÉCRIT POUR ÊTRE REJOUÉ. Le jour où il envoie la boutique de vêtements,
// la boulangerie ou l'hypnothérapeute — les trois qui manquent — on dépose le
// PNG dans le dossier source et on relance : rien d'autre à faire, et surtout
// pas à retrouver les réglages de conversion.
//
//   node scripts/fantomes-mascottes.mjs <dossier-des-png>

import { readdirSync, statSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const source = process.argv[2];
if (!source) {
  console.error("Usage : node scripts/fantomes-mascottes.mjs <dossier-des-png>");
  process.exit(1);
}
const dest = "public/direct/fantomes";
mkdirSync(dest, { recursive: true });

/**
 * ═══ LE CADRAGE, QUAND LE DESSIN EST UNE SCÈNE ET PAS UN PERSONNAGE ═══════
 *
 * « Le visuel du fantôme est trop petit par rapport au mock-up de la page
 * commerçant type que je t'ai donné. C'est l'acteur principal de la page, donc
 * il faut qu'il soit visible comme sur la page que je t'ai donnée. »
 *
 * LES NEUF PREMIERS SONT DES PERSONNAGES : le fantôme occupe près de soixante
 * pour cent de la largeur, et le rognage sur la transparence suffit. LES DEUX
 * DERNIERS SONT DES VITRINES — une boulangerie entière, une boutique entière —
 * où le fantôme ne fait plus que quarante pour cent. Servis tels quels à la même
 * largeur, ILS PARAISSENT DEUX FOIS PLUS PETITS que les autres, alors que le
 * fichier a exactement la même taille.
 *
 * ON NE REMONTE PAS LA TAILLE D'AFFICHAGE POUR ÇA : elle est commune aux onze,
 * et l'agrandir ferait déborder les neuf. On recadre la scène sur son sujet, et
 * les onze retrouvent la même échelle de fantôme.
 *
 * LES BOÎTES SONT ÉCRITES EN POINTS DE L'IMAGE D'ORIGINE (1312 × 1199), mesurées
 * une fois à l'œil sur chaque dessin. Elles gardent ce que le fantôme TIENT — la
 * baguette, le chapeau, le sac, le cintre — et laissent partir le fond de
 * boutique, qui ne se lit de toute façon pas à cent quatre-vingts points.
 */
const CADRES = {
  boulangerie: { left: 120, top: 10, width: 1030, height: 1130 },
  mode: { left: 190, top: 70, width: 1000, height: 1100 },
};

/**
 * ═══ ET LEUR BORD EST ÉTEINT DANS LE FICHIER, PAS DANS LA FEUILLE ═════════
 *
 * Ces deux-là gardent un fond de boutique jusqu'au bord : posées sur le panneau
 * rose, elles font un RECTANGLE PHOTOGRAPHIQUE au milieu d'une page où tout le
 * reste flotte. C'est la seule chose de l'écran qui ait l'air collée.
 *
 * LE VOILE EST CUIT DANS LE WEBP, ET C'EST UN CHOIX DE PRUDENCE. Un
 * `mask-image` CSS ferait la même chose, mais il se compose différemment entre
 * Safari et Chromium, et la sanction d'une erreur est une mascotte INVISIBLE
 * sur l'iPhone où le produit se teste. Une image dont les bords sont déjà
 * transparents ne dépend de rien : elle se comporte comme les neuf autres,
 * partout, y compris le jour où quelqu'un la pose ailleurs.
 */
const FONDUS = new Set(["boulangerie", "mode"]);

/** Un cache blanc aux bords fondus, de la taille exacte de l'image. */
function voile(l, h) {
  // LE FLOU EST PROPORTIONNEL AU PLUS PETIT CÔTÉ : en points fixes, il dévore
  // une petite image et ne se voit pas sur une grande.
  const flou = Math.max(6, Math.round(Math.min(l, h) * 0.05));
  const m = Math.round(flou * 1.1);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}">` +
      `<filter id="f" x="-20%" y="-20%" width="140%" height="140%">` +
      `<feGaussianBlur stdDeviation="${flou}"/></filter>` +
      `<rect x="${m}" y="${m}" width="${l - 2 * m}" height="${h - 2 * m}" ` +
      `rx="${Math.round(Math.min(l, h) * 0.12)}" fill="#ffffff" filter="url(#f)"/></svg>`,
  );
}

const png = readdirSync(source).filter((f) => f.toLowerCase().endsWith(".png"));
if (!png.length) {
  console.error(`Aucun PNG dans ${source}`);
  process.exit(1);
}

for (const f of png) {
  const nom = f.replace(/\.png$/i, "").toLowerCase();
  const sortie = join(dest, `${nom}.webp`);
  let image = sharp(join(source, f));
  const cadre = CADRES[nom];
  if (cadre) {
    // ON NE RECADRE QUE SI LA BOÎTE TIENT DANS L'IMAGE. Un dessin renvoyé un
    // jour dans une autre définition ferait échouer `extract` ; mieux vaut la
    // mascotte entière qu'une conversion qui s'arrête.
    const m = await image.metadata();
    if (cadre.left + cadre.width <= m.width && cadre.top + cadre.height <= m.height) {
      image = image.extract(cadre);
    } else {
      console.warn(`${nom} : cadre hors de l'image (${m.width}×${m.height}), on garde tout`);
    }
  }
  // LE VOILE S'APPLIQUE APRÈS LE REDIMENSIONNEMENT, sur la taille finale : posé
  // avant, il serait réduit avec l'image et le fondu deviendrait un liséré.
  let apres = await image
    // LE SEUIL EST BAS : le halo des dessins est presque transparent, et un
    // seuil élevé le rognerait avec la marge, ce qui coupe la lueur.
    .trim({ threshold: 2 })
    .resize({ width: 440, withoutEnlargement: true })
    .png()
    .toBuffer();
  if (FONDUS.has(nom)) {
    const { width, height } = await sharp(apres).metadata();
    apres = await sharp(apres)
      .composite([{ input: voile(width, height), blend: "dest-in" }])
      .png()
      .toBuffer();
  }
  await sharp(apres).webp({ quality: 86, effort: 6 }).toFile(sortie);
  const a = statSync(join(source, f)).size;
  const b = statSync(sortie).size;
  const m = await sharp(sortie).metadata();
  console.log(
    `${nom.padEnd(14)} ${(a / 1048576).toFixed(1)} Mo → ${(b / 1024).toFixed(0)} ko  ${m.width}×${m.height}`,
  );
}
console.log(`\n${png.length} mascotte(s) dans ${dest}`);
