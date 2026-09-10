// ✂️ DÉTOURER LA PHOTO DU JOUR — sans modèle, sans serveur, sans un centime.
//
// ═══ CE QUE ÇA RÉSOUT ══════════════════════════════════════════════════════
//
// « Chaque jour il met un nouveau produit avec une offre flash sur son annonce.
// Donc ce ne peut pas être une séance photo, juste une prise de photo classique
// qu'il faudra qu'on détoure nous-mêmes pour la mettre sur le client. »
//
// UNE PHOTO PAR JOUR ET PAR COMMERCE — quinze pour toute la ville. Le détourage
// n'est donc PAS une opération d'essai : elle se fait UNE FOIS, à la publication.
// Ce qui la rendait chère disparaît avec cette phrase-là.
//
// ═══ POURQUOI IL N'Y A PAS DE MODÈLE ICI ══════════════════════════════════
//
// PARCE QU'ON DEMANDE LE FOND. L'écran de publication montre un cadre et une
// phrase — « posez-le sur un fond uni » — et le commerçant le fait, puisqu'il
// prenait déjà la photo. À partir de là, séparer l'objet de son fond n'est plus
// un problème de vision : c'est un problème de couleur, et il se résout en
// quelques millisecondes dans le navigateur.
//
// CE QUE ÇA ÉCONOMISE N'EST PAS QUE DE L'ARGENT. Pas de clé, pas de quota
// fournisseur, pas de panne d'API, pas de photo qui part chez un tiers, et un
// résultat instantané — donc le commerçant VOIT sa découpe avant de publier et
// peut reprendre la photo en cinq secondes. La boucle de qualité est gratuite et
// immédiate, ce qu'aucun appel distant ne permet.
//
// UN MODÈLE DE SEGMENTATION RESTE LA SUITE, et elle est écrite : le jour où l'on
// voudra détourer une photo prise n'importe où — sur un présentoir, dans une
// main, devant une vitrine — il faudra en passer par là. Ce fichier rend ce
// jour-là facultatif au lieu d'obligatoire.
//
// ═══ LA SEULE VRAIE DIFFICULTÉ : L'OMBRE ══════════════════════════════════
//
// Un objet posé sur une feuille blanche projette une ombre. En distance RVB
// brute, un gris à 40 % est TRÈS loin du blanc — l'ombre serait donc gardée avec
// l'objet, et on collerait sur le poignet du client une auréole grise.
//
// ON MESURE DONC LA CHROMINANCE, PAS LA LUMINOSITÉ. On ramène chaque pixel à la
// clarté du fond avant de comparer : une ombre est le fond en plus sombre, donc
// sa chrominance est identique, donc elle part avec le fond. C'est cette seule
// ligne qui fait la différence entre une découpe utilisable et une découpe qui
// se voit.

/** Ce que le détourage rend, et ce qu'il en pense. */
export type Decoupe = {
  /** Le PNG détouré, en `data:` — prêt à être posé, stocké, envoyé. */
  png: string;
  largeur: number;
  hauteur: number;
  /**
   * DE 0 À 1, ET ELLE SERT À PARLER AU COMMERÇANT, PAS À NOUS.
   *
   * En dessous de 0,45 l'écran lui dit ce qui ne va pas et lui propose de
   * reprendre. Une découpe ratée publiée est pire qu'une photo non détourée :
   * elle ira se coller sur le poignet de quelqu'un.
   */
  qualite: number;
  /** Ce qui cloche, en une phrase, quand la qualité est basse. */
  souci?: string;
};

/** La couleur moyenne du bord, et sa dispersion. */
function fondDuBord(px: Uint8ClampedArray, l: number, h: number) {
  const ech: number[][] = [];
  const pas = Math.max(1, Math.round(Math.min(l, h) / 90));
  const lire = (x: number, y: number) => {
    const i = (y * l + x) * 4;
    ech.push([px[i], px[i + 1], px[i + 2]]);
  };
  for (let x = 0; x < l; x += pas) {
    lire(x, 0);
    lire(x, h - 1);
  }
  for (let y = 0; y < h; y += pas) {
    lire(0, y);
    lire(l - 1, y);
  }
  // LA MÉDIANE, PAS LA MOYENNE : un coin d'étagère qui dépasse dans un angle
  // décalerait une moyenne, il ne décale pas une médiane.
  const med = (k: number) => {
    const v = ech.map((e) => e[k]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  const fond = [med(0), med(1), med(2)];
  // La dispersion dit si le fond est uni. Un fond bavard fera une découpe sale,
  // et il vaut mieux le dire au commerçant que de le lui livrer.
  let ecart = 0;
  for (const e of ech) {
    ecart += Math.abs(e[0] - fond[0]) + Math.abs(e[1] - fond[1]) + Math.abs(e[2] - fond[2]);
  }
  return { fond, ecart: ecart / (ech.length * 3) };
}

/**
 * LA DISTANCE AU FOND, INSENSIBLE À L'OMBRE.
 *
 * Voir l'en-tête : on ramène le pixel à la clarté du fond avant de comparer, et
 * on ne rend à la luminosité qu'un tiers de son poids. Une ombre garde donc la
 * chrominance du fond et s'en va avec lui ; un objet gris sur fond blanc, lui,
 * garde une différence de clarté suffisante pour rester.
 */
function distance(r: number, g: number, b: number, fond: number[]): number {
  const cl = (r + g + b) / 3;
  const cf = (fond[0] + fond[1] + fond[2]) / 3;
  const k = cl > 6 ? cf / cl : 1;
  const dr = r * k - fond[0];
  const dg = g * k - fond[1];
  const db = b * k - fond[2];
  const chroma = Math.sqrt(dr * dr + dg * dg + db * db);
  return chroma + Math.abs(cl - cf) * 0.34;
}

/** Au-delà de ce rapport diamètre / épaisseur de paroi, c'est un trou. */
const TROU_MINCEUR = 8;

/**
 * PERCER LES BOUCLES FERMÉES, ET ÉPARGNER LES SURFACES.
 *
 * On cherche les régions de couleur du fond que le remplissage n'a pas pu
 * atteindre, et pour chacune on mesure DEUX choses : sa taille, et l'épaisseur
 * de ce qui l'entoure. Voir l'appel plus haut pour le pourquoi.
 *
 * Modifie `dehors` sur place.
 */
function perforer(
  px: Uint8ClampedArray,
  l: number,
  h: number,
  dehors: Uint8Array,
  fond: number[],
  tolerance: number,
): void {
  const n = l * h;
  const vu = new Uint8Array(n);
  const region: number[] = [];
  const pile: number[] = [];

  /** De ce pixel, en s'éloignant du centre, combien avant de sortir ? */
  const paroi = (depart: number, cx: number, cy: number): number => {
    const x = depart % l;
    const y = (depart / l) | 0;
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d < 1) return 999;
    const ux = dx / d;
    const uy = dy / d;
    for (let k = 1; k < 260; k++) {
      const sx = Math.round(x + ux * k);
      const sy = Math.round(y + uy * k);
      // SORTIR DU CADRE COMPTE COMME SORTIR : un collier coupé par le bord de la
      // photo a une paroi ouverte, donc infiniment mince.
      if (sx < 0 || sy < 0 || sx >= l || sy >= h) return k;
      if (dehors[sy * l + sx]) return k;
    }
    return 999;
  };

  for (let d = 0; d < n; d++) {
    if (vu[d] || dehors[d]) continue;
    const j = d * 4;
    if (distance(px[j], px[j + 1], px[j + 2], fond) > tolerance) continue;

    // La région enfermée, d'un seul tenant.
    region.length = 0;
    pile.length = 0;
    pile.push(d);
    vu[d] = 1;
    let sx = 0;
    let sy = 0;
    while (pile.length) {
      const i = pile.pop() as number;
      region.push(i);
      const x = i % l;
      const y = (i / l) | 0;
      sx += x;
      sy += y;
      const voisins = [x > 0 ? i - 1 : -1, x < l - 1 ? i + 1 : -1, y > 0 ? i - l : -1, y < h - 1 ? i + l : -1];
      for (const v of voisins) {
        if (v < 0 || vu[v] || dehors[v]) continue;
        const k = v * 4;
        if (distance(px[k], px[k + 1], px[k + 2], fond) > tolerance) continue;
        vu[v] = 1;
        pile.push(v);
      }
    }

    // UNE PETITE RÉGION NE SE DISCUTE PAS : un reflet, un interstice de chaîne,
    // un éclat de pierre. Sous un millième de la photo, on la garde.
    const aire = region.length;
    if (aire < n / 1000) continue;

    const cx = sx / aire;
    const cy = sy / aire;
    const diametre = 2 * Math.sqrt(aire / Math.PI);

    // L'ÉPAISSEUR, PRISE À LA MÉDIANE SUR UNE QUARANTAINE DE POINTS DU BORD. La
    // médiane, parce qu'un fermoir épais d'un côté ne doit pas sauver toute la
    // boucle.
    // ON PARCOURT TOUTE LA RÉGION POUR TROUVER SES BORDS, et on n'échantillonne
    // qu'ENSUITE. Le premier essai piochait un point sur quatre cents dans
    // l'ordre du remplissage — donc presque toujours à l'intérieur, jamais sur
    // le bord — et la règle ne se déclenchait sur rien.
    const bords: number[] = [];
    for (const i of region) {
      const x = i % l;
      const y = (i / l) | 0;
      if (
        x === 0 ||
        y === 0 ||
        x === l - 1 ||
        y === h - 1 ||
        !vu[i - 1] ||
        !vu[i + 1] ||
        !vu[i - l] ||
        !vu[i + l]
      ) {
        bords.push(i);
      }
    }
    if (bords.length < 8) continue;
    const pas = Math.max(1, Math.floor(bords.length / 120));
    const mesures: number[] = [];
    for (let t = 0; t < bords.length; t += pas) mesures.push(paroi(bords[t], cx, cy));
    mesures.sort((a, b) => a - b);
    const epaisseur = mesures[Math.floor(mesures.length / 2)];

    if (diametre / Math.max(1, epaisseur) >= TROU_MINCEUR) {
      for (const i of region) dehors[i] = 1;
    }
  }
}

/**
 * PERCER À LA MAIN, LÀ OÙ LE COMMERÇANT APPUIE.
 *
 * LA RÈGLE AUTOMATIQUE TRANCHE LE CAS COURANT, PAS TOUS. Un bijou posé sur un
 * buste d'exposition, un vase dont l'intérieur se voit, une anse large : il
 * reste des régions dont je ne peux pas décider seul, et deviner à sa place
 * serait pire que lui demander.
 *
 * ALORS ON LUI DEMANDE, ET ÇA NE COÛTE QU'UN APPUI. La découpe s'affiche sur un
 * damier, il touche ce qui devrait être vide, on remplit depuis son doigt. Il
 * regarde déjà l'écran, il est le seul à savoir, et c'est instantané.
 */
export function percer(
  px: Uint8ClampedArray,
  alpha: Uint8Array,
  l: number,
  h: number,
  x: number,
  y: number,
  tolerance = 34,
): Uint8Array {
  const n = l * h;
  const depart = y * l + x;
  if (depart < 0 || depart >= n || alpha[depart] < 8) return alpha;
  const j = depart * 4;
  const cible = [px[j], px[j + 1], px[j + 2]];
  const sortie = new Uint8Array(alpha);
  const vu = new Uint8Array(n);
  const pile = [depart];
  vu[depart] = 1;
  while (pile.length) {
    const i = pile.pop() as number;
    const k = i * 4;
    if (distance(px[k], px[k + 1], px[k + 2], cible) > tolerance) continue;
    sortie[i] = 0;
    const cx = i % l;
    const cy = (i / l) | 0;
    const voisins = [cx > 0 ? i - 1 : -1, cx < l - 1 ? i + 1 : -1, cy > 0 ? i - l : -1, cy < h - 1 ? i + l : -1];
    for (const v of voisins) {
      if (v < 0 || vu[v]) continue;
      vu[v] = 1;
      pile.push(v);
    }
  }
  return sortie;
}

/**
 * DÉTOURER — le cœur, sur des pixels bruts.
 *
 * ON PART DES BORDS ET ON SE PROPAGE. Un remplissage depuis les quatre côtés,
 * pas un seuil global : ce qui est de la couleur du fond mais ENFERMÉ dans
 * l'objet — le blanc d'un cadran, un reflet — reste dans l'objet. Un seuil
 * global le percerait, et on verrait le poignet du client à travers la montre.
 */
export function detourerPixels(
  px: Uint8ClampedArray,
  l: number,
  h: number,
  tolerance = 30,
): { alpha: Uint8Array; part: number; ecartFond: number } {
  const { fond, ecart } = fondDuBord(px, l, h);
  const n = l * h;
  const vu = new Uint8Array(n);
  const pile: number[] = [];
  const pousser = (i: number) => {
    if (!vu[i]) {
      vu[i] = 1;
      pile.push(i);
    }
  };
  for (let x = 0; x < l; x++) {
    pousser(x);
    pousser((h - 1) * l + x);
  }
  for (let y = 0; y < h; y++) {
    pousser(y * l);
    pousser(y * l + l - 1);
  }
  const dehors = new Uint8Array(n);
  while (pile.length) {
    const i = pile.pop() as number;
    const j = i * 4;
    if (distance(px[j], px[j + 1], px[j + 2], fond) > tolerance) continue;
    dehors[i] = 1;
    const x = i % l;
    const y = (i / l) | 0;
    if (x > 0) pousser(i - 1);
    if (x < l - 1) pousser(i + 1);
    if (y > 0) pousser(i - l);
    if (y < h - 1) pousser(i + l);
  }

  // ─── LES TROUS, ET CE QUI LES DISTINGUE D'UNE SURFACE ───
  //
  // LE REMPLISSAGE DEPUIS LES BORDS GARDE CE QUI EST ENFERMÉ, et c'est ce qu'on
  // veut pour le cadran d'une montre. Mais UN COLLIER EST UNE BOUCLE FERMÉE :
  // son intérieur est du papier, et il restait — on collait sur le cou de la
  // cliente un grand ovale blanc. Le défaut a été vu sur une photo construite
  // exprès, avec les deux pièges dans la même image.
  //
  // CE QUI LES SÉPARE N'EST PAS LA COULEUR, C'EST L'ÉPAISSEUR DE LA PAROI. Un
  // cadran de quatre-vingts points est cerclé d'un boîtier de trente ; la boucle
  // d'un collier de quatre cents points est cerclée d'une chaîne de neuf. Le
  // rapport est de six d'un côté, de quarante de l'autre, et il ne dépend NI de
  // la taille de la photo NI de la distance de prise de vue — c'est pour ça
  // qu'on peut lui faire confiance.
  perforer(px, l, h, dehors, fond, tolerance);

  // ─── L'ALPHA, ET SON DÉGRADÉ ───
  // Un masque binaire donne un bord en escalier qui se voit immédiatement une
  // fois posé sur une peau. On rend donc l'alpha PROGRESSIF entre la tolérance
  // et le double : le bord de l'objet, qui mélange l'objet et le fond, devient
  // un vrai dégradé.
  const alpha = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!dehors[i]) {
      alpha[i] = 255;
      continue;
    }
    const j = i * 4;
    const d = distance(px[j], px[j + 1], px[j + 2], fond);
    alpha[i] = d <= tolerance ? 0 : Math.min(255, Math.round(((d - tolerance) / tolerance) * 255));
  }

  // ─── UN LISSAGE D'UN PIXEL ───
  // Trois passes de moyenne sur trois cases : assez pour tuer l'escalier, trop
  // peu pour manger un détail. Au-delà, une chaîne fine disparaît.
  const lisse = new Uint8Array(alpha);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < l - 1; x++) {
      const i = y * l + x;
      lisse[i] = Math.round(
        (alpha[i] * 4 + alpha[i - 1] + alpha[i + 1] + alpha[i - l] + alpha[i + l]) / 8,
      );
    }
  }
  let dedans = 0;
  for (let i = 0; i < n; i++) if (lisse[i] > 128) dedans++;
  return { alpha: lisse, part: dedans / n, ecartFond: ecart };
}

/**
 * DÉTOURER UNE IMAGE, DANS LE NAVIGATEUR, ET RENDRE UN PNG.
 *
 * ON RECADRE SUR L'OBJET. Le commerçant photographie de loin, l'objet occupe le
 * tiers du cadre — et c'est ce cadre-là qu'on irait poser sur un poignet, avec
 * ses trois quarts de vide. On rogne donc sur ce qui reste, avec deux points de
 * marge pour ne pas raboter le dégradé du bord.
 */
export async function detourer(source: string, tolerance = 30): Promise<Decoupe> {
  const img = await chargerImage(source);
  // On travaille au plus à 900 points de large : au-delà, on paie des millions
  // de pixels pour une découpe qui sera affichée sur un téléphone.
  const ech = Math.min(1, 900 / Math.max(img.width, img.height));
  const l = Math.max(1, Math.round(img.width * ech));
  const h = Math.max(1, Math.round(img.height * ech));
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(img, 0, 0, l, h);
  const donnees = ctx.getImageData(0, 0, l, h);
  const { alpha, part, ecartFond } = detourerPixels(donnees.data, l, h, tolerance);

  let x0 = l;
  let y0 = h;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      if (alpha[y * l + x] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0 || y1 < y0) {
    return { png: "", largeur: 0, hauteur: 0, qualite: 0, souci: "Rien à détourer sur cette photo." };
  }
  const m = 2;
  x0 = Math.max(0, x0 - m);
  y0 = Math.max(0, y0 - m);
  x1 = Math.min(l - 1, x1 + m);
  y1 = Math.min(h - 1, y1 + m);
  const dl = x1 - x0 + 1;
  const dh = y1 - y0 + 1;

  const sortie = ctx.createImageData(dl, dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dl; x++) {
      const s = ((y + y0) * l + (x + x0)) * 4;
      const d = (y * dl + x) * 4;
      sortie.data[d] = donnees.data[s];
      sortie.data[d + 1] = donnees.data[s + 1];
      sortie.data[d + 2] = donnees.data[s + 2];
      sortie.data[d + 3] = alpha[(y + y0) * l + (x + x0)];
    }
  }
  const c2 = document.createElement("canvas");
  c2.width = dl;
  c2.height = dh;
  c2.getContext("2d")?.putImageData(sortie, 0, 0);

  /**
   * LA QUALITÉ, ET LES TROIS FAÇONS DE RATER.
   *
   * · L'objet remplit tout : le fond n'a pas été trouvé, on a gardé la photo.
   * · L'objet est minuscule : on n'a gardé qu'un reflet ou une poussière.
   * · Le fond est bavard : la découpe sera dentelée, quoi qu'on fasse.
   */
  /**
   * ON MESURE L'ENCOMBREMENT, PAS LA SURFACE PLEINE. Le premier essai jugeait
   * sur la part de pixels gardés, et il a recalé le bracelet — une chaîne fine
   * ne remplit qu'un centième de la photo tout en la traversant d'un bord à
   * l'autre. C'est le CADRE de l'objet qui dit s'il est bien cadré ; sa surface
   * ne dit que s'il est plein ou ajouré, ce qui ne nous regarde pas.
   */
  const encombrement = (dl * dh) / (l * h);
  let qualite = 1;
  let souci: string | undefined;
  if (part > 0.9) {
    qualite = 0.15;
    souci = "Le fond n’a pas été reconnu. Posez l’objet sur une surface unie et recadrez.";
  } else if (encombrement < 0.02 || part < 0.0015) {
    qualite = 0.2;
    souci = "L’objet est trop petit dans la photo. Rapprochez-vous.";
  } else if (ecartFond > 26) {
    qualite = 0.4;
    souci = "Le fond n’est pas uni : la découpe sera irrégulière.";
  } else {
    // Le confort est autour du tiers du cadre : plus petit on perd le détail,
    // plus grand on rogne l'objet.
    qualite = Math.min(1, 0.62 + (1 - Math.min(1, Math.abs(encombrement - 0.34) / 0.5)) * 0.38);
  }
  return { png: c2.toDataURL("image/png"), largeur: dl, hauteur: dh, qualite, souci };
}

/** Charge une image, quelle que soit sa provenance. */
export function chargerImage(source: string): Promise<HTMLImageElement> {
  return new Promise((ok, non) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => non(new Error(`image illisible : ${source.slice(0, 40)}`));
    i.src = source;
  });
}
