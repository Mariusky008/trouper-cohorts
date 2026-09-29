/**
 * 👻 FABRIQUER LE DOUBLE DU CHEF — les sept poses et le comptoir.
 *
 * Les fichiers arrivent avec des noms de machine ; on les nomme d'après ce
 * qu'ils montrent, vu un par un. Les poses sont détourées (fond transparent)
 * et cadrées pareil : on les réduit à 512 points en WebP, qui garde la
 * transparence pour le quart du poids d'un PNG. Le fond reste en JPEG.
 *
 * Usage : node scripts/fabriquer-double.mjs <dossier des sources>
 */
import sharp from "../node_modules/sharp/lib/index.js";
import { mkdirSync } from "node:fs";

const SRC = process.argv[2];
if (!SRC) throw new Error("donner le dossier des sources");
const OUT = "public/direct/double";
mkdirSync(OUT, { recursive: true });

const POSES = {
  "1d95950b-2ff7-4d50-b876-bfc100448e1e.png": "accueil", // il salue, sourire
  "3c9f3366-df68-4d35-9f85-f3c71186f620.png": "content", // yeux fermés en sourire
  "8fa6c772-f189-4e51-8eee-8680a4df9a19.png": "ecoute", // main à l'oreille
  "97cb5616-a64b-4cca-8bf4-b2541e9d7609.png": "parle-1", // bouche grande ouverte
  "a580f6e7-1448-4091-9b13-6b7d5c2e70e4.png": "parle-2", // bouche ouverte
  "fc3515e3-684a-4da4-9031-904251149210.png": "parle-3", // bouche entrouverte
  "bd58a910-be9c-4686-a1a7-c18ec7d1c81f.png": "reflechit", // doigt au menton
};

for (const [f, nom] of Object.entries(POSES)) {
  await sharp(`${SRC}/${f}`).resize(512, 512).webp({ quality: 86, alphaQuality: 90 }).toFile(`${OUT}/${nom}.webp`);
}
await sharp(`${SRC}/7a369e74-0a7e-4ff8-b2c9-9ea09585a6e0.png`).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/comptoir.jpg`);
console.log("fini : 7 poses et le comptoir dans", OUT);
