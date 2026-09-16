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

const png = readdirSync(source).filter((f) => f.toLowerCase().endsWith(".png"));
if (!png.length) {
  console.error(`Aucun PNG dans ${source}`);
  process.exit(1);
}

for (const f of png) {
  const nom = f.replace(/\.png$/i, "").toLowerCase();
  const sortie = join(dest, `${nom}.webp`);
  await sharp(join(source, f))
    // LE SEUIL EST BAS : le halo des dessins est presque transparent, et un
    // seuil élevé le rognerait avec la marge, ce qui coupe la lueur.
    .trim({ threshold: 2 })
    .resize({ width: 440, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(sortie);
  const a = statSync(join(source, f)).size;
  const b = statSync(sortie).size;
  const m = await sharp(sortie).metadata();
  console.log(
    `${nom.padEnd(14)} ${(a / 1048576).toFixed(1)} Mo → ${(b / 1024).toFixed(0)} ko  ${m.width}×${m.height}`,
  );
}
console.log(`\n${png.length} mascotte(s) dans ${dest}`);
