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
        /* CE QUE LES CONTENEURS AU-DESSUS ONT DÉFILÉ, additionné. */
        let defile = 0;
        for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) defile += n.scrollTop || 0;
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
          // ET PAS UNE TRANCHE. Un conteneur qui défile coupe une ligne à son
          // bord comme l'écran la coupe au sien : il n'en reste alors que le
          // bas des lettres, sept points d'aplat qui se lisent « illisible ».
          // Vu sur l'onglet Infos d'un restaurant. On écarte la ligne à ce
          // passage-là, exactement comme au bord de l'écran — le recouvrement
          // des passes lui en donne un autre où elle est entière.
          if (b.height < brut.height * 0.9) continue;
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
            // LA POSITION DANS LE CONTENU, PAS À L'ÉCRAN. `window.scrollY` ne
            // suffit plus quand c'est un conteneur qui défile : il reste à 0,
            // et la même ligne revenait à chaque passe sous une clé neuve.
            cle: `${Math.round(b.x)}:${Math.round(b.y + window.scrollY + defile)}:${mot.slice(0, 20)}`,
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
/**
 * `preuve` À VRAI QUAND LES FAUTES SONT CE QU'ON CHERCHE.
 *
 * L'AUTO-PREUVE ÉCRIVAIT « ÉCHEC » SUR SA PROPRE RÉUSSITE. Elle retire les
 * fonds exprès, donc elle DOIT trouver des textes illisibles — et la ligne
 * s'affichait quand même en rouge, juste avant celle qui dit que tout va bien.
 * Le compte était juste (on le retranche plus bas), la lecture ne l'était pas :
 * un journal qui affiche un échec là où il y a une réussite est exactement ce
 * qui fait qu'on cesse de lire les journaux.
 */
async function mesurerLaPage(nom, preuve = false, conteneur = null) {
  /* LE CONTENEUR QUI DEFILE. La longue page fait defiler le document ; la page
     a onglets des restaurants est fixe, et c'est chaque onglet qui defile a
     l'interieur. Sans ce parametre, la garde ne voyait que le haut de chaque
     onglet. */
  const haut = await p.evaluate(
    (sel) => (sel ? document.querySelector(sel)?.scrollHeight ?? 0 : document.documentElement.scrollHeight),
    conteneur,
  );
  const ecran = await p.evaluate(
    (sel) => (sel ? document.querySelector(sel)?.clientHeight ?? window.innerHeight : window.innerHeight),
    conteneur,
  );
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
    await p.evaluate(
      ([v, sel]) => (sel ? document.querySelector(sel) : window)?.scrollTo({ top: v, behavior: "instant" }),
      [y, conteneur],
    );
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
  await p.evaluate((sel) => (sel ? document.querySelector(sel) : window)?.scrollTo(0, 0), conteneur);
  if (preuve) {
    console.log(`       ${nom} — ${combien} textes mesurés, ${fautifs.length} illisible(s)`);
  } else {
    dire(fautifs.length === 0, `${nom} — ${combien} textes mesurés, ${fautifs.length} illisible(s)`);
  }
  for (const f of fautifs.slice(0, 6)) {
    console.log(`        · ${f.balise}.${f.classe} « ${f.mot} » écart ${f.e}`);
  }
  return fautifs.length;
}

/**
 * ═══ DEUX PAGES, DEUX SELECTEURS ═══════════════════════════════════════════
 *
 * LES RESTAURANTS ONT LEUR PAGE A ONGLETS, voir `boutique-table.tsx`, et la
 * maquette s'ouvre sur un restaurant. Son selecteur n'est pas la rangee de
 * boutons de la longue page mais une liste deroulante. La garde les connait
 * tous les deux : sans ca, elle trouvait ZERO commerce, ne mesurait rien, et
 * ne le disait pas — une garde muette est pire qu'une garde en echec.
 */
async function nomsDesCommerces() {
  if (await p.$(".bt-maq select")) return p.locator(".bt-maq select option").allTextContents();
  return p.locator(".bq-maq-c button").allTextContents();
}
async function choisir(nom) {
  if (await p.$(".bt-maq select")) {
    const options = await p.locator(".bt-maq select option").evaluateAll((os) =>
      os.map((o) => ({ v: o.value, t: o.textContent ?? "" })),
    );
    const o = options.find((x) => x.t.includes(nom.trim()));
    if (!o) throw new Error(`commerce introuvable dans la liste : ${nom}`);
    await p.selectOption(".bt-maq select", o.v);
  } else {
    await p.locator(".bq-maq-c button", { hasText: nom }).first().click();
  }
  await p.waitForTimeout(420);
}
/** Les onglets d'un restaurant, et sa carte, chacun mesuré jusqu'en bas. */
async function mesurerLesOnglets(nom) {
  const onglets = await p.locator(".bt-nav button").allTextContents();
  for (let i = 0; i < onglets.length; i++) {
    await p.locator(".bt-nav button").nth(i).click();
    await p.waitForTimeout(450);
    await mesurerLaPage(`${nom} · ${onglets[i].trim()}`, false, ".bt-ecran");
  }
  /* LA CARTE N'EST PLUS UN ONGLET : elle s'ouvre depuis le lieu, par « Carte
     et prix ». Sans ce détour, la garde ne la mesurerait plus du tout. */
  await p.locator(".bt-nav button").first().click();
  await p.waitForTimeout(350);
  const porte = p.locator(".bt-entrer.second");
  if (await porte.count()) {
    await porte.click();
    await p.waitForTimeout(450);
    await mesurerLaPage(`${nom} · Carte`, false, ".bt-ecran");
  }
}

console.log("\n══ la page commerçant, métier par métier ══");
await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
const noms = await nomsDesCommerces();
dire(noms.length >= 10, `la garde trouve ${noms.length} commerces à mesurer`);
for (const n of noms) {
  await choisir(n);
  if (await p.$(".bt-nav")) await mesurerLesOnglets(n.trim());
  else await mesurerLaPage(n.trim());
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
  await choisir(n);
  /* CHEZ UN RESTAURANT, LA PORTE EST LE BOUTON ROSE DE L'EXPERIENCE — il ouvre
     le parcours du plat, ou la voix du chef quand il n'y a pas de parcours. */
  /* TOUS LES MÉTIERS ONT MAINTENANT LEURS ONGLETS. À table, la porte est le
     bouton rose de l'expérience ; ailleurs, l'expérience EST la vitrine de
     l'essayage, et la porte son grand bouton — voir `essai-du-lieu.tsx`. */
  if (await p.$(".bt-nav")) {
    await p.locator(".bt-nav button", { hasText: "Expérience" }).click();
    await p.waitForTimeout(450);
    if (await p.$(".bt-e-exp .bt-go")) await p.click(".bt-e-exp .bt-go");
    // L'INVITATION A ÉTÉ REPENSÉE : son grand bouton est « .bx-go », et il
    // ouvre l'atelier en plein écran, par-dessus toute la page.
    else if (await p.$(".bt-e-essai .bx-go")) await p.click(".bt-e-essai .bx-go");
    else {
      dire(false, `${n.trim()} — ni plat ni grand bouton dans l'expérience`);
      continue;
    }
    await p.waitForTimeout(900);
    await mesurerLaPage(`${n.trim()} · derrière la porte`);
    continue;
  }
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
 *
 * ═══ ET ELLE A CESSÉ DE LE VOIR SANS QUE RIEN NE CASSE ═══════════════════
 *
 * La preuve visait un nom de classe : `.mu.bq-mu.atelier`, le grand panneau
 * derrière la porte de la boucherie. Ce panneau existe toujours — mais ce
 * n'est plus lui qui est derrière le texte. La porte de la boucherie ouvre
 * maintenant l'Avant-goût, dont l'écran porte SON PROPRE fond opaque, à
 * l'intérieur du panneau. Rendre le panneau transparent ne changeait donc plus
 * un seul pixel : la garde ne signalait rien, et l'auto-preuve échouait en
 * accusant la garde d'être aveugle alors qu'elle voyait très bien.
 *
 * ON NE VISE PLUS UNE CLASSE, ON RETIRE TOUS LES FONDS. Aucun nom n'est écrit,
 * donc plus rien à tenir à jour : chaque texte de la page retombe sur ce qu'il
 * y a tout en dessous, et les écrans habillés pour la nuit — texte blanc sur
 * fond sombre — deviennent du blanc sur blanc. C'est le défaut d'origine, en
 * plus large, et il se reproduira quel que soit l'écran que la porte ouvre
 * dans six mois.
 */
console.log("\n══ la garde voit-elle encore le défaut d'origine ? ══");
await p.goto(`${BASE}/autour-de-moi/boutique`, { waitUntil: "networkidle" });
/* LA BOUCHERIE EST UN RESTAURANT, et les restaurants ont quitté la longue
   page pour leurs onglets : elle n'a plus de « .bf-cta ». La preuve n'a pas
   besoin d'elle — elle a besoin d'un écran habillé pour la nuit derrière une
   porte, et le salon de coiffure en a un : son parcours d'essai. */
await choisir("Un salon du centre");
/* SA VITRINE VIT SOUS L'ONGLET « EXPÉRIENCE » depuis que tous les métiers ont
   leurs onglets. */
if (await p.$(".bt-nav")) {
  await p.locator(".bt-nav button", { hasText: "Expérience" }).click();
  await p.waitForTimeout(450);
}
await p.click(".bx-go");
await p.waitForTimeout(700);
/* LE FOND DE `body` RESTE, ET C'EST VOLONTAIRE : sans lui la page devient
   transparente au sens du navigateur, qui la rend alors blanche — on ne saurait
   plus si l'on mesure un défaut ou une page vide. */
/* … ET LA PAGE PASSE AU BLANC. Sur la page à onglets, `body` est lui-même
   une nuit (#0B0806) : retirer les fonds au-dessus laissait le texte crème
   sur du sombre, parfaitement lisible, et la preuve ne prouvait plus rien. Le
   défaut d'origine était du blanc sur BLANC : c'est lui qu'on remet. */
/* … ET LES PHOTOS S'EFFACENT AUSSI. L'atelier s'ouvre maintenant PAR-DESSUS
   la page, en plein écran : son fond retiré, on voyait au travers les
   vignettes des coupes de l'invitation, et le texte blanc posé sur une photo
   gardait assez d'écart pour passer. C'est le blanc sur blanc qu'on veut. */
await p.addStyleTag({
  content:
    "html,body{background:#fff !important;} body *{background-image:none !important;background-color:transparent !important;} img{opacity:0 !important;}",
});
await p.waitForTimeout(200);
const revus = await mesurerLaPage("(fond rendu transparent exprès)", true);
dire(revus > 0, `le fond retiré, la garde signale ${revus} texte(s) — elle voit bien le défaut`);

await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
