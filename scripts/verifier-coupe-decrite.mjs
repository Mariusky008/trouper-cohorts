// ✂️ UNE COUPE DÉCRITE DOIT DIRE OÙ ELLE S'ARRÊTE.
//
// ═══ POURQUOI CE FICHIER EXISTE ════════════════════════════════════════════
//
// « Si des cheveux descendent encore sur les épaules, la transformation a
// échoué, même si la couleur a changé. »
//
// DEUX FOIS, J'AI DÉCRIT LA MÊME PHOTO SANS LA REGARDER. La première, « coupé
// net, sans dégradé ni frange » sur une coupe qui a un dégradé. La seconde,
// « des mèches plus longues devant qui tombent devant l'épaule » sur un carré
// qui s'arrête à la base du cou. Les deux fois, le modèle a exécuté notre
// texte fidèlement, et les deux fois on a cherché la panne dans la mécanique —
// le masque, le cadre, la recomposition — pendant plusieurs tours.
//
// ON NE PEUT PAS VÉRIFIER QU'UNE DESCRIPTION DÉCRIT BIEN SA PHOTO : il
// faudrait regarder l'image, et aucune garde ne sait faire ça. Mais on peut
// vérifier DEUX CHOSES QUI NE DEMANDENT QUE LE TEXTE, et qui auraient arrêté
// les deux fautes :
//
//   1. UNE DESCRIPTION DE COUPE DIT OÙ LA COUPE S'ARRÊTE. La longueur est le
//      seul fait qui décide de la réussite — c'est son propre critère de
//      contrôle. Une description qui ne la donne pas ne décrit pas une coupe.
//   2. ELLE NE LA DONNE PAS DEUX FOIS DIFFÉREMMENT. « S'arrête sous le
//      menton » et « tombent devant l'épaule » dans la même phrase ne peuvent
//      pas décrire une seule tête. C'est une contradiction interne, elle se
//      lit sans rien voir, et c'était exactement la faute.
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/direct/fantomes.ts", "utf8");
let echecs = 0;
const dire = (bon, quoi) => {
  if (!bon) echecs++;
  console.log(`  ${bon ? "ok  " : "ÉCHEC"} ${quoi}`);
};

/* ON TROUVE LE MÉTIER PAR CE QUE SON ESSAI MODIFIE, pas par son nom. Un mur
   s'appelle « coif-centre » aujourd'hui et autrement demain ; `change` dit en
   toutes lettres « uniquement les cheveux », et c'est ça qui ne bouge pas.
   Même raisonnement que la garde de l'avis de Nadia. */
const murs = src.split(/\n  \{\n    cle: "/).slice(1);
const coiffures = murs.filter((b) => {
  const m = b.match(/change: "([^"]+)"/);
  return m && /cheveux|coiffure/i.test(m[1]);
});

// OÙ UNE COUPE PEUT S'ARRÊTER, en français de coiffeur. La liste dit des
// repères du corps, pas des styles : un repère se voit sur une photo.
const REPERES = /menton|m[âa]choire|cou\b|nuque|oreille|clavicule|[ée]paule|omoplate|poitrine|taille|milieu du dos|ras\b/i;
// CE QUI FAIT DE LA DESCRIPTION LA DESCRIPTION D'UNE COUPE. Une prestation de
// couleur seule — un balayage — n'a pas à dire une longueur : elle ne la
// change pas.
const COUPE = /carr[ée]|coupe|d[ée]grad[ée]|frange|boucles|cheveux|m[èe]ches/i;
// UNE LONGUEUR AFFIRMÉE SUR L'ÉPAULE. Le verbe compte : « au-dessus des
// épaules » est un repère, « tombent sur les épaules » est une longueur.
const SUR_EPAULE = /(tombe\w*|descend\w*|jusqu['’]aux?)[^.]{0,20}?[ée]paules?/i;
// ET SA NÉGATION, parce qu'une description honnête dit souvent ce qui NE
// descend pas — c'est même la formulation la plus utile pour le modèle.
const NIE = /(aucune?|rien|sans|ni)\b[^.]{0,40}$/i;
// LES REPÈRES COURTS : au-dessus de l'épaule, par construction.
const COURT = /menton|m[âa]choire|cou\b|nuque|oreille/i;

console.log("══ chaque coupe dit où elle s'arrête ══");
let pieces = 0;
for (const bloc of coiffures) {
  for (const m of bloc.matchAll(/\{ id: "([^"]+)", nom: "([^"]+)", decrire: "([^"]+)"/g)) {
    const [, id, nom, d] = m;
    pieces++;
    if (!COUPE.test(d)) continue;
    dire(REPERES.test(d), `${nom} (${id}) donne un repère de longueur`);
  }
}
dire(pieces > 0, `${pieces} prestation(s) de coiffure relues`);

console.log("\n══ et elle ne le dit pas deux fois différemment ══");
for (const bloc of coiffures) {
  for (const m of bloc.matchAll(/\{ id: "([^"]+)", nom: "([^"]+)", decrire: "([^"]+)"/g)) {
    const [, id, nom, d] = m;
    const court = COURT.test(d);
    let contradiction = null;
    for (const e of d.matchAll(new RegExp(SUR_EPAULE.source, "gi"))) {
      // ON REGARDE CE QUI PRÉCÈDE : « aucune longueur qui descende sur les
      // épaules » affirme le contraire de ce que le motif attrape.
      const avant = d.slice(Math.max(0, e.index - 40), e.index);
      if (!NIE.test(avant)) contradiction = e[0];
    }
    dire(
      !(court && contradiction),
      court && contradiction
        ? `${nom} (${id}) s'arrête haut ET « ${contradiction} » : les deux ne peuvent pas être vrais`
        : `${nom} (${id}) est cohérente sur la longueur`,
    );
  }
}

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
