// 🖼️ LES PHOTOS DE LA FICHE GOOGLE ARRIVENT-ELLES ENTIÈRES ?
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// « Les photos ne sont toujours pas lues. Elles semblent là mais pas lisibles,
// les deux dernières. »
//
// UNE ADRESSE DE PHOTO GOOGLE SE TERMINE PAR UNE COMMANDE, pas par une
// décoration : `=w86-h86-k-no` demande au serveur d'images quatre-vingt-six
// points de côté, et `k` et `no` disent comment servir le fichier. Trois tours
// durant, on a réécrit ce suffixe dans le navigateur en espérant tomber juste,
// sans jamais pouvoir vérifier : le mandataire du conteneur de développement
// refuse la connexion vers Google.
//
// LA PHOTO PASSE MAINTENANT PAR NOUS — voir `/api/photo-fiche`. Ce qui se
// vérifie ici, c'est donc ce qui peut l'être sans réseau, et c'est justement ce
// qui a cassé deux fois :
//
//   1. L'ADRESSE D'ORIGINE N'EST JAMAIS PERDUE. C'est la seule dont on sache
//      qu'elle existe ; tout le reste est un pari. Elle doit partir entière
//      vers la route, et rester la dernière écriture essayée.
//   2. LES JETONS QUI NE SONT PAS DES TAILLES SURVIVENT à la réécriture. Les
//      jeter, c'était demander une adresse que Google n'a jamais émise.
//   3. LA PORTE EST FERMÉE. Une route qui va lire une adresse qu'on lui donne
//      doit refuser tout ce qui n'est pas un serveur d'images de Google, sans
//      quoi elle lit des adresses internes pour qui la lui demande.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");

/**
 * On transpile les fonctions pures d'un module sans tirer son graphe.
 *
 * `avant` EMPORTE LES CONSTANTES DONT ELLES DÉPENDENT. `hoteAutorise` lit
 * `HOTES` : sans la liste, la fonction se transpile très bien et tombe à
 * l'exécution. Une garde qui plante n'est pas une garde qui échoue — c'est une
 * garde qu'on finit par retirer.
 */
function charger(fichier, noms, avant = []) {
  const src = readFileSync(fichier, "utf8");
  const constantes = avant.map((nom) => {
    const m = src.match(new RegExp(`^const ${nom} = [\\s\\S]*?^\\];`, "m"));
    if (!m) throw new Error(`la constante ${nom} a disparu de ${fichier}`);
    return m[0];
  });
  const bouts = noms.map((nom) => {
    const i = src.indexOf(`function ${nom}(`);
    if (i < 0) throw new Error(`${nom} a disparu de ${fichier}`);
    const debut = src.lastIndexOf("export ", i) === i - 7 ? i - 7 : i;
    let d = 0;
    let k = src.indexOf("{", i);
    for (; k < src.length; k++) {
      if (src[k] === "{") d++;
      else if (src[k] === "}" && --d === 0) break;
    }
    return src.slice(debut, k + 1).replace("export ", "");
  });
  const js = ts.transpileModule(
    `${constantes.join("\n")}\n${bouts.join("\n")}\n${noms.map((n) => `exports.${n}=${n};`).join("")}`,
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const boite = { exports: {} };
  new Function("exports", "module", js)(boite.exports, boite);
  return boite.exports;
}

const { enGrand } = charger("src/lib/site-internet/carte-depuis-fiche.ts", ["enGrand"]);
const { ecritures, hoteAutorise } = charger(
  "src/app/api/photo-fiche/route.ts",
  ["ecritures", "hoteAutorise"],
  ["HOTES"],
);

let echecs = 0;
const dire = (bon, quoi) => {
  if (!bon) echecs++;
  console.log(`  ${bon ? "ok  " : "ÉCHEC"} ${quoi}`);
};

const P = "https://lh3.googleusercontent.com/p/AF1QipExemple";
const VIGNETTE = `${P}=w86-h86-k-no`;

console.log("══ l'adresse d'origine part entière vers nous ══");
{
  const r = enGrand(VIGNETTE);
  dire(r.startsWith("/api/photo-fiche?u="), "la page demande la photo à notre route");
  // C'EST LE POINT QUI A CASSÉ DEUX FOIS : on envoyait une adresse réécrite,
  // donc une adresse dont personne ne savait si elle existait.
  dire(
    decodeURIComponent(r.slice("/api/photo-fiche?u=".length)) === VIGNETTE,
    "et elle porte l'adresse de Google sans un caractère de moins",
  );
  // NOS PROPRES FICHIERS NE PASSENT PAS PAR LÀ : ce sont des fichiers du
  // dépôt, et les faire relire par le serveur coûterait un aller-retour pour
  // rien.
  dire(enGrand("/demo/fleuriste-1.jpg") === "/demo/fleuriste-1.jpg", "un fichier du dépôt ressort intact");
  dire(enGrand("https://exemple.fr/photo?a=b") === "https://exemple.fr/photo?a=b", "une adresse tierce aussi");
}

console.log("\n══ les écritures essayées, dans l'ordre ══");
{
  const l = ecritures(VIGNETTE);
  dire(l[0] === `${P}=w1600-h1200-k-no`, `une vignette s'agrandit d'abord (${l[0].slice(l[0].lastIndexOf("="))})`);
  dire(l.includes(`${P}=s1600`), "l'autre écriture de la grande ensuite");
  // SI LES DEUX PARIS SONT PERDUS, IL RESTE CE QU'ON SAIT. Une vignette de
  // quatre-vingt-six points qui s'affiche vaut mieux qu'une grande absente.
  dire(l[l.length - 1] === VIGNETTE, "et l'originale en dernier recours");

  /* LE CAS DE GAÏA : huit photos en `=w1920-h1080-k-no`, huit échecs. On les
     réécrivait en `=w1600-h1200` — plus petit que l'original, et dans un autre
     rapport. On demandait un recadrage à la place d'une adresse qui existait. */
  const deja = `${P}=w1920-h1080-k-no`;
  dire(ecritures(deja)[0] === deja, "une adresse déjà grande est essayée telle quelle d'abord");
  dire(ecritures(deja).length === 3, "et les agrandissements restent en secours");

  const long = ecritures("https://lh5.googleusercontent.com/gps-cs-s/XYZ=w408-h306-k-no-pi0-ya0");
  dire(
    long[0] === "https://lh5.googleusercontent.com/gps-cs-s/XYZ=w1600-h1200-k-no-pi0-ya0",
    "un suffixe de cinq jetons garde ses trois jetons qui ne sont pas des tailles",
  );
  // UNE ADRESSE SANS SUFFIXE NE SE DEMANDE PAS TROIS FOIS : on paierait trois
  // allers-retours pour la même chose.
  dire(new Set(ecritures(P)).size === ecritures(P).length, "aucune écriture n'est demandée deux fois");
}

console.log("\n══ et la porte reste fermée ══");
{
  const ok = (u) => hoteAutorise(new URL(u));
  dire(ok(VIGNETTE), "un serveur d'images de Google passe");
  dire(ok("https://lh6.ggpht.com/x"), "ggpht aussi");
  // UNE ROUTE QUI VA LIRE CE QU'ON LUI DONNE EST UNE PORTE. Ces trois-là sont
  // les portes qu'on ouvre sans y penser : le réseau interne, l'adresse de
  // métadonnées d'un hébergeur, et le nom de domaine acheté pour ressembler.
  dire(!ok("http://lh3.googleusercontent.com/x"), "mais pas en clair, sans chiffrement");
  dire(!ok("https://169.254.169.254/latest/meta-data/"), "ni une adresse de métadonnées d'hébergeur");
  dire(!ok("https://googleusercontent.com.pirate.fr/x"), "ni un nom qui se contente d'y ressembler");
  dire(!ok("https://interne.clikme.fr/admin"), "ni notre propre réseau");
}

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
