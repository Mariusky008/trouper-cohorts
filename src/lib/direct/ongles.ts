// 💅 LA POSE D'ONGLES — sur la main de la cliente, dans son téléphone.
//
// ═══ CE QUE CE FICHIER A APPRIS EN SE TROMPANT DEUX FOIS ══════════════════
//
// LA PREMIÈRE IDÉE ÉTAIT DE SEGMENTER L'ONGLE DE LA CLIENTE PAR SA COULEUR.
// Deux tentatives, deux échecs, tous les deux mesurés et regardés :
//
//   1. « CE QUI EST LOIN DE LA PEAU EST UN ONGLE. » Le remplissage attrapait le
//      FOND — lui aussi très loin de la peau — et laissait dehors un ongle rose,
//      qui est plus proche de la peau que le fond ne l'est. L'ongle faisait six
//      fois sa taille.
//   2. « ON PART DU MILIEU DE L'ONGLE ET ON MARCHE JUSQU'À SON BORD. » Sur un
//      ongle à paillettes, deux pixels voisins ne se ressemblent pas : la marche
//      s'arrêtait au bout de trois points.
//
// ET LA VRAIE LEÇON N'ÉTAIT PAS UN RÉGLAGE. Une onglerie ne vend pas une
// retouche de l'ongle existant : elle vend UNE POSE — une forme, une longueur et
// une couleur QU'ELLE choisit, posées par-dessus ce que la cliente porte déjà.
// Il n'y a donc rien à segmenter. Il faut savoir OÙ EST LE DOIGT, et dessiner
// l'ongle du salon dessus. C'est plus simple, c'est plus robuste, et c'est ce
// qui est réellement acheté.
//
// ═══ CE QUI COÛTE, ET CE QUI NE COÛTE PAS ═════════════════════════════════
//
// LE MODÈLE DE MAIN TOURNE DANS LE TÉLÉPHONE. `hand_landmarker` de MediaPipe,
// en WebAssembly : la photo ne part nulle part, il n'y a pas de clé, pas de
// quota, pas de panne d'API, et le calcul est à zéro centime QUEL QUE SOIT le
// nombre d'essais.
//
// CE QU'IL COÛTE VRAIMENT, ET IL FAUT LE DIRE : DIX-NEUF MÉGAOCTETS de
// téléchargement, UNE FOIS. Onze pour le moteur, sept et demi pour le modèle.
// C'est beaucoup en 4G, et c'est le vrai prix de cette fonctionnalité. Trois
// choses le rendent tenable : il est mis en cache par le navigateur, il n'est
// demandé QUE si quelqu'un ouvre un mur d'onglerie, et il ne se repaie jamais.
// Un modèle distant, lui, se paie à chaque essai, pour toujours.
//
// ═══ CE QUE ÇA NE FAIT PAS ════════════════════════════════════════════════
//
// LE POUCE EST MIS DE CÔTÉ, DÉLIBÉRÉMENT. Main à plat, paume vers le bas, son
// ongle est vu de biais ou pas vu du tout : le peindre inventerait une surface
// qui n'est pas dans la photo. Quatre ongles justes valent mieux que cinq dont
// un faux.
//
// LE NAIL ART FIN N'EST PAS FAIT. On pose une couleur, avec le relief et le
// reflet de l'ongle. Un motif demanderait de savoir où est le haut de l'ongle
// dans le plan de l'image, ce que ce fichier ne calcule pas.
import type { Gabarit } from "./essai";

/** Ce qu'on pose : la couleur du salon, et la longueur de la pose. */
export type Vernis = {
  /** En hexadécimal, `#RRGGBB`. */
  couleur: string;
  /**
   * LA LONGUEUR DE LA POSE, en fraction de la dernière phalange.
   *
   * Ce n'est pas un réglage technique, c'est CE QUE LE SALON VEND : une pose
   * courte, moyenne ou longue. Elle est donc écrite sur la pièce, pas devinée.
   */
  longueur?: number;
};

export type PoseOngles = {
  image: string;
  ms: number;
  /** Combien d'ongles ont été posés. Zéro veut dire qu'on n'a pas vu de main. */
  ongles: number;
  souci?: string;
};

/** Court, moyen, long — les trois longueurs qu'un salon propose. */
export const LONGUEURS = { courte: 0.95, moyenne: 1.22, longue: 1.55 } as const;

/** Où commence l'ongle sur la dernière phalange. Voir `POURQUOI PAS LE BOUT`. */
const BASE = 0.47;

/**
 * POURQUOI PAS LE BOUT DU DOIGT DE MEDIAPIPE.
 *
 * Le point « bout du doigt » (8, 12, 16, 20) est posé sur la CHAIR, pas au bout
 * de l'ongle — un ongle un peu long le dépasse largement. Mesuré sur photo : la
 * cuticule tombe vers 0,47 de la distance articulation→bout, et une pose moyenne
 * s'arrête vers 1,74. Ces deux nombres sont anatomiques, donc stables d'une main
 * à l'autre, ce qui est exactement ce qu'il faut pour s'en servir.
 */
const DOIGTS: [number, number, number][] = [
  [6, 7, 8],
  [10, 11, 12],
  [14, 15, 16],
  [18, 19, 20],
];

type Detecteur = { detect: (i: HTMLCanvasElement) => { landmarks?: { x: number; y: number }[][] } };
let detecteur: Detecteur | null = null;
let enCours: Promise<Detecteur> | null = null;

/**
 * CHARGER LE MODÈLE, UNE SEULE FOIS PAR SESSION.
 *
 * `enCours` existe pour un cas précis : la cliente tape deux couleurs coup sur
 * coup pendant le téléchargement. Sans lui, on lancerait deux fois dix-neuf
 * mégaoctets.
 */
export async function chargerLaMain(): Promise<Detecteur> {
  if (detecteur) return detecteur;
  if (enCours) return enCours;
  enCours = (async () => {
    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const fichiers = await FilesetResolver.forVisionTasks("/mediapipe");
    const d = await HandLandmarker.createFromOptions(fichiers, {
      baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate: "CPU" },
      runningMode: "IMAGE",
      numHands: 1,
      // LE SEUIL EST BAS EXPRÈS. Une main à plat photographiée de près n'est pas
      // ce sur quoi le modèle a été le plus entraîné ; à 0,5 il refusait des
      // photos parfaitement lisibles.
      minHandDetectionConfidence: 0.2,
      minHandPresenceConfidence: 0.2,
    });
    detecteur = d as unknown as Detecteur;
    enCours = null;
    return detecteur;
  })();
  return enCours;
}

/** Le modèle est-il déjà là ? Sert à savoir s'il faut prévenir de l'attente. */
export function laMainEstPrete(): boolean {
  return detecteur !== null;
}

/** La distance de couleur, insensible à l'ombre. Même métrique que le détourage. */
function ecart(a: number[], b: number[]): number {
  const cl = (a[0] + a[1] + a[2]) / 3;
  const cf = (b[0] + b[1] + b[2]) / 3;
  const k = cl > 6 ? cf / cl : 1;
  const dr = a[0] * k - b[0];
  const dg = a[1] * k - b[1];
  const db = a[2] * k - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db) + Math.abs(cl - cf) * 0.34;
}

/**
 * POSER LE VERNIS SUR LA PHOTO DE LA MAIN.
 */
export async function poserVernis(opts: {
  photo: string;
  vernis: Vernis;
  largeur?: number;
}): Promise<PoseOngles> {
  const t0 = Date.now();
  const modele = await chargerLaMain();

  const img = await new Promise<HTMLImageElement>((ok, non) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => non(new Error("photo illisible"));
    i.src = opts.photo;
  });

  const cible = opts.largeur ?? 900;
  const e = Math.min(1, cible / Math.max(img.width, img.height));
  const L = Math.max(1, Math.round(img.width * e));
  const H = Math.max(1, Math.round(img.height * e));
  const c = document.createElement("canvas");
  c.width = L;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(img, 0, 0, L, H);

  /**
   * ON DÉTECTE SUR UNE COPIE ENTOURÉE D'UNE MARGE, ET C'EST INDISPENSABLE.
   *
   * Mesuré : sur la même photo, sans marge le modèle ne trouve RIEN ; avec un
   * quart de marge il trouve la main en quatre-vingt-dix millisecondes. Une main
   * qui touche les bords du cadre n'est pas reconnue comme une main.
   *
   * C'est aussi ce que le gabarit demande à l'écran — « toute la main dans le
   * cadre » — mais on ne peut pas compter là-dessus : la marge est ajoutée ici,
   * quoi qu'ait fait la cliente.
   */
  const m = Math.round(Math.max(L, H) * 0.25);
  const dc = document.createElement("canvas");
  dc.width = L + 2 * m;
  dc.height = H + 2 * m;
  const dctx = dc.getContext("2d");
  if (!dctx) throw new Error("canvas indisponible");
  dctx.fillStyle = "#7a7a7a";
  dctx.fillRect(0, 0, dc.width, dc.height);
  dctx.drawImage(c, m, m);

  const trouve = modele.detect(dc);
  const brut = trouve.landmarks?.[0];
  if (!brut) {
    return {
      image: c.toDataURL("image/jpeg", 0.92),
      ms: Date.now() - t0,
      ongles: 0,
      souci: "Main non reconnue. Mettez la main entière dans le cadre, à plat.",
    };
  }
  const pts = brut.map((q) => ({ x: q.x * dc.width - m, y: q.y * dc.height - m }));

  const im = ctx.getImageData(0, 0, L, H);
  const px = im.data;
  const dedans = (X: number, Y: number) => X >= 0 && Y >= 0 && X < L && Y < H;
  const lire = (X: number, Y: number) => {
    const i = ((Y | 0) * L + (X | 0)) * 4;
    return [px[i], px[i + 1], px[i + 2]];
  };

  const alpha = new Float32Array(L * H);
  const longueur = opts.vernis.longueur ?? LONGUEURS.moyenne;
  let ongles = 0;

  /**
   * DEUX PASSES, ET LA PREMIÈRE NE SERT QU'À MESURER.
   *
   * L'AURICULAIRE N'ÉTAIT PAS PEINT, et un ongle manquant se voit bien plus
   * qu'un ongle approximatif. Replié ou de biais, sa largeur ne se lisait pas et
   * la garde le rejetait. Or LES DOIGTS D'UNE MÊME MAIN ONT DES PROPORTIONS
   * VOISINES : quand un doigt refuse de se mesurer, la médiane des autres est
   * une bien meilleure réponse que le silence.
   */
  const mesures = new Map<number, { W: number; peau: number[] }>();

  for (const [PIP, DIP, TIP] of DOIGTS) {
    const a = pts[DIP];
    const b = pts[TIP];
    const q = pts[PIP];
    const Ld = Math.hypot(b.x - a.x, b.y - a.y);
    if (Ld < 8) continue;
    const ux = (b.x - a.x) / Ld;
    const uy = (b.y - a.y) / Ld;
    const nx = -uy;
    const ny = ux;
    const en = (t: number, o: number) => ({
      X: a.x + ux * t * Ld + nx * o * Ld,
      Y: a.y + uy * t * Ld + ny * o * Ld,
    });

    // La peau, prise au milieu de la phalange précédente : à cet endroit-là il
    // n'y a que du doigt, quoi que la cliente porte aux ongles.
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let n = 0;
    for (let t = 0.35; t <= 0.65; t += 0.1) {
      for (let o = -0.1; o <= 0.1; o += 0.05) {
        const X = q.x + (a.x - q.x) * t - (a.y - q.y) * o;
        const Y = q.y + (a.y - q.y) * t + (a.x - q.x) * o;
        if (!dedans(X, Y)) continue;
        const v = lire(X, Y);
        sr += v[0];
        sg += v[1];
        sb += v[2];
        n++;
      }
    }
    if (!n) continue;
    const peau = [sr / n, sg / n, sb / n];

    /**
     * LA LARGEUR DU DOIGT, MESURÉE SOUS L'ARTICULATION.
     *
     * C'est la seule mesure qu'on prend dans l'image, et c'est la seule dont on
     * a besoin : sous l'articulation il n'y a QUE de la peau, donc le bord se
     * lit sans ambiguïté — alors qu'au niveau de l'ongle tout est discutable.
     * La médiane sur plusieurs hauteurs plutôt qu'une seule lecture : une bague,
     * un pli, une ombre suffiraient à fausser un unique balayage.
     */
    const larg: number[] = [];
    for (let t = -0.45; t <= -0.05; t += 0.08) {
      for (const s of [1, -1]) {
        let o = 0.04;
        while (o < 0.95) {
          const g = en(t, o * s);
          if (!dedans(g.X, g.Y)) break;
          if (ecart(lire(g.X, g.Y), peau) > 30) break;
          o += 0.03;
        }
        larg.push(o);
      }
    }
    larg.sort((u, v) => u - v);
    mesures.set(DIP, { W: Math.min(0.8, larg[larg.length >> 1]), peau });
  }

  const bonnes = [...mesures.values()].map((v) => v.W).filter((w) => w >= 0.15).sort((a, b) => a - b);
  const secours = bonnes.length ? bonnes[bonnes.length >> 1] * 0.82 : 0;

  for (const [, DIP, TIP] of DOIGTS) {
    const mes = mesures.get(DIP);
    if (!mes) continue;
    const a = pts[DIP];
    const b = pts[TIP];
    const Ld = Math.hypot(b.x - a.x, b.y - a.y);
    if (Ld < 8) continue;
    const ux = (b.x - a.x) / Ld;
    const uy = (b.y - a.y) / Ld;
    const nx = -uy;
    const ny = ux;
    const W = mes.W >= 0.15 ? mes.W : secours;
    if (W < 0.1) continue;

    const T0 = BASE;
    const T1 = BASE + longueur;
    const RW = W * 0.86;
    const bx0 = Math.max(0, Math.min(a.x, b.x) - 2 * Ld) | 0;
    const by0 = Math.max(0, Math.min(a.y, b.y) - 2 * Ld) | 0;
    const bx1 = Math.min(L - 1, Math.max(a.x, b.x) + 2 * Ld) | 0;
    const by1 = Math.min(H - 1, Math.max(a.y, b.y) + 2 * Ld) | 0;
    let touche = 0;
    for (let Y = by0; Y <= by1; Y++) {
      for (let X = bx0; X <= bx1; X++) {
        const dxp = X - a.x;
        const dyp = Y - a.y;
        const t = (dxp * ux + dyp * uy) / Ld;
        const o = (dxp * nx + dyp * ny) / Ld;
        if (t < T0 || t > T1) continue;
        const u = (t - T0) / (T1 - T0);
        // L'amande : large au milieu, arrondie aux deux bouts. L'exposant est ce
        // qui la rend plus « ongle » qu'ellipse — les côtés restent parallèles
        // plus longtemps.
        const demi = RW * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 2.8)));
        const r = Math.abs(o) / Math.max(1e-6, demi);
        if (r > 1) continue;
        const i = Y * L + X;
        alpha[i] = Math.max(alpha[i], r > 0.88 ? (1 - r) / 0.12 : 1);
        touche++;
      }
    }
    if (touche > 0) ongles++;
  }

  if (!ongles) {
    return {
      image: c.toDataURL("image/jpeg", 0.92),
      ms: Date.now() - t0,
      ongles: 0,
      souci: "Les doigts n’ont pas pu être mesurés. Rapprochez-vous, à la lumière du jour.",
    };
  }

  /**
   * ON GARDE LA LUMIÈRE, ON REMPLACE LA COULEUR — ET ON LISSE LA LUMIÈRE.
   *
   * Un aplat opaque donne un autocollant : ce qui fait qu'un vernis se lit comme
   * du vernis, c'est son relief — la courbure de l'ongle et son reflet. On garde
   * donc la luminance du pixel et on n'échange que sa teinte.
   *
   * MAIS LA GARDER TELLE QUELLE GARDE AUSSI L'ANCIEN VERNIS. Mesuré : les
   * paillettes du dessous transparaissaient à travers la nouvelle couleur. Un
   * vernis opaque, dans la vraie vie, COUVRE. On lisse donc la luminance à
   * l'intérieur du masque — ce qui efface le motif d'en dessous et laisse la
   * forme — et on borne son écart, parce que même lissés les points les plus
   * noirs restaient visibles et qu'un vernis n'a pas de trous.
   */
  const V = [
    parseInt(opts.vernis.couleur.slice(1, 3), 16),
    parseInt(opts.vernis.couleur.slice(3, 5), 16),
    parseInt(opts.vernis.couleur.slice(5, 7), 16),
  ];
  let Y = new Float32Array(L * H);
  for (let i = 0; i < L * H; i++) {
    if (alpha[i] > 0) Y[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  }
  for (let passe = 0; passe < 12; passe++) {
    const Y2 = new Float32Array(Y);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < L - 1; x++) {
        const i = y * L + x;
        if (alpha[i] <= 0) continue;
        let s = 0;
        let w = 0;
        // Les voisins HORS du masque sont ignorés, sinon la peau déteint sur le
        // bord de l'ongle et la pose paraît sale.
        for (const v of [i, i - 1, i + 1, i - L, i + L, i - L - 1, i - L + 1, i + L - 1, i + L + 1]) {
          if (alpha[v] > 0) {
            s += Y[v];
            w++;
          }
        }
        Y2[i] = w ? s / w : Y[i];
      }
    }
    Y = Y2;
  }
  let sy = 0;
  let ny = 0;
  for (let i = 0; i < L * H; i++) {
    if (alpha[i] > 0.5) {
      sy += Y[i];
      ny++;
    }
  }
  const moy = ny ? sy / ny : 128;

  for (let i = 0; i < L * H; i++) {
    const A = alpha[i];
    if (A <= 0) continue;
    const j = i * 4;
    const k = Math.max(0.74, Math.min(1.5, Y[i] / Math.max(1, moy)));
    // Le reflet reste un reflet : au-delà du seuil on tire vers le blanc plutôt
    // que vers une version claire de la couleur, sinon la brillance disparaît.
    const spec = Math.max(0, Math.min(1, (k - 1.28) / 0.5));
    for (let ch = 0; ch < 3; ch++) {
      const teint = Math.min(255, V[ch] * k);
      px[j + ch] = px[j + ch] * (1 - A) + (teint * (1 - spec) + 255 * spec) * A;
    }
  }
  ctx.putImageData(im, 0, 0);

  return { image: c.toDataURL("image/jpeg", 0.92), ms: Date.now() - t0, ongles };
}

/** Le gabarit d'une main : il ne porte rien, c'est la forme qui dit tout. */
export type GabaritMain = Extract<Gabarit, { forme: "main" }>;
