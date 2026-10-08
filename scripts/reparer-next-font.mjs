#!/usr/bin/env node
// 🔤 UNE POLICE GOOGLE NE DOIT PLUS POUVOIR ARRÊTER LA COMPILATION.
//
// « Failed to compile. src/app/avis-google/layout.tsx — An error occurred in
// `next/font`. TypeError: Cannot read properties of null (reading '1'). »
//
// CE QUI SE PASSE. Pendant la compilation, `next/font/google` télécharge la
// feuille de style de chaque police, puis chacun de ses fichiers, et lit
// l'EXTENSION du fichier dans son adresse :
//
//     const ext = /\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1];
//
// Quand Google Fonts répond, depuis le serveur de compilation, avec une adresse
// qui ne finit pas par une extension (une adresse dynamique, ou suivie de
// paramètres), la recherche rend `null`, et `[1]` arrête toute la compilation.
// Ça n'arrive pas à chaque fois — le même commit est passé une fois et a
// échoué la suivante —, et c'est ce qui le rend si coûteux : deux déploiements
// perdus en une après-midi, et des corrections qui n'arrivaient jamais en
// ligne.
//
// LA RÉPARATION, AVANT CHAQUE COMPILATION (`prebuild`) : sans extension
// lisible, on prend `woff2` — c'est le format que Google sert à l'agent de
// navigateur que Next.js présente. Le script ne touche qu'à cette ligne, ne
// fait rien si elle a déjà été réparée ou si Next.js l'a changée, et
// N'ARRÊTE JAMAIS la compilation lui-même.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const AVANT = "const ext = /\\.(woff|woff2|eot|ttf|otf)$/.exec(googleFontFileUrl)[1];";
const APRES =
  "const ext = (/\\.(woff|woff2|eot|ttf|otf)(?:$|[?#])/.exec(googleFontFileUrl) || [null, 'woff2'])[1]; /* réparé par scripts/reparer-next-font.mjs */";

try {
  const require = createRequire(import.meta.url);
  const racine = dirname(require.resolve("next/package.json"));
  const fichier = join(racine, "dist/compiled/@next/font/dist/google/loader.js");
  if (!existsSync(fichier)) {
    console.log("[reparer-next-font] loader introuvable — rien à faire.");
  } else {
    const texte = readFileSync(fichier, "utf8");
    if (texte.includes("réparé par scripts/reparer-next-font.mjs")) {
      console.log("[reparer-next-font] déjà réparé.");
    } else if (!texte.includes(AVANT)) {
      console.log("[reparer-next-font] ligne absente (Next.js a changé) — rien à faire.");
    } else {
      writeFileSync(fichier, texte.replace(AVANT, APRES));
      console.log("[reparer-next-font] extension des polices Google : repli sur woff2 posé.");
    }
  }
} catch (e) {
  console.log("[reparer-next-font] ignoré :", e instanceof Error ? e.message : String(e));
}
