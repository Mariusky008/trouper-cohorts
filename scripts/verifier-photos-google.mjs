// 🖼️ LES PHOTOS DE LA FICHE GOOGLE ARRIVENT-ELLES ENTIÈRES ?
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// « Les photos ne sont toujours pas lues. »
//
// UNE ADRESSE DE PHOTO GOOGLE SE TERMINE PAR UNE COMMANDE, pas par une
// décoration : `=w86-h86-k-no` demande au serveur d'images quatre-vingt-six
// points de côté, et `k` et `no` disent comment servir le fichier. On
// remplaçait le suffixe ENTIER pour demander la grande — et on jetait les deux
// drapeaux avec la taille.
//
// ON NE PEUT PAS VÉRIFIER DEPUIS CE CONTENEUR QUE GOOGLE RÉPOND : le mandataire
// refuse la connexion vers `lh3.googleusercontent.com`. Ce qui se vérifie, et
// qui survit au prochain changement, c'est que la RÉÉCRITURE NE PERD RIEN : les
// jetons qui ne sont pas des dimensions doivent ressortir, dans leur ordre. Un
// suffixe qu'on ne sait pas lire se garde plutôt qu'il ne se jette.
//
// ET QU'IL EXISTE UNE SECONDE ÉCRITURE, différente de la première. C'est elle
// que la vignette essaie quand la première ne vient pas — voir
// `reessayerAutrement` dans `boutique.tsx`. Le jour où les deux se mettent à
// rendre la même chaîne, le repli ne replie plus rien et personne ne le voit.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const src = readFileSync("src/lib/site-internet/carte-depuis-fiche.ts", "utf8");

// ON NE TRANSPILE QUE LES DEUX FONCTIONS PURES, pour ne pas tirer tout le
// graphe d'imports d'un module qui parle à la moitié du dépôt.
function extraire(nom) {
  const i = src.indexOf(`export function ${nom}(`);
  if (i < 0) throw new Error(`${nom} a disparu de carte-depuis-fiche.ts`);
  let d = 0;
  let k = src.indexOf("{", i);
  for (; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}" && --d === 0) break;
  }
  return src.slice(i, k + 1).replace("export ", "");
}
const js = ts.transpileModule(`${extraire("enGrand")}\n${extraire("enGrandAutrement")}\nexports.enGrand=enGrand;exports.enGrandAutrement=enGrandAutrement;`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boite = { exports: {} };
new Function("exports", "module", js)(boite.exports, boite);
const { enGrand, enGrandAutrement } = boite.exports;

let echecs = 0;
const dire = (bon, quoi) => {
  if (!bon) echecs++;
  console.log(`  ${bon ? "ok  " : "ÉCHEC"} ${quoi}`);
};

const P = "https://lh3.googleusercontent.com/p/AF1QipExemple";

console.log("══ la taille change, les drapeaux restent ══");
{
  // C'EST LE DÉFAUT EXACT QU'IL A VU : deux vignettes sur quatre manquantes,
  // et les deux qui restaient étaient nos propres fichiers.
  const r = enGrand(`${P}=w86-h86-k-no`);
  dire(/=w1600-h1200/.test(r), "la vignette de quatre-vingt-six points devient une grande");
  dire(r.endsWith("-k-no"), "et les drapeaux `k` et `no` sont toujours là");

  const long = enGrand("https://lh3.googleusercontent.com/gps-cs-s/XYZ=w408-h306-k-no-pi0-ya0");
  dire(
    long === "https://lh3.googleusercontent.com/gps-cs-s/XYZ=w1600-h1200-k-no-pi0-ya0",
    "un suffixe de cinq jetons garde ses trois jetons qui ne sont pas des tailles",
  );

  // `=s120` EST L'AUTRE ÉCRITURE DE GOOGLE : un seul nombre, le plus grand côté.
  dire(enGrand(`${P}=s120`) === `${P}=w1600-h1200`, "l'écriture à un seul nombre se réécrit aussi");
  dire(enGrand(P) === `${P}=w1600-h1200`, "et une adresse sans suffixe en reçoit un");
}

console.log("\n══ ce qui n'est pas de Google ne se touche pas ══");
{
  // NOS PHOTOS DE DÉMONSTRATION SONT DES FICHIERS DU DÉPÔT : leur ajouter un
  // suffixe donnerait une image introuvable, donc un trou sur la page.
  dire(enGrand("/demo/fleuriste-1.jpg") === "/demo/fleuriste-1.jpg", "un fichier du dépôt ressort intact");
  dire(enGrand("https://exemple.fr/photo?a=b") === "https://exemple.fr/photo?a=b", "une adresse tierce aussi");
  dire(enGrandAutrement("/demo/fleuriste-1.jpg") === "", "et il n'y a pas de seconde écriture à essayer pour elles");
}

console.log("\n══ le repli propose vraiment autre chose ══");
{
  const un = enGrand(`${P}=w86-h86-k-no`);
  const deux = enGrandAutrement(`${P}=w86-h86-k-no`);
  // SANS CETTE DIFFÉRENCE, LA VIGNETTE REDEMANDE LA MÊME ADRESSE : le repli
  // coûte un aller-retour et ne rattrape rien. C'est ce qu'on ne verrait pas.
  dire(deux !== "" && deux !== un, "la seconde écriture n'est pas la première");
  dire(deux.endsWith("=s1600"), "c'est la forme à un seul nombre, la plus largement acceptée");
  dire(deux.startsWith(P), "et elle porte la même photo");
}

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
