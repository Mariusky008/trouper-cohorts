// 🔍 AUCUN TEXTE NE DOIT ÊTRE ÉCRIT SUR SA PROPRE COULEUR.
//
// ═══ POURQUOI CETTE GARDE EXISTE ═══════════════════════════════════════════
//
// « Les textes sont invisibles ou très tonalité sur tonalité sur toutes les
// pages. »
//
// LA CAUSE TENAIT EN UN MOT, ET AUCUNE GARDE NE POUVAIT LA VOIR. La page
// commerçant monte des composants écrits pour un fond de nuit — le mur des
// essayages, le parcours d'essai, l'Avant-goût — et neutralisait leur fond pour
// qu'ils tiennent dans une section. L'encre restait BLANCHE, le noir partait :
// blanc sur blanc, chez tous les métiers, sur tous les écrans.
//
// TOUT PASSAIT. Le texte était là, dans le DOM, au bon endroit, avec le bon
// contenu ; les quarante gardes qui lisent `textContent` le trouvaient. Ce qui
// manquait n'était pas une assertion sur le TEXTE, c'était une mesure de ce
// qu'on VOIT.
//
// ═══ LA MÉTHODE : ON REGARDE L'IMAGE, PAS LA FEUILLE ═══════════════════════
//
// ON NE LIT PAS `color` ET `background-color`, ET C'EST DÉLIBÉRÉ. Un fond peut
// venir d'un dégradé, d'une photographie, d'un parent lointain, d'un voile en
// `::after` ou d'un `backdrop-filter` ; remonter la pile des ancêtres pour
// « deviner » la couleur derrière, c'est réécrire le moteur de rendu, et se
// tromper exactement là où c'est le plus subtil.
//
// ON DÉCOUPE DONC L'IMAGE RENDUE. Sous chaque ligne de texte, on prend les
// pixels et on mesure l'ÉCART de luminance entre les plus sombres et les plus
// clairs. Un texte lisible fabrique forcément cet écart — c'est la définition
// même de lisible. Un texte tonalité sur tonalité n'en fabrique aucun.
//
// LES CENTILES PLUTÔT QUE LE MINIMUM ET LE MAXIMUM. Un seul pixel d'ombre ou
// une seule bordure claire suffiraient à faire passer un bloc entièrement
// illisible ; le cinquième et le quatre-vingt-quinzième centile décrivent la
// masse de ce qu'on voit, pas ses accidents.
//
//   node scripts/verifier-contraste.mjs [port]

import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import sharp from "sharp";

const PORT = process.argv[2] ?? "3821";
const BASE = `http://127.0.0.1:${PORT}`;

/**
 * L'ÉCART MINIMAL, EN NIVEAUX DE GRIS SUR DEUX CENT CINQUANTE-SIX.
 *
 * CE N'EST PAS UN SEUIL D'ACCESSIBILITÉ, et il ne prétend pas l'être : le
 * rapport de contraste WCAG demande la couleur du texte ET celle du fond, donc
 * exactement les deux choses qu'on a renoncé à deviner. Ceci mesure autre
 * chose, et de plus grossier : « y a-t-il quelque chose à voir ici ? ».
 *
 * QUARANTE-CINQ EST CALÉ SUR LE DÉFAUT RÉEL. Du gris pâle sur blanc — le texte
 * secondaire le plus faible du produit, qui est lisible — donne environ
 * soixante-dix ; le blanc sur blanc du défaut donne moins de dix. Entre les
 * deux il n'y a rien dans le produit, ce qui rend le seuil facile à tenir.
 */
const ECART_MIN = 45;

let echecs = 0;
const dire = (ok, t) => {
  if (!ok) echecs++;
  console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`);
};

const nav = await pw.chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("!! ERREUR PAGE:", e.message));

/**
 * LES LIGNES DE TEXTE VISIBLES, AVEC LE RECTANGLE DES LETTRES.
 *
 * ═══ ON MESURE LES GLYPHES, PAS LA BOÎTE QUI LES CONTIENT ═════════════════
 *
 * PREMIER JET : le rectangle de l'ÉLÉMENT. Il déclarait illisible le mot
 * « Infos » d'un onglet — six lettres au milieu d'un bouton de cent points sur
 * quarante. Le texte n'occupe alors que quelques pour cent des pixels, donc les
 * centiles décrivent le FOND et l'écart tombe à zéro : la garde accusait
 * précisément les textes les mieux entourés.
 *
 * UN `Range` SUR LE NŒUD DE TEXTE REND UN RECTANGLE PAR LIGNE, collé aux
 * lettres. Le découpage ne contient alors presque que de l'encre et du fond
 * entre les mots — c'est-à-dire exactement les deux choses qu'on veut comparer.
 *
 * ═══ ET ON NE MESURE QUE CE QUI EST VRAIMENT À L'ÉCRAN ════════════════════
 *
 * ON PHOTOGRAPHIE LE CHAMP DE VISION, PAS LA PAGE ENTIÈRE, EN DESCENDANT.
 * Une capture pleine page dessine la barre collante à sa place naturelle et non
 * là où le navigateur la pose : les coordonnées relevées dans la page ne
 * pointent alors plus sur la même chose dans l'image, et la garde accusait la
 * frise du parcours — qui, elle, était bel et bien lisible.
 *
 * ET `elementFromPoint` DIT QUI EST DEVANT. Un texte recouvert par la barre
 * collante n'est pas « peu contrasté », il est CACHÉ : ce n'est pas la même
 * faute, ce n'est pas au même endroit, et le confondre avec l'autre revient à
 * signaler dix fois par page quelque chose qu'on ne corrigera jamais.
 */
async function lignes() {
  return p.evaluate(() => {
    const sortie = [];
    const H = window.innerHeight;
    const L = window.innerWidth;
    for (const e of document.querySelectorAll("body *")) {
      const s = getComputedStyle(e);
      if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) < 0.15) continue;
      for (const n of e.childNodes) {
        if (n.nodeType !== 3) continue;
        const mot = n.textContent.replace(/\s+/g, " ").trim();
        if (mot.length < 3) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        /**
         * ON REDUIT LE RECTANGLE À CE QUI EST RÉELLEMENT VISIBLE.
         *
         * `getClientRects` rend la place que le texte OCCUPERAIT, pas celle
         * qu'on voit : sur un élément à `overflow:hidden` et points de
         * suspension — « Une boucherie du centre · Dax · 340 m » dans le pied
         * du parcours — la fin du rectangle tombe hors du cadre, sur ce qui se
         * trouve derrière. La garde y lisait un aplat uni et déclarait
         * illisible un texte parfaitement lisible.
         */
        const clip = (() => {
          let c = null;
          for (let n = e; n && n !== document.body; n = n.parentElement) {
            const q = getComputedStyle(n);
            if (/hidden|clip|auto|scroll/.test(q.overflow + q.overflowX + q.overflowY)) {
              const b = n.getBoundingClientRect();
              c = c
                ? {
                    x: Math.max(c.x, b.x),
                    y: Math.max(c.y, b.y),
                    r: Math.min(c.r, b.right),
                    b: Math.min(c.b, b.bottom),
                  }
                : { x: b.x, y: b.y, r: b.right, b: b.bottom };
            }
          }
          return c;
        })();
        for (const brut of r.getClientRects()) {
          const b = clip
            ? new DOMRect(
                Math.max(brut.x, clip.x),
                Math.max(brut.y, clip.y),
                Math.min(brut.right, clip.r) - Math.max(brut.x, clip.x),
                Math.min(brut.bottom, clip.b) - Math.max(brut.y, clip.y),
              )
            : brut;
          // UNE LIGNE, PAS UN MOT ISOLÉ : sous une trentaine de points de large
          // il ne reste plus assez de pixels pour que les centiles disent quoi
          // que ce soit de fiable.
          if (b.width < 30 || b.height < 7) continue;
          // ENTIÈREMENT DANS LE CHAMP DE VISION : une ligne coupée par le bord
          // donnerait un découpage dont la moitié n'existe pas dans l'image.
          if (b.top < 1 || b.bottom > H - 1 || b.left < 0 || b.right > L) continue;
          // ET DEVANT, PAS DERRIÈRE. Voir l'en-tête : un texte recouvert par la
          // barre collante est caché, ce qui n'est pas la faute qu'on cherche.
          const devant = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
          if (!devant || !(devant === e || e.contains(devant) || devant.contains(e))) continue;
          sortie.push({
            mot: mot.slice(0, 44),
            balise: e.tagName.toLowerCase(),
            classe: (e.className || "").toString().split(/\s+/)[0] || "",
            x: Math.round(b.x),
            y: Math.round(b.y),
            l: Math.round(b.width),
            h: Math.round(b.height),
            cle: `${Math.round(b.x)}:${Math.round(b.y + window.scrollY)}:${mot.slice(0, 20)}`,
          });
        }
      }
    }
    return sortie;
  });
}

/** L'écart de luminance sur un rectangle de l'image rendue. */
async function ecart(image, r, taille) {
  const x = Math.max(0, Math.min(r.x, taille.l - 2));
  const y = Math.max(0, Math.min(r.y, taille.h - 2));
  const l = Math.max(2, Math.min(r.l, taille.l - x));
  const h = Math.max(2, Math.min(r.h, taille.h - y));
  const { data } = await sharp(image)
    .extract({ left: x, top: y, width: l, height: h })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const tri = Uint8Array.from(data).sort();
  const bas = tri[Math.floor(tri.length * 0.08)];
  const haut = tri[Math.floor(tri.length * 0.92)];
  return haut - bas;
}

/**
 * UN ÉTAT DE LA PAGE, MESURÉ EN DESCENDANT.
 *
 * ON PHOTOGRAPHIE UNE FOIS PAR ÉCRAN ET ON DÉCOUPE ENSUITE. Une capture par
 * ligne de texte donnerait deux mille captures pour vingt commerces,
 * c'est-à-dire une garde qu'on finirait par ne plus lancer.
 *
 * LE PAS EST PLUS COURT QUE L'ÉCRAN, à dessein : une ligne coupée par le bord
 * est écartée à ce passage-là, et le recouvrement lui donne un second passage
 * où elle sera entière. Sans lui, une bande de texte pourrait n'être mesurée
 * nulle part.
 */
async function mesurerLaPage(nom) {
  const haut = await p.evaluate(() => document.documentElement.scrollHeight);
  const ecran = await p.evaluate(() => window.innerHeight);
  const vus = new Set();
  const fautifs = [];
  let combien = 0;
  for (let y = 0; y < haut; y += Math.round(ecran * 0.8)) {
    /**
     * « instant » N'EST PAS UN LUXE D'ÉCRITURE.
     *
     * La page déclare `scroll-behavior:smooth` : un `scrollTo` ordinaire lance
     * une ANIMATION. La photographie est alors prise en cours de route et les
     * rectangles relevés après, à une autre position — tout le contenu se
     * retrouvait décalé de quelques dizaines de points, et la garde déclarait
     * soixante textes illisibles par page, ce qui ne voulait plus rien dire.
     */
    await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await p.waitForTimeout(220);
    const image = await p.screenshot();
    const taille = await sharp(image).metadata().then((m) => ({ l: m.width, h: m.height }));
    for (const r of await lignes()) {
      if (vus.has(r.cle)) continue;
      vus.add(r.cle);
      combien++;
      const e = await ecart(image, r, taille);
      if (e < ECART_MIN) fautifs.push({ ...r, e });
    }
  }
  await p.evaluate(() => window.scrollTo(0, 0));
  dire(fautifs.length === 0, `${nom} — ${combien} textes mesurés, ${fautifs.length} illisible(s)`);
  for (const f of fautifs.slice(0, 6)) {
    console.log(`        · ${f.balise}.${f.classe} « ${f.mot} » écart ${f.e}`);
  }
  return fautifs.length;
}

console.log("\n══ la page commerçant, métier par métier ══");
await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
const noms = await p.locator(".bq-maq-c button").allTextContents();
for (const n of noms) {
  await p.locator(".bq-maq-c button", { hasText: n }).first().click();
  await p.waitForTimeout(320);
  await mesurerLaPage(n.trim());
}

/**
 * ═══ ET DERRIÈRE LA PORTE, LÀ OÙ LE DÉFAUT VIVAIT ═════════════════════════
 *
 * C'EST LE CŒUR DE LA GARDE, PAS UN SUPPLÉMENT. La vitrine — le panneau rose —
 * pose ses couleurs à la main et n'a jamais été en cause. Ce qui était invisible
 * est ce qu'on trouve APRÈS avoir touché le grand bouton : le parcours d'essai
 * et l'Avant-goût, qui arrivent habillés pour la nuit.
 */
console.log("\n══ et derrière le grand bouton, sur chaque métier ══");
for (const n of noms) {
  await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
  await p.locator(".bq-maq-c button", { hasText: n }).first().click();
  await p.waitForTimeout(300);
  const cta = await p.$(".bf-cta");
  if (!cta) {
    dire(false, `${n.trim()} — pas de grand bouton dans la vitrine`);
    continue;
  }
  await cta.click();
  await p.waitForTimeout(700);
  await mesurerLaPage(`${n.trim()} · derrière la porte`);
}

/**
 * ═══ ET ON REJOUE LE DÉFAUT, POUR PROUVER QUE LA GARDE LE VOIT ════════════
 *
 * UNE GARDE QUI NE PEUT QUE RÉUSSIR NE GARDE RIEN. Celle-ci mesure des pixels
 * à travers quatre couches — capture, découpage, centiles, seuil — et chacune
 * peut se dérégler en silence : il a suffi d'un défilement animé pour qu'elle
 * accuse soixante textes parfaitement lisibles, et un rectangle trop large pour
 * qu'elle en innocente autant.
 *
 * ON REMET DONC LE FOND TRANSPARENT — le défaut exact qu'il a signalé — et on
 * exige que la garde le voie. Si elle ne le voit pas, c'est elle qui est
 * cassée, et c'est ce verdict-là qui compte le plus.
 */
console.log("\n══ la garde voit-elle encore le défaut d'origine ? ══");
await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
await p.locator(".bq-maq-c button", { hasText: "boucherie" }).first().click();
await p.waitForTimeout(300);
await p.click(".bf-cta");
await p.waitForTimeout(700);
await p.addStyleTag({ content: ".mu.bq-mu.atelier{background:transparent !important;}" });
await p.waitForTimeout(200);
const revus = await mesurerLaPage("(fond rendu transparent exprès)");
dire(revus > 0, `le fond retiré, la garde signale ${revus} texte(s) — elle voit bien le défaut`);
// LA LIGNE PRÉCÉDENTE COMPTE POUR UNE FAUTE PUISQUE `mesurerLaPage` en déclare
// une : on la retranche, sinon la preuve ferait échouer la garde qu'elle prouve.
if (revus > 0) echecs--;

await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
