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
 * ET LA TROISIÈME ÉTAPE A SES TROIS IMAGES, DANS LES DEUX PARCOURS.
 *
 * « Les trois femmes ne portent pas du tout la même veste » puis « pareil ici,
 * il faut que ce soit la même coupe. » Deux fois le même défaut, à deux écrans
 * différents. Les blocs ne sont justes que si les trois fichiers sont là ; s'il
 * en manque un, la vignette s'affiche VIDE et personne ne s'en aperçoit — une
 * image absente ne fait pas de bruit.
 */
const TROIS = [
  { quoi: "mode", fichier: "src/lib/direct/parcours-mode.ts", liste: "FACONS_MODE", dit: "façons de porter la pièce" },
  { quoi: "coiffure", fichier: "src/lib/direct/parcours-coiffure.ts", liste: "VISAGES_COIFFURE", dit: "visages qui portent la coupe" },
];

/**
 * ═══ LE PARCOURS SORTIE : SES PHOTOS, ET SON SON ═══════════════════════════
 *
 * IL N'A PAS DE PIÈCE DANS UNE JOURNÉE — c'est un événement de la ville, pas
 * un commerce. Ce qu'il faut vérifier est donc différent : que l'événement
 * qu'il désigne existe, que ses deux photos sont là, et surtout QUE L'EXTRAIT
 * SONORE EXISTE. Ce parcours ne se regarde pas, il s'écoute : un fichier
 * absent le vide de son seul argument, et un fichier absent ne fait aucun
 * bruit — au sens propre.
 */
/**
 * ═══ LE PARCOURS RESTAURANT : SES QUATRE PHOTOS ET SES DEUX LIGNES DE CARTE ═
 *
 * IL NE DESIGNE PAS UN MOMENT DE LA JOURNEE mais DEUX ENTREES DE CARTE — le
 * plat sur place et la part a emporter — par leur identifiant. Un identifiant
 * qui ne correspond a rien ne plante pas : l'ecran affiche une vignette sans
 * nom et sans prix, et personne ne s'en apercoit. C'est le meme silence que
 * les cartes vides de l'ecran de depart, et il se surveille pareil.
 */
const table = readFileSync("src/lib/direct/parcours-table.ts", "utf8");
const idTable = constante(table, "COMMERCE_TABLE");
if (!idTable) {
  soucis.push("restaurant : COMMERCE_TABLE est introuvable.");
} else {
  const bloc = blocDuCommerce(catalogue, idTable);
  if (!bloc) {
    soucis.push(`restaurant : le commerce « ${idTable} » n'existe pas dans le catalogue.`);
  } else {
    for (const nom of ["PLAT_TABLE", "PART_TABLE"]) {
      const art = constante(table, nom);
      if (!art) soucis.push(`restaurant : ${nom} est introuvable.`);
      else if (!bloc.includes(`id: "${art}"`)) {
        soucis.push(
          `restaurant : la carte de « ${idTable} » n'a pas d'article « ${art} ».\n` +
          `      La vignette s'affichera sans nom et sans prix, en silence.`,
        );
      }
    }
    for (const nom of ["PLAT_PHOTO", "PART_PHOTO", "MARGOT_PHOTO", "DEVANTURE_TABLE"]) {
      const f = constante(table, nom);
      if (!f) soucis.push(`restaurant : ${nom} est introuvable.`);
      else if (!existsSync(`public${f}`)) soucis.push(`restaurant : ${f} n'est pas dans public/.`);
    }
    console.log(`  ok   restaurant : « ${idTable} », ses deux lignes de carte et ses quatre photos sont la`);
  }
}

/**
 * ═══ LE PARCOURS DÉCO : SA BOUTIQUE, SES DEUX LIGNES DE CARTE, SES SIX IMAGES
 *
 * SA BOUTIQUE N'EXISTAIT PAS — il a fallu écrire `maison-dax`, la catégorie
 * « Commerces » n'ayant aucun meuble. Un commerce ajouté à la main peut être
 * supprimé à la main : sans cette garde, le parcours afficherait un écran vide
 * et l'écran de choix une carte qui ne dessine rien, tous les deux en silence.
 */
const deco = readFileSync("src/lib/direct/parcours-deco.ts", "utf8");
const idDeco = constante(deco, "COMMERCE_DECO");
if (!idDeco) {
  soucis.push("deco : COMMERCE_DECO est introuvable.");
} else {
  const bloc = blocDuCommerce(catalogue, idDeco);
  if (!bloc) {
    soucis.push(`deco : le commerce « ${idDeco} » n'existe pas dans le catalogue.`);
  } else {
    for (const nom of ["PIECE_DECO", "COUSSIN_DECO"]) {
      const art = constante(deco, nom);
      if (!art) soucis.push(`deco : ${nom} est introuvable.`);
      else if (!bloc.includes(`id: "${art}"`)) {
        soucis.push(`deco : la carte de « ${idDeco} » n'a pas d'article « ${art} ».`);
      }
    }
    for (const nom of ["SALON_AVANT", "SALON_APRES", "FAUTEUIL_DECO", "BOUTIQUE_DECO"]) {
      const f = constante(deco, nom);
      if (!f) soucis.push(`deco : ${nom} est introuvable.`);
      else if (!existsSync(`public${f}`)) soucis.push(`deco : ${f} n'est pas dans public/.`);
    }
    /* LES DEUX GROS PLANS, comme les trois façons et les trois visages : une
       image absente laisse une vignette vide, et une vignette vide ne fait
       pas de bruit. */
    const detail = deco.slice(deco.indexOf("export const DETAILS_DECO"), deco.indexOf("];", deco.indexOf("export const DETAILS_DECO")));
    const gros = [...detail.matchAll(/photo: "(\/direct\/[^"]+)"/g)].map((m) => m[1]);
    if (gros.length !== 2) soucis.push(`deco : DETAILS_DECO declare ${gros.length} photo(s), il en faut deux.`);
    else for (const g of gros) {
      if (!existsSync(`public${g}`)) soucis.push(`deco : le gros plan ${g} n'est pas dans public/.`);
    }
    console.log(`  ok   deco : « ${idDeco} », ses deux lignes de carte et ses six images sont la`);
  }
}

const sortie = readFileSync("src/lib/direct/parcours-sortie.ts", "utf8");
const idSortie = constante(sortie, "SORTIE_ID");
if (!idSortie) {
  soucis.push("sortie : SORTIE_ID est introuvable.");
} else if (!catalogue.includes(`id: "${idSortie}"`)) {
  soucis.push(`sortie : l'evenement « ${idSortie} » n'existe pas dans le catalogue.`);
} else {
  for (const nom of ["TRIO_SORTIE", "TABLEE_SORTIE"]) {
    const f = constante(sortie, nom);
    if (!f) soucis.push(`sortie : ${nom} est introuvable.`);
    else if (!existsSync(`public${f}`)) soucis.push(`sortie : ${f} n'est pas dans public/.`);
  }
  /* L'EXTRAIT EST DÉCLARÉ DANS LA SOIRÉE, PAS ICI, et c'est la bonne place —
     mais c'est ce parcours qui le joue, donc c'est ici qu'on le surveille. */
  const soirees = readFileSync("src/lib/direct/soiree.ts", "utf8");
  const bloc = soirees.slice(soirees.indexOf("const SOIREE_KIOSQUE"), soirees.indexOf("const SOIREE_MARCHE"));
  const media = bloc.match(/media: "([^"]+)"/);
  if (!media) soucis.push(`sortie : la soiree « ${idSortie} » ne declare aucun extrait sonore.`);
  else if (!existsSync(`public${media[1]}`)) {
    soucis.push(`sortie : l'extrait ${media[1]} n'est pas dans public/ — le parcours n'a plus rien a faire ecouter.`);
  } else {
    console.log(`  ok   sortie : l'evenement, ses deux photos et son extrait de ${media[1].split("/").pop()} sont la`);
  }
}

for (const t of TROIS) {
  const texte = readFileSync(t.fichier, "utf8");
  const debut = texte.indexOf(`export const ${t.liste}`);
  if (debut < 0) { soucis.push(`${t.quoi} : ${t.liste} est introuvable dans ${t.fichier}.`); continue; }
  const bloc = texte.slice(debut, texte.indexOf("];", debut));
  const images = [...bloc.matchAll(/photo: "(\/direct\/[^"]+)"/g)].map((m) => m[1]);
  if (images.length !== 3) {
    soucis.push(`${t.quoi} : ${t.liste} declare ${images.length} photo(s), il en faut trois.`);
    continue;
  }
  const absentes = images.filter((f) => !existsSync(`public${f}`));
  if (absentes.length) {
    for (const f of absentes) soucis.push(`${t.quoi} : ${f} n'est pas dans public/ — la vignette s'affichera vide.`);
    continue;
  }
  console.log(`  ok   ${t.quoi} : les trois ${t.dit} sont sur le disque`);
}

if (soucis.length) {
  console.error("\n✗ LE PARCOURS RACONTE AUTRE CHOSE QUE CE QU'IL MONTRE\n");
  for (const s of soucis) console.error(`  - ${s}`);
  process.exit(1);
}
console.log("\nTOUT PASSE");
