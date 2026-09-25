// 🎯 CHAQUE CARTE DE L'ECRAN DE DEPART DOIT DESIGNER QUELQU'UN QUI EXISTE.
//
// ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
//
// PARCE QUE J'AI ECRIT VINGT ET UN IDENTIFIANTS FAUX, et que rien ne me l'a
// dit. L'ecran s'est construit, il s'est affiche, il etait beau — et deux de
// ses cinq categories etaient VIDES. Une carte dont l'identifiant ne correspond
// a aucun commerce ne provoque pas d'erreur : elle ne se dessine pas, c'est
// tout. La categorie « Mode » montrait zero commercant et la page n'avait
// aucune raison de s'en plaindre.
//
// D'OU VENAIT LA FAUTE. Je les avais releves en LISANT le fichier des commerces
// avec une expression reguliere, et l'expression attrapait les identifiants des
// articles de catalogue au lieu de ceux des commerces. Les deux se ressemblent
// et vivent dans le meme fichier. Une lecture de code qui se trompe d'un niveau
// d'imbrication ne se voit pas en relisant : elle se voit en verifiant.
//
// ═══ CE QUI SE VERIFIE ═════════════════════════════════════════════════════
//
//   · chaque `id` existe dans CARTES ou dans EVENEMENTS ;
//   · chaque `photo` existe dans public/ ;
//   · chaque categorie a au moins trois cartes — il en demandait « quatre ou
//     cinq », et en dessous de trois le paquet n'a plus de voisines a montrer,
//     donc plus rien a faire glisser.
//
// CE QUI NE SE VERIFIE PAS : que la photo soit belle, ni qu'elle montre la
// chose plutot que la devanture. Aucune garde ne sait faire ca. Voir
// verifier-annonce-essayable.mjs pour le meme aveu sur les annonces.

import fs from "node:fs";

const CHOIX = "src/lib/direct/choisir-commerce.ts";
const SOURCE = "src/lib/direct/apercu-habitant.ts";

const choix = fs.readFileSync(CHOIX, "utf8");
const source = fs.readFileSync(SOURCE, "utf8");

/* LES IDENTIFIANTS QUI FONT FOI. On les prend dans les deux tableaux de
   premier niveau, et on borne la lecture a eux : c'est exactement l'erreur
   qu'on veut rendre impossible, donc on ne la refait pas ici. Les identifiants
   d'un commerce sont indentes de quatre espaces dans ces tableaux-la ; ceux des
   articles de catalogue le sont davantage. */
const bloc = (debut, fin) => {
  const i = source.indexOf(debut);
  const j = fin ? source.indexOf(fin) : -1;
  if (i < 0) return "";
  return source.slice(i, j > i ? j : source.length);
};
const connus = new Set();
for (const m of bloc("const CARTES: CarteAutour[] = [", "\nexport function autourDeMoi").matchAll(
  /^ {4}id: "([^"]+)",/gm,
))
  connus.add(m[1]);
for (const m of bloc("const EVENEMENTS", "export function evenementsDeLaVille").matchAll(
  /^ {4}id: "([^"]+)",/gm,
))
  connus.add(m[1]);

if (connus.size < 10) {
  console.error(
    "✗ La liste des commerces n'a pas pu etre lue : " +
      connus.size +
      " identifiants trouves. La structure de " +
      SOURCE +
      " a change, et cette garde ne verifie plus rien. Corrigez-la avant de continuer.",
  );
  process.exit(1);
}

const fautes = [];
let cartes = 0;

/* UNE CATEGORIE A LA FOIS, pour pouvoir dire laquelle est trop courte. */
for (const cat of choix.split(/^  \{$/m).slice(1)) {
  const cle = (cat.match(/cle: "([^"]+)"/) || [])[1];
  if (!cle) continue;
  const lignes = [...cat.matchAll(/\{ id: "([^"]+)", photo: "([^"]+)"/g)];
  if (lignes.length < 3) {
    fautes.push(
      `la categorie « ${cle} » n'a que ${lignes.length} carte(s). Il en faut au moins trois : ` +
        "en dessous, le paquet n'a plus de voisine a montrer et il n'y a plus rien a faire glisser.",
    );
  }
  for (const [, id, photo] of lignes) {
    cartes++;
    if (!connus.has(id)) {
      fautes.push(
        `« ${cle} » designe « ${id} », qui n'est ni un commerce ni un evenement. ` +
          "La carte ne se dessinera pas, et la categorie sera silencieusement plus courte.",
      );
    }
    if (!fs.existsSync("public" + photo)) {
      fautes.push(`« ${cle} » demande la photo ${photo}, qui n'existe pas dans public/.`);
    }
  }
}

if (fautes.length) {
  console.error("✗ " + CHOIX);
  for (const f of fautes) console.error("  • " + f);
  process.exit(1);
}
console.log(`✓ Les ${cartes} cartes de l'ecran de depart designent toutes quelqu'un qui existe.`);
