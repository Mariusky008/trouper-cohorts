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
   * DE COMBIEN LA POSE DÉPASSE LE BOUT DU DOIGT.
   *
   * Ce n'est pas un réglage technique, c'est CE QUE LE SALON VEND : une pose
   * courte, moyenne ou longue. Voir `LONGUEURS` pour l'échelle, et pourquoi
   * c'est un dépassement et non une position.
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

/**
 * COURT, MOYEN, LONG — ET C'EST UN DÉPASSEMENT, PAS UNE POSITION.
 *
 * 1 veut dire « au ras du doigt » ; 1,4 veut dire « quatre dixièmes d'ongle en
 * plus ». C'est ce qu'une prothésiste vend, et ça reste juste sur n'importe
 * quelle main — contrairement à une position absolue, qui ne valait que pour la
 * main sur laquelle elle avait été calibrée.
 */
export const LONGUEURS = { courte: 1, moyenne: 1.4, longue: 1.9 } as const;

/**
 * CE QUE MEDIAPIPE DONNE, ET CE QU'IL NE FAUT PAS LUI DEMANDER.
 *
 * Il donne l'ARTICULATION et le BOUT de chaque doigt, très fiablement, et la
 * DIRECTION du doigt s'en déduit. C'est tout ce qu'on lui prend.
 *
 * ON NE LUI PREND PAS UNE ÉCHELLE. La distance articulation→bout raccourcit en
 * projection dès que la main bascule — une main à plat vue d'au-dessus l'écrase.
 * S'en servir comme règle a produit, sur un vrai téléphone, des ongles trop
 * petits remontés sur les articulations. L'échelle vient de la LARGEUR du doigt,
 * mesurée dans l'image : voir plus bas.
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
  /**
   * LE MODE REPÈRES — pour que la capture d'écran d'un testeur DISE quelque chose.
   *
   * IL EXISTE PARCE QUE DEUX CORRECTIONS DE SUITE ONT RATÉ. Elles ont raté pour
   * la même raison : je réglais une géométrie sur une photo que je n'avais pas,
   * à partir d'images d'écran où l'on voit le résultat mais aucune des mesures
   * qui l'ont produit. Une capture ne disait donc jamais POURQUOI.
   *
   * Avec ce mode, elle le dit : les points du modèle, l'axe de chaque doigt, le
   * bout mesuré, et le contour calculé de l'ongle. Un aller-retour au lieu de
   * cinq.
   */
  reperes?: boolean;
}): Promise<PoseOngles> {
  const modele = await chargerLaMain();
  /**
   * LE CHRONOMÈTRE PART APRÈS LE MODÈLE, ET PAS AVANT.
   *
   * Il partait avant : l'écran affichait « calculé sur votre téléphone en
   * 5451 ms » alors que cinq secondes sur les cinq et demie étaient le
   * TÉLÉCHARGEMENT du moteur, une fois pour toutes. C'est un mensonge dans
   * l'autre sens — il fait passer pour lent un calcul qui ne l'est pas, et il le
   * fera à chaque fois alors que l'attente, elle, n'arrive qu'une fois.
   */
  const t0 = Date.now();

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
  const traces: { a: {x:number;y:number}; b: {x:number;y:number}; Ld: number; W: number; bout: number; T0: number; T1: number; RW: number; fond: boolean }[] = [];
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
  const mesures = new Map<number, { W: number; peau: number[]; Ld: number }>();

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
    mesures.set(DIP, { W: Math.min(0.8, larg[larg.length >> 1]), peau, Ld });
  }

  /**
   * LES LARGEURS SE COMPARENT EN PIXELS, PAS EN FRACTIONS DE PHALANGE.
   *
   * Elles étaient comparées en fractions — or la phalange n'a pas la même
   * longueur projetée d'un doigt à l'autre, donc deux doigts de la même largeur
   * réelle donnaient deux fractions très différentes. Sur la photo de référence :
   * 0,43 · 0,31 · 0,43 · 0,16 pour une seule main. Aucune main n'a un auriculaire
   * trois fois plus fin que son index.
   *
   * ET LES DOIGTS D'UNE MAIN SE RESSEMBLENT. On ramène donc chaque mesure dans
   * une fourchette autour de la médiane des quatre : assez large pour que
   * l'auriculaire reste plus fin, assez serrée pour qu'une mesure ratée ne
   * produise plus un ongle minuscule.
   */
  const enPx = [...mesures.values()].map((v) => v.W * v.Ld).filter((w) => w > 4).sort((a, b) => a - b);
  const medPx = enPx.length ? enPx[enPx.length >> 1] : 0;
  if (medPx > 0) {
    for (const m of mesures.values()) {
      const px = m.W * m.Ld;
      const borne = Math.max(medPx * 0.74, Math.min(medPx * 1.22, px > 4 ? px : medPx));
      m.W = borne / m.Ld;
    }
  }

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
    const W = mes.W;
    if (!(W > 0.05)) continue;

    /**
     * NI LA LONGUEUR SEULE, NI LA LARGEUR SEULE : LE BOUT DU DOIGT, MESURÉ.
     *
     * DEUX ÉCHECS SUR UN VRAI TÉLÉPHONE, ET ILS SE RÉPONDENT :
     *
     *   1. Tout calé sur la distance articulation→bout. Cette distance RACCOURCIT
     *      EN PROJECTION quand la main est vue d'au-dessus : les ongles devenaient
     *      petits et remontaient sur les articulations.
     *   2. Tout calé sur la largeur du doigt, qui elle ne raccourcit pas. Sur une
     *      main très écrasée, la largeur vaut alors DEUX FOIS la phalange
     *      projetée, et l'ongle partait au-delà du doigt, sur le tapis du bureau.
     *
     * LA LEÇON EST QU'AUCUNE PROPORTION NE SURVIT SEULE À LA PERSPECTIVE. Il faut
     * un point mesuré dans l'image, et il y en a un : LE BOUT DU DOIGT. Droit
     * devant lui il n'y a plus de doigt, donc on peut le trouver — et il ne
     * dépend ni de l'angle de la main, ni de la couleur de l'ongle.
     *
     * L'ONGLE FINIT AU BOUT DU DOIGT et remonte d'une longueur d'ongle. La pose
     * du salon, elle, DÉPASSE — c'est ce qu'elle vend.
     */
    const en2 = (t: number, o: number) => ({
      X: a.x + ux * t * Ld + nx * o * Ld,
      Y: a.y + uy * t * Ld + ny * o * Ld,
    });

    // Le fond : de part et d'autre du doigt, là où il n'y a plus de doigt.
    const ech: number[][] = [];
    for (const o of [-2.1, -1.7, 1.7, 2.1]) {
      for (const t of [0.2, 0.6, 1.0]) {
        const g = en2(t, o * W);
        if (dedans(g.X, g.Y)) ech.push(lire(g.X, g.Y));
      }
    }
    let fond: number[] | null = null;
    if (ech.length >= 6) {
      const med = (k: number) => {
        const v = ech.map((e) => e[k]).sort((x, y) => x - y);
        return v[v.length >> 1];
      };
      const f = [med(0), med(1), med(2)];
      // S'il ressemble à la peau, ce n'est pas le fond : c'est un autre doigt.
      if (ecart(mes.peau, f) > 26) fond = f;
    }

    /**
     * L'ANCRE EST LE BOUT DU DOIGT DE MEDIAPIPE, ET C'EST LUI LE PLUS FIABLE.
     *
     * On a essayé de le mesurer dans l'image, en marchant le long du doigt
     * jusqu'au fond. LE MODE REPÈRES A MONTRÉ QUE ÇA NE TIENT PAS : sur
     * l'auriculaire de la photo de référence, la marche est partie jusqu'à la
     * butée — deux fois la phalange — et dessinait un ongle dans le vide. Un
     * ongle rose clair sur un fond bleu clair ne se distingue pas assez pour
     * qu'on arrête une marche dessus.
     *
     * LE POINT DU MODÈLE, LUI, N'EST JAMAIS ABSURDE. Il est approximatif — posé
     * sur la chair, un ongle long le dépasse — mais il est toujours SUR le
     * doigt, et c'est ce qui compte le plus après deux essais partis ailleurs.
     * Mieux vaut une pose un peu courte qu'une pose sur le tapis du bureau.
     */
    const bout = 1;

    /**
     * LA LONGUEUR DE L'ONGLE, BORNÉE DES DEUX CÔTÉS.
     *
     * Environ une largeur de doigt — c'est le rapport le plus stable — mais
     * JAMAIS plus que la phalange visible. C'est cette borne qui manquait quand
     * les ongles sont partis au-delà des doigts : sur une main très écrasée, la
     * largeur vaut deux fois la phalange projetée, et sans borne l'ongle sortait
     * du doigt.
     */
    const ONGLE = Math.min(1.15 * 2 * W, 0.85);
    const T1 = bout + (longueur - 1) * ONGLE;
    const T0 = T1 - ONGLE;
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
        // ON NE PEINT PAS LE FOND, ET C'EST LA GARDE QUI REND L'ABSURDE
        // IMPOSSIBLE. Trois ovales bruns posés sur un tapis de bureau, c'est ce
        // qu'on a vu quand la géométrie s'est trompée. Au-delà du bout du doigt
        // on accepte — c'est le dépassement de la pose, il est censé être dans
        // le vide — mais en deçà, un pixel qui est du fond n'est pas un ongle.
        if (fond && t < bout && ecart(lire(X, Y), fond) < 26) continue;
        const i = Y * L + X;
        alpha[i] = Math.max(alpha[i], r > 0.88 ? (1 - r) / 0.12 : 1);
        touche++;
      }
    }
    if (touche > 0) ongles++;
    if (opts.reperes) traces.push({ a, b, Ld, W, bout, T0, T1, RW, fond: !!fond });
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

  if (opts.reperes) {
    const e2 = Math.max(1, L / 380);
    ctx.lineWidth = 2 * e2;
    ctx.font = `bold ${11 * e2}px system-ui, sans-serif`;
    for (const t of traces) {
      const ux = (t.b.x - t.a.x) / t.Ld;
      const uy = (t.b.y - t.a.y) / t.Ld;
      const nx = -uy;
      const ny = ux;
      const pt = (u: number, o: number) => [
        t.a.x + ux * u * t.Ld + nx * o * t.Ld,
        t.a.y + uy * u * t.Ld + ny * o * t.Ld,
      ];
      // le contour calcule de l'ongle
      ctx.strokeStyle = "#00E5FF";
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const u = t.T0 + ((t.T1 - t.T0) * k) / 60;
        const v = (u - t.T0) / (t.T1 - t.T0);
        const demi = t.RW * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(2 * v - 1), 2.8)));
        const [x1, y1] = pt(u, demi);
        if (k === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
      }
      for (let k = 60; k >= 0; k--) {
        const u = t.T0 + ((t.T1 - t.T0) * k) / 60;
        const v = (u - t.T0) / (t.T1 - t.T0);
        const demi = t.RW * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(2 * v - 1), 2.8)));
        const [x1, y1] = pt(u, -demi);
        ctx.lineTo(x1, y1);
      }
      ctx.closePath();
      ctx.stroke();
      // l'axe, l'articulation, le bout du modele, le bout mesure
      ctx.strokeStyle = "#FF2D9B";
      ctx.beginPath();
      ctx.moveTo(t.a.x, t.a.y);
      ctx.lineTo(t.b.x, t.b.y);
      ctx.stroke();
      const rond = (x: number, y: number, col: string) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(x, y, 4 * e2, 0, 7);
        ctx.fill();
      };
      rond(t.a.x, t.a.y, "#FF2D9B");
      rond(t.b.x, t.b.y, "#FFD400");
      const [bx, by] = pt(t.bout, 0);
      rond(bx, by, t.fond ? "#00FF88" : "#FF5A3C");  // vert : le fond a ete lu, donc le decoupage protege
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`W${t.W.toFixed(2)} b${t.bout.toFixed(2)}`, t.a.x + 6 * e2, t.a.y - 6 * e2);
    }
    ctx.fillStyle = "rgba(0,0,0,.6)";
    ctx.fillRect(0, 0, L, 22 * e2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(
      `${L}x${H} · ${ongles} ongles · rose=articulation jaune=bout-modele vert=bout-mesure`,
      6 * e2,
      15 * e2,
    );
  }

  return { image: c.toDataURL("image/jpeg", 0.92), ms: Date.now() - t0, ongles };
}

/** Le gabarit d'une main : il ne porte rien, c'est la forme qui dit tout. */
export type GabaritMain = Extract<Gabarit, { forme: "main" }>;
