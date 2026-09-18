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
export async function trouverLeVisage(
  src: string,
  /**
   * LE VISAGE QU'ON CHERCHE, quand on en cherche un en particulier.
   *
   * Passé au moment de lire le RENDU : c'est celui de la photo du client. Voir
   * le choix entre plusieurs visages, plus bas.
   */
  proche?: Visage | null,
): Promise<Visage | null> {
  try {
    const d = await chargerLeVisage();
    const img = await charger(src);
    const r = d.detect(img);
    const l = img.naturalWidth;
    const h = img.naturalHeight;
    /**
     * ═══ LEQUEL, QUAND IL Y EN A PLUSIEURS ? ══════════════════════════════
     *
     * « La coiffure ce n'est pas du tout comme la photo originale et il y a
     * son visage en double. »
     *
     * ON PRENAIT TOUJOURS LE PREMIER, ET C'EST LA MOITIÉ DU DÉFAUT. Le modèle
     * reçoit DEUX portraits — celui du client et la référence du salon — et il
     * lui arrive de rendre les deux : la cliente recoiffée, et le modèle de la
     * référence quelque part dans le cadre. MediaPipe les trouve tous les
     * deux, dans un ordre qui ne nous appartient pas, et `faceLandmarks[0]`
     * pouvait donc être LE VISAGE DE QUELQU'UN D'AUTRE.
     *
     * TOUT LE RESTE EN DÉCOULE MÉCANIQUEMENT. On calcule alors l'alignement
     * entre le visage de la photo et celui d'une inconnue ; la similitude qui
     * en sort est absurde ; la couronne de cheveux se pose à côté du crâne, et
     * l'on voit deux visages — le vrai, et un morceau de l'autre transporté
     * par-dessus. C'est exactement l'image qu'il a envoyée.
     *
     * ON CHOISIT DONC CELUI QUI RESSEMBLE LE PLUS À CELUI QU'ON CHERCHE, et
     * « ressembler » a ici un sens précis : c'est celui dont les repères
     * s'alignent sur les siens avec le plus petit résidu — voir
     * `alignementSurLeRendu`. Sans candidat de comparaison — le cas de la
     * photo du client, où l'on ne cherche rien de particulier — on garde le
     * premier, qui est aussi le plus grand chez MediaPipe.
     */
    const tous = (r.faceLandmarks ?? []).filter((p) => p && p.length >= 400);
    if (!tous.length) return null;
    let pts = tous[0];
    if (proche && tous.length > 1) {
      let mieux = Infinity;
      for (const c of tous) {
        const reperes = REPERES.map((i) => ({ x: c[i].x * l, y: c[i].y * h }));
        const e = residuDeLAlignement(proche.reperes, reperes);
        if (e !== null && e < mieux) {
          mieux = e;
          pts = c;
        }
      }
    }
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
/**
 * ═══ LA ZONE DE TRAVAIL — la seule surface que le métier a le droit de changer
 *
 * « Je veux que la photo de départ et d'arrivée soit la même, sauf la coiffure
 * qui aura été ajoutée, ou le vêtement, ou autres. »
 *
 * ELLE EST TRACÉE ICI, UNE FOIS, ET LES DEUX VERROUS S'EN SERVENT. Le masque
 * dit au modèle « tu peux travailler là » ; la recomposition dit « je ne garde
 * de ton travail que ça ». Tant que les deux lisaient deux tracés différents,
 * ils pouvaient se contredire en silence — et c'est exactement ce qui est
 * arrivé.
 *
 * ═══ POURQUOI UNE ELLIPSE ET PLUS TOUTE LA LARGEUR ════════════════════════
 *
 * LE MASQUE OUVRAIT TOUTE LA BANDE HAUTE DE L'IMAGE, sur la largeur entière.
 * Sur un portrait serré, cela revient à effacer la photo et à demander au
 * modèle de la refaire : il ne lui restait presque aucun pixel verrouillé pour
 * savoir à quoi ressemblait le décor. Il a donc inventé — et ce qu'un modèle
 * invente quand il n'a rien à continuer, c'est un fond noir de studio. D'où sa
 * capture : un visage qui flotte dans le noir, sans le feuillage, sans son
 * haut, sans la photo.
 *
 * L'ELLIPSE LAISSE UNE MARGE VERROUILLÉE TOUT AUTOUR. Le modèle n'a plus le
 * décor à inventer : il n'a qu'à le prolonger sur quelques dizaines de points,
 * ce que ces modèles font très bien. Et elle reste large — une fois et demie la
 * largeur du visage de chaque côté, deux hauteurs de visage vers le bas — donc
 * une chevelure longue a toujours la place de tomber sur les épaules, qui était
 * le défaut d'avant.
 */
function tracerLaZoneDeTravail(
  g: CanvasRenderingContext2D,
  v: Visage,
  zone: ZoneVisage,
): void {
  const { l, h } = v.taille;
  const cx = v.boite.x + v.boite.l / 2;
  g.beginPath();
  if (zone === "buste") {
    /**
     * LE BUSTE : SOUS LE MENTON, ET PAS AU-DELÀ DES ÉPAULES.
     *
     * Le vêtement est sur le torse ; la tête entière — cheveux compris — n'a
     * aucune raison de bouger. La largeur est bornée pour la même raison que
     * l'ellipse : le mur derrière la personne n'est pas un vêtement.
     */
    const menton = v.boite.y + v.boite.h;
    const demi = v.boite.l * 2.4;
    g.rect(Math.max(0, cx - demi), menton, Math.min(l, demi * 2), h - menton);
  } else if (zone === "lunettes") {
    /**
     * LES LUNETTES : UNE BANDE SUR LES YEUX ET LE NEZ.
     *
     * La monture doit pouvoir se poser — elle occupe précisément la zone qu'on
     * protège chez le coiffeur. On ouvre donc du haut du front au bas du nez,
     * en débordant sur les tempes pour les branches. Le reste du visage —
     * bouche, menton, mâchoire, joues basses — n'est jamais touché : c'est là
     * que le modèle se permettait d'élargir le nez et de changer l'expression,
     * et ça n'a rien à voir avec une paire de lunettes.
     */
    g.ellipse(
      cx,
      v.boite.y + v.boite.h * 0.42,
      v.boite.l * 0.72,
      v.boite.h * 0.24,
      0,
      0,
      Math.PI * 2,
    );
  } else {
    // LA COIFFURE : le crâne, le volume au-dessus, et la place où tombent les
    // cheveux longs. Voir l'en-tête de cette fonction pour les proportions.
    g.ellipse(
      cx,
      v.boite.y + v.boite.h * 0.55,
      v.boite.l * 1.45,
      v.boite.h * 1.95,
      0,
      0,
      Math.PI * 2,
    );
  }
}

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
  /**
   * ═══ ON OUVRE LA ZONE DE TRAVAIL, ET RIEN D'AUTRE ═══════════════════════
   *
   * « Ce n'est pas tout à fait la même coupe. J'ai demandé à ChatGPT de me
   * faire la même chose et le résultat est parfait — vu qu'on prend l'API
   * d'OpenAI on devrait avoir le même résultat, alors pourquoi ça marche si
   * mal ? »
   *
   * DEUX ERREURS SUCCESSIVES, ET IL A VU LES DEUX. La première était un masque
   * AVARE : une couronne qui s'arrêtait aux oreilles, donc « fais des boucles
   * longues » avec interdiction de dessiner là où les boucles tombent. La
   * seconde, en la corrigeant, était un masque PRODIGUE : toute la largeur de
   * l'image, ce qui revenait à effacer le décor et à demander au modèle de le
   * réinventer — il l'a remplacé par du noir.
   *
   * LA ZONE DE TRAVAIL EST LE JUSTE MILIEU, et elle est tracée au même endroit
   * que celui qui sert à la recomposition. Voir `tracerLaZoneDeTravail`.
   */
  g.save();
  g.globalCompositeOperation = "destination-out";
  tracerLaZoneDeTravail(g, v, zone);
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
  const t = {
    a: c,
    b: sn,
    e: mb.x - (c * ma.x - sn * ma.y),
    f: mb.y - (sn * ma.x + c * ma.y),
  };
  /**
   * ═══ ET ON VÉRIFIE QUE LA SIMILITUDE COLLE VRAIMENT ═══════════════════════
   *
   * L'ÉCHELLE ET L'ANGLE NE PROUVENT RIEN, ET C'ÉTAIT L'AUTRE MOITIÉ DU
   * VISAGE DOUBLÉ. Une similitude se calcule TOUJOURS : donnez-lui onze points
   * d'un visage et onze points de n'importe quoi d'autre, elle rend une
   * matrice. Rien ne garantit que cette matrice décrive quoi que ce soit —
   * elle peut très bien avoir une échelle de 1,1 et un angle de 3 degrés tout
   * en étant complètement fausse, parce qu'elle est le MOINS MAUVAIS
   * compromis entre onze paires qui n'ont aucun rapport entre elles.
   *
   * LE RÉSIDU EST LA SEULE MESURE QUI LE DIT. On applique la transformation
   * aux repères de la photo, on regarde à quelle distance ils tombent de ceux
   * du rendu, et on rapporte cette distance à la LARGEUR DU VISAGE — sans quoi
   * le seuil serait juste sur un portrait serré et absurde sur une photo en
   * pied.
   *
   * QUATRE POUR CENT, ET C'EST MESURÉ SUR CE QUE FAIT LE MODÈLE. Un vrai
   * recadrage laisse un résidu d'un à deux pour cent — les repères sont sur le
   * même visage, seule la caméra a bougé. Au-delà de quatre, ce ne sont plus
   * deux vues du même visage : c'est deux visages, ou le même dans une pose
   * différente, et dans les deux cas recoller par-dessus donne l'image qu'il a
   * envoyée.
   */
  // LA LARGEUR DU VISAGE, PAS L'ÉCART DES YEUX. Les deux sont à portée de main
  // et le second est tentant — il est dans `reperes` — mais il vaut moins de la
  // moitié du premier, donc le même pourcentage y serait deux fois plus sévère
  // et refuserait des recadrages parfaitement ordinaires.
  const largeur = photo.boite.l || 1;
  let somme = 0;
  for (let i = 0; i < n; i++) {
    const x = t.a * A[i].x - t.b * A[i].y + t.e;
    const y = t.b * A[i].x + t.a * A[i].y + t.f;
    somme += Math.hypot(x - B[i].x, y - B[i].y);
  }
  if (somme / n > largeur * 0.04) return null;
  return t;
}

/**
 * LE RÉSIDU SEUL, POUR DÉPARTAGER DEUX VISAGES.
 *
 * ELLE REND LA DISTANCE MOYENNE APRÈS ALIGNEMENT, en pixels, sans porter de
 * jugement : c'est l'appelant qui compare. `null` quand l'alignement lui-même
 * n'a pas de sens.
 *
 * ELLE NE PASSE PAS PAR `alignementSurLeRendu` EXPRÈS. Celle-là REFUSE au-delà
 * d'un seuil ; ici on veut justement la valeur, y compris mauvaise, pour
 * pouvoir dire lequel de deux mauvais candidats est le moins mauvais.
 */
function residuDeLAlignement(
  A: { x: number; y: number }[],
  B: { x: number; y: number }[],
): number | null {
  if (!A?.length || A.length !== B?.length) return null;
  const n = A.length;
  const moy = (l: { x: number; y: number }[]) => ({
    x: l.reduce((s, p) => s + p.x, 0) / n,
    y: l.reduce((s, p) => s + p.y, 0) / n,
  });
  const ma = moy(A);
  const mb = moy(B);
  let n1 = 0;
  let n2 = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const ax = A[i].x - ma.x;
    const ay = A[i].y - ma.y;
    const bx = B[i].x - mb.x;
    const by = B[i].y - mb.y;
    n1 += ax * bx + ay * by;
    n2 += ax * by - ay * bx;
    den += ax * ax + ay * ay;
  }
  if (den < 1) return null;
  const c = n1 / den;
  const s = n2 / den;
  const e = mb.x - (c * ma.x - s * ma.y);
  const f = mb.y - (s * ma.x + c * ma.y);
  let somme = 0;
  for (let i = 0; i < n; i++) {
    somme += Math.hypot(
      c * A[i].x - s * A[i].y + e - B[i].x,
      s * A[i].x + c * A[i].y + f - B[i].y,
    );
  }
  return somme / n;
}

/**
 * ═══ VERROU 2 · LA PHOTO EST LE FOND, LE RENDU N'EST QU'UNE PIÈCE ═════════
 *
 * « Le résultat est mieux, mais ce n'est quand même pas la même photo qu'au
 * départ. Je veux que la photo de départ et d'arrivée soit la même, sauf la
 * coiffure qui aura été ajoutée, ou le vêtement, ou autres. »
 *
 * ═══ CE QUI ÉTAIT FAIT, ET POURQUOI ÇA NE POUVAIT PAS TENIR ═══════════════
 *
 * LE RENDU ÉTAIT LE FOND, ET ON Y RECOLLAIT LE VISAGE. Tout ce qui n'était pas
 * l'ovale du visage — le décor, le buste, les vêtements, le cadrage — venait
 * donc du modèle. Tant qu'il se contentait de recoiffer, ça passait ; le jour
 * où il a décidé d'isoler le sujet sur fond noir, il a emporté le feuillage,
 * le haut bleu et le collier avec lui. On avait construit une architecture où
 * le modèle POUVAIT tout perdre, et on a été surpris qu'il le fasse.
 *
 * ═══ CE QUI EST FAIT MAINTENANT ══════════════════════════════════════════
 *
 * LA PHOTO EST LE FOND, ENTIÈRE, À SA TAILLE, DANS SON CADRAGE. Le rendu est
 * ramené dans SON repère à elle, puis découpé à la zone de travail — voir
 * `tracerLaZoneDeTravail`. En dehors de cette zone, l'image de sortie EST la
 * photographie, pixel pour pixel : ce n'est plus une préférence adressée à un
 * modèle, c'est une propriété de l'opération.
 *
 * ET LE CADRE DE SORTIE EST CELUI DE LA PHOTO. Le modèle rend du carré ou du
 * 2:3 selon son humeur ; garder son cadre rendait une image d'un autre format
 * que celle qu'on lui avait donnée — « ce n'est pas la même photo » commence
 * là, avant même de regarder les pixels.
 *
 * ═══ LES DEUX PIÈGES QUI RESTENT ═════════════════════════════════════════
 *
 * LE PREMIER EST L'ALIGNEMENT. Le modèle recadre, décale, agrandit un peu. On
 * ramène donc le rendu par la similitude INVERSE de celle qui amène les repères
 * de la photo sur les siens — voir `alignementSurLeRendu`. Sans elle, la
 * chevelure générée se poserait à côté du crâne.
 *
 * LE SECOND EST LA DÉCOUPE VISIBLE. Un collage net dessine un contour sur la
 * peau : on le voit, et l'œil ne voit plus que ça. D'où le fondu de huit à
 * dix-huit points, proportionné à la taille du visage.
 */
export async function reposerLeVisage(
  photo: string,
  rendu: string,
  v: Visage,
  zone: ZoneVisage,
  /**
   * LE VISAGE TROUVÉ SUR LE RENDU, quand on a su le trouver.
   *
   * Il donne l'ALIGNEMENT — voir `alignementSurLeRendu` — et c'est désormais sa
   * seule utilité : le contour à protéger se lit sur la PHOTO, puisque c'est
   * dans son repère qu'on travaille.
   */
  vRendu?: Visage | null,
): Promise<string> {
  const [a, b] = await Promise.all([charger(photo), charger(rendu)]);
  // LE CADRE DE SORTIE EST CELUI DE LA PHOTO. Voir l'en-tête.
  const L = a.naturalWidth;
  const H = a.naturalHeight;
  const RL = b.naturalWidth;
  const RH = b.naturalHeight;

  // 1 · LA PHOTO, ENTIÈRE. C'est le fond, et c'est ce qui a changé.
  const fin = document.createElement("canvas");
  fin.width = L;
  fin.height = H;
  const gf = fin.getContext("2d");
  if (!gf) return rendu;
  gf.drawImage(a, 0, 0);

  /**
   * 2 · LE RENDU, RAMENÉ DANS LE REPÈRE DE LA PHOTO.
   *
   * `alignementSurLeRendu` donne la similitude qui va de la photo vers le
   * rendu ; c'est l'inverse qu'il faut ici. Une similitude est une
   * multiplication complexe suivie d'une translation — z·p + t — donc son
   * inverse est (q − t)/z, et il s'écrit en trois lignes.
   *
   * SANS ALIGNEMENT, ON COUVRE LE CADRE, CENTRÉ. C'est le repli : il suppose
   * que le modèle n'a pas bougé la tête, ce qui est vrai assez souvent pour
   * valoir mieux que rien.
   */
  const ali = vRendu ? alignementSurLeRendu(v, vRendu) : null;
  /**
   * ═══ SANS ALIGNEMENT SÛR, ON NE RECOLLE RIEN AUTOUR D'UN VISAGE ═══════════
   *
   * « Il y a son visage en double. »
   *
   * LE REPLI CENTRÉ ÉTAIT LA CAUSE DIRECTE DE CETTE IMAGE-LÀ. Quand
   * l'alignement manque, on couvrait le cadre et on recadrait au centre — en
   * SUPPOSANT que le modèle n'avait pas bougé la tête. Cette supposition est
   * fausse la moitié du temps, et quand elle est fausse on découpe une couronne
   * de cheveux aux coordonnées de la photo dans un rendu qui n'a pas le même
   * cadrage. Ce qu'on colle alors sur le front de la cliente n'est pas sa
   * chevelure : c'est un morceau du visage du rendu, sourcil compris. D'où le
   * second visage.
   *
   * ON RENVOIE DONC SA PHOTO, INTACTE, ET L'APPELANT LE SAIT. Un essai qui
   * échoue franchement se recommence ; une image à deux visages se montre à
   * des amis et décide de ce qu'on pense du produit. Entre les deux il n'y a
   * pas à hésiter — c'est la même règle que « parfait ou rien » qu'il a posée
   * le premier jour.
   *
   * CELA NE CONCERNE QUE LES ZONES QUI TOUCHENT LE VISAGE. Un buste — un
   * vêtement sous le menton — ne peut pas produire de visage en double : il n'y
   * a pas de visage dans la zone de travail. Le repli centré y reste donc bon,
   * et c'est heureux : c'est le métier qui s'en sert le plus.
   */
  if (!ali && (zone === "coiffure" || zone === "lunettes")) {
    return photo;
  }
  const transporte = document.createElement("canvas");
  transporte.width = L;
  transporte.height = H;
  const gt = transporte.getContext("2d");
  if (!gt) return rendu;
  if (ali) {
    const d = ali.a * ali.a + ali.b * ali.b;
    const ia = ali.a / d;
    const ib = -ali.b / d;
    gt.setTransform(ia, ib, -ib, ia, -(ia * ali.e - ib * ali.f), -(ib * ali.e + ia * ali.f));
    gt.drawImage(b, 0, 0);
    gt.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    const k = Math.max(RL / L, RH / H);
    const tl = RL / k;
    const th = RH / k;
    gt.drawImage(b, (L - tl) / 2, (H - th) / 2, tl, th);
  }

  /**
   * 3 · LE POCHOIR : LA ZONE DE TRAVAIL, MOINS LE VISAGE, AVEC SON FONDU.
   *
   * On dessine la zone en blanc sur un calque vide, puis on la FLOUTE. Le flou
   * EST le fondu : au centre l'alpha vaut 1 — le rendu gagne entièrement — et
   * il retombe à 0 sur une douzaine de points au bord, ce qui fait la
   * transition vers la photographie.
   *
   * LE RAYON SUIT LA TAILLE DU VISAGE. Douze points fixes sont un fondu correct
   * sur un portrait serré et une bavure sur une photo en pied.
   */
  const pochoir = document.createElement("canvas");
  pochoir.width = L;
  pochoir.height = H;
  const gp = pochoir.getContext("2d");
  if (!gp) return rendu;
  const flou = Math.max(8, Math.min(18, v.boite.l * 0.05));
  gp.filter = `blur(${flou}px)`;
  gp.fillStyle = "#fff";
  tracerLaZoneDeTravail(gp, v, zone);
  gp.fill();
  gp.filter = "none";

  /**
   * ET CHEZ LE COIFFEUR, ON REFERME LE VISAGE.
   *
   * C'est le contour INTÉRIEUR, pas l'ovale : celui de MediaPipe passe à la
   * racine des cheveux, et le refermer reposerait l'ANCIENNE ligne capillaire
   * par-dessus la nouvelle coupe — « la coupe est mal ajustée à son crâne ».
   * Le contour intérieur s'arrête à ras des sourcils et rentre de dix pour
   * cent : ce qui fait l'identité d'un visage vient de la photographie, le
   * front et les tempes viennent du rendu, donc une frange est possible.
   *
   * IL SE LIT SUR LA PHOTO, SANS TRANSPORT. C'est le bénéfice de travailler
   * dans son repère : un calcul de moins, donc une erreur de moins.
   *
   * SUR LE BUSTE ET LES LUNETTES, IL N'Y A RIEN À REFERMER. La zone de travail
   * du buste est sous le menton ; celle du lunetier EST la bande des yeux, et
   * la refermer rendrait au client sa photo, exactement — sans les lunettes.
   */
  if (zone === "coiffure") {
    gp.save();
    gp.globalCompositeOperation = "destination-out";
    gp.filter = `blur(${flou}px)`;
    gp.beginPath();
    v.interieur.forEach((p, i) => {
      if (i === 0) gp.moveTo(p.x, p.y);
      else gp.lineTo(p.x, p.y);
    });
    gp.closePath();
    gp.fill();
    gp.restore();
    gp.filter = "none";
  }

  /**
   * 4 · ON DÉCOUPE LE RENDU AVEC CE POCHOIR, PUIS ON LE POSE SUR LA PHOTO.
   *
   * `destination-in` garde du rendu ce que le pochoir couvre, avec SON alpha :
   * c'est ce qui transporte le fondu depuis le pochoir jusqu'à la pièce collée.
   */
  gt.globalCompositeOperation = "destination-in";
  gt.drawImage(pochoir, 0, 0);
  gt.globalCompositeOperation = "source-over";
  gf.drawImage(transporte, 0, 0);

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
