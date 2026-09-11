// 🪞 POSER LA PIÈCE SUR LA PHOTO DU CLIENT — sans modèle, sans serveur, sans un
// centime, et sans attente.
//
// ═══ CE QU'ON A APPRIS EN LE FABRIQUANT, ET IL FAUT LE LIRE AVANT LE CODE ══
//
// LA PREMIÈRE TENTATIVE A ÉCHOUÉ, ET ELLE A ÉTÉ MONTRÉE PLUTÔT QU'EFFACÉE : on
// avait posé le bracelet détouré sur le poignet, il flottait comme un
// autocollant, et les deux pièces concernées ont été marquées « Bientôt
// essayable » dans `fantomes.ts`. Ce fichier est ce qu'on a compris depuis, et
// il ne prétend pas plus que ce qu'il a démontré.
//
// ═══ CE QUI FAIT QU'UN COLLAGE SE VOIT ════════════════════════════════════
//
// Ce n'est presque jamais la découpe. Ce sont QUATRE choses, dans cet ordre :
//
//   1. LA LUMIÈRE. La pièce garde l'éclairage de l'atelier du commerçant. Posée
//      sur une photo prise ailleurs, elle détonne avant même qu'on ait regardé
//      sa forme. On mesure donc la lumière du lieu à l'endroit de la pose, et on
//      y tire la pièce.
//   2. L'OMBRE. Un objet sans ombre ne touche rien. Il plane d'un millimètre, et
//      l'œil le voit sans savoir le nommer.
//   3. L'OCCLUSION. Pour ce qui fait le tour d'un poignet, l'arc arrière passe
//      DERRIÈRE le bras. Sans ça, on voit la boucle entière posée à plat sur la
//      peau — c'était exactement le défaut de la première tentative.
//   4. LE GRAIN. La découpe est plus propre que la photo qui l'accueille. Une
//      zone trop nette au milieu d'une photo de téléphone se repère.
//
// ═══ CE QUE ÇA RÉUSSIT, ET CE QUE ÇA NE RÉUSSIT PAS ═══════════════════════
//
// MESURÉ SUR LES PHOTOS DU DÉPÔT, PAS SUPPOSÉ :
//
//   · POSER UN OBJET DANS UN LIEU — une bougie sur la table du salon, un objet
//     de déco, une plante, un plat. C'EST CONVAINCANT, franchement. La lumière
//     du salon prend sur l'objet, l'ombre le couche sur le bois. C'est ici que
//     se trouve l'effet recherché, et il ne coûte rien.
//
//   · CEINDRE UN POIGNET — un bracelet, une montre. C'EST CORRECT, PAS
//     ÉBLOUISSANT, et la raison n'est pas un réglage : la photo à plat d'une
//     boucle fermée a un point de vue FIGÉ, celui du commerçant, qui ne
//     coïncidera jamais avec celui du client. On garde l'arc avant, on l'assombrit
//     vers les bords, et on obtient un bracelet reconnaissable posé sur un
//     poignet. On n'obtient pas une photographie.
//
//   · LES ONGLES, LA COIFFURE, LE VÊTEMENT — ce fichier NE LES FAIT PAS. Il
//     faut, pour chacun, savoir où est l'ongle, où est la mèche, où est
//     l'épaule : c'est de la segmentation, donc un modèle, donc une facture par
//     essai. C'est la suite, et ce fichier la rend facultative là où elle ne
//     l'était pas — il ne la remplace pas partout.
//
// LA DÉCISION DE PRODUIT QUI EN DÉCOULE : on ouvre l'essai en grand là où il est
// gratuit et beau, et on garde le modèle payant en réserve pour l'onglerie. On
// ne fait pas payer un modèle pour poser une bougie sur une table.
import { chargerImage } from "./detourage";

/**
 * OÙ VA LA PIÈCE, ET SUR QUELLE FORME.
 *
 * TOUT EST EN FRACTIONS DE L'IMAGE, jamais en points. Le gabarit est écrit une
 * fois pour un métier ; la photo, elle, arrive dans la définition du téléphone
 * du client, qui n'est pas celle du nôtre.
 *
 * C'EST LE GABARIT QUI REND LE CALCUL GÉOMÉTRIQUE SUFFISANT. On ne devine pas où
 * est le poignet : l'écran de prise de vue a DEMANDÉ de le mettre là. Cadrer
 * n'est pas une contrainte imposée au client, c'est ce qui nous dispense d'un
 * modèle — et donc ce qui rend l'essai gratuit.
 */
export type Gabarit =
  /** L'objet est POSÉ sur une surface : son pied touche `pied`, il fait `hauteur` de haut. */
  | { forme: "plan"; pied: [number, number]; hauteur: number; lumiere?: number }
  /** L'objet FAIT LE TOUR d'un cylindre : le poignet court le long de `axe`, large de `diametre`. */
  | { forme: "cylindre"; axe: [[number, number], [number, number]]; diametre: number }
  /**
   * UNE MAIN, ET C'EST LE MODÈLE QUI LA TROUVE — pas des coordonnées.
   *
   * Les deux formes ci-dessus disent OÙ va la pièce, parce qu'on le sait
   * d'avance : le gabarit l'a imposé au cadrage. Une main, non — elle a cinq
   * doigts qui bougent, et il faut les localiser dans la photo. C'est
   * `lib/direct/ongles.ts` qui s'en charge, avec un modèle qui tourne dans le
   * téléphone ; ce gabarit-ci ne porte donc aucune coordonnée, il dit seulement
   * « ici, on cherche une main ».
   */
  | { forme: "main" }
  /**
   * UN SIMPLE CADRE, QUAND IL N'Y A RIEN À MESURER.
   *
   * Depuis que le rendu passe par un modèle d'image, le gabarit ne sert plus à
   * placer quoi que ce soit : il sert à DIRE CE QU'ON DOIT PHOTOGRAPHIER. Pour
   * une tête ou un buste, ça tient en un cadre et une phrase — le modèle trouve
   * le reste tout seul, et lui imposer une géométrie ne l'aiderait pas.
   */
  | { forme: "cadre" };

export type Pose = {
  /** Le rendu, en `data:` — prêt à être montré, gardé, publié. */
  image: string;
  largeur: number;
  hauteur: number;
  /** Le temps que ça a pris, en millisecondes. Sert à tenir la promesse « instantané ». */
  ms: number;
};

/** Un canevas hors écran, de la taille demandée. */
function toile(l: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(l));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas indisponible");
  return { c, ctx };
}

/**
 * LA COULEUR MOYENNE DE LA PIÈCE, PONDÉRÉE PAR SON ALPHA.
 *
 * SANS LA PONDÉRATION, LES PIXELS TRANSPARENTS COMPTENT COMME DU NOIR. Le
 * premier essai ne la faisait pas : la moyenne d'un bracelet ajouré tombait
 * près de zéro, le facteur d'harmonisation explosait, et l'argent ressortait
 * orange vif. C'est une ligne, et elle décide de la couleur du résultat.
 */
function lumierePiece(px: Uint8ClampedArray): [number, number, number] {
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sa = 0;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 24) continue;
    sr += px[i] * a;
    sg += px[i + 1] * a;
    sb += px[i + 2] * a;
    sa += a;
  }
  if (!sa) return [128, 128, 128];
  return [sr / sa, sg / sa, sb / sa];
}

/** La couleur moyenne du lieu, autour du point de pose. */
function lumiereLieu(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rayon: number,
  l: number,
  h: number,
): [number, number, number] {
  const x = Math.max(0, Math.round(cx - rayon));
  const y = Math.max(0, Math.round(cy - rayon));
  const w = Math.min(l - x, Math.round(rayon * 2));
  const t = Math.min(h - y, Math.round(rayon * 2));
  if (w < 2 || t < 2) return [128, 128, 128];
  const d = ctx.getImageData(x, y, w, t).data;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (let i = 0; i < d.length; i += 4) {
    sr += d[i];
    sg += d[i + 1];
    sb += d[i + 2];
  }
  const n = d.length / 4;
  return [sr / n, sg / n, sb / n];
}

/** Combien d'écart de lumière on rattrape. Un, ce serait repeindre. */
const DOSE = 0.46;

/**
 * HARMONISER LA PIÈCE AVEC LA LUMIÈRE DU LIEU, et éventuellement l'enrouler.
 *
 * `enroulement` n'est utilisé que pour le cylindre : vers les bords du poignet,
 * la pièce tourne loin de la lumière, donc elle s'assombrit. Sans ça, l'arc est
 * aussi net au bord qu'au centre et se lit comme un trait posé, pas comme un
 * objet qui fait le tour.
 */
function accorder(
  ctx: CanvasRenderingContext2D,
  l: number,
  h: number,
  cible: [number, number, number],
  enroulement: number,
): void {
  const img = ctx.getImageData(0, 0, l, h);
  const px = img.data;
  const mp = lumierePiece(px);
  // ON ÉCLAIRE, ON NE REPEINT PAS. Les bornes empêchent qu'une pièce très sombre
  // sur un fond très clair devienne une tache blanche.
  const k = [0, 1, 2].map((i) =>
    Math.min(1.65, Math.max(0.62, Math.pow(cible[i] / Math.max(4, mp[i]), DOSE))),
  );
  // L'enroulement ne dépend que de la colonne : on le calcule une fois par
  // colonne plutôt qu'une fois par pixel.
  const voile = new Float32Array(l);
  for (let x = 0; x < l; x++) {
    voile[x] = enroulement > 0 ? 1 - enroulement * Math.pow(Math.abs(x - l / 2) / (l / 2), 2.2) : 1;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      const i = (y * l + x) * 4;
      if (px[i + 3] < 4) continue;
      const vo = voile[x];
      px[i] = Math.min(255, px[i] * k[0] * vo);
      px[i + 1] = Math.min(255, px[i + 1] * k[1] * vo);
      px[i + 2] = Math.min(255, px[i + 2] * k[2] * vo);
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * FLOUTER — avec un repli, parce que `ctx.filter` n'est pas partout.
 *
 * Safari ne l'a que depuis 16.4, et une ombre non floutée est pire qu'une ombre
 * absente : c'est une silhouette noire décalée, et ça se voit à l'autre bout de
 * la pièce. Le repli redessine la même image quelques fois autour d'elle-même :
 * ce n'est pas un flou gaussien, mais à faible opacité personne ne fait la
 * différence.
 */
function flouter(
  dest: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  x: number,
  y: number,
  rayon: number,
  opacite: number,
): void {
  dest.save();
  dest.globalAlpha = opacite;
  // LE TEST SE FAIT À L'EXÉCUTION, PAS SUR LE TYPE. `filter` est TOUJOURS
  // déclarée sur le contexte — c'est le navigateur qui l'a ou non — donc un
  // `"filter" in dest` ferait croire au compilateur que le repli est mort.
  const filtre = typeof (dest as { filter?: unknown }).filter === "string";
  if (filtre) {
    dest.filter = `blur(${rayon}px)`;
    dest.drawImage(src, x, y);
    dest.filter = "none";
  } else {
    const n = 8;
    dest.globalAlpha = opacite / n;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      dest.drawImage(src, x + Math.cos(a) * rayon * 0.7, y + Math.sin(a) * rayon * 0.7);
    }
  }
  dest.restore();
}

/** La silhouette de la pièce, en une seule couleur — c'est de là que part l'ombre. */
function silhouette(piece: HTMLCanvasElement, teinte = "rgb(24,17,13)"): HTMLCanvasElement {
  const { c, ctx } = toile(piece.width, piece.height);
  ctx.drawImage(piece, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = teinte;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

/**
 * LE GRAIN, RENDU À LA PIÈCE.
 *
 * On ne bruite QUE la zone touchée : bruiter toute l'image dégraderait la photo
 * du client pour cacher notre couture, ce qui serait payer trop cher.
 */
function grainer(ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, L: number, H: number) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const w = Math.min(L - x0, Math.ceil(l));
  const t = Math.min(H - y0, Math.ceil(h));
  if (w < 2 || t < 2) return;
  const img = ctx.getImageData(x0, y0, w, t);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = ((Math.random() * 7) | 0) - 3;
    px[i] = Math.max(0, Math.min(255, px[i] + n));
    px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + n));
    px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + n));
  }
  ctx.putImageData(img, x0, y0);
}

/** Où l'arc visible s'arrête. Voir `ceindre`. */
const COUPE = 0.5;
/**
 * COMBIEN LA PIÈCE S'ASSOMBRIT VERS LES BORDS DU POIGNET.
 *
 * Un premier réglage à quarante-deux centièmes a été rendu et regardé : trop.
 * L'arc entier s'éteignait et le bijou devenait un fil gris. On enroule, on
 * n'éteint pas.
 */
const ENROULEMENT = 0.24;
/** La pièce est un peu plus large que le poignet : elle n'est pas serrée dessus. */
const SERRAGE = 1.06;

/**
 * POSER LA PIÈCE, ET RENDRE L'IMAGE.
 *
 * Tout se passe dans le téléphone, en une fraction de seconde, sans un octet
 * envoyé nulle part. La photo du client ne quitte pas son appareil tant qu'il
 * n'a pas décidé de publier — ce qui n'est pas un détail technique mais la
 * raison pour laquelle on peut demander une photo de son poignet.
 */
export async function composer(opts: {
  lieu: string;
  piece: string;
  gabarit: Gabarit;
  largeur?: number;
}): Promise<Pose> {
  const t0 = Date.now();
  const [lieu, piece] = await Promise.all([chargerImage(opts.lieu), chargerImage(opts.piece)]);
  const L = Math.min(opts.largeur ?? 900, lieu.width);
  const H = Math.round((L * lieu.height) / lieu.width);
  const { c, ctx } = toile(L, H);
  ctx.drawImage(lieu, 0, 0, L, H);

  if (opts.gabarit.forme === "main" || opts.gabarit.forme === "cadre") {
    // Une main ne se compose pas, elle se PEINT : voir `lib/direct/ongles.ts`.
    throw new Error("ce gabarit passe par le modèle d’image, pas par composer");
  }
  if (opts.gabarit.forme === "cylindre") {
    ceindre(ctx, piece, opts.gabarit, L, H);
  } else {
    deposer(ctx, piece, opts.gabarit, L, H);
  }

  return { image: c.toDataURL("image/jpeg", 0.92), largeur: L, hauteur: H, ms: Date.now() - t0 };
}

/**
 * CEINDRE — la pièce fait le tour du poignet.
 *
 * ON NE GARDE QU'UN SEUL ARC. C'est la correction qui a tout changé : la boucle
 * entière posée à plat sur la peau se lit comme deux chaînes côte à côte, jamais
 * comme un bracelet. Coupée, l'autre moitié passe derrière le bras — et le
 * bracelet apparaît.
 *
 * ET C'EST L'ARC DU HAUT QU'ON GARDE, PAS CELUI DU BAS. Les deux ont été rendus
 * côte à côte et regardés : garder celui du bas donne un fil sombre et maigre,
 * garder celui du haut donne un bracelet. La raison est qu'on photographie un
 * poignet EN LE REGARDANT UN PEU D'EN HAUT — l'arc visible est donc celui qui
 * repose sur la face supérieure, et l'autre passe dessous.
 *
 * ON COUPE À LA MOITIÉ, ET PAS AILLEURS. Une coupe plus franche a été essayée et
 * elle est moins bonne : l'ellipse est à sa plus grande largeur EXACTEMENT sur
 * sa ligne médiane, donc couper au-delà rogne les extrémités et l'arc s'arrête
 * avant le bord du bras.
 */
function ceindre(
  ctx: CanvasRenderingContext2D,
  piece: HTMLImageElement,
  g: Extract<Gabarit, { forme: "cylindre" }>,
  L: number,
  H: number,
): void {
  const [[axn, ayn], [bxn, byn]] = g.axe;
  const ax = axn * L;
  const ay = ayn * H;
  const bx = bxn * L;
  const by = byn * H;
  const angle = Math.atan2(by - ay, bx - ax);
  const cx = (ax + bx) / 2;
  const cy = (ay + by) / 2;
  const D = g.diametre * L;

  const pl = D * SERRAGE;
  const ph = Math.max(1, Math.round((pl * piece.height) / piece.width));
  const { c: pc, ctx: pctx } = toile(pl, ph);
  pctx.drawImage(piece, 0, 0, pl, ph);

  // L'arc qui passe sous le bras s'en va, avec un bord adouci : une coupe nette
  // ferait apparaître une ligne droite au milieu du bijou.
  const fondu = pctx.createLinearGradient(0, ph * (COUPE - 0.06), 0, ph * (COUPE + 0.06));
  fondu.addColorStop(0, "rgba(0,0,0,0)");
  fondu.addColorStop(1, "rgba(0,0,0,1)");
  pctx.globalCompositeOperation = "destination-out";
  pctx.fillStyle = fondu;
  pctx.fillRect(0, ph * (COUPE - 0.06), pc.width, ph - ph * (COUPE - 0.06));
  pctx.globalCompositeOperation = "source-over";

  accorder(pctx, pc.width, pc.height, lumiereLieu(ctx, cx, cy, Math.max(24, D / 3), L, H), ENROULEMENT);

  const sil = silhouette(pc);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle + Math.PI / 2);
  flouter(ctx, sil, -pc.width / 2 + 4, -pc.height / 2 + 9, 8, 0.55);
  ctx.drawImage(pc, -pc.width / 2, -pc.height / 2);
  ctx.restore();

  // La zone à bruiter : le disque qui contient la pièce quelle que soit sa
  // rotation.
  const r = Math.hypot(pc.width, pc.height) / 2;
  grainer(ctx, cx - r, cy - r, r * 2, r * 2, L, H);
}

/**
 * DÉPOSER — la pièce est posée sur une surface.
 *
 * C'EST LE CAS QUI MARCHE VRAIMENT, et c'est aussi le plus fréquent : tout ce
 * qui se met dans un lieu plutôt que sur un corps. Une bougie sur la table du
 * salon, un objet, une plante, un plat sur une nappe.
 *
 * L'OMBRE EST COUCHÉE, PAS RECOPIÉE. Une ombre sur une table n'est pas la
 * silhouette de l'objet décalée : c'est cette silhouette écrasée vers le sol et
 * poussée du côté opposé à la lumière. Plus un liseré sombre serré sous le pied,
 * qui fait le contact.
 */
function deposer(
  ctx: CanvasRenderingContext2D,
  piece: HTMLImageElement,
  g: Extract<Gabarit, { forme: "plan" }>,
  L: number,
  H: number,
): void {
  const px = g.pied[0] * L;
  const py = g.pied[1] * H;
  const ph = g.hauteur * H;
  const pl = Math.max(1, Math.round((ph * piece.width) / piece.height));
  const { c: pc, ctx: pctx } = toile(pl, ph);
  pctx.drawImage(piece, 0, 0, pl, ph);
  accorder(pctx, pl, Math.round(ph), lumiereLieu(ctx, px, py - ph * 0.4, Math.max(30, pl / 2), L, H), 0);

  const x0 = px - pl / 2;
  const y0 = py - ph;
  const vers = g.lumiere ?? -0.7;

  // L'ombre couchée : la silhouette écrasée au tiers de sa hauteur, effacée en
  // s'éloignant du pied.
  const oh = Math.max(6, Math.round(ph * 0.3));
  const { c: oc, ctx: octx } = toile(pl, oh);
  octx.drawImage(silhouette(pc), 0, 0, pl, oh);
  const fondu = octx.createLinearGradient(0, 0, 0, oh);
  fondu.addColorStop(0, "rgba(0,0,0,1)");
  fondu.addColorStop(1, "rgba(0,0,0,0)");
  octx.globalCompositeOperation = "destination-in";
  octx.fillStyle = fondu;
  octx.fillRect(0, 0, pl, oh);
  flouter(ctx, oc, x0 + vers * pl * 0.3, py - oh / 2, Math.max(5, pl / 26), 0.5);

  // Le contact : sans lui, l'objet plane d'un millimètre.
  const { c: cc, ctx: cctx } = toile(pl, Math.max(4, ph * 0.09));
  cctx.fillStyle = "rgba(15,10,8,0.6)";
  cctx.beginPath();
  cctx.ellipse(pl / 2, cc.height / 2, pl * 0.34, cc.height / 2, 0, 0, Math.PI * 2);
  cctx.fill();
  flouter(ctx, cc, x0, py - cc.height / 2, Math.max(3, pl / 45), 1);

  ctx.drawImage(pc, x0, y0);
  grainer(ctx, x0 - 20, y0, pl + 40, ph + 24, L, H);
}
