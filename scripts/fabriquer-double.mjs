/**
 * 👻 FABRIQUER LE DOUBLE D'UN MÉTIER — les sept poses et le décor.
 *
 * Les poses sont détourées (fond transparent) et cadrées pareil : on les
 * réduit à 512 points en WebP, qui garde la transparence pour le quart du
 * poids d'un PNG. Le décor reste en JPEG.
 *
 * DEUX USAGES :
 *
 *   node scripts/fabriquer-double.mjs <dossier>
 *     Le chef, tel qu'il est arrivé : des fichiers aux noms de machine, qu'on
 *     a nommés d'après ce qu'ils montrent, vus un par un (voir CHEF).
 *
 *   node scripts/fabriquer-double.mjs <dossier> <métier>
 *     Un autre métier (fleurs, coiffure, ongles, mode, bar, createur,
 *     lunettes, seance). Les fichiers sont nommés par leur expression :
 *     accueil, content, ecoute, reflechit, parle-1, parle-2, parle-3 (bouche
 *     grande ouverte, ouverte, entrouverte) et decor — en .png, .jpg ou .webp.
 *     Ils partent dans public/direct/double/<métier>/ ; il reste à ajouter le
 *     métier à TENUES dans `lib/direct/double-metiers.ts`.
 */
import sharp from "../node_modules/sharp/lib/index.js";
import { existsSync, mkdirSync } from "node:fs";

const SRC = process.argv[2];
const METIER = process.argv[3];
if (!SRC) throw new Error("donner le dossier des sources");

const CHEF = {
  "1d95950b-2ff7-4d50-b876-bfc100448e1e.png": "accueil", // il salue, sourire
  "3c9f3366-df68-4d35-9f85-f3c71186f620.png": "content", // yeux fermés en sourire
  "8fa6c772-f189-4e51-8eee-8680a4df9a19.png": "ecoute", // main à l'oreille
  "97cb5616-a64b-4cca-8bf4-b2541e9d7609.png": "parle-1", // bouche grande ouverte
  "a580f6e7-1448-4091-9b13-6b7d5c2e70e4.png": "parle-2", // bouche ouverte
  "fc3515e3-684a-4da4-9031-904251149210.png": "parle-3", // bouche entrouverte
  "bd58a910-be9c-4686-a1a7-c18ec7d1c81f.png": "reflechit", // doigt au menton
};

/** Le fichier d'une expression, quelle que soit son extension. */
function trouver(nom) {
  for (const ext of ["png", "webp", "jpg", "jpeg"]) {
    if (existsSync(`${SRC}/${nom}.${ext}`)) return `${SRC}/${nom}.${ext}`;
  }
  throw new Error(`il manque « ${nom} » dans ${SRC}`);
}

if (!METIER) {
  const OUT = "public/direct/double";
  mkdirSync(OUT, { recursive: true });
  for (const [f, nom] of Object.entries(CHEF)) {
    await sharp(`${SRC}/${f}`).resize(512, 512).webp({ quality: 86, alphaQuality: 90 }).toFile(`${OUT}/${nom}.webp`);
  }
  await sharp(`${SRC}/7a369e74-0a7e-4ff8-b2c9-9ea09585a6e0.png`).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/comptoir.jpg`);
  console.log("fini : 7 poses et le comptoir dans", OUT);
} else {
  const OUT = `public/direct/double/${METIER}`;
  mkdirSync(OUT, { recursive: true });
  for (const nom of ["accueil", "content", "ecoute", "reflechit", "parle-1", "parle-2", "parle-3"]) {
    await sharp(trouver(nom)).resize(512, 512).webp({ quality: 86, alphaQuality: 90 }).toFile(`${OUT}/${nom}.webp`);
  }
  await sharp(trouver("decor")).resize({ width: 1080, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/decor.jpg`);
  console.log(`fini : 7 poses et le décor dans ${OUT} — ajoute « ${METIER} » à TENUES dans lib/direct/double-metiers.ts`);
}
