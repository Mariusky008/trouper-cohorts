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

/** Ce qu'une détection rend : de quoi masquer, et de quoi recomposer. */
export type Visage = {
  /** Le contour du visage à protéger, en coordonnées d'image (pixels). */
  contour: { x: number; y: number }[];
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
    return {
      contour,
      boite: { x: x0, y: y0, l: Math.max(...xs) - x0, h: Math.max(...ys) - y0 },
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
   * 2 · ON OUVRE LA COURONNE : le crâne et ses côtés, jusqu'au milieu du
   *     visage. L'ellipse est centrée sur le haut du visage et déborde
   *     largement — c'est la place dont une coupe longue a besoin.
   *
   *     LES PROPORTIONS VIENNENT DE LA BOÎTE DU VISAGE, PAS DE L'IMAGE. Une
   *     photo de près et une photo en pied n'ont pas la même échelle ; s'y
   *     fier donnerait un masque juste sur l'une et absurde sur l'autre.
   */
  const cx = v.boite.x + v.boite.l / 2;
  const cy = v.boite.y + v.boite.h * 0.22;
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
    // LA COIFFURE : LA COURONNE AUTOUR DU CRÂNE, largement — voir plus haut.
    g.ellipse(cx, cy, v.boite.l * 1.25, v.boite.h * 1.15, 0, 0, Math.PI * 2);
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
  // tracé inutile. Chez le coiffeur, elle a ouvert le front avec le crâne.
  if (zone !== "coiffure") return c.toDataURL("image/png");
  g.save();
  g.fillStyle = "#000";
  const marge = v.boite.h * 0.06;
  g.beginPath();
  v.contour.forEach((p, i) => {
    // LE HAUT DU CONTOUR DESCEND, LE BAS NE BOUGE PAS. Un menton remonté
    // laisserait le modèle refaire la mâchoire, qui est justement l'une des
    // choses qu'il déforme.
    const y = p.y < cy ? p.y + marge : p.y;
    if (i === 0) g.moveTo(p.x, y);
    else g.lineTo(p.x, y);
  });
  g.closePath();
  g.fill();
  g.restore();

  return c.toDataURL("image/png");
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
  /** Un point de la photo, dans le repère du rendu. */
  const versRendu = (p: { x: number; y: number }) => ({
    x: px + (p.x / a.naturalWidth) * pl,
    y: py + (p.y / a.naturalHeight) * ph,
  });

  // 1 · LA PHOTO D'ORIGINE, À L'ÉCHELLE DU RENDU.
  const source = document.createElement("canvas");
  source.width = L;
  source.height = H;
  const gs = source.getContext("2d");
  if (!gs) return rendu;
  gs.drawImage(a, px, py, pl, ph);

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
    v.contour.forEach((p, i) => {
      const q = versRendu(p);
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
