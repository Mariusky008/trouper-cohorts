/**
 * ☕ FABRIQUER L'ÉCRAN DU SALON — les yeux qui clignent, le café qui fume.
 *
 * ═══ CE QU'ON DEMANDE, ET POURQUOI C'EST DÉCOUPÉ ══════════════════════════
 *
 * « Mets juste cet écran avec une animation sur le fantôme qui cligne des yeux
 * et sur le café qui fume. Conserver la base fixe et superposer uniquement les
 * zones des yeux et de la vapeur, pour éviter que les petites différences entre
 * rendus fassent trembler le décor. »
 *
 * IL AVAIT RAISON AVANT MÊME QUE JE MESURE, ET LA MESURE LE CONFIRME : d'un
 * rendu à l'autre, 3 à 4 % des points de TOUTE l'image changent — le grain du
 * canapé, les feuilles de la plante, le bord de la lampe. Fondre deux images
 * entières ferait donc respirer le salon en entier à chaque battement de
 * paupière. Ce qu'on veut bouger tient dans deux rectangles.
 *
 * ON DÉCOUPE DONC, ET ON MESURE OÙ DÉCOUPER. Le bruit est ÉPARS, les vrais
 * changements sont GROUPÉS : on binarise la différence, on la floute, et seul
 * un amas survit — un point isolé se dilue. Relevé ainsi :
 *
 *   · les yeux  — x 357-597, y 645-792 ;
 *   · la vapeur — x 592-720, y 938-1080.
 *
 * LES BORDS SONT FONDUS. Un rectangle à bord net posé sur une photo se voit :
 * les points en dessous ne sont pas les mêmes d'un rendu à l'autre, et la
 * couture apparaît au moment précis où l'on veut que rien ne bouge. Une rampe
 * d'alpha de vingt points la fait disparaître.
 *
 * ═══ ET L'ORDRE DES HUIT VAPEURS N'EST PAS DANS LES NOMS ══════════════════
 *
 * Les fichiers arrivent avec des noms de machine. On ne devine pas : on RANGE.
 * De la fumée évolue continûment, donc deux étapes voisines se ressemblent —
 * on part de la plus fine et on prend chaque fois la plus proche de la
 * précédente. C'est un chemin du plus proche voisin, et il redonne l'ordre du
 * rendu sans qu'on ait à le connaître.
 */

import sharp from "../node_modules/sharp/lib/index.js";
import { mkdirSync, readdirSync } from "node:fs";

const SRC = "/tmp/claude-0/zip4";
const OUT = "public/direct/ouverture/salon";

/** Les deux fenêtres, relevées sur les différences. Voir l'en-tête. */
const YEUX = { left: 338, top: 626, width: 278, height: 184 };
const VAPEUR = { left: 552, top: 862, width: 204, height: 246 };
/** La rampe d'alpha sur chaque bord, en points. */
const FONDU = 20;
/** La taille du plan. Toutes les vignettes sont écrites à cette taille. */
const LARGE = 941;
const HAUT = 1672;

/** Les trois états de paupière, dans l'ordre du clignement. */
const PAUPIERES = ["1.png", "2.png", "3.png"];

mkdirSync(OUT, { recursive: true });

/**
 * UN MASQUE AUX BORDS FONDUS, à la taille d'une fenêtre. Plein au centre, il
 * descend à zéro sur les `FONDU` derniers points de chaque côté.
 */
function voile(l, h) {
  const m = Buffer.alloc(l * h);
  for (let y = 0; y < h; y++) {
    const dy = Math.min(y, h - 1 - y);
    for (let x = 0; x < l; x++) {
      const dx = Math.min(x, l - 1 - x);
      const d = Math.min(dx, dy);
      m[y * l + x] = d >= FONDU ? 255 : Math.round((d / FONDU) * 255);
    }
  }
  return m;
}

/**
 * DÉCOUPER UNE FENÊTRE — MAIS LA RENDRE SUR LA TOILE ENTIÈRE.
 *
 * ═══ POURQUOI PAS UNE PETITE VIGNETTE ════════════════════════════════════
 *
 * PREMIER JET : j'écrivais la fenêtre seule, 278 × 184 points, et la feuille de
 * style la replaçait en pourcentage. C'EST FAUX, ET ÇA NE SE VOIT QUE SUR UN
 * ÉCRAN QUI N'A PAS LE FORMAT DE L'IMAGE. Le fond est posé en cover : il est
 * agrandi ET ROGNÉ par les côtés. Une vignette posée en pourcentage de l'écran,
 * elle, ne connaît pas ce rognage — elle suit l'écran pendant que le fond suit
 * autre chose. Les paupières tombent alors à côté des yeux dès qu'on change la
 * hauteur de la fenêtre, et c'est le genre de défaut qui n'apparaît que sur le
 * téléphone de quelqu'un d'autre.
 *
 * LA TOILE ENTIÈRE SUPPRIME LE CALCUL AU LIEU DE LE REFAIRE. Chaque vignette
 * est écrite dans une image de la taille du plan, transparente partout sauf sa
 * fenêtre. La feuille de style pose alors les quatre calques avec EXACTEMENT
 * le même center/cover : c'est le navigateur qui refait le même cadrage pour
 * tous, et l'alignement est juste par construction, sur n'importe quel écran.
 *
 * ET ÇA NE COÛTE PRESQUE RIEN : un PNG compresse une grande plage transparente
 * en quelques octets.
 */
async function decouper(fichier, fenetre, sortie) {
  const corps = await sharp(`${SRC}/${fichier}`)
    .extract(fenetre)
    .removeAlpha()
    .raw()
    .toBuffer();
  const alpha = voile(fenetre.width, fenetre.height);
  const n = fenetre.width * fenetre.height;
  const rgba = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    rgba[i * 4] = corps[i * 3];
    rgba[i * 4 + 1] = corps[i * 3 + 1];
    rgba[i * 4 + 2] = corps[i * 3 + 2];
    rgba[i * 4 + 3] = alpha[i];
  }
  const vignette = await sharp(rgba, {
    raw: { width: fenetre.width, height: fenetre.height, channels: 4 },
  })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: LARGE,
      height: HAUT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: vignette, left: fenetre.left, top: fenetre.top }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${sortie}`);
}

/** Les points bruts d'une fenêtre, pour comparer deux étapes. */
const fenetreBrute = (f, w) =>
  sharp(`${SRC}/${f}`).extract(w).removeAlpha().resize(64).raw().toBuffer();

// ═══ QUI EST QUOI ═════════════════════════════════════════════════════════
const tous = readdirSync(SRC).filter((f) => f.endsWith(".png"));
/* CELLE QUI PORTE LE TEXTE SE RECONNAÎT À SA DIFFÉRENCE : 20 d'ecart moyen contre 3
   pour les autres. On l'écarte, le texte est écrit en HTML. */
const base = await sharp(`${SRC}/1.png`).removeAlpha().resize(200).raw().toBuffer();
const vapeurs = [];
for (const f of tous) {
  if (PAUPIERES.includes(f)) continue;
  const b = await sharp(`${SRC}/${f}`).removeAlpha().resize(200).raw().toBuffer();
  let d = 0;
  for (let i = 0; i < base.length; i++) d += Math.abs(base[i] - b[i]);
  const part = d / base.length;
  if (part > 10) {
    console.log(`  ${f} — écartée, c'est la version avec le texte (écart ${part.toFixed(1)})`);
    continue;
  }
  vapeurs.push(f);
}
if (vapeurs.length !== 8) throw new Error(`${vapeurs.length} vapeurs au lieu de 8`);

// ═══ LES RANGER, DU PLUS PROCHE AU PLUS PROCHE ════════════════════════════
const vues = new Map();
for (const f of vapeurs) vues.set(f, await fenetreBrute(f, VAPEUR));
const ecart = (a, b) => {
  const A = vues.get(a), B = vues.get(b);
  let d = 0;
  for (let i = 0; i < A.length; i++) d += Math.abs(A[i] - B[i]);
  return d / A.length;
};
/* ON PART DE LA PLUS FINE — celle qui s'écarte le moins de l'image sans vapeur
   ajoutée, c'est-à-dire la plus proche du panache le plus discret. */
const depart = vapeurs
  .map((f) => ({ f, d: vapeurs.reduce((s, g) => s + ecart(f, g), 0) }))
  .sort((a, b) => b.d - a.d)[0].f;
const ordre = [depart];
const reste = new Set(vapeurs.filter((f) => f !== depart));
while (reste.size) {
  const dernier = ordre[ordre.length - 1];
  let meilleur = null, min = Infinity;
  for (const f of reste) {
    const d = ecart(dernier, f);
    if (d < min) { min = d; meilleur = f; }
  }
  ordre.push(meilleur);
  reste.delete(meilleur);
}
console.log("ordre des vapeurs :");
ordre.forEach((f, i) => console.log(`  ${i + 1}. ${f.slice(0, 8)}`));

// ═══ ÉCRIRE ═══════════════════════════════════════════════════════════════
/* LA BASE EST LA SEULE IMAGE ENTIÈRE, et c'est elle qui tient le décor. En
   JPEG : elle n'a pas de transparence, et un PNG de 941 × 1672 pèse dix fois
   plus pour le même œil. */
await sharp(`${SRC}/1.png`).jpeg({ quality: 88, mozjpeg: true }).toFile(`${OUT}/fond.jpg`);
for (let i = 0; i < PAUPIERES.length; i++) await decouper(PAUPIERES[i], YEUX, `yeux-${i + 1}.png`);
for (let i = 0; i < ordre.length; i++) await decouper(ordre[i], VAPEUR, `vapeur-${i + 1}.png`);

/* PLUS RIEN À RELEVER POUR LA FEUILLE DE STYLE : les quatre sortes de calques
   ont la même taille et le même cadrage, donc une seule règle center/cover les
   aligne tous. Voir `decouper`. */
console.log(`\nfini — ${LARGE} x ${HAUT} : 1 fond, 3 paupières, 8 vapeurs.`);
