// 🔒 LA PREUVE QUE LE VISAGE NE BOUGE PLUS.
//
// ═══ POURQUOI CE FICHIER EXISTE À PART ═════════════════════════════════════
//
// « Ça déforme ma tête au lieu de garder l'original comme base entièrement. »
//
// LA CORRECTION TIENT EN DEUX VERROUS — un masque envoyé au modèle, et la
// REPOSE des pixels du visage original par-dessus le rendu. Le premier est une
// contrainte adressée à un générateur : on ne peut le juger qu'en regardant une
// vraie image, donc avec une clé d'image, donc pas ici. Le second est de
// l'arithmétique sur des pixels : il se prouve.
//
// ET C'EST LE SECOND QUI GARANTIT L'IDENTITÉ. « Même si OpenAI déforme
// légèrement le nez ou la bouche, ces pixels sont écrasés par ceux de la photo
// originale. » Un fichier de garde qui ne saurait vérifier que le premier
// vérifierait la moitié rassurante et laisserait la moitié décisive sans filet.
//
// ═══ LA MÉTHODE ═══════════════════════════════════════════════════════════
//
// On fabrique deux images qui ne se ressemblent EN RIEN : la « photo » est
// rouge, le « rendu » est bleu. On recompose. Alors :
//
//   · au centre du contour, le résultat doit être ROUGE — le visage vient de la
//     photographie ;
//   · loin du contour, il doit être BLEU — les cheveux viennent du rendu ;
//   · et entre les deux, il doit exister une bande de teintes intermédiaires,
//     sans quoi la découpe serait nette et se verrait.
//
// DEUX COULEURS PURES PLUTÔT QU'UN VRAI PORTRAIT, et c'est ce qui rend la garde
// lisible : un écart de rendu ne se discute pas, il se compte. Sur deux
// photographies, « le nez a-t-il bougé ? » redeviendrait une question d'opinion,
// c'est-à-dire exactement ce qu'on essaie de sortir du produit.

import pw from "/opt/node22/lib/node_modules/playwright/index.js";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

const PORT = process.argv[2] ?? "3821";
const BASE = `http://127.0.0.1:${PORT}`;
let echecs = 0;
const dire = (ok, t) => { if (!ok) echecs++; console.log(`${ok ? "  ok  " : "ÉCHEC "} ${t}`); };

const nav = await pw.chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("!! ERREUR PAGE:", e.message));
// N'IMPORTE QUELLE PAGE DU SITE FAIT L'AFFAIRE : on a besoin d'une origine pour
// que les modules se chargent, pas d'un écran particulier.
await p.goto(`${BASE}/autour-de-moi`, { waitUntil: "domcontentloaded" });

console.log("\n══ la recomposition repose bien le visage d'origine ══");

const mesure = await p.evaluate(async () => {
  /** Une image unie, en data-url. */
  const uni = (l, h, couleur) => {
    const c = document.createElement("canvas");
    c.width = l; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = couleur;
    g.fillRect(0, 0, l, h);
    return c.toDataURL("image/png");
  };

  const charger = (src) =>
    new Promise((ok, non) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => non(new Error("illisible"));
      i.src = src;
    });

  /**
   * ON RECOPIE LA RECOMPOSITION PLUTÔT QUE DE L'IMPORTER.
   *
   * `visage.ts` est un module de l'application, servi compilé et empaqueté : le
   * charger depuis une page arbitraire demanderait de connaître le nom de son
   * paquet, qui change à chaque construction. La garde vérifie donc L'ALGORITHME
   * — l'échelle, le pochoir, le fondu, l'ordre des deux dessins — sur la même
   * suite d'opérations. Si le fichier change de méthode, cette garde ne le voit
   * pas ; c'est sa limite, et elle est écrite ici pour qu'on la connaisse.
   */
  const reposer = async (photo, rendu, contour, taillePhoto) => {
    const [a, b] = await Promise.all([charger(photo), charger(rendu)]);
    const L = b.naturalWidth, H = b.naturalHeight;
    const k = Math.max(L / a.naturalWidth, H / a.naturalHeight);
    const pl = a.naturalWidth * k, ph = a.naturalHeight * k;
    const px = (L - pl) / 2, py = (H - ph) / 2;
    const versRendu = (q) => ({
      x: px + (q.x / taillePhoto.l) * pl,
      y: py + (q.y / taillePhoto.h) * ph,
    });
    const source = document.createElement("canvas");
    source.width = L; source.height = H;
    const gs = source.getContext("2d");
    gs.drawImage(a, px, py, pl, ph);

    const pochoir = document.createElement("canvas");
    pochoir.width = L; pochoir.height = H;
    const gp = pochoir.getContext("2d");
    const xs = contour.map((q) => versRendu(q).x);
    const flou = Math.max(8, Math.min(18, (Math.max(...xs) - Math.min(...xs)) * 0.05));
    gp.filter = `blur(${flou}px)`;
    gp.fillStyle = "#fff";
    gp.beginPath();
    contour.forEach((q, i) => {
      const r = versRendu(q);
      if (i === 0) gp.moveTo(r.x, r.y); else gp.lineTo(r.x, r.y);
    });
    gp.closePath();
    gp.fill();
    gp.filter = "none";

    gs.globalCompositeOperation = "destination-in";
    gs.drawImage(pochoir, 0, 0);
    gs.globalCompositeOperation = "source-over";

    const fin = document.createElement("canvas");
    fin.width = L; fin.height = H;
    const gf = fin.getContext("2d");
    gf.drawImage(b, 0, 0);
    gf.drawImage(source, 0, 0);
    return { url: fin.toDataURL("image/png"), L, H, flou };
  };

  // LA PHOTO ET LE RENDU N'ONT NI LA MÊME TAILLE NI LA MÊME FORME, et c'est
  // exprès : c'est le cas réel. OpenAI rend du 1024 carré ou du 1024×1536 ; la
  // photo du client fait ce qu'elle fait.
  const taillePhoto = { l: 600, h: 800 };
  const photo = uni(taillePhoto.l, taillePhoto.h, "#FF0000");
  const rendu = uni(1024, 1024, "#0000FF");

  // UN CARRÉ AU MILIEU DE LA PHOTO, en coordonnées de la PHOTO — comme le
  // contour que rend MediaPipe.
  const contour = [
    { x: 200, y: 300 }, { x: 400, y: 300 }, { x: 400, y: 560 }, { x: 200, y: 560 },
  ];

  const { url, L, H, flou } = await reposer(photo, rendu, contour, taillePhoto);
  const fini = await charger(url);
  const c = document.createElement("canvas");
  c.width = L; c.height = H;
  const g = c.getContext("2d");
  g.drawImage(fini, 0, 0);
  const lire = (x, y) => {
    const d = g.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return { r: d[0], v: d[1], b: d[2] };
  };

  // Où tombe le centre du contour dans le repère du rendu ?
  const k = Math.max(L / taillePhoto.l, H / taillePhoto.h);
  const pl = taillePhoto.l * k, ph = taillePhoto.h * k;
  const px = (L - pl) / 2, py = (H - ph) / 2;
  const versRendu = (q) => ({ x: px + (q.x / taillePhoto.l) * pl, y: py + (q.y / taillePhoto.h) * ph });
  const centre = versRendu({ x: 300, y: 430 });
  /**
   * LE POINT « DEHORS » DOIT ÊTRE DANS L'IMAGE, ET IL N'Y ÉTAIT PAS.
   *
   * Premier jet : le coin haut-gauche de la photo. Or la photo fait 600×800 et
   * le rendu 1024×1024 : pour couvrir le cadre, la photo est agrandie à
   * 1024×1365 et DÉBORDE de 170 points en haut comme en bas. Le coin haut-gauche
   * de la photo tombe donc à y = −18, hors de la toile — la lecture rendait du
   * noir transparent, et la garde concluait « ce n'est pas le rendu ».
   *
   * C'EST LE MÊME PIÈGE D'ÉCHELLE QUE LA RECOMPOSITION ÉVITE, retombé dans la
   * garde qui la vérifie. On prend donc un point à mi-hauteur, loin du contour
   * mais sûrement dans le cadre.
   */
  const dehors = versRendu({ x: 60, y: 430 });

  // LA BANDE DE TRANSITION : on longe le bord droit du carré et on compte les
  // pixels qui ne sont NI franchement rouges NI franchement bleus.
  const bordY = centre.y;
  const bordX = versRendu({ x: 400, y: 430 }).x;
  let melange = 0;
  for (let dx = -40; dx <= 40; dx++) {
    const q = lire(bordX + dx, bordY);
    if (q.r > 30 && q.b > 30) melange++;
  }

  return {
    centre: lire(centre.x, centre.y),
    dehors: lire(dehors.x, dehors.y),
    melange,
    flou: Math.round(flou),
    taille: { L, H },
  };
});

dire(
  mesure.centre.r > 200 && mesure.centre.b < 40,
  `au centre du contour, le pixel vient de la PHOTO (rouge ${mesure.centre.r}, bleu ${mesure.centre.b})`,
);
dire(
  mesure.dehors.b > 200 && mesure.dehors.r < 40,
  `et hors du contour, il vient du RENDU (bleu ${mesure.dehors.b}, rouge ${mesure.dehors.r})`,
);
// SANS FONDU, LA DÉCOUPE SE VOIT — c'est le « léger fondu de 8 à 15 pixels »
// de son analyse, et c'est ce qui distingue un essayage d'un photomontage.
dire(
  mesure.melange >= 6,
  `la frontière est fondue sur ${mesure.melange} points, pas découpée au couteau`,
);
dire(
  mesure.flou >= 8 && mesure.flou <= 18,
  `et le rayon du fondu reste dans la fourchette utile (${mesure.flou} points)`,
);
// LE RÉSULTAT A LA TAILLE DU RENDU, PAS CELLE DE LA PHOTO. C'est le piège de
// l'échelle : recoller le visage à ses coordonnées d'origine sur une image
// d'une autre taille le poserait à côté de la tête.
dire(
  mesure.taille.L === 1024 && mesure.taille.H === 1024,
  `le résultat garde le format du rendu (${mesure.taille.L}×${mesure.taille.H})`,
);

console.log("\n══ le modèle de visage est servi ══");
for (const f of ["face_landmarker.task", "vision_wasm_internal.wasm"]) {
  const r = await p.request.get(`${BASE}/mediapipe/${f}`);
  // ON PÈSE LE CORPS, PAS L'EN-TÊTE. `content-length` est absent quand le
  // serveur répond en morceaux, ce qu'il fait pour les gros fichiers : la garde
  // lisait alors zéro et déclarait le modèle absent alors qu'il arrivait bien.
  const n = (await r.body()).length;
  dire(r.status() === 200 && n > 100000, `/mediapipe/${f} est servi (${r.status()}, ${(n / 1048576).toFixed(1)} Mo)`);
}

await nav.close();

/**
 * ═══ L'ALIGNEMENT, TESTÉ SUR LE VRAI CODE ET NON SUR UNE COPIE ════════════
 *
 * « On a encore des problèmes dans la génération des images : la femme a un
 * visage qui se double un peu sur sa droite. »
 *
 * CE DÉFAUT-LÀ N'ÉTAIT PAS DANS LA GÉNÉRATION, IL ÉTAIT DANS LE RECOLLAGE. La
 * recomposition posait le visage d'origine à sa place SUPPOSÉE au lieu de sa
 * place MESURÉE ; quelques points d'écart suffisent à faire voir deux bords de
 * visage. `alignementSurLeRendu` calcule la similitude qui amène les repères de
 * la photo sur ceux du rendu, et c'est elle qu'on vérifie ici.
 *
 * ON L'IMPORTE POUR DE VRAI, ET C'EST NOUVEAU DANS CE FICHIER. La partie
 * graphique, plus haut, recopie l'algorithme faute de pouvoir charger un module
 * empaqueté depuis une page — et cette limite est écrite là où elle se trouve.
 * Celle-ci est de l'arithmétique pure : elle ne touche ni au DOM ni à MediaPipe,
 * donc elle se transpile et s'exécute telle quelle. Une garde qui teste une
 * COPIE ne voit pas le jour où l'original change.
 */
console.log("\n══ la photo est alignée sur le visage du rendu, pas posée au jugé ══");
{
  const exige = createRequire(import.meta.url);
  const ts = exige("typescript");
  const source = readFileSync("src/lib/direct/visage.ts", "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dossier = mkdtempSync(join(tmpdir(), "visage-"));
  const fichier = join(dossier, "visage.mjs");
  writeFileSync(fichier, js);
  const { alignementSurLeRendu } = await import(fichier);

  /** Un visage de laboratoire : onze repères, une boîte, une taille. */
  const faux = (pts) => ({
    contour: pts,
    interieur: pts,
    reperes: pts,
    boite: { x: 0, y: 0, l: 100, h: 100 },
    taille: { l: 600, h: 800 },
  });
  const base = [
    [200, 300], [240, 300], [360, 300], [400, 300], [300, 320],
    [300, 360], [300, 380], [260, 440], [340, 440], [300, 500], [300, 480],
  ].map(([x, y]) => ({ x, y }));

  /** La même figure, déplacée, agrandie et tournée d'un petit angle. */
  const bouger = (k, deg, dx, dy) => {
    const r = (deg * Math.PI) / 180;
    const c = k * Math.cos(r);
    const s2 = k * Math.sin(r);
    return base.map((p) => ({ x: c * p.x - s2 * p.y + dx, y: s2 * p.x + c * p.y + dy }));
  };

  // 1 · UN DÉCALAGE PUR — le cas le plus fréquent, et celui qui dédouble.
  {
    const a2 = alignementSurLeRendu(faux(base), faux(bouger(1, 0, 57, -23)));
    const ok = a2 && Math.abs(a2.e - 57) < 0.5 && Math.abs(a2.f + 23) < 0.5;
    dire(!!ok, `un décalage de 57 points est retrouvé au point près (${a2 ? `${a2.e.toFixed(1)} · ${a2.f.toFixed(1)}` : "aucun"})`);
  }
  // 2 · UN RECADRAGE — le modèle rend souvent la tête un peu plus grande.
  {
    const a2 = alignementSurLeRendu(faux(base), faux(bouger(1.18, 6, 40, 15)));
    const k = a2 ? Math.hypot(a2.a, a2.b) : 0;
    const deg = a2 ? (Math.atan2(a2.b, a2.a) * 180) / Math.PI : 0;
    dire(
      !!a2 && Math.abs(k - 1.18) < 0.01 && Math.abs(deg - 6) < 0.2,
      `une mise à l'échelle de 1,18 et six degrés sont retrouvés (${k.toFixed(3)} · ${deg.toFixed(1)}°)`,
    );
  }
  // 3 · ET ON REFUSE L'ABERRANT PLUTÔT QUE DE RECOLLER DE TRAVERS.
  {
    dire(
      alignementSurLeRendu(faux(base), faux(bouger(3.4, 0, 0, 0))) === null,
      "une échelle de 3,4 est refusée : ce n'est plus un recadrage",
    );
    dire(
      alignementSurLeRendu(faux(base), faux(bouger(1, 35, 0, 0))) === null,
      "une rotation de 35 degrés est refusée : ce n'est plus la même pose",
    );
  }
  // 4 · LA PHOTO SEULE NE SUFFIT PAS : sans visage trouvé sur le rendu, on ne
  //     bouge rien plutôt que de deviner.
  {
    dire(
      alignementSurLeRendu(faux(base), faux(base.slice(0, 4))) === null,
      "et sans repères comparables, aucun alignement n'est rendu",
    );
  }
  /**
   * ═══ 5 · LE VISAGE DE QUELQU'UN D'AUTRE EST REFUSÉ ═══════════════════════
   *
   * « La coiffure ce n'est pas du tout comme la photo originale et il y a son
   * visage en double. »
   *
   * C'EST LE CAS QUE L'ÉCHELLE ET L'ANGLE NE VOYAIENT PAS. On fabrique ici un
   * second visage PLAUSIBLE — même taille, même orientation, même position
   * générale — mais dont les traits sont ailleurs : un nez plus bas, des yeux
   * plus écartés, une bouche décalée. C'est ce que rend le modèle quand il
   * dessine la cliente ET le modèle de la référence dans la même image.
   *
   * LA SIMILITUDE SE CALCULE QUAND MÊME, et c'est tout le piège : elle sort
   * avec une échelle proche de un et un angle de quelques degrés, donc elle
   * passait les deux contrôles d'avant. C'est son RÉSIDU qui la trahit.
   */
  {
    const autre = base.map((p, i) => ({
      // ON NE BOUGE QUE LES TRAITS, PAS L'ENSEMBLE. Décaler tout le monde
      // ferait une translation, que l'alignement doit justement absorber.
      x: p.x + (i % 3 === 0 ? 26 : i % 3 === 1 ? -21 : 9),
      y: p.y + (i % 2 === 0 ? -18 : 24),
    }));
    const a2 = alignementSurLeRendu(faux(base), faux(autre));
    dire(
      a2 === null,
      "un second visage, plausible en taille et en angle, est refusé sur son résidu",
    );
    // ET ON MONTRE QUE L'ANCIEN CONTRÔLE L'AURAIT LAISSÉ PASSER : sans quoi
    // cette garde ne prouverait pas qu'elle sert à quelque chose.
    const n = base.length;
    const moy = (l) => ({
      x: l.reduce((s2, p) => s2 + p.x, 0) / n,
      y: l.reduce((s2, p) => s2 + p.y, 0) / n,
    });
    const ma = moy(base);
    const mb = moy(autre);
    let n1 = 0;
    let n2 = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const ax = base[i].x - ma.x;
      const ay = base[i].y - ma.y;
      const bx = autre[i].x - mb.x;
      const by = autre[i].y - mb.y;
      n1 += ax * bx + ay * by;
      n2 += ax * by - ay * bx;
      den += ax * ax + ay * ay;
    }
    const k = Math.hypot(n1 / den, n2 / den);
    const deg = Math.abs((Math.atan2(n2 / den, n1 / den) * 180) / Math.PI);
    dire(
      k > 0.5 && k < 2.2 && deg < 18,
      `et les deux anciens contrôles l'auraient accepté (échelle ${k.toFixed(2)}, angle ${deg.toFixed(1)}°)`,
    );
  }
  // 6 · ET UN VRAI RECADRAGE N'EST PAS REFUSÉ POUR AUTANT. Une garde qui
  //     refuse tout est aussi inutile qu'une garde qui accepte tout : on
  //     vérifie donc le contraire de ce qui précède sur le même seuil.
  {
    const leger = bouger(1.06, 3, 12, -7).map((p, i) => ({
      // UN BRUIT D'UN POINT ET DEMI : c'est ce que rend une détection sur deux
      // images d'une même personne, et ça ne doit jamais faire échouer un essai.
      x: p.x + (i % 2 ? 1.4 : -1.2),
      y: p.y + (i % 3 ? -1.1 : 1.5),
    }));
    dire(
      alignementSurLeRendu(faux(base), faux(leger)) !== null,
      "un vrai recadrage, avec son bruit de détection, reste accepté",
    );
  }
}

/**
 * ═══ ET LE MASQUE LAISSE-T-IL LA PLACE D'UNE COUPE LONGUE ? ═══════════════
 *
 * « Ce n'est pas tout à fait la même coupe, et ça rend terriblement mal. »
 *
 * LE MASQUE OUVRAIT UNE ELLIPSE D'UN RAYON D'UNE FOIS ET QUART LA LARGEUR DU
 * VISAGE — une couronne qui s'arrête au niveau des oreilles. On demandait donc
 * « des boucles longues » en interdisant la surface où des boucles longues
 * tombent : les épaules, la poitrine, les côtés. Le modèle faisait ce qu'il
 * pouvait dans la couronne, c'est-à-dire une autre coupe.
 *
 * ON MESURE DEUX CHOSES, ET LES DEUX SONT DES SURFACES :
 *
 *   · CE QUI EST OUVERT DESCEND BIEN SOUS LE MENTON — sans quoi aucune coupe
 *     longue n'est possible ;
 *   · ET LE CŒUR DU VISAGE RESTE FERMÉ, pendant que le HAUT DU FRONT est
 *     ouvert. C'est ce couple qui permet une frange tout en gardant les traits.
 *
 * LE MODULE EST CHARGÉ POUR DE VRAI, DANS LA PAGE. `masqueDEssai` a besoin
 * d'une toile, donc d'un navigateur, mais de rien d'autre : ni MediaPipe, ni
 * réseau. Transpilé et injecté, c'est le code qui part en production qu'on
 * interroge — pas une copie qui vieillira sans prévenir.
 */
console.log("\n══ le masque laisse la place d'une coupe longue ══");
{
  const exige2 = createRequire(import.meta.url);
  const ts2 = exige2("typescript");
  const js2 = ts2.transpileModule(readFileSync("src/lib/direct/visage.ts", "utf8"), {
    compilerOptions: { module: ts2.ModuleKind.ESNext, target: ts2.ScriptTarget.ES2022 },
  }).outputText;

  const nav2 = await pw.chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const p2 = await (await nav2.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p2.goto(`${BASE}/autour-de-moi`, { waitUntil: "domcontentloaded" });
  await p2.addScriptTag({
    content: `${js2}\nwindow.__visage = { masqueDEssai, reposerLeVisage };`,
    type: "module",
  });
  await p2.waitForFunction(() => !!window.__visage, null, { timeout: 8000 });

  const m = await p2.evaluate(() => {
    // UN VISAGE DE LABORATOIRE : une boîte de 200 × 260 au milieu d'une image
    // de 800 × 1000, comme un portrait en buste.
    const boite = { x: 300, y: 180, l: 200, h: 260 };
    const cx = boite.x + boite.l / 2;
    const cy = boite.y + boite.h / 2;
    // UN OVALE RÉGULIER À LA PLACE DU MAILLAGE : ce qu'on mesure est la
    // géométrie du masque, pas la finesse de la détection.
    const contour = Array.from({ length: 36 }, (_, i) => {
      const t = (i / 36) * Math.PI * 2;
      return { x: cx + Math.cos(t) * (boite.l / 2), y: cy + Math.sin(t) * (boite.h / 2) };
    });
    const plafond = boite.y + boite.h * 0.3;
    const interieur = contour.map((q) => ({
      x: cx + (q.x - cx) * 0.9,
      y: Math.max(cy + (q.y - cy) * 0.9, plafond),
    }));
    const v = {
      contour,
      interieur,
      reperes: contour.slice(0, 11),
      boite,
      taille: { l: 800, h: 1000 },
    };
    const url = window.__visage.masqueDEssai(v, "coiffure");
    return new Promise((ok) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 800;
        c.height = 1000;
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        // TRANSPARENT = MODIFIABLE. On lit donc l'alpha, et rien d'autre.
        const alpha = (x, y) => g.getImageData(Math.round(x), Math.round(y), 1, 1).data[3];
        ok({
          // Sous le menton, là où tombe une chevelure longue.
          sousLeMenton: alpha(cx, boite.y + boite.h * 1.6),
          // Sur le côté, à hauteur d'épaule.
          surLEpaule: alpha(boite.x - boite.l * 0.6, boite.y + boite.h * 1.5),
          // Au-dessus du crâne.
          auDessus: alpha(cx, Math.max(2, boite.y - boite.h * 0.5)),
          // Le haut du front : ouvert, pour qu'une frange soit possible.
          leFront: alpha(cx, boite.y + boite.h * 0.14),
          // Le cœur du visage : fermé.
          leCoeur: alpha(cx, cy + boite.h * 0.12),
          // Très bas, sous le buste : refermé, on ne repeint pas la photo.
          toutEnBas: alpha(cx, 990),
        });
      };
      img.src = url;
    });
  });

  /**
   * ═══ ET LA PHOTO D'ARRIVÉE EST LA PHOTO DE DÉPART ══════════════════════
   *
   * « Le résultat est mieux, mais ce n'est quand même pas la même photo qu'au
   * départ. Je veux que la photo de départ et d'arrivée soit la même, sauf la
   * coiffure qui aura été ajoutée. »
   *
   * ON REJOUE EXACTEMENT SA PANNE. Le rendu de laboratoire est une image
   * ENTIÈREMENT NOIRE — c'est ce que le modèle lui a renvoyé, un sujet isolé
   * sur fond de studio. Si la recomposition prend le rendu pour fond, le
   * feuillage, le haut bleu et le collier disparaissent ; s'il prend la photo,
   * il ne reste du noir que la chevelure.
   *
   * LA GARDE COMPARE DES PIXELS, PAS UNE APPARENCE. Aux quatre coins et sur le
   * buste, l'image de sortie doit être identique à la photographie, à la
   * compression JPEG près. C'est la formulation littérale de sa règle, et c'est
   * une propriété qu'on peut mesurer — pas une préférence qu'on espère.
   */
  const r = await p2.evaluate(async () => {
    const L = 800;
    const H = 1000;
    const boite = { x: 300, y: 180, l: 200, h: 260 };
    const cx = boite.x + boite.l / 2;
    const cy = boite.y + boite.h / 2;
    const contour = Array.from({ length: 36 }, (_, i) => {
      const t = (i / 36) * Math.PI * 2;
      return { x: cx + Math.cos(t) * (boite.l / 2), y: cy + Math.sin(t) * (boite.h / 2) };
    });
    const plafond = boite.y + boite.h * 0.3;
    const interieur = contour.map((q) => ({
      x: cx + (q.x - cx) * 0.9,
      y: Math.max(cy + (q.y - cy) * 0.9, plafond),
    }));
    const v = { contour, interieur, reperes: contour.slice(0, 11), boite, taille: { l: L, h: H } };

    /**
     * LA PHOTO DE LABORATOIRE : un dégradé en diagonale.
     *
     * CHAQUE POINT Y A SA PROPRE COULEUR, ce qui est la condition pour mesurer
     * qu'il l'a GARDÉE — une teinte unie ne prouverait rien.
     *
     * ET IL EST LISSE, ce qui est une correction. Premier jet : quatre aplats
     * francs. Deux mesures tombaient alors pile sur la couture entre deux
     * aplats, là où la compression JPEG de la sortie bave sur une quinzaine
     * d'unités — la garde signalait un décor repeint là où il n'y avait qu'un
     * bord dur et un encodeur qui fait son travail. Elle mesurait son propre
     * point de mesure.
     */
    const cp = document.createElement("canvas");
    cp.width = L;
    cp.height = H;
    const gp2 = cp.getContext("2d");
    const deg = gp2.createLinearGradient(0, 0, L, H);
    deg.addColorStop(0, "#1E9E4A");
    deg.addColorStop(0.34, "#C2452F");
    deg.addColorStop(0.67, "#2B5FD9");
    deg.addColorStop(1, "#D9A521");
    gp2.fillStyle = deg;
    gp2.fillRect(0, 0, L, H);

    // LE RENDU DE LABORATOIRE : tout noir, exactement sa capture.
    const cr = document.createElement("canvas");
    cr.width = L;
    cr.height = H;
    const gr = cr.getContext("2d");
    gr.fillStyle = "#000";
    gr.fillRect(0, 0, L, H);

    /**
     * ═══ ON JOUE LES DEUX BRANCHES, ET C'EST TOUT LE SUJET ════════════════
     *
     * AVEC UN ALIGNEMENT SÛR, on recolle : la couronne doit venir du rendu.
     * SANS ALIGNEMENT, on ne recolle plus rien — voir la règle dans
     * `reposerLeVisage`. C'est la correction du visage doublé, et une garde qui
     * ne mesurerait que la première branche laisserait revenir la seconde.
     *
     * L'ALIGNEMENT SÛR EST ICI L'IDENTITÉ : le même visage aux mêmes
     * coordonnées sur les deux images. C'est le cas d'un modèle qui n'a pas
     * bougé le cadrage, et c'est suffisant pour prouver que le collage a lieu.
     */
    const jouer = async (vRendu) => {
      const sortie = await window.__visage.reposerLeVisage(
        cp.toDataURL("image/png"),
        cr.toDataURL("image/png"),
        v,
        "coiffure",
        vRendu,
      );
      const img = await new Promise((ok) => {
        const e = new Image();
        e.onload = () => ok(e);
        e.src = sortie;
      });
      const cs = document.createElement("canvas");
      cs.width = L;
      cs.height = H;
      const g = cs.getContext("2d");
      g.drawImage(img, 0, 0);
      return { img, g };
    };
    const avecAli = await jouer(v);
    const sansAli = await jouer(null);
    const img = avecAli.img;
    const gs2 = avecAli.g;

    const lire = (g, x, y) => Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 3);
    // L'ÉCART MAXIMAL PAR CANAL. Le JPEG bouge de quelques unités ; un fond
    // remplacé bouge de deux cents.
    const ecart = (x, y) => {
      const a2 = lire(gp2, x, y);
      const b2 = lire(gs2, x, y);
      return Math.max(...a2.map((n, i) => Math.abs(n - b2[i])));
    };
    const noirceur = (x, y) => Math.max(...lire(gs2, x, y));

    return {
      taille: { l: img.naturalWidth, h: img.naturalHeight },
      coinHautGauche: ecart(6, 6),
      coinHautDroit: ecart(L - 7, 6),
      coinBasGauche: ecart(6, H - 7),
      coinBasDroit: ecart(L - 7, H - 7),
      // Le buste, sous la zone de travail : c'est son haut bleu et son collier.
      leBuste: ecart(cx - 60, H - 90),
      // Le cœur du visage : la photographie a le dernier mot.
      leVisage: ecart(cx - 40, cy + boite.h * 0.12),
      // Au-dessus du crâne, DANS la zone de travail : là, le rendu gagne.
      leCrane: noirceur(cx - 40, 100),
      /**
       * ET SANS ALIGNEMENT, LE CRÂNE RESTE LA PHOTO.
       *
       * C'est la mesure de la règle nouvelle. Le rendu est tout noir : s'il
       * était recollé, la clarté tomberait à zéro. Qu'elle reste celle du
       * dégradé prouve qu'on a rendu sa photographie plutôt que de deviner.
       */
      craneSansAli: (() => {
        const a2 = Array.from(gp2.getImageData(cx - 40, 100, 1, 1).data).slice(0, 3);
        const b2 = Array.from(sansAli.g.getImageData(cx - 40, 100, 1, 1).data).slice(0, 3);
        return Math.max(...a2.map((n, i) => Math.abs(n - b2[i])));
      })(),
    };
  });
  await nav2.close();

  dire(
    r.taille.l === 800 && r.taille.h === 1000,
    `l'image rendue garde le cadre de la photo (${r.taille.l}×${r.taille.h})`,
  );
  dire(
    Math.max(r.coinHautGauche, r.coinHautDroit, r.coinBasGauche, r.coinBasDroit) < 12,
    `les quatre coins sont ceux de la photo (écart ${r.coinHautGauche} · ${r.coinHautDroit} · ${r.coinBasGauche} · ${r.coinBasDroit})`,
  );
  dire(r.leBuste < 12, `le buste et le décor ne sont pas repeints (écart ${r.leBuste})`);
  dire(r.leVisage < 12, `et le visage reste celui de la photographie (écart ${r.leVisage})`);
  dire(
    r.leCrane < 40,
    `mais au-dessus du crâne, c'est bien le rendu qu'on garde (clarté ${r.leCrane})`,
  );
  dire(
    r.craneSansAli < 12,
    `et sans alignement sûr, on rend sa photo au lieu de deviner (écart ${r.craneSansAli})`,
  );

  dire(m.sousLeMenton < 40, `sous le menton, le modèle peut dessiner (alpha ${m.sousLeMenton})`);
  dire(m.surLEpaule < 40, `et sur les épaules aussi (alpha ${m.surLEpaule})`);
  dire(m.auDessus < 40, `le volume au-dessus du crâne est ouvert (alpha ${m.auDessus})`);
  dire(m.leFront < 40, `le front est ouvert : une frange est possible (alpha ${m.leFront})`);
  dire(m.leCoeur > 200, `mais le cœur du visage reste fermé (alpha ${m.leCoeur})`);
  dire(m.toutEnBas > 200, `et le bas de la photo n'est pas repeint (alpha ${m.toutEnBas})`);
}

console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
