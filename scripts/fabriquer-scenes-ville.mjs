/**
 * 🏛️ FABRIQUER LES CALQUES DES SCÈNES DE LA VILLE — une fois, pas à l'affichage.
 *
 * « Cette scène est créée et enregistrée une fois, puis réutilisée. » Les
 * fantômes du métier (`public/direct/fantomes/hote-*.png`) et ceux des clients
 * (`client-*.png`) pèsent chacun plus d'un mégaoctet : parfaits pour un écran
 * plein, beaucoup trop lourds pour un fil où l'on en croise dix en faisant
 * défiler. On les ramène ici à 520 points de haut, en webp, transparence
 * gardée — c'est la taille à laquelle une scène du fil les montre, deux fois
 * pour un écran à haute densité.
 *
 * RIEN N'EST REDESSINÉ : mêmes images, plus petites. Relancer ce script après
 * avoir changé un fantôme d'origine suffit à mettre les scènes à jour.
 *
 *   node scripts/fabriquer-scenes-ville.mjs
 */
import sharp from "../node_modules/sharp/lib/index.js";
import { mkdirSync, readdirSync } from "node:fs";

const SRC = "public/direct/fantomes";
const OUT = "public/direct/ville";
const HAUT = 520;

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(SRC).filter((x) => /^(hote|client)-.*\.png$/.test(x))) {
  const sortie = `${OUT}/${f.replace(/\.png$/, ".webp")}`;
  // ON ROGNE LE VIDE AUTOUR : le calque se pose alors au pied exact du
  // fantôme, sans marge transparente qui le ferait flotter au-dessus du sol.
  const info = await sharp(`${SRC}/${f}`)
    .trim({ threshold: 1 })
    .resize({ height: HAUT, withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(sortie);
  console.log(`${sortie} — ${info.width}×${info.height}, ${Math.round(info.size / 1024)} Ko`);
}
