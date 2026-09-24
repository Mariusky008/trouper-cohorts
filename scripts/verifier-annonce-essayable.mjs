// 👗 UNE ANNONCE QU'ON PEUT ESSAYER MONTRE LA CHOSE, PAS LE LIEU.
//
// ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
//
// « Pour l'annonce coiffure il faut que ça soit une coupe de coiffure en photo
// et pas un siège de salon pour donner envie d'essayer la coiffure. Idem pour
// le magasin de vêtement : il faut un vêtement clair et net qui donne envie
// d'être essayé. En fait chaque annonce doit être quelque chose qui donne
// envie d'être essayé. »
//
// LA CARTE PORTE UN BOUTON QUI DIT « ESSAYER SUR MOI », ET ELLE MONTRAIT UN
// FAUTEUIL VIDE. Le défaut n'était pas dans le dessin : les annonces de ces
// métiers-là n'avaient AUCUNE photo, et la carte retombait alors sur celle du
// commerce — une devanture, un salon, des portants. Un repli qui montre le
// décor est un repli qui tue la promesse.
//
// ═══ CE QUI SE VÉRIFIE, ET POURQUOI C'EST CELUI-LÀ ═════════════════════════
//
// AUCUNE GARDE NE SAIT SI UNE PHOTO DONNE ENVIE. Ce qui se vérifie, c'est la
// condition sans laquelle elle ne peut pas : que l'annonce ait SA PROPRE
// photo, au lieu d'emprunter celle du commerce.
//
// ET SEULEMENT LÀ OÙ LA PROMESSE EST FAITE. Un restaurant n'a pas besoin d'une
// photo par annonce : sa photo de tête est déjà une assiette, et « la table
// des 6 inconnus » n'est pas une chose qu'on essaie sur soi. La règle vaut
// pour les métiers dont la carte propose un essayage — c'est là que le repli
// coûte quelque chose.
//
// ON LIT LA BRANCHE, PAS LE NOM DU COMMERCE. « coif-centre » s'appellera
// autrement un jour ; `branche: "coiffeur"` dit ce que le commerce EST, et
// c'est sur cette déclaration-là que le produit se fonde partout ailleurs.
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/direct/apercu-habitant.ts", "utf8");

/**
 * LES MÉTIERS OÙ L'ON POSE LA CHOSE SUR SOI.
 *
 * Ce ne sont pas « les métiers importants » : ce sont ceux dont la carte
 * affiche « Essayer sur moi », donc ceux où une photo de décor promet une
 * chose et en montre une autre.
 */
const ESSAYABLES = ["mode", "coiffeur", "lunetier", "ongles"];

let echecs = 0;
const dire = (bon, quoi) => {
  if (!bon) echecs++;
  console.log(`  ${bon ? "ok  " : "ÉCHEC"} ${quoi}`);
};

const murs = src.split(/\n  \{\n    id: "/).slice(1);
let vus = 0;
let annonces = 0;

console.log("══ chaque annonce essayable porte sa propre photo ══");
for (const bloc of murs) {
  const id = bloc.slice(0, bloc.indexOf('"'));
  const branche = (bloc.match(/\n    branche: "([^"]+)"/) || [])[1];
  if (!branche || !ESSAYABLES.includes(branche)) continue;
  vus++;
  const moments = (bloc.match(/\n    moments: \[([\s\S]*?)\n    \],/) || [])[1] || "";
  const sans = [];
  let n = 0;
  for (const m of moments.split(/\n      \{/).slice(1)) {
    const titre = (m.match(/titre: "([^"]+)"/) || [])[1] || "sans titre";
    n++;
    annonces++;
    if (!/\n        photo: "\/direct\//.test(m)) sans.push(titre);
  }
  dire(
    n > 0 && sans.length === 0,
    sans.length
      ? `${id} [${branche}] : ${sans.length} annonce(s) sans photo — ${sans.join(" ; ")}`
      : `${id} [${branche}] : ${n} annonce(s), toutes illustrées`,
  );
}
dire(vus >= 6, `${vus} commerces essayables relus, ${annonces} annonces`);

/**
 * ═══ ET LA PHOTO DÉSIGNÉE EXISTE VRAIMENT ═════════════════════════════════
 *
 * « Erreur : 404. » Un fichier annoncé qui n'existe pas n'est pas un repli,
 * c'est une requête morte à chaque affichage de la carte. Le dépôt le dit
 * déjà dans `public/direct/LISEZ-MOI.md` ; personne ne le vérifiait.
 */
console.log("\n══ et le fichier existe dans le dépôt ══");
{
  const { existsSync } = await import("node:fs");
  const manquants = [...new Set([...src.matchAll(/photo: "(\/direct\/[^"]+)"/g)].map((m) => m[1]))]
    .filter((p) => !existsSync(`public${p}`));
  dire(
    manquants.length === 0,
    manquants.length ? `des photos n'existent pas : ${manquants.join(" ; ")}` : "toutes les photos citées sont là",
  );
}

/**
 * ═══ ET LE MOT DU MÉTIER RESTE CELUI DU CLIENT ════════════════════════════
 *
 * « On parlait de flash au lieu de tatous. »
 *
 * « FLASH » EST UN MOT DE TATOUEUR, PAS DE CLIENT. Il était sorti de la voix
 * de la démonstration ; il restait dans le titre d'une annonce, où il est
 * encore plus visible. Le jargon d'un métier ne s'écrit pas sur la carte que
 * lit son client.
 */
console.log("\n══ pas de jargon de métier sur une annonce ══");
{
  const fautifs = [...src.matchAll(/titre: "([^"]*\bflash\w*\b[^"]*)"/gi)].map((m) => m[1]);
  dire(fautifs.length === 0, fautifs.length ? `« flash » dans : ${fautifs.join(" ; ")}` : "« flash » n'apparaît dans aucun titre");
}

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
