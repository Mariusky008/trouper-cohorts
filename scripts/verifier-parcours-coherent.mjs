/**
 * 🔎 LA PHOTO D'UN PARCOURS DOIT AVOIR SON MOMENT — sinon le titre ment.
 *
 * ═══ LE DÉFAUT QU'ELLE ATTRAPE ═════════════════════════════════════════════
 *
 * « Photo 4 : c'est une femme et c'est marqué coupe homme et tondeuse +
 * ciseaux. »
 *
 * LES DEUX PARCOURS DÉSIGNENT LEUR PIÈCE PAR SA PHOTO, puis cherchent dans la
 * journée du commerce le moment qui porte cette photo, pour en lire le nom et
 * le prix. Quand ce moment n'existe pas, le code retombe sur l'offre en cours —
 * et affiche alors le nom et le prix d'une AUTRE chose, sous l'image de la
 * bonne. C'est exactement ce qui s'est passé : un carré sur une femme, titré
 * « Coupe homme · Tondeuse + ciseaux · 18 € ».
 *
 * CE DÉFAUT NE SE VOIT PAS EN LISANT LE CODE, parce que le repli est légitime
 * et que rien ne plante. Il ne se voit qu'à l'écran, et seulement si on connaît
 * la coupe qu'on regarde. Une garde, elle, le voit à chaque fois.
 *
 * ═══ CE QU'ELLE VÉRIFIE ════════════════════════════════════════════════════
 *
 * Pour chaque parcours : le commerce existe ; la photo de la pièce est un
 * fichier présent ; et un moment de ce commerce porte exactement cette photo.
 * Rien de plus — le nom et le prix, eux, viennent de ce moment, donc dès qu'il
 * existe ils sont justes par construction.
 *
 * ELLE LIT LES FICHIERS, ELLE N'EXÉCUTE PAS L'APPLICATION. Le catalogue est un
 * gros module React ; l'importer ici demanderait un compilateur. Deux lectures
 * de texte suffisent, et une garde qu'on ne peut pas lancer ne sert à rien.
 */

import { readFileSync, existsSync } from "node:fs";

const CATALOGUE = "src/lib/direct/apercu-habitant.ts";

/** Les parcours, et où chacun déclare son commerce et sa photo. */
const PARCOURS = [
  { quoi: "mode", fichier: "src/lib/direct/parcours-mode.ts", commerce: "COMMERCE_MODE", piece: "PIECE_MODE" },
  { quoi: "coiffure", fichier: "src/lib/direct/parcours-coiffure.ts", commerce: "COMMERCE_COIFFURE", piece: "APRES_COIFFURE" },
];

/** La valeur d'une constante `export const NOM = "…";`. */
function constante(texte, nom) {
  const m = texte.match(new RegExp(`export const ${nom}\\s*=\\s*"([^"]+)"`));
  return m ? m[1] : null;
}

/**
 * LE BLOC D'UN COMMERCE, DÉCOUPÉ SUR SON IDENTIFIANT.
 *
 * Du `id: "coif-centre"` jusqu'au `id:` suivant. C'est grossier et c'est
 * suffisant : on ne cherche qu'une chaîne de caractères à l'intérieur.
 */
function blocDuCommerce(texte, id) {
  const debut = texte.indexOf(`id: "${id}"`);
  if (debut < 0) return null;
  const suite = texte.slice(debut + 6);
  const fin = suite.search(/\n {4}id: "/);
  return fin < 0 ? suite : suite.slice(0, fin);
}

const catalogue = readFileSync(CATALOGUE, "utf8");
const soucis = [];

for (const p of PARCOURS) {
  if (!existsSync(p.fichier)) {
    soucis.push(`${p.quoi} : le fichier ${p.fichier} n'existe pas.`);
    continue;
  }
  const texte = readFileSync(p.fichier, "utf8");

  const id = constante(texte, p.commerce);
  const photo = constante(texte, p.piece);
  if (!id) { soucis.push(`${p.quoi} : ${p.commerce} est introuvable dans ${p.fichier}.`); continue; }
  if (!photo) { soucis.push(`${p.quoi} : ${p.piece} est introuvable dans ${p.fichier}.`); continue; }

  if (!existsSync(`public${photo}`)) {
    soucis.push(`${p.quoi} : la photo ${photo} n'est pas dans public/.`);
  }

  const bloc = blocDuCommerce(catalogue, id);
  if (!bloc) { soucis.push(`${p.quoi} : le commerce « ${id} » n'existe pas dans le catalogue.`); continue; }

  if (!bloc.includes(`photo: "${photo}"`)) {
    soucis.push(
      `${p.quoi} : aucun moment de « ${id} » ne porte la photo ${photo}.\n` +
      `      Le parcours affichera donc le nom et le prix d'une AUTRE offre\n` +
      `      sous cette image — c'est le defaut « une femme, titre coupe homme ».\n` +
      `      Remede : ajouter a ses moments une offre dont photo vaut ${photo}.`,
    );
    continue;
  }
  console.log(`  ok   ${p.quoi} : ${photo} est bien un moment de « ${id} »`);
}

/**
 * ET LES TROIS FAÇONS DE PORTER LA PIÈCE EXISTENT AUSSI.
 *
 * « Trois femmes qui ont des tenues qui n'ont rien à voir avec la veste rose
 * d'essayage. » Le bloc n'est juste que si les trois fichiers sont là ; s'il en
 * manque un, la vignette s'affiche vide et personne ne s'en aperçoit.
 */
const mode = readFileSync("src/lib/direct/parcours-mode.ts", "utf8");
const facons = [...mode.matchAll(/photo: "(\/direct\/[^"]+)"/g)].map((m) => m[1]);
if (facons.length !== 3) {
  soucis.push(`mode : FACONS_MODE declare ${facons.length} photo(s), il en faut trois.`);
} else {
  for (const f of facons) {
    if (!existsSync(`public${f}`)) soucis.push(`mode : la facon ${f} n'est pas dans public/.`);
  }
  if (!soucis.length) console.log(`  ok   mode : les trois façons de porter la pièce sont sur le disque`);
}

if (soucis.length) {
  console.error("\n✗ LE PARCOURS RACONTE AUTRE CHOSE QUE CE QU'IL MONTRE\n");
  for (const s of soucis) console.error(`  - ${s}`);
  process.exit(1);
}
console.log("\nTOUT PASSE");
