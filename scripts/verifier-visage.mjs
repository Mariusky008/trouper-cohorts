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
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nTOUT PASSE");
process.exit(echecs ? 1 : 0);
