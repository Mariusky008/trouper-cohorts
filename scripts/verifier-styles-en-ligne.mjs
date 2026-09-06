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
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * ═══ ON NE DEVINE PLUS : ON FAIT LIRE LE FICHIER PAR UN VRAI ANALYSEUR ═══
 *
 * CE QUE LES DEUX GARDES DU DESSOUS SAVENT FAIRE, ET CE QU'ELLES NE SAVENT PAS.
 * Elles lisent le TEXTE : où commence le bloc, ce qui suit l'accent grave de
 * fermeture, quels noms de classes se répètent. C'est la bonne façon de dire
 * « ce nom est pris deux fois » — un analyseur JavaScript, lui, ne sait rien du
 * CSS qu'il transporte. Mais pour dire « ce fichier compile-t-il », lire le
 * texte est un pari : il faut supposer où le littéral finit, et une supposition
 * finit toujours par tomber sur un cas qu'on n'avait pas prévu.
 *
 * LE CAS QUI L'A IMPOSÉ. Un commentaire citait un nom d'animation entre deux
 * accents graves. UNE PAIRE ne coupe pas le texte : elle le referme puis le
 * rouvre. Le fichier a compilé ici et levé une Syntax Error au déploiement,
 * parce que les deux analyseurs ne traitent pas la même construction de la même
 * façon. Aucune lecture de texte ne peut trancher ce genre de chose — seul un
 * analyseur le peut, et il rend en prime le numéro de ligne exact.
 *
 * ET IL NE SE TAIT JAMAIS EN SILENCE. Si le module n'est pas installé, on le
 * DIT et on échoue. Une vérification qui se désactive toute seule est pire que
 * pas de vérification : on continue de lui faire confiance.
 */
const exiger = createRequire(import.meta.url);
let analyser = null;
let pourquoiPasDAnalyseur = "";
try {
  analyser = exiger("@babel/parser").parse;
} catch (e) {
  pourquoiPasDAnalyseur = String(e?.message ?? e).split("\n")[0];
}

function erreurDeSyntaxe(source) {
  try {
    analyser(source, { sourceType: "module", plugins: ["jsx", "typescript"] });
    return null;
  } catch (e) {
    return {
      message: String(e?.message ?? e),
      ligne: e?.loc?.line ?? 0,
      colonne: e?.loc?.column ?? 0,
    };
  }
}


/**
 * ON NE TIENT PLUS LA LISTE À LA MAIN — ELLE ÉTAIT INCOMPLÈTE, ET ÇA A COÛTÉ
 * DEUX DÉFAUTS D'UN COUP.
 *
 * `src/app/autour-de-moi/assistante/page.tsx` porte la plus grosse feuille du
 * projet et n'y était pas. Cette garde-là passait donc au vert pendant que,
 * dans ce fichier :
 *   — un accent grave dans un commentaire cassait la compilation (la 9ᵉ fois) ;
 *   — « .as-plan » se retrouvait déclaré à deux endroits éloignés, ce que la
 *     seconde garde de ce script détecte précisément — le fil de la
 *     conversation avait perdu toute sa mise en page, et le commerçant l'a vu
 *     avant moi : « le design est très ramassé sur lui-même, étrangement ».
 *
 * Une liste écrite à la main vieillit à chaque écran ajouté. On cherche donc
 * les fichiers, et un écran neuf est couvert le jour où il est écrit.
 */
function fichiersAvecFeuille(dossier, trouves = []) {
  for (const e of readdirSync(new URL(`../${dossier}`, import.meta.url), { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const rel = `${dossier}/${e.name}`;
    if (e.isDirectory()) fichiersAvecFeuille(rel, trouves);
    else if (/\.tsx$/.test(e.name)) {
      // UN LITTÉRAL DE GABARIT, PAS N'IMPORTE QUEL `__html`. Beaucoup d'écrans
      // injectent une variable déjà construite ; ceux-là n'ont pas de feuille à
      // couper, et les compter en fautes désarmerait la garde d'un coup.
      if (/__html:\s*`/.test(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"))) {
        trouves.push(rel);
      }
    }
  }
  return trouves;
}

const FICHIERS = fichiersAvecFeuille("src").sort();

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

/**
 * LE MÊME NOM POUR DEUX CHOSES — trois fois payé sur ce projet.
 *
 * `.ap-vue` désignait la zone de la carte du paquet ET la vue d'un onglet.
 * `.ap-l` désignait les lignes de la liste des salons ET celles de la fiche
 * d'un commerce. `.ap-plus` désignait le panneau de La Ville ET le bouton qui
 * déplie les outils du champ d'écriture. Les trois fois, le symptôme est le
 * même : un élément hérite de propriétés venues d'un autre écran, et selon
 * l'ordre d'écriture. La dernière fois, un bouton de 38 points s'étirait en
 * ellipse verte de 118.
 *
 * CE QU'ON MESURE : une classe déclarée SEULE (`.machin{`) à deux endroits
 * éloignés de la feuille. Deux règles voisines sont une continuation
 * légitime — on les écrit comme ça partout ici ; deux règles à trois cents
 * lignes d'écart sont deux personnes qui ne se savaient pas voisines.
 */
const ECART_SUSPECT = 60;

function nomsRepris(css, ligneDebut) {
  const vus = new Map();
  const lignes = css.split("\n");
  // LA PROFONDEUR EST INDISPENSABLE. Sans elle, la garde criait sur chaque
  // surcharge d'un `@media` — c'est-à-dire sur la façon normale d'écrire du
  // CSS adaptatif, et une garde qui crie sur du code juste finit désarmée.
  // Seules les déclarations de PREMIER NIVEAU nomment un objet.
  let creux = 0;
  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const m = /^\s*(\.[A-Za-z][\w-]*)\s*\{/.exec(ligne);
    if (m && creux === 0) {
      const liste = vus.get(m[1]) ?? [];
      liste.push(ligneDebut + i);
      vus.set(m[1], liste);
    }
    // Les commentaires CSS peuvent porter des accolades : on les enlève avant
    // de compter, sinon un exemple entre parenthèses fausse toute la suite.
    const net = ligne.replace(/\/\*.*?\*\//g, "");
    creux += (net.match(/\{/g) ?? []).length - (net.match(/\}/g) ?? []).length;
    if (creux < 0) creux = 0;
  }
  const repris = [];
  for (const [nom, ou] of vus) {
    for (let k = 1; k < ou.length; k++) {
      if (ou[k] - ou[k - 1] > ECART_SUSPECT) repris.push({ nom, ou });
    }
  }
  return repris;
}

let fautes = 0;
for (const rel of FICHIERS) {
  const source = readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
  const blocs = blocsDeStyle(source);
  // ─── D'ABORD : EST-CE QUE CE FICHIER SE LIT ? ───
  // Avant de raisonner sur le contenu du bloc, on demande a un analyseur si le
  // fichier tient debout. C'est la seule verification qui ne suppose rien, et
  // c'est celle qui aurait attrape la paire d'accents graves des deux cotes.
  if (analyser) {
    const mal = erreurDeSyntaxe(source);
    if (mal) {
      const ligne = (source.split("\n")[mal.ligne - 1] ?? "").trim();
      console.error(
        `✗ ${rel}:${mal.ligne}:${mal.colonne} — ce fichier ne compile pas :\n` +
          `    ${mal.message}\n` +
          `    ${ligne.slice(0, 100)}\n` +
          `    Dans un bloc de style, la cause la plus frequente est un ACCENT\n` +
          `    GRAVE dans un commentaire CSS — seul il coupe le litteral, PAR\n` +
          `    PAIRE il le referme puis le rouvre, ce qui passe ici et casse au\n` +
          `    deploiement. Retirez-le, y compris autour d'un simple nom.`,
      );
      fautes++;
      // Le reste du script raisonne sur un fichier suppose valide : inutile
      // d'empiler des messages derives d'une lecture qui n'a plus de sens.
      continue;
    }
  }
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
  for (const b of blocs) {
    for (const { nom, ou } of nomsRepris(b.texte, b.ligne)) {
      console.error(
        `✗ ${rel} — « ${nom} » est déclaré seul à deux endroits éloignés : ` +
          `lignes ${ou.join(", ")}.\n` +
          `    Deux objets sans rapport sous le même nom héritent l'un de l'autre,\n` +
          `    et le résultat dépend de l'ordre d'écriture. Déjà payé trois fois\n` +
          `    (.ap-vue, .ap-l, .ap-plus). Renommez le plus récent.`,
      );
      fautes++;
    }
  }
  if (!fautes) console.log(`✓ ${rel} — ${blocs.length} bloc(s), refermé(s) au bon endroit, aucun nom repris.`);
}

if (!analyser) {
  console.error(
    `\n✗ L'ANALYSEUR SYNTAXIQUE EST ABSENT : ${pourquoiPasDAnalyseur}\n` +
      `    La verification la plus sure de ce script ne peut pas tourner, et\n` +
      `    une garde qui se desactive toute seule est pire que pas de garde :\n` +
      `    on continue de lui faire confiance. Installez @babel/parser.`,
  );
  process.exit(1);
}
if (fautes) {
  console.error(`\n${fautes} faute(s).`);
  process.exit(1);
}
console.log("Les feuilles de style en ligne sont saines.");
