/**
 * 🛋️ LES ÉLÉMENTS DU GRAND SALON D'ENSEMBLE — préparés une fois, pas à l'affichage.
 *
 * « Ne pas générer une nouvelle grande image pour chaque utilisateur ou
 * chaque changement de conversation. » On part des PNG transparents fournis
 * (le fond du salon, la bibliothèque, le mobilier, les fantômes), on rogne le
 * vide autour de chacun — un calque se pose alors au pied exact de ce qu'il
 * montre — et on les ramène à la taille où un téléphone les affiche, en webp.
 *
 * RIEN N'EST REDESSINÉ : mêmes images, plus légères.
 *
 *   node scripts/fabriquer-salon-ensemble.mjs <dossier des PNG>
 *
 * Les noms d'origine (des identifiants) sont rangés sous un nom qui dit ce
 * qu'ils montrent : voir `NOMS`.
 */
import sharp from "../node_modules/sharp/lib/index.js";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2];
const OUT = "public/direct/ensemble";
if (!SRC || !existsSync(SRC)) {
  console.error("Indiquer le dossier des PNG.");
  process.exit(1);
}

// nom d'origine → [nom, hauteur maximale]
const NOMS = {
  "6fcb9032-e7d0-485d-8f87-a6fe9267d7bf": ["fond", 1672],
  "4521ad61-cbc3-479d-993f-28d723a78d44": ["bibliotheque", 1100],
  "c16ba030-30d8-40f4-bd9b-2f3d3b210285": ["canape-vert", 560],
  "17b310d4-b920-454c-9990-d4f5f00f2f78": ["canape-cuir", 560],
  "65f93eeb-ae61-4268-9280-b91fbf1f1c3e": ["canape-bouclette", 460],
  "7ac21d66-bacc-4965-9007-18d36e86b24f": ["fauteuil-bouclette", 560],
  "e1304fda-9702-4828-b3ee-9f8f5d61a4a8": ["fauteuil-cuir", 560],
  "149ed52b-5242-48f1-8bf8-f431cd90cecf": ["chaises-velours", 420],
  "a42ee00a-973f-4ddf-b77d-11ac097d8506": ["table-travertin", 400],
  "b93aca37-4aac-4f43-b031-afc7ca74be68": ["table-ronde", 460],
  "f644163f-fb1a-45fa-94a6-faaf60dd1d77": ["table-laiton", 400],
  "04876feb-346b-4882-98f1-c410ffc2e5fd": ["fantome-beret-noir", 520],
  "24316380-07a6-4836-9e7f-ec11635e153c": ["fantome-echarpe-verte", 520],
  "2f7a2b8f-adc9-4518-9c2f-b07fcc652002": ["fantome-beret-rouge", 520],
  "4e0cc36d-c1de-45a1-8f09-126538896b5f": ["fantome-echarpe-violette", 520],
  "5e6835d4-8441-40b4-8f5f-be269bbcfc97": ["fantome-bonnet", 520],
  "6b110030-fee3-4811-bf39-32448a1fc748": ["fantome-salue", 520],
  "7f3cf527-8f55-4c3d-8962-8c47749a4b63": ["fantome-lunettes-rouges", 520],
  "9473b419-cf5a-4754-a31e-fc7fdeb4ac67": ["fantome-casquette-bleue", 520],
  "aa60d6b3-967b-4847-8085-0a10e8a0346f": ["fantome-casquette-noire", 520],
};

/**
 * « LE SOL DOMINE TROP LA COMPOSITION. Le parquet orange très lumineux attire
 * presque autant l'œil que les personnages. » Sous la ligne des fenêtres, le
 * parquet passe plus sombre, moins saturé, ses reflets adoucis ; un léger
 * assombrissement sur les bords ramène le regard vers le milieu, où sont les
 * groupes. Le haut de la pièce (fenêtres, bibliothèques) ne change pas.
 */
async function solAdouci(img, haut) {
  const orig = await img.resize({ height: haut, withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = orig.info;
  const doux = await sharp(orig.data).modulate({ brightness: 0.76, saturation: 0.68 }).linear(0.86, 10).blur(0.8).png().toBuffer();
  const svg = (corps) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${corps}</svg>`);
  const masque = svg(
    '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.25" stop-color="#fff" stop-opacity="0"/><stop offset="0.42" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>',
  );
  const bords = svg(
    '<defs><radialGradient id="v" cx="0.5" cy="0.6" r="0.8"><stop offset="0.5" stop-color="#140904" stop-opacity="0"/><stop offset="1" stop-color="#140904" stop-opacity="0.5"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/>',
  );
  const sol = await sharp(doux).composite([{ input: masque, blend: "dest-in" }]).png().toBuffer();
  return sharp(orig.data).composite([{ input: sol }, { input: bords }]);
}

mkdirSync(OUT, { recursive: true });
for (const [id, [nom, haut]] of Object.entries(NOMS)) {
  const f = join(SRC, `${id}.png`);
  if (!existsSync(f)) {
    console.warn(`absent : ${id} (${nom})`);
    continue;
  }
  let img = sharp(f);
  // LE FOND GARDE SON CADRE ; les calques perdent leur vide.
  if (nom !== "fond") img = img.trim({ threshold: 1 });
  if (nom === "fond") img = await solAdouci(img, haut);
  const info = await img
    .resize({ height: haut, withoutEnlargement: true })
    .webp({ quality: nom === "fond" ? 80 : 84, alphaQuality: 90 })
    .toFile(join(OUT, `${nom}.webp`));
  console.log(`${nom}.webp — ${info.width}×${info.height}, ${Math.round(info.size / 1024)} Ko`);
}
