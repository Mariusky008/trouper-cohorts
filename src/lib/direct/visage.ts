// 🔒 LE VISAGE EST UNE ZONE PROTÉGÉE — on ne le régénère pas, on le repose.
//
// ═══ LE DÉFAUT, ET IL EST DE FOND ══════════════════════════════════════════
//
// « Ça déforme ma tête au lieu de garder l'original comme base entièrement.
// Ma tête doit rester entièrement la même. »
//
// ENTRE L'AVANT ET L'APRÈS, LE MODÈLE NE CHANGE PAS QUE LES CHEVEUX : le nez
// s'élargit, les lèvres et l'expression changent, les yeux sont différents, la
// mâchoire et les joues sont remodelées, la texture de peau est recréée. C'est
// visible à l'œil nu sur ses deux captures, et ce n'est pas une question de
// réglage : un générateur d'images RECALCULE TOUS LES PIXELS. Il n'édite pas
// une photo, il en fabrique une nouvelle qui ressemble à la photo.
//
// ═══ POURQUOI LA CONSIGNE NE SUFFIRA JAMAIS ════════════════════════════════
//
// `lib/direct/consigne-essai.ts` dit déjà, en toutes lettres et pour chaque
// métier, ce qu'il ne faut pas toucher — le visage trait pour trait, la forme
// du crâne, la peau, la pose. `input_fidelity: high` est posé. Et le visage
// bouge quand même.
//
// UNE CONSIGNE EST UNE PRÉFÉRENCE, PAS UNE CONTRAINTE. Elle pèse sur la
// génération, elle ne la borne pas. Renforcer le texte donnera parfois un bon
// résultat, jamais une identité garantie à chaque essai — et « parfois » est
// exactement ce qu'on ne peut pas vendre à quelqu'un qui se regarde.
//
// ═══ CE QUE FAIT CE FICHIER, EN DEUX VERROUS ═══════════════════════════════
//
// VERROU 1 — LE MASQUE. On envoie au modèle une image de masque qui déclare la
// zone modifiable : les cheveux, plus une marge autour du crâne pour qu'une
// coupe plus longue ait de la place. Tout le reste est opaque, donc interdit.
//
// VERROU 2 — LA RECOMPOSITION, ET C'EST LUI QUI DÉCIDE. Après la génération, on
// REPOSE LES PIXELS DU VISAGE ORIGINAL par-dessus le résultat, avec un fondu de
// quelques points autour de la ligne capillaire. Le visage final vient donc de
// la photographie, pas de l'image générée — même si le modèle a ignoré le
// masque, même s'il a déformé le nez, ces pixels-là sont écrasés.
//
// L'ORDRE D'IMPORTANCE EST L'INVERSE DE L'ORDRE D'EXÉCUTION. Le masque est une
// aide : il peut échouer (pas de visage trouvé, modèle qui n'en tient pas
// compte). La recomposition, elle, est arithmétique — elle marche ou le fichier
// est cassé, il n'y a pas d'entre-deux. C'est pour ça qu'elle ne dépend PAS du
// masque : si la détection échoue, on n'envoie pas de masque ET on ne recompose
// pas, mais si elle réussit, les deux verrous tombent ensemble.
//
// ═══ POURQUOI DANS LE NAVIGATEUR ═══════════════════════════════════════════
//
// MediaPipe est déjà servi depuis `/mediapipe` pour la pose d'ongles, et le
// navigateur sait découper des images sans qu'on lui installe quoi que ce soit.
// Surtout : LA PHOTO N'A PAS BESOIN DE PARTIR POUR QU'ON CALCULE LE MASQUE, et
// la recomposition a besoin de l'ORIGINAL, qui est déjà là. Le faire au serveur
// obligerait à renvoyer la photo une seconde fois pour la recoller à elle-même.

/** Ce qu'une détection rend : de quoi masquer, de quoi aligner, de quoi recomposer. */
export type Visage = {
  /** Le contour du visage à protéger, en coordonnées d'image (pixels). */
  contour: { x: number; y: number }[];
  /**
   * LE CONTOUR INTÉRIEUR — celui qu'on recolle, et il n'est PAS le même.
   *
   * « La coupe est mal ajustée à son crâne, et ce n'est pas tout à fait la même
   * coupe. Ça rend terriblement mal. »
   *
   * L'OVALE DE MEDIAPIPE PASSE À LA RACINE DES CHEVEUX ET SUR LES TEMPES. Le
   * recoller tel quel repose la LIGNE CAPILLAIRE D'ORIGINE par-dessus la coupe
   * qu'on vient de générer : la nouvelle coiffure se retrouve découpée au ciseau
   * par l'ancienne, et elle ne colle plus au crâne. C'est exactement ce qu'il
   * décrit, et c'était notre faute, pas celle du modèle.
   *
   * CELUI-CI S'ARRÊTE JUSTE AU-DESSUS DES SOURCILS et rentre de dix pour cent
   * vers le centre. Ce qui fait l'identité d'un visage — les yeux, le nez, la
   * bouche, la mâchoire — vient de la photographie ; le front, les tempes et la
   * ligne des cheveux viennent du rendu, donc une frange est possible.
   */
  interieur: { x: number; y: number }[];
  /**
   * LES REPÈRES QUI NE BOUGENT PAS SOUS UNE COUPE DE CHEVEUX.
   *
   * Coins des yeux, arête du nez, coins de la bouche, menton. On s'en sert pour
   * ALIGNER la photo sur le rendu — voir `alignementSurLeRendu`. Un point pris
   * sur l'ovale servirait mal : il est posé sur la chevelure, qui est justement
   * ce que le modèle vient de changer.
   */
  reperes: { x: number; y: number }[];
  /** La boîte du visage, pour dimensionner la marge autour du crâne. */
  boite: { x: number; y: number; l: number; h: number };
  /** Les dimensions de l'image sur laquelle tout ceci a été mesuré. */
  taille: { l: number; h: number };
};

type Detecteur = {
  detect: (img: HTMLImageElement | HTMLCanvasElement) => {
    faceLandmarks?: { x: number; y: number }[][];
  };
};

let detecteur: Detecteur | null = null;
let enCours: Promise<Detecteur> | null = null;

/**
 * LES POINTS DU CONTOUR DU VISAGE, DANS LE MAILLAGE DE MEDIAPIPE.
 *
 * Le maillage rend 478 points ; celui-ci est l'ovale du visage, dans l'ordre du
 * tracé. C'est la liste publiée par MediaPipe sous le nom `FACE_OVAL`, aplatie :
 * on n'a pas besoin des paires d'arêtes, seulement des sommets dans l'ordre.
 *
 * ON NE PREND PAS L'ENVELOPPE CONVEXE DE TOUS LES POINTS. Elle inclurait le
 * front jusqu'à la racine des cheveux — c'est-à-dire précisément la bande qu'on
 * veut laisser modifiable pour qu'une frange soit possible.
 */
const OVALE = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

/**
 * LES POINTS QU'UNE COUPE DE CHEVEUX NE DÉPLACE PAS.
 *
 * Coins internes et externes des deux yeux, arête et base du nez, coins de la
 * bouche, menton, sous-menton. Dix points bien répartis sur le visage et aucun
 * sur la chevelure : c'est la condition pour qu'ils décrivent la même chose sur
 * la photo et sur le rendu.
 */
const REPERES = [33, 133, 362, 263, 168, 1, 2, 61, 291, 152, 199];

/**
 * LES SOURCILS — la limite haute de ce qu'on recolle.
 *
 * Au-dessus commence le front, et au-dessus du front la ligne des cheveux. Une
 * frange, un dégradé, une raie déplacée : tout cela se joue là, et tout cela
 * doit venir du rendu.
 */
const SOURCILS = [105, 66, 107, 334, 296, 336, 65, 295, 70, 300];

/**
 * CHARGER LE MODÈLE DE VISAGE, UNE SEULE FOIS PAR SESSION.
 *
 * Même forme que `chargerLaMain` dans `ongles.ts`, et pour la même raison :
 * `enCours` empêche deux téléchargements si l'on tape deux styles coup sur
 * coup pendant que le modèle arrive.
 */
export async function chargerLeVisage(): Promise<Detecteur> {
  if (detecteur) return detecteur;
  if (enCours) return enCours;
  enCours = (async () => {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const fichiers = await FilesetResolver.forVisionTasks("/mediapipe");
    const d = await FaceLandmarker.createFromOptions(fichiers, {
      baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task", delegate: "CPU" },
      runningMode: "IMAGE",
      numFaces: 1,
    });
    detecteur = d as unknown as Detecteur;
    enCours = null;
    return detecteur;
  })();
  return enCours;
}

/** Le modèle est-il déjà là ? Sert à savoir s'il faut prévenir de l'attente. */
export function leVisageEstPret(): boolean {
  return detecteur !== null;
}

/** Charger une image depuis une source `data:` ou une URL. */
function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, non) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => non(new Error("image illisible"));
    i.src = src;
  });
}

/**
 * OÙ EST LE VISAGE SUR CETTE PHOTO ?
 *
 * REND `null` PLUTÔT QUE DE DEVINER. Pas de visage trouvé — une main, une table,
 * un poignet, une photo floue — et les deux verrous se taisent : on essaie comme
 * avant. Un masque posé au jugé sur une image où l'on n'a rien reconnu
 * interdirait au modèle de travailler là où il devait, ce qui est pire que de
 * ne rien interdire.
 */
export async function trouverLeVisage(src: string): Promise<Visage | null> {
  try {
    const d = await chargerLeVisage();
    const img = await charger(src);
    const r = d.detect(img);
    const pts = r.faceLandmarks?.[0];
    if (!pts || pts.length < 400) return null;
    const l = img.naturalWidth;
    const h = img.naturalHeight;
    // MEDIAPIPE REND DES COORDONNÉES NORMALISÉES. On les ramène en pixels une
    // fois pour toutes : tout le reste de ce fichier travaille en pixels, et
    // mélanger les deux repères est la faute qu'on ne voit qu'au résultat.
    const contour = OVALE.map((i) => ({ x: pts[i].x * l, y: pts[i].y * h }));
    const xs = contour.map((p) => p.x);
    const ys = contour.map((p) => p.y);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const boite = { x: x0, y: y0, l: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };

    /**
     * LE CONTOUR INTÉRIEUR — voir le type.
     *
     * DEUX OPÉRATIONS, ET CHACUNE RÉPOND À UN DÉFAUT QU'IL A VU. On RENTRE de
     * dix pour cent vers le centre, ce qui décolle les tempes de la chevelure ;
     * et on ABAISSE le haut jusqu'à ras des sourcils, ce qui rend le front, la
     * raie et la frange au rendu.
     */
    const cx = x0 + boite.l / 2;
    const cy = y0 + boite.h / 2;
    const sourcils = SOURCILS.map((i) => pts[i].y * h);
    // CINQ POUR CENT AU-DESSUS DES SOURCILS, ET PAS PLUS. Plus haut, on
    // reprendrait le front — donc on couperait une frange en deux. Plus bas, on
    // laisserait le modèle refaire les sourcils, qui font l'expression.
    const plafond = Math.min(...sourcils) - boite.h * 0.05;
    const interieur = contour.map((p) => {
      const q = { x: cx + (p.x - cx) * 0.9, y: cy + (p.y - cy) * 0.9 };
      return { x: q.x, y: Math.max(q.y, plafond) };
    });

    return {
      contour,
      interieur,
      reperes: REPERES.map((i) => ({ x: pts[i].x * l, y: pts[i].y * h })),
      boite,
      taille: { l, h },
    };
  } catch {
    return null;
  }
}

/**
 * ═══ VERROU 1 · LE MASQUE ENVOYÉ AU MODÈLE ════════════════════════════════
 *
 * L'API d'édition d'OpenAI lit le CANAL ALPHA du masque : transparent = « tu
 * peux réécrire ici », opaque = « n'y touche pas ». Le masque doit avoir
 * exactement les dimensions de l'image éditée.
 *
 * CE QU'ON OUVRE, ET POURQUOI ON OUVRE SI LARGE :
 *
 *   · TOUT LE HAUT DE L'IMAGE au-dessus du front, et une marge de chaque côté
 *     du crâne. Une coupe plus longue ou plus volumineuse a besoin de PLACE :
 *     en n'ouvrant que les cheveux existants, on demande au modèle de faire un
 *     carré long dans le volume d'un carré court, et il le fait — en écrasant
 *     la tête.
 *   · LA LIGNE CAPILLAIRE, en fondu. C'est la seule frontière qui doit être
 *     floue : nette, on verrait la découpe.
 *
 * CE QU'ON FERME : l'ovale du visage, et tout ce qui est en dessous — cou,
 * épaules, vêtements. L'arrière-plan reste fermé aussi, alors qu'il n'est pas
 * le sujet : un modèle à qui on ouvre le fond s'en sert pour « améliorer » la
 * photo, et la cliente retrouve son salon repeint.
 */
export function masqueDEssai(v: Visage, zone: ZoneVisage): string {
  const { l, h } = v.taille;
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) return "";

  // 1 · TOUT EST OPAQUE, DONC INTERDIT, PAR DÉFAUT. On ouvre ensuite ce qu'on
  //     autorise : l'inverse — tout ouvert puis on ferme — laisse passer ce
  //     qu'on a oublié de fermer, et ce qu'on oublie est toujours le visage.
  g.fillStyle = "#000";
  g.fillRect(0, 0, l, h);

  /**
   * 2 · ON OUVRE CE QUE LE MÉTIER DEMANDE.
   *
   *     LES PROPORTIONS VIENNENT DE LA BOÎTE DU VISAGE, PAS DE L'IMAGE. Une
   *     photo de près et une photo en pied n'ont pas la même échelle ; s'y
   *     fier donnerait un masque juste sur l'une et absurde sur l'autre.
   */
  const cx = v.boite.x + v.boite.l / 2;
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  if (zone === "buste") {
    /**
     * LE BUSTE : ON OUVRE TOUT CE QUI EST SOUS LE MENTON.
     *
     * Le vêtement est sur le torse ; la tête entière — cheveux compris — n'a
     * aucune raison de bouger. C'est le régime le plus strict des trois, et
     * c'est aussi le seul où l'on peut se permettre de tout fermer en haut :
     * un essayage de robe qui recoifferait au passage serait un défaut, pas
     * un bonus.
     */
    const menton = v.boite.y + v.boite.h;
    g.rect(0, menton, l, h - menton);
  } else if (zone === "lunettes") {
    /**
     * LES LUNETTES : UNE BANDE SUR LES YEUX ET LE NEZ.
     *
     * La monture doit pouvoir se poser — elle occupe précisément la zone qu'on
     * protège chez le coiffeur. On ouvre donc du haut du front au bas du nez,
     * en débordant sur les tempes pour les branches.
     *
     * ET LE RESTE DU VISAGE RESTE FERMÉ : bouche, menton, mâchoire, joues
     * basses. C'est là que le modèle se permettait d'élargir le nez et de
     * changer l'expression, et ça n'a rien à voir avec une paire de lunettes.
     */
    g.ellipse(cx, v.boite.y + v.boite.h * 0.42, v.boite.l * 0.72, v.boite.h * 0.24, 0, 0, Math.PI * 2);
  } else {
    /**
     * ═══ LA COIFFURE : ON OUVRE TOUT LE HAUT, ET C'EST UNE CORRECTION ══════
     *
     * « Ce n'est pas tout à fait la même coupe. J'ai demandé à ChatGPT de me
     * faire la même chose et le résultat est parfait — vu qu'on prend l'API
     * d'OpenAI on devrait avoir le même résultat, alors pourquoi ça marche si
     * mal ? »
     *
     * PARCE QU'ON NE LUI DEMANDAIT PAS LA MÊME CHOSE. ChatGPT envoie l'image
     * SANS MASQUE : le modèle dessine où il veut. Nous lui ouvrions une ellipse
     * d'un rayon d'une fois et quart la largeur du visage — une couronne qui
     * s'arrête au niveau des oreilles. On lui demandait donc « fais des boucles
     * longues » et on lui interdisait la surface où ces boucles tombent : les
     * épaules, la poitrine, les côtés. Il faisait ce qu'il pouvait DANS la
     * couronne, c'est-à-dire une autre coupe.
     *
     * ON OUVRE MAINTENANT TOUT CE QUI EST AU-DESSUS ET AUTOUR : la largeur
     * entière de l'image, du haut jusqu'en bas du buste. Une chevelure longue a
     * la place d'exister.
     *
     * ET CE N'EST PLUS RISQUÉ, PARCE QUE LE SECOND VERROU A CHANGÉ. Le masque
     * était notre seule protection du visage, donc il devait être avare ;
     * depuis que la recomposition est ALIGNÉE sur le rendu, c'est elle qui
     * garantit les traits, et le masque peut redevenir ce qu'il aurait toujours
     * dû être : de la place pour travailler. L'ovale du visage est refermé
     * juste après — étape 3.
     */
    const bas = Math.min(h, v.boite.y + v.boite.h * 2.6);
    g.rect(0, 0, l, bas);
  }
  g.fill();
  g.restore();

  /**
   * 3 · ON REFERME LE VISAGE, ET C'EST LA DERNIÈRE OPÉRATION.
   *
   *     L'ellipse de l'étape 2 a ouvert le haut du visage avec le crâne — front,
   *     sourcils, parfois les yeux. On repose donc l'ovale du visage par-dessus,
   *     en dessinant du noir opaque.
   *
   *     IL EST LÉGÈREMENT RÉTRÉCI VERS LE HAUT. Le contour de MediaPipe passe à
   *     la racine des cheveux ; le protéger tel quel interdirait toute frange et
   *     toute ligne capillaire différente. On le remonte donc de quelques points
   *     — c'est la bande « modifiable avec fondu » de son tableau.
   */
  // SUR LE BUSTE ET LES LUNETTES, L'ÉTAPE 2 N'A RIEN OUVERT DU VISAGE : il n'y
  // a donc rien à refermer, et repasser l'ovale par-dessus ne coûterait qu'un
  // tracé inutile. Chez le coiffeur, elle a ouvert toute la moitié haute.
  if (zone !== "coiffure") return c.toDataURL("image/png");
  g.save();
  g.fillStyle = "#000";
  g.beginPath();
  /**
   * ON REFERME LE VISAGE — ET C'EST LE CONTOUR INTÉRIEUR, PAS L'OVALE.
   *
   * L'ovale de MediaPipe passe à la racine des cheveux : le refermer
   * interdirait au modèle de déplacer la ligne capillaire, donc de faire une
   * frange, un dégradé ou une raie ailleurs. Le contour intérieur s'arrête à
   * ras des sourcils — voir `Visage.interieur` — et c'est exactement la même
   * surface que la recomposition rendra ensuite. Les deux verrous protègent
   * ainsi la MÊME chose, ce qui est la seule manière qu'ils ne se contredisent
   * pas.
   */
  v.interieur.forEach((p, i) => {
    if (i === 0) g.moveTo(p.x, p.y);
    else g.lineTo(p.x, p.y);
  });
  g.closePath();
  g.fill();
  g.restore();

  return c.toDataURL("image/png");
}

/**
 * ═══ L'ALIGNEMENT — ce qui manquait, et qui dédoublait le visage ═══════════
 *
 * « On a encore des problèmes dans la génération des images : la femme a un
 * visage qui se double un peu sur sa droite. »
 *
 * CE N'ÉTAIT PAS LA GÉNÉRATION, C'ÉTAIT LE RECOLLAGE. La recomposition posait
 * le visage d'origine à sa place SUPPOSÉE : on remettait la photo à l'échelle du
 * cadre du rendu, centrée, et on espérait que le modèle avait laissé la tête
 * exactement où elle était. Il ne le fait pas — il recadre, il décale de
 * quelques points, il agrandit un peu. Quelques points suffisent : on voit alors
 * DEUX bords de visage, le vrai et le recollé, et l'œil ne voit plus que ça.
 *
 * ON NE SUPPOSE DONC PLUS, ON MESURE. On cherche le visage SUR LE RENDU aussi,
 * et on calcule la similitude — rotation, échelle, translation — qui amène les
 * repères de la photo sur ceux du rendu. C'est un ajustement aux moindres
 * carrés sur onze points, et il se résout en quatre lignes.
 *
 * ON REFUSE UNE TRANSFORMATION ABERRANTE plutôt que de l'appliquer. Si le modèle
 * a rendu un autre cadrage, une autre pose ou une autre personne, l'échelle ou
 * l'angle sortent de la fourchette du raisonnable — et recoller de travers est
 * pire que ne pas recoller du tout.
 */
export type Alignement = { a: number; b: number; e: number; f: number };

export function alignementSurLeRendu(photo: Visage, rendu: Visage): Alignement | null {
  const A = photo.reperes;
  const B = rendu.reperes;
  if (!A?.length || A.length !== B?.length) return null;
  const n = A.length;
  const moy = (l: { x: number; y: number }[]) => ({
    x: l.reduce((s2, p) => s2 + p.x, 0) / n,
    y: l.reduce((s2, p) => s2 + p.y, 0) / n,
  });
  const ma = moy(A);
  const mb = moy(B);
  let num1 = 0;
  let num2 = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const ax = A[i].x - ma.x;
    const ay = A[i].y - ma.y;
    const bx = B[i].x - mb.x;
    const by = B[i].y - mb.y;
    num1 += ax * bx + ay * by;
    num2 += ax * by - ay * bx;
    den += ax * ax + ay * ay;
  }
  if (den < 1) return null;
  // c ET s SONT L'ÉCHELLE FOIS LE COSINUS ET LE SINUS. On ne les sépare que pour
  // les juger : la matrice, elle, les porte tels quels.
  const c = num1 / den;
  const sn = num2 / den;
  const echelle = Math.hypot(c, sn);
  const angle = Math.abs((Math.atan2(sn, c) * 180) / Math.PI);
  // LA FOURCHETTE EST LARGE, PARCE QU'UN RECADRAGE EST NORMAL. Au-delà, ce n'est
  // plus un recadrage : c'est un autre visage, ou une autre pose.
  if (!Number.isFinite(echelle) || echelle < 0.5 || echelle > 2.2 || angle > 18) return null;
  return {
    a: c,
    b: sn,
    e: mb.x - (c * ma.x - sn * ma.y),
    f: mb.y - (sn * ma.x + c * ma.y),
  };
}

/**
 * ═══ VERROU 2 · LE VISAGE ORIGINAL REVIENT PAR-DESSUS ═════════════════════
 *
 * « La partie décisive est l'étape 5 : on remet le vrai visage après le passage
 * de l'IA. Ainsi, même si OpenAI déforme légèrement le nez ou la bouche, ces
 * pixels sont écrasés par ceux de la photo originale. »
 *
 * C'EST EXACT, ET C'EST LA SEULE GARANTIE DU FICHIER. Tout le reste est une
 * préférence adressée à un modèle ; ceci est une opération sur des pixels.
 *
 * ═══ LES DEUX PIÈGES DE CETTE ÉTAPE ═══════════════════════════════════════
 *
 * LE PREMIER EST L'ÉCHELLE. Le rendu ne fait pas la taille de la photo : OpenAI
 * rend du 1024×1024, du 1024×1536 ou du 1536×1024, et la photo du client fait ce
 * qu'elle fait. Recoller le visage à ses coordonnées d'origine sur une image
 * d'une autre taille le poserait à côté de la tête. On travaille donc dans le
 * repère du RENDU, en remettant la photo à son échelle.
 *
 * LE SECOND EST LA DÉCOUPE VISIBLE. Un collage net dessine un ovale de peau sur
 * une chevelure : on voit le contour, et l'œil ne voit plus que ça. D'où le
 * fondu de huit à quinze points autour de la ligne des cheveux et des tempes.
 */
export async function reposerLeVisage(
  photo: string,
  rendu: string,
  v: Visage,
  zone: ZoneVisage,
  /**
   * LE VISAGE TROUVÉ SUR LE RENDU, quand on a su le trouver.
   *
   * Il sert à deux choses, et les deux règlent un défaut qu'il a vu : il donne
   * l'ALIGNEMENT — voir `alignementSurLeRendu` — et il donne le contour à
   * découper, mesuré là où le visage est VRAIMENT sur l'image finale.
   */
  vRendu?: Visage | null,
): Promise<string> {
  const [a, b] = await Promise.all([charger(photo), charger(rendu)]);
  const L = b.naturalWidth;
  const H = b.naturalHeight;

  /**
   * LA PHOTO REMISE À L'ÉCHELLE DU RENDU, EN GARDANT SES PROPORTIONS.
   *
   * C'est ce que le modèle a fait de son côté quand il a recadré, et il faut
   * faire le même geste : couvrir le cadre, centré. Étirer la photo aux
   * dimensions du rendu déformerait le visage qu'on est en train de sauver —
   * la faute serait alors la nôtre.
   */
  const k = Math.max(L / a.naturalWidth, H / a.naturalHeight);
  const pl = a.naturalWidth * k;
  const ph = a.naturalHeight * k;
  const px = (L - pl) / 2;
  const py = (H - ph) / 2;

  /**
   * ═══ ON ALIGNE SI ON PEUT, ON COUVRE SI ON NE PEUT PAS ═══════════════════
   *
   * L'ALIGNEMENT MESURÉ EST LE BON CHEMIN — voir `alignementSurLeRendu`, et le
   * visage dédoublé qu'il a photographié. Le simple « couvrir le cadre » est le
   * repli : il suppose que le modèle n'a pas bougé la tête, ce qui est vrai
   * assez souvent pour valoir mieux que rien, et faux assez souvent pour avoir
   * fabriqué le défaut.
   */
  const ali = vRendu ? alignementSurLeRendu(v, vRendu) : null;
  /** Un point de la photo, dans le repère du rendu. */
  const versRendu = (p: { x: number; y: number }) =>
    ali
      ? { x: ali.a * p.x - ali.b * p.y + ali.e, y: ali.b * p.x + ali.a * p.y + ali.f }
      : { x: px + (p.x / a.naturalWidth) * pl, y: py + (p.y / a.naturalHeight) * ph };

  // 1 · LA PHOTO D'ORIGINE, POSÉE SUR LE VISAGE DU RENDU.
  const source = document.createElement("canvas");
  source.width = L;
  source.height = H;
  const gs = source.getContext("2d");
  if (!gs) return rendu;
  if (ali) {
    gs.save();
    gs.setTransform(ali.a, ali.b, -ali.b, ali.a, ali.e, ali.f);
    gs.drawImage(a, 0, 0);
    gs.restore();
  } else {
    gs.drawImage(a, px, py, pl, ph);
  }

  /**
   * 2 · LE POCHOIR DU VISAGE, AVEC SON FONDU.
   *
   * On dessine l'ovale du visage en blanc sur un calque vide, puis on le FLOUTE.
   * Le flou EST le fondu : au centre l'alpha vaut 1 — le visage d'origine gagne
   * entièrement — et il retombe à 0 sur une douzaine de points autour du
   * contour, ce qui fait la transition vers la chevelure générée.
   *
   * LE RAYON SUIT LA TAILLE DU VISAGE. Douze points fixes sont un fondu correct
   * sur un portrait serré et une bavure sur une photo en pied.
   */
  const pochoir = document.createElement("canvas");
  pochoir.width = L;
  pochoir.height = H;
  const gp = pochoir.getContext("2d");
  if (!gp) return rendu;
  const boite = {
    a: versRendu({ x: v.boite.x, y: v.boite.y }),
    b: versRendu({ x: v.boite.x + v.boite.l, y: v.boite.y + v.boite.h }),
  };
  const flou = Math.max(8, Math.min(18, (boite.b.x - boite.a.x) * 0.05));
  gp.filter = `blur(${flou}px)`;
  gp.fillStyle = "#fff";
  gp.beginPath();
  if (zone === "buste") {
    /**
     * ON REPOSE LA TÊTE ENTIÈRE, CHEVEUX COMPRIS.
     *
     * L'ovale du visage seul laisserait la chevelure générée autour d'un visage
     * d'origine : sur un essayage de vêtement, le modèle n'avait aucune raison
     * d'y toucher, et s'il l'a fait c'est une erreur qu'on écrase. L'ellipse
     * déborde donc largement au-dessus du front.
     */
    const cx2 = (boite.a.x + boite.b.x) / 2;
    const bl = boite.b.x - boite.a.x;
    const bh = boite.b.y - boite.a.y;
    gp.ellipse(cx2, boite.a.y + bh * 0.42, bl * 0.95, bh * 0.92, 0, 0, Math.PI * 2);
  } else {
    /**
     * ═══ CHEZ LE COIFFEUR, ON NE RECOLLE QUE L'INTÉRIEUR DU VISAGE ══════════
     *
     * « La coupe est mal ajustée à son crâne. »
     *
     * L'OVALE DE MEDIAPIPE PASSE À LA RACINE DES CHEVEUX ET SUR LES TEMPES : le
     * recoller reposait l'ANCIENNE ligne capillaire par-dessus la nouvelle
     * coupe, qui se retrouvait découpée par un contour qui n'était plus le sien.
     * Le contour intérieur s'arrête à ras des sourcils et rentre de dix pour
     * cent — voir `Visage.interieur`.
     *
     * ET ON LE PREND SUR LE RENDU QUAND ON L'A. Mesuré là où le visage est
     * vraiment sur l'image finale, il n'a plus besoin d'être transporté : c'est
     * un calcul de moins, donc une erreur de moins.
     */
    const trace =
      zone === "coiffure"
        ? (vRendu?.interieur ?? v.interieur).map((p) => (vRendu ? p : versRendu(p)))
        : v.contour.map(versRendu);
    trace.forEach((q, i) => {
      if (i === 0) gp.moveTo(q.x, q.y);
      else gp.lineTo(q.x, q.y);
    });
    gp.closePath();
  }
  gp.fill();
  gp.filter = "none";

  /**
   * ET CHEZ LE LUNETIER, ON REDÉCOUPE LA BANDE DES YEUX.
   *
   * Reposer l'ovale entier effacerait la monture qu'on vient de poser — on
   * rendrait au client sa photo, exactement. On retire donc du pochoir la même
   * bande que le masque avait ouverte : le nez, la bouche, le menton et la
   * mâchoire reviennent de la photographie, les lunettes restent du rendu.
   */
  if (zone === "lunettes") {
    const cx2 = (boite.a.x + boite.b.x) / 2;
    const bl = boite.b.x - boite.a.x;
    const bh = boite.b.y - boite.a.y;
    gp.save();
    gp.globalCompositeOperation = "destination-out";
    gp.filter = `blur(${flou}px)`;
    gp.beginPath();
    gp.ellipse(cx2, boite.a.y + bh * 0.42, bl * 0.78, bh * 0.28, 0, 0, Math.PI * 2);
    gp.fill();
    gp.restore();
    gp.filter = "none";
  }

  /**
   * 3 · ON DÉCOUPE LA PHOTO AVEC CE POCHOIR.
   *
   * `destination-in` garde de la photo ce que le pochoir couvre, avec SON alpha :
   * c'est ce qui transporte le fondu depuis le pochoir jusqu'au visage découpé.
   */
  gs.globalCompositeOperation = "destination-in";
  gs.drawImage(pochoir, 0, 0);
  gs.globalCompositeOperation = "source-over";

  // 4 · LE RENDU, PUIS LE VISAGE D'ORIGINE PAR-DESSUS. Dans cet ordre : c'est
  //     la photographie qui a le dernier mot, et c'est tout le propos.
  const fin = document.createElement("canvas");
  fin.width = L;
  fin.height = H;
  const gf = fin.getContext("2d");
  if (!gf) return rendu;
  gf.drawImage(b, 0, 0);
  gf.drawImage(source, 0, 0);

  // JPEG ET NON PNG : le rendu part dans le salon, dans un partage, et parfois
  // dans la mémoire du téléphone. Un PNG de 1536 points pèse quatre fois plus
  // pour une photographie, où il n'apporte rien.
  return fin.toDataURL("image/jpeg", 0.92);
}

/**
 * ═══ TROIS MÉTIERS PHOTOGRAPHIENT UN VISAGE, ET ILS NE PROTÈGENT PAS LA MÊME
 *     CHOSE ════════════════════════════════════════════════════════════════
 *
 * C'EST LE PIÈGE DE TOUT CE FICHIER, et il se referme silencieusement : écrire
 * « protège le visage » partout où il y a un visage CASSE LE LUNETIER. Ses
 * montures se posent sur les yeux et le nez — c'est-à-dire au milieu de la zone
 * qu'on vient d'interdire. Le masque empêcherait de les poser, et la
 * recomposition les effacerait en reposant la peau d'origine par-dessus.
 *
 * TROIS RÉGIMES, ET ILS SE DÉDUISENT DE CE QU'ON PHOTOGRAPHIE :
 *
 *   · `coiffure` — « votre tête ». On ouvre la couronne autour du crâne, on
 *     ferme le visage. C'est le cas de sa capture, et le plus demandé.
 *   · `buste` — « vous, en buste ». Le vêtement est sur le torse : LA TÊTE
 *     ENTIÈRE est protégée, cheveux compris. C'est le régime le plus strict, et
 *     c'est le bon — un essayage de robe n'a aucune raison de recoiffer.
 *   · `lunettes` — « votre visage ». On ouvre une bande sur les yeux et le nez,
 *     on ferme le reste : bouche, menton, mâchoire, joues basses. Le nez et
 *     l'expression bougeaient là aussi ; ce régime les tient sans empêcher la
 *     monture de se poser.
 *
 * `null` EST LE CAS NORMAL, pas un trou. Une main, un poignet, une table, un
 * avant-bras : rien à protéger, et on ne charge pas quatre mégaoctets de modèle
 * de visage pour ne rien trouver.
 */
export type ZoneVisage = "coiffure" | "buste" | "lunettes";

export function zoneDe(partie: string | undefined): ZoneVisage | null {
  if (!partie) return null;
  // L'ORDRE COMPTE : « votre visage » est le lunetier, « votre tête » le
  // coiffeur. Les deux mots sont proches et une seule expression qui les
  // regrouperait rendrait le premier des deux pour les deux métiers.
  if (/lunette|monture|visage/i.test(partie)) return "lunettes";
  if (/buste|torse|silhouette|pied/i.test(partie)) return "buste";
  if (/t[êe]te|cheveux|coupe|coiffure|portrait/i.test(partie)) return "coiffure";
  return null;
}

/** Y a-t-il quelque chose à verrouiller ? Voir `zoneDe` pour le détail. */
export function aUnVisage(partie: string | undefined): boolean {
  return zoneDe(partie) !== null;
}
