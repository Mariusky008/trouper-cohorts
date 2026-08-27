#!/usr/bin/env node
// LE DÉFAUT LE PLUS CHER DE CE PROJET, ET LE PLUS BÊTE.
//
// Les feuilles de style de `/autour-de-moi` et de `/le-direct` sont posées dans
// un littéral de gabarit passé à `dangerouslySetInnerHTML`. UN SEUL ACCENT
// GRAVE n'importe où dedans — y compris dans un commentaire CSS, y compris dans
// un commentaire qui AVERTIT de ne pas en mettre — termine la chaîne, avale la
// suite du fichier, et la compilation s'arrête sur une erreur qui ne parle de
// rien : « Expected ',', got 'nth' ».
//
// Il a été payé cinq fois : aspect-ratio:auto, flex:initial, svh,
// overflow:hidden, puis nth-child(even). Les cinq fois, l'avertissement était
// déjà écrit deux lignes plus haut. Un commentaire ne suffit donc pas ; on le
// mesure, et on rend une phrase qui dit quoi faire.
//
//   node scripts/verifier-styles-en-ligne.mjs
import { readFileSync } from "node:fs";

const FICHIERS = [
  "src/app/le-direct/page.tsx",
  "src/app/autour-de-moi/apercu-habitant.tsx",
];

/**
 * Le contenu de chaque littéral de gabarit passé à `__html`, et CE QUI SUIT
 * l'accent grave de fermeture — c'est là qu'est le signal.
 */
function blocsDeStyle(source) {
  const blocs = [];
  const debut = /__html:\s*`/g;
  let m;
  while ((m = debut.exec(source))) {
    const i = m.index + m[0].length;
    const fin = source.indexOf("`", i);
    blocs.push({
      texte: source.slice(i, fin === -1 ? source.length : fin),
      // La ligne du DÉBUT du bloc, pour que le message soit cliquable.
      ligne: source.slice(0, i).split("\n").length,
      // Manque totalement : la chaîne n'est jamais refermée.
      ferme: fin !== -1,
      apres: fin === -1 ? "" : source.slice(fin + 1, fin + 40),
    });
    debut.lastIndex = fin === -1 ? source.length : fin + 1;
  }
  return blocs;
}

/**
 * DEUX FAÇONS DE S'Y PRENDRE QUI NE MARCHENT PAS, ET IL FAUT LES CONNAÎTRE
 * POUR NE PAS LES RÉÉCRIRE.
 *
 * 1. CHERCHER L'ACCENT GRAVE DANS LE BLOC. L'accent grave fautif EST la fin du
 *    bloc extrait : le bloc paraît donc parfaitement propre. Première version
 *    de cette garde écrite ainsi — verte sur un fichier délibérément cassé.
 *
 * 2. COMPTER LES ACCOLADES. Une coupure tombe presque toujours ENTRE deux
 *    règles, et le préfixe qui reste est parfaitement équilibré. Deuxième
 *    version, verte elle aussi.
 *
 * CE QUI MARCHE : REGARDER APRÈS. Quand le bloc se ferme au bon endroit, ce qui
 * suit l'accent grave est la fin de la propriété JSX — une virgule, puis les
 * accolades. Quand il se ferme trop tôt, ce qui suit est du CSS. On ne devine
 * rien, on lit.
 */
const APRES_ATTENDU = /^\s*[,}]/;

let fautes = 0;
for (const rel of FICHIERS) {
  const source = readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
  const blocs = blocsDeStyle(source);
  if (!blocs.length) {
    console.error(`✗ ${rel} : aucune feuille de style en ligne trouvée.`);
    fautes++;
    continue;
  }
  for (const b of blocs) {
    if (b.ferme && APRES_ATTENDU.test(b.apres)) continue;

    // La dernière ligne du bloc extrait est celle où la chaîne s'est arrêtée :
    // l'accent grave fautif est à son bout.
    const lignes = b.texte.split("\n");
    const ligne = b.ligne + lignes.length - 1;
    console.error(
      b.ferme
        ? `✗ ${rel}:${ligne} — la feuille de style se referme au milieu d'elle-même :\n` +
            `    ${(lignes.at(-1) ?? "").trim()}\n` +
            `    Un ACCENT GRAVE termine ici le littéral de gabarit. Retirez-le —\n` +
            `    y compris dans un commentaire CSS, y compris dans un commentaire\n` +
            `    qui avertit de ne pas en mettre. Déjà payé cinq fois.`
        : `✗ ${rel}:${b.ligne} — la feuille de style n'est jamais refermée.`,
    );
    fautes++;
  }
  if (!fautes) console.log(`✓ ${rel} — ${blocs.length} bloc(s), refermé(s) au bon endroit.`);
}

if (fautes) {
  console.error(`\n${fautes} faute(s).`);
  process.exit(1);
}
console.log("Les feuilles de style en ligne sont saines.");
