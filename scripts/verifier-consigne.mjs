// 🪞 CE QU'ON DEMANDE VRAIMENT AU MODÈLE D'IMAGE, MESURÉ SUR LA PHRASE.
//
// ═══ POURQUOI CE FICHIER EXISTE ═════════════════════════════════════════════
//
// « Ce n'est toujours pas la même coupe et pas du tout ajustée à la photo de
// départ. »
//
// LA CAUSE N'ÉTAIT NI LE MODÈLE, NI LE MASQUE, NI LA RECOMPOSITION. Elle tenait
// en une contradiction dans la consigne : le texte disait « cette description
// est la CIBLE, exécute-la » ET « l'image 2 ne sert qu'à confirmer la couleur ».
// Le texte l'emportait donc sur la photo — et le jour où une description est
// écrite de mémoire plutôt que devant l'image, le modèle exécute fidèlement la
// mauvaise coupe. C'est exactement ce qui s'est passé.
//
// ELLE N'ÉTAIT SURVEILLÉE PAR RIEN, et c'est le vrai défaut. L'en-tête de
// `consigne-essai.ts` l'annonçait pourtant : « c'est LA phrase dont dépend la
// moitié du résultat », « une fonction pure se lit et se mesure en trois
// lignes », « le seul défaut grave de tout l'essayage venait d'ici, et rien ne
// le surveillait ». Le fichier a été déplacé pour être vérifiable, et personne
// ne l'a jamais vérifié.
//
// ═══ CE QUI SE MESURE ICI, ET CE QUI NE PEUT PAS L'ÊTRE ════════════════════
//
// ON NE PEUT PAS VÉRIFIER QU'UNE DESCRIPTION DÉCRIT BIEN SA PHOTO : il faudrait
// regarder l'image, et aucune garde ne sait faire ça. Ce qui se vérifie, c'est
// la RÈGLE qui rend une description imparfaite inoffensive — que la photo, quand
// il y en a une, ait le dernier mot sur la forme. C'est la seule protection qui
// survive au prochain oubli.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/consigne-essai.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boite = { exports: {} };
new Function("exports", "module", js)(boite.exports, boite);
const { consigne, consigneBrute } = boite.exports;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};

const COUPE =
  "un carré long dégradé qui s'arrête sous le menton, avec une raie au milieu";
const CHANGE = "uniquement les cheveux : leur coupe, leur longueur, leur couleur";

console.log("══ la photo de référence a le dernier mot sur la forme ══");
{
  const avec = consigne("votre tête", [], CHANGE, COUPE, true, true);

  // ═══ LA RÈGLE, ET C'EST LA SEULE QUI COMPTE ═══
  // Une description est écrite par un humain, parfois de mémoire. La photo, elle,
  // EST la coupe. Quand les deux se contredisent, la phrase doit dire laquelle
  // gagne — sans quoi le modèle tranche tout seul, et il tranche pour le texte.
  dire(
    /si les deux\s+ne concordent pas SUR .+, c'est l'image qui a raison/i.test(avec),
    "la consigne dit que l'image tranche en cas de désaccord",
  );
  // ═══ ET ELLE DIT SUR QUOI ═══
  // Une règle de préséance sans domaine est une règle qui déborde. Celle-ci
  // était posée juste avant quarante lignes qui protègent le visage, les
  // vêtements et le décor — et l'image 2 montre une AUTRE personne, dans
  // d'autres vêtements, sur un autre fond.
  dire(
    /Cette préséance ne vaut QUE pour cela/i.test(avec) &&
      /c'est l'image 1 qui fait foi, toujours/i.test(avec),
    "et elle borne cette préséance à la seule chose qu'elle doit trancher",
  );
  dire(
    /c'est ELLE qui fait foi/i.test(avec),
    "et elle nomme la photo comme la référence de la forme",
  );

  // ═══ ET LA CONTRADICTION D'AVANT NE PEUT PLUS REVENIR ═══
  // Ces deux formules disaient au modèle d'ignorer la photo. Elles sont la
  // cause mesurée du défaut ; les interdire est plus sûr que se souvenir de ne
  // pas les réécrire.
  dire(
    !/cette description est la CIBLE/i.test(avec),
    "la description n'est plus annoncée comme la cible",
  );
  dire(
    !/ne sert qu'à confirmer/i.test(avec),
    "et la photo n'est plus réduite à confirmer une couleur",
  );

  // LA DESCRIPTION RESTE DITE : elle n'est pas le problème, elle dit où
  // regarder. La retirer ramènerait l'autre défaut — un modèle qui déduit une
  // coupe d'une photo de quelqu'un d'autre et refabrique un portrait quand il
  // n'y arrive pas.
  dire(avec.includes(COUPE), "la description est toujours donnée, en toutes lettres");
}

console.log("\n══ sans photo, on ne parle pas d'une image qui n'existe pas ══");
{
  const sans = consigne("votre tête", [], CHANGE, COUPE, true, false);
  // UN TEXTE QUI DÉCRIT « IMAGE 2 » QUAND UNE SEULE IMAGE EST JOINTE envoie le
  // modèle chercher une consigne qu'il n'a pas : il la devine, et deviner est
  // exactement ce qui le fait refabriquer un portrait.
  dire(!/image 2/i.test(sans), "aucune mention d'une seconde image");
  dire(
    /Exécute cette description sur la personne de l'image 1/i.test(sans),
    "et la description reprend alors la main, puisqu'il n'y a rien d'autre",
  );
}

console.log("\n══ le mode brut reste ce qu'on taperait dans ChatGPT ══");
{
  const brut = consigneBrute("votre tête", CHANGE, COUPE, true);
  // IL SERT À COMPARER, DONC IL DOIT RESTER COURT. Le jour où on lui ajoute des
  // interdictions, il mesure la même chose que l'autre et ne compare plus rien.
  dire(brut.length < 600, `il tient en moins de six cents signes (${brut.length})`);
  dire(
    !/EXACTEMENT|Absolument rien|trait pour trait/i.test(brut),
    "et il ne contient aucune des interdictions accumulées",
  );
}

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
