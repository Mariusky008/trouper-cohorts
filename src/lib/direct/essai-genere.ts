"use client";

// 🪞 DEMANDER LE RENDU — le côté téléphone de `/api/direct/essayer`.
//
// ═══ CE QUE CE FICHIER FAIT DE PLUS QU'UN `fetch` ═════════════════════════
//
// TROIS CHOSES, ET CHACUNE VIENT D'UNE MESURE :
//
//   · IL RÉDUIT LES DEUX PHOTOS AVANT DE LES ENVOYER. Un iPhone rend douze
//     mégapixels ; en base64, c'est plusieurs mégaoctets qui partent sur un
//     réseau de rue pour qu'un modèle les redimensionne à l'arrivée. On envoie
//     du mille deux cents points, ce qui est déjà plus que ce que l'écran
//     montrera.
//   · IL LIT LA PHOTO DE RÉFÉRENCE DU COMMERÇANT depuis son adresse et la
//     transforme en `data:`. Le serveur n'a pas à aller la chercher : elle est
//     publique, elle est déjà dans le navigateur, et un aller-retour de moins
//     est une seconde de moins.
//   · IL REMONTE LA RAISON D'UNE PANNE. « L'essayage n'a pas abouti » ne se
//     diagnostique pas ; « Gemini a répondu 429 » se diagnostique en trois
//     secondes. Le détail va à l'écran, pas dans une console que personne
//     n'ouvre sur un téléphone.
//
// ET IL NE RETOMBE JAMAIS SUR LE MOTEUR GÉOMÉTRIQUE. Voir la route : un repli
// silencieux vers un rendu jugé « très très mauvais » serait le même défaut que
// le `catch` qui servait la photo du catalogue — un écran qui montre autre chose
// que ce qu'il prétend.

import {
  alignementSurLeRendu,
  masqueDEssai,
  reposerLeVisage,
  trouverLeVisage,
  zoneDe,
  type Visage,
  type ZoneVisage,
} from "@/lib/direct/visage";

export type Rendu = {
  image: string;
  ms: number;
  /**
   * LE VISAGE D'ORIGINE A-T-IL ÉTÉ REPOSÉ SUR LE RENDU ?
   *
   * Sert aux gardes et au journal, pas à l'écran. On ne l'affiche pas : dire
   * « visage préservé » sous une image ferait douter de toutes celles qui ne le
   * disent pas, et c'est précisément le genre de ligne qu'il vient de demander
   * de retirer du bas du résultat.
   */
  visageRepose?: boolean;
};

export type Souci = {
  erreur: string;
  pourquoi?: string;
};

/**
 * LE PLUS GRAND CÔTÉ ENVOYÉ AU MODÈLE.
 *
 * BAISSÉ DE DOUZE CENTS À HUIT CENTS APRÈS UN 504. Deux photos de douze cents
 * points en base64, c'est plusieurs mégaoctets qui montent depuis un téléphone
 * en 4G avant même que le modèle commence — et le temps de la fonction est
 * compté. Le modèle redimensionne de toute façon à l'arrivée.
 */
const COTE = 800;

/**
 * LE PLUS GRAND CÔTÉ EN RÉGIME LÉGER.
 *
 * « Je n'ai pas recadré ta photo avant l'envoi. »
 *
 * LA RÉDUCTION N'EST PAS UN RECADRAGE — elle garde le cadre entier et son
 * rapport — mais huit cents points sur une coupe de cheveux, c'est cent points
 * pour une mèche. On remonte donc à douze cent quatre-vingts là où la coupe
 * est le sujet. LE PRIX EST UN RISQUE DE 504 UN PEU PLUS HAUT : l'envoi est
 * deux fois et demie plus lourd, et il monte d'un téléphone. `OPENAI_IMAGE_
 * QUALITY` reste le moyen de redescendre en production sans redéployer.
 */
const COTE_LEGER = 1280;

/**
 * ═══ LE RÉGIME DE L'ESSAI — ET CELUI DE LA COIFFURE A CHANGÉ ═══════════════
 *
 * « Je n'ai demandé aucune taille précise. Je n'ai pas envoyé de masque. Je
 * n'ai pas recadré ta photo avant l'envoi. J'ai transmis les deux images comme
 * références, avec une instruction textuelle. »
 *
 * C'EST SA RÉPONSE, ET ELLE CONTREDIT TROIS DE NOS CHOIX, UN PAR UN. Il est
 * allé la chercher exprès, et elle vaut mieux que tout ce que j'ai pu déduire
 * en lisant notre code : c'est la seule chose de ce dossier qui décrive la
 * configuration qui MARCHE, mesurée sur sa photo à lui.
 *
 * CES TROIS CHOIX, C'EST MOI QUI LES AI DÉFENDUS PENDANT CINQ TOURS. Le
 * masque, le cadre imposé, le rognage : chacun avait sa raison, chacun
 * réparait un défaut réel, et aucun n'a jamais été mesuré avec les autres.
 * Trois réparations correctes prises ensemble peuvent rendre le travail
 * impossible — c'est exactement ce que le rendu montre depuis cinq tours.
 * Les enlever n'est pas un aveu de détail : c'est revenir sur le raisonnement
 * entier, et il vaut mieux le dire que le glisser dans un commit.
 *
 * TROIS RÉGIMES EXISTENT DONC MAINTENANT :
 *
 *   · `atelier` — nos trois verrous plus la recomposition. C'est ce qui tourne
 *     depuis des semaines, et ça reste le régime de TOUS LES AUTRES MÉTIERS.
 *     Le vêtement ne s'est jamais plaint : on ne touche pas à ce qui va.
 *   · `leger` — ni masque, ni cadre demandé, ni rognage, MAIS LA RECOMPOSITION
 *     RESTE. C'est le régime de la coiffure, par défaut, depuis ce tour.
 *   · `brut` — plus rien du tout, recomposition comprise. Il ne sert qu'à
 *     répondre à « le verrou fait-il du mal ? », et il se demande dans
 *     l'adresse.
 *
 * ON GARDE LA RECOMPOSITION, ET CE N'EST PAS UNE HÉSITATION. Elle est la seule
 * pièce de ce fichier qui GARANTISSE quelque chose : elle n'adresse aucune
 * demande à un générateur, elle écrit des pixels. Tout le reste n'était que
 * des prières. On enlève les prières, on garde l'arithmétique.
 *
 * `?atelier=1` REMET L'ANCIEN RÉGIME SANS REDÉPLOYER, parce qu'on compare deux
 * rendus sur un téléphone, pas dans un journal.
 */
/**
 * ═══ ET UN QUATRIÈME, CALQUÉ SUR CE QUI MARCHE ════════════════════════════
 *
 * « Dis-moi ce que tu as demandé à l'API, ainsi je le dirai à mon codeur pour
 * qu'il fasse à l'identique. »
 *
 * `calquee` A LA MÊME GÉOMÉTRIE QUE `leger` — ni masque, ni cadre demandé, ni
 * rognage — ET LA CONSIGNE QU'IL EST ALLÉ CHERCHER : celle dont on a la preuve
 * qu'elle rend le bon résultat sur sa photo. Voir `consigneCalquee`.
 *
 * C'EST DÉSORMAIS LE RÉGIME DE LA COIFFURE. Notre consigne longue a produit
 * huit rendus qu'il refuse ; celle-là en a produit un qu'il appelle parfait.
 * Entre les deux il n'y a pas à hésiter — et l'ancienne reste au banc d'essai,
 * en deuxième ligne, pour que la comparaison ne se perde pas.
 */
export type Regime = "atelier" | "leger" | "brut" | "calquee";

function regimeDe(partie: string | undefined): Regime {
  const defaut: Regime = zoneDe(partie) === "coiffure" ? "calquee" : "atelier";
  if (typeof window === "undefined") return defaut;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("brut") === "1") return "brut";
    if (q.get("atelier") === "1") return "atelier";
    if (q.get("leger") === "1") return "leger";
    if (q.get("calquee") === "1") return "calquee";
    return defaut;
  } catch {
    return defaut;
  }
}

/**
 * ═══ LE MODE BRUT — NOTRE PILE SANS NOS QUATRE AJOUTS ══════════════════════
 *
 * « ChatGPT réalise un rendu beaucoup plus naturel et ajusté à la photo de
 * départ que via ClikMe. Ça fait un moment qu'on essaie de réaliser quelque
 * chose comme ChatGPT et on est encore et toujours très loin, alors qu'on
 * utilise leur API. »
 *
 * C'EST LE MÊME MOTEUR, LE MÊME POINT D'ENTRÉE, LA MÊME FIDÉLITÉ D'ENTRÉE.
 * Quatre choses seulement nous séparent d'une édition faite dans ChatGPT, et
 * nous les avons toutes ajoutées nous-mêmes :
 *
 *   1. LA RECOMPOSITION du visage par-dessus le rendu. C'est elle qui garantit
 *      l'identité, et c'est aussi elle qui donne l'air d'une tête collée : le
 *      modèle a ré-éclairé le visage pour la nouvelle coupe, et on repose
 *      par-dessus un visage éclairé pour l'ancienne.
 *   2. LE MASQUE, qui interdit de retoucher hors de la couronne de cheveux —
 *      donc interdit de rattraper une ombre sur la joue ou un reflet sur
 *      l'épaule, c'est-à-dire tout ce qui fait qu'une coupe a l'air POSÉE SUR
 *      quelqu'un plutôt que collée devant.
 *   3. LA RÉDUCTION À HUIT CENTS POINTS avant l'envoi, pour tenir le budget de
 *      temps de la fonction. ChatGPT reçoit la photo entière.
 *   4. LA CONSIGNE LONGUE — deux mille signes d'interdictions accumulées après
 *      chaque défaut constaté, et qui tirent le modèle vers la prudence.
 *
 * AUCUN DE CES QUATRE N'A JAMAIS ÉTÉ MESURÉ AVEC LES AUTRES. Chacun a été
 * ajouté seul, pour réparer un défaut réel, et la somme n'a jamais été
 * comparée à ce qu'elle remplace. Ce drapeau les enlève tous les quatre d'un
 * coup : on obtient la comparaison à une seule variable qui manquait.
 *
 * IL SE DEMANDE DANS L'ADRESSE, `?brut=1`, et il ne change rien pour qui ne le
 * demande pas. Il ne protège rien — le visage peut bouger, c'est exactement ce
 * qu'il sert à voir.
 *
 * ET IL N'AURA JAMAIS ÉTÉ LANCÉ. Je l'ai construit pour obtenir une mesure, il
 * demandait d'ouvrir une adresse à la main sur un téléphone, et ça ne s'est
 * pas produit — pendant que je l'attendais, il est allé demander la réponse à
 * ChatGPT directement. UN DIAGNOSTIC QUI SE DEMANDE DANS L'ADRESSE N'EST PAS
 * UN DIAGNOSTIC : c'est une chose qu'on espère que quelqu'un fera. C'est de là
 * que vient le régime `leger`, qui n'attend plus personne — voir `regimeDe`.
 */

/**
 * ═══ LES SEULS CADRES QUE LE MODÈLE SAIT RENDRE ═════════════════════════════
 *
 * `gpt-image-1` ne rend QUE ces trois formats. Ce n'est pas une préférence,
 * c'est la liste fermée de ce qu'il sait produire.
 */
const CADRES = [
  { l: 1024, h: 1024 },
  { l: 1536, h: 1024 },
  { l: 1024, h: 1536 },
] as const;

/**
 * ═══ ON ENVOIE EXACTEMENT LE CADRE QU'ON DEMANDE ════════════════════════════
 *
 * « Ce n'est pas du tout la bonne coupe, c'est une coupe qui ressemble un peu
 * mais qui a été RÉINVENTÉE au lieu d'avoir pris la même coupe et de l'avoir
 * ajustée. »
 *
 * VOICI CE QU'ON ENVOYAIT, MESURÉ SUR SA PHOTO. Elle fait 1409 × 904, soit un
 * rapport de 1,559. On la réduisait à 800 × 513 — même rapport — et on
 * demandait au modèle une sortie en 1536 × 1024, c'est-à-dire un rapport de
 * 1,5.
 *
 * UN MODÈLE À QUI L'ON DEMANDE UNE AUTRE FORME NE PEUT PAS RECOPIER. Entre
 * 1,559 et 1,5 il n'y a aucune correspondance pixel à pixel : il doit
 * RECADRER, donc recomposer, donc redessiner ce qu'il déplace. C'est
 * exactement ce qu'il décrit — une coupe qui ressemble, un visage qui a
 * bougé, des vêtements qui ont changé. Pas un mauvais travail : un travail
 * qu'on a rendu impossible.
 *
 * ET C'EST LA SEULE DES CINQ PISTES QUI EXPLIQUE LES TROIS SYMPTÔMES À LA
 * FOIS. Le masque n'explique pas les vêtements, la consigne n'explique pas le
 * visage, la recomposition n'explique pas la coupe. Une reprise de cadre, si.
 *
 * ON RECADRE DONC AVANT D'ENVOYER, au rapport exact du cadre demandé, et à sa
 * taille exacte. Le modèle reçoit et rend la même géométrie : il n'a plus
 * aucune raison de recomposer, le masque tombe au bon endroit, et la
 * recomposition du visage se repose au pixel près.
 *
 * ON ROGNE, ON NE COMPLÈTE PAS. Ajouter des bandes pour atteindre le rapport
 * donnerait au modèle des zones vides à remplir — et il les remplit. Le
 * rognage centré coûte quelques pour cent sur un bord ; sur sa photo, quatre
 * pour cent de largeur.
 */
function cadreDe(l: number, h: number): { l: number; h: number } {
  const r = l / h;
  let choisi: { l: number; h: number } = CADRES[0];
  let ecart = Infinity;
  for (const c of CADRES) {
    const d = Math.abs(c.l / c.h - r);
    if (d < ecart) {
      ecart = d;
      choisi = c;
    }
  }
  return choisi;
}

/** Le format tel que l'API l'attend : « 1536x1024 ». */
export function nomDuCadre(c: { l: number; h: number }): string {
  return `${c.l}x${c.h}`;
}

/** Charge une image, la rogne au centre au rapport du cadre, et la rend à sa taille. */
async function cadrer(source: string, cadre: { l: number; h: number }): Promise<string> {
  const img = await new Promise<HTMLImageElement>((ok, non) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => non(new Error(`image illisible : ${source.slice(0, 40)}`));
    i.src = source;
  });
  const rCible = cadre.l / cadre.h;
  const rSource = img.width / img.height;
  /* LE RECTANGLE QU'ON GARDE : le plus grand possible au bon rapport. */
  let sl = img.width;
  let sh = img.height;
  if (rSource > rCible) sl = Math.round(img.height * rCible);
  else sh = Math.round(img.width / rCible);
  /* EN LARGEUR ON CENTRE — un buste est au milieu du cadre.

     EN HAUTEUR ON NE CENTRE PAS, ET C'EST MESURÉ SUR LES FORMATS RÉELS. Une
     photo de téléphone en 3:4 perd onze pour cent de sa hauteur pour entrer
     dans le seul cadre vertical que le modèle sache rendre. Centré, c'est cinq
     et demi en haut : sur un portrait cadré serré, cinq et demi en haut,
     c'est le dessus du crâne — donc précisément le volume dont une coupe
     longue a besoin, et la première chose qu'on ne doit pas couper dans un
     essayage de coiffure.
     ON RETIRE DONC UN QUART EN HAUT ET TROIS QUARTS EN BAS. Le bas d'un
     portrait porte un buste et un fond ; le haut porte les cheveux. */
  const sx = Math.round((img.width - sl) / 2);
  const sy = Math.round((img.height - sh) * 0.25);

  const c = document.createElement("canvas");
  c.width = cadre.l;
  c.height = cadre.h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(img, sx, sy, sl, sh, 0, 0, cadre.l, cadre.h);
  return c.toDataURL("image/jpeg", 0.9);
}

/** Lit les dimensions d'une image sans la redessiner. */
async function mesurer(source: string): Promise<{ l: number; h: number }> {
  const img = await new Promise<HTMLImageElement>((ok, non) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => non(new Error("image illisible"));
    i.src = source;
  });
  return { l: img.width, h: img.height };
}

/** Charge une image et la rend en `data:` JPEG, réduite. */
async function reduire(source: string, cote = COTE): Promise<string> {
  const img = await new Promise<HTMLImageElement>((ok, non) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = () => non(new Error(`image illisible : ${source.slice(0, 40)}`));
    i.src = source;
  });
  const e = Math.min(1, cote / Math.max(img.width, img.height));
  const l = Math.max(1, Math.round(img.width * e));
  const h = Math.max(1, Math.round(img.height * e));
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas indisponible");
  ctx.drawImage(img, 0, 0, l, h);
  return c.toDataURL("image/jpeg", 0.92);
}

/**
 * ESSAYER LA PIÈCE DU COMMERÇANT SUR LA PHOTO DU CLIENT.
 *
 * `partie` est ce que l'écran a demandé de photographier — « votre main »,
 * « votre poignet », « vos cheveux ». Elle part telle quelle dans la consigne :
 * c'est le seul endroit où le métier entre dans le rendu, et c'est pour ça qu'il
 * n'y a pas une route par métier.
 *
 * `garder` EST LE SECOND, ET IL A ÉTÉ AJOUTÉ POUR UNE PAIRE DE LUNETTES.
 *
 * « Ce n'est pas exactement ma tête ni les mêmes lunettes, donc assez déçu. »
 * Le modèle avait remplacé une monture par une autre, et personne ne lui avait
 * dit de ne pas le faire. Cette liste nomme ce que CE métier-là ne doit pas
 * toucher, et elle ne peut pas être écrite dans la route : chez le coiffeur les
 * lunettes restent, chez le lunetier elles sont ce qui change.
 */
export async function essayerSurMoi(opts: {
  photo: string;
  reference: string;
  partie: string;
  garder?: string[];
  /**
   * CE QUE LE MODÈLE A LE DROIT DE MODIFIER, ET RIEN D'AUTRE.
   *
   * IL NE SE DÉDUIT PAS DE `partie`, et c'est la confusion qui a fait rendre un
   * autre visage : on photographie une TÊTE pour changer des CHEVEUX.
   */
  change?: string;
  /** Ce que la pièce EST, en toutes lettres. Voir `decrire` dans `fantomes.ts`. */
  decrire?: string;
  /**
   * ═══ LE RÉGIME IMPOSÉ, POUR LE BANC D'ESSAI ═══════════════════════════════
   *
   * « Arrêter les essais de prompts isolés. Faire un test comparatif sur les
   * mêmes photos, en ne changeant qu'un paramètre à la fois. »
   *
   * SANS CE CHAMP, LE RÉGIME SE LIT DANS L'ADRESSE — donc on ne peut en
   * comparer qu'un par chargement de page, et on compare alors deux rendus
   * faits à dix minutes d'écart sur deux pages différentes. C'est exactement
   * la méthode qui nous a fait tourner huit tours.
   *
   * IL RESTE VIDE PARTOUT AILLEURS. Le produit ne choisit pas son régime :
   * c'est le métier qui le décide, dans `regimeDe`.
   */
  regime?: Regime;
  signal?: AbortSignal;
}): Promise<Rendu | Souci> {
  const regime = opts.regime ?? regimeDe(opts.partie);
  const brut = regime === "brut";
  /* LE RÉGIME LÉGER NE ROGNE PAS ET NE DEMANDE PAS DE CADRE — voir `regimeDe`.
     `brut` et `leger` partagent ces deux-là ; seule la recomposition les
     sépare. */
  const leger = regime !== "atelier";
  /* QUELLE PHRASE PART. La route ne peut plus la déduire d'un seul booléen :
     il y a maintenant trois consignes pour quatre régimes. On le lui dit. */
  const phrase: "longue" | "courte" | "calquee" =
    regime === "brut" ? "courte" : regime === "calquee" ? "calquee" : "longue";
  let photo: string;
  let reference: string;
  let cadre: { l: number; h: number } | null = null;
  try {
    if (leger) {
      /**
       * ON ENVOIE SA PHOTO ENTIÈRE, ET ON NE DEMANDE AUCUN FORMAT.
       *
       * « Je n'ai pas recadré ta photo avant l'envoi. Je n'ai demandé aucune
       * taille précise. L'outil a choisi son format de sortie
       * automatiquement. »
       *
       * LE RAISONNEMENT DU ROGNAGE SE RETOURNE ICI. Je rognais pour que la
       * photo ait EXACTEMENT le rapport du cadre demandé, afin que le modèle
       * n'ait pas à recomposer. Mais si l'on ne demande aucun cadre, le modèle
       * garde celui qu'il reçoit : la correspondance est acquise sans qu'on
       * coupe quoi que ce soit — et sans qu'on jette le haut du crâne, qui est
       * précisément ce qu'une coupe longue a de plus à montrer.
       */
      [photo, reference] = await Promise.all([
        reduire(opts.photo, COTE_LEGER),
        /* UNE RÉFÉRENCE ABSENTE N'EST PAS UNE PHOTO ILLISIBLE. `reduire("")`
           lève, et l'appelant lisait « Photo illisible » alors que sa photo à
           lui allait parfaitement. La consigne sait déjà travailler sans
           seconde image — voir `avecReference` — et le banc d'essai s'en sert
           pour mesurer ce qu'elle apporte. */
        opts.reference ? reduire(opts.reference, COTE_LEGER) : Promise.resolve(""),
      ]);
    } else {
      /**
       * LA PHOTO PART DANS LE CADRE EXACT QU'ON VA DEMANDER — voir `cadrer`.
       * C'est ce qui permet au modèle d'ÉDITER au lieu de recomposer.
       *
       * LA RÉFÉRENCE, ELLE, GARDE SON PROPRE CADRE. Elle n'est pas éditée : elle
       * est REGARDÉE. La rogner au rapport de la photo du client couperait la
       * coupe qu'on veut montrer — sur celle du carré long, les mèches qui
       * tombent devant l'épaule sont précisément dans le bas de l'image.
       */
      const d = await mesurer(opts.photo);
      cadre = cadreDe(d.l, d.h);
      [photo, reference] = await Promise.all([
        cadrer(opts.photo, cadre),
        opts.reference ? reduire(opts.reference, COTE) : Promise.resolve(""),
      ]);
    }
  } catch (e) {
    return { erreur: "Photo illisible.", pourquoi: e instanceof Error ? e.message : String(e) };
  }

  /**
   * ═══ ON CHERCHE LE VISAGE AVANT D'ENVOYER QUOI QUE CE SOIT ════════════════
   *
   * « Ça déforme ma tête au lieu de garder l'original comme base. Ma tête doit
   * rester entièrement la même. »
   *
   * DEUX VERROUS EN DÉCOULENT, et ils commencent tous les deux ici :
   *
   *   · LE MASQUE part avec la requête et déclare au modèle ce qu'il peut
   *     réécrire — les cheveux et la couronne autour du crâne, rien d'autre.
   *   · LA RECOMPOSITION attend le rendu et repose les pixels du visage
   *     d'origine par-dessus. C'est elle qui garantit l'identité ; le masque
   *     n'est qu'une préférence adressée à un générateur.
   *
   * LE VISAGE EST MESURÉ SUR LA PHOTO RÉDUITE, PAS SUR L'ORIGINALE. C'est elle
   * qu'on envoie, donc c'est elle dont le masque doit avoir les dimensions —
   * l'API refuse un masque d'une autre taille. Mesurer sur l'original aurait
   * donné un masque juste, et rejeté.
   *
   * ON NE CHERCHE QUE LÀ OÙ IL Y A QUELQUE CHOSE À TROUVER. Voir `aUnVisage` :
   * une onglerie photographie une main, une cirière une table. Y charger quatre
   * mégaoctets de modèle de visage à chaque essai serait payé par l'attente,
   * pour ne rien protéger.
   */
  let visage: Visage | null = null;
  let masque = "";
  /**
   * LE RÉGIME DE PROTECTION, ET IL DÉPEND DE CE QU'ON PHOTOGRAPHIE.
   *
   * Trois métiers cadrent un visage et ne protègent pas la même chose : le
   * coiffeur ferme le visage et ouvre la couronne, la boutique ferme la tête
   * entière et ouvre le torse, le lunetier ouvre la bande des yeux. Écrire
   * « protège le visage » pour les trois casserait le lunetier — la monture se
   * pose précisément là où l'on interdit. Voir `zoneDe`.
   */
  const zone: ZoneVisage | null = zoneDe(opts.partie);
  /**
   * ═══ QUAND LE VERROU NE S'APPLIQUE PAS, ON LE DIT ═════════════════════════
   *
   * « Ce n'est même plus les mêmes vêtements, et la tête non plus réellement. »
   *
   * TROIS CHEMINS DIFFÉRENTS RENDAIENT LE MÊME ÉCRAN, ET AUCUN NE SE
   * SIGNALAIT : pas de visage trouvé sur la photo, masque impossible à
   * dessiner, recomposition qui échoue. Dans les trois cas on rend le portrait
   * BRUT du modèle — celui où le visage a bougé — et rien nulle part ne dit
   * que le verrou n'a pas tenu. On regarde alors le résultat en se demandant
   * si le modèle a mal travaillé, alors que la question est : le verrou
   * s'est-il seulement posé ?
   *
   * C'EST LA MÊME FAUTE QUE LE `catch` MUET DES PHOTOS GOOGLE, corrigé ce
   * matin : un repli silencieux n'est pas une tolérance, c'est une panne qu'on
   * a décidé de ne pas voir. Ces trois-là parlent maintenant, dans la console
   * du téléphone, à côté des journaux `[essai]` du serveur.
   */
  const dire = (quoi: string, pourquoi?: unknown) => {
    console.warn(
      "[essai] verrou du visage",
      JSON.stringify({
        quoi,
        partie: opts.partie,
        pourquoi: pourquoi instanceof Error ? pourquoi.message : pourquoi ? String(pourquoi) : undefined,
      }),
    );
  };

  /* EN MODE BRUT ON NE CHERCHE MÊME PAS LE VISAGE : sans masque et sans
     recomposition, la détection ne servirait qu'à faire attendre. */
  if (brut) {
    dire("mode brut : ni masque ni recomposition, demandé dans l'adresse");
  } else if (!zone) {
    /* CE N'EST PAS UN DÉFAUT : une main, un poignet, une table n'ont pas de
       visage à protéger. On le dit quand même, parce que la première question
       devant un rendu raté est « le verrou était-il censé s'appliquer ? ». */
    dire("pas de zone à protéger pour cette partie du corps");
  } else {
    visage = await trouverLeVisage(photo);
    if (!visage) {
      /* SANS VISAGE TROUVÉ, LES DEUX VERROUS TOMBENT ENSEMBLE — ni masque, ni
         recomposition. C'est le chemin le plus probable derrière « ce n'est
         plus tout à fait la même tête », et c'est celui qui ne se voyait
         nulle part. */
      dire("aucun visage trouvé sur la photo : ni masque ni recomposition");
    } else if (leger) {
      /* EN RÉGIME LÉGER ON A LE VISAGE, ET ON NE S'EN SERT QUE POUR LE
         RECOLLER. Pas de masque : c'est l'un des trois choix que sa réponse
         de ChatGPT contredit. Voir `regimeDe`. */
      dire("régime léger : pas de masque, la recomposition tient seule");
    } else {
      try {
        masque = masqueDEssai(visage, zone);
      } catch (e) {
        // UN MASQUE QU'ON NE SAIT PAS DESSINER N'EMPÊCHE PAS L'ESSAI. On part
        // sans lui, et la recomposition tient encore : elle n'a besoin que du
        // contour, qu'on a déjà.
        masque = "";
        dire("masque impossible à dessiner ; la recomposition tient encore", e);
      }
    }
  }

  let r: Response;
  try {
    r = await fetch("/api/direct/essayer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        photo,
        reference,
        masque,
        partie: opts.partie,
        garder: opts.garder ?? [],
        change: opts.change ?? "",
        decrire: opts.decrire ?? "",
        brut,
        consigne: phrase,
        /* LE CADRE EST CHOISI ICI, PAS DEVINÉ LÀ-BAS. La route le déduisait
           des dimensions reçues, ce qui redonnait le même rapport — mais elle
           n'avait aucun moyen de savoir qu'on venait de rogner exprès. Un
           cadre décidé à un endroit et recalculé à un autre finit toujours par
           diverger.

           ET « auto » N'EST PAS UN CADRE : c'est la consigne de n'en demander
           aucun. La route ne pose alors pas `size` du tout, et le modèle garde
           le format qu'il reçoit. Sans ce mot, elle retomberait sur sa
           déduction d'autrefois et redemanderait un cadre — exactement ce
           qu'on vient d'enlever. */
        taille: cadre ? nomDuCadre(cadre) : "auto",
      }),
      signal: opts.signal,
    });
  } catch (e) {
    // UNE COUPURE RÉSEAU N'EST PAS UNE PANNE DU SERVICE, et le dire évite de
    // chercher au mauvais endroit.
    return {
      erreur: "L’essayage n’a pas pu être demandé.",
      pourquoi: e instanceof Error ? e.message : String(e),
    };
  }

  let j: { image?: string; ms?: number; erreur?: string; pourquoi?: string };
  try {
    j = (await r.json()) as typeof j;
  } catch {
    /**
     * UNE RÉPONSE QUI N'EST PAS DU JSON EST PRESQUE TOUJOURS LA PASSERELLE.
     *
     * « Réponse illisible du serveur (HTTP 504) » s'est affiché sur un vrai
     * téléphone, et ça n'aide personne : ce n'est pas la réponse qui est
     * illisible, c'est qu'il n'y en a pas eu. Un 502/504 renvoie une page HTML
     * d'erreur d'hébergeur — donc on le nomme.
     */
    if (r.status === 504 || r.status === 502 || r.status === 408) {
      return {
        erreur: "L’essayage a mis trop de temps.",
        pourquoi: `le serveur a coupé avant la fin du rendu (HTTP ${r.status})`,
      };
    }
    return { erreur: "Réponse illisible du serveur.", pourquoi: `HTTP ${r.status}` };
  }
  if (!r.ok || !j.image) {
    return {
      erreur: j.erreur ?? "L’essayage n’a pas abouti.",
      pourquoi: j.pourquoi ?? `HTTP ${r.status}`,
    };
  }
  /**
   * ═══ ET LE VRAI VISAGE REVIENT PAR-DESSUS LE RENDU ════════════════════════
   *
   * « La partie décisive : on remet le vrai visage après le passage de l'IA.
   * Même si OpenAI déforme légèrement le nez ou la bouche, ces pixels sont
   * écrasés par ceux de la photo originale. »
   *
   * C'EST LA SEULE LIGNE DE CE FICHIER QUI GARANTIT QUELQUE CHOSE. Tout le
   * reste — la consigne, `input_fidelity`, le masque — pèse sur un générateur
   * sans le contraindre. Ici on ne demande rien : on écrit des pixels.
   *
   * UN ÉCHEC DE RECOMPOSITION REND LE RENDU BRUT PLUTÔT QUE RIEN. Le résultat
   * est alors celui d'avant, c'est-à-dire imparfait — mais un essai imparfait
   * vaut mieux qu'un écran vide, et `reposerLeVisage` ne jette de toute façon
   * que si le navigateur refuse une toile.
   */
  if (visage && zone) {
    try {
      /**
       * ═══ ON CHERCHE AUSSI LE VISAGE SUR LE RENDU ══════════════════════════
       *
       * « La femme a un visage qui se double un peu sur sa droite. »
       *
       * C'ÉTAIT LA MOITIÉ MANQUANTE DE LA RECOMPOSITION. On savait où était le
       * visage sur la PHOTO ; on supposait qu'il était au même endroit sur le
       * RENDU. Le modèle recadre, décale de quelques points, agrandit un peu —
       * et quelques points suffisent pour qu'on voie DEUX bords de visage, le
       * vrai et le recollé.
       *
       * UNE SECONDE DÉTECTION COÛTE UNE DEMI-SECONDE, et elle arrive après une
       * attente de plusieurs secondes qu'on a passé un écran entier à rendre
       * agréable. C'est le meilleur rapport de tout ce fichier.
       *
       * ET SON ÉCHEC NE CASSE RIEN : `reposerLeVisage` sait travailler sans —
       * elle retombe sur l'ancien calcul, qui vaut mieux que rien quand le
       * modèle n'a pas bougé la tête.
       */
      /* ON LUI DIT QUEL VISAGE CHERCHER — voir `trouverLeVisage`. Le modèle
         reçoit deux portraits et il lui arrive de rendre les deux ; sans ce
         repère, on alignait parfois sur le visage du modèle de la référence,
         et la couronne de cheveux se posait à côté du crâne de la cliente. */
      const vRendu = await trouverLeVisage(j.image, visage);
      if (!vRendu) {
        /* ON ALIGNE ALORS SUR L'ANCIEN CALCUL, et ça vaut mieux que rien —
           mais si le modèle a recadré, le visage se repose à côté. C'est le
           défaut « la femme a un visage qui se double un peu sur sa droite »,
           et il redevient possible dès que cette détection-ci échoue. */
        dire("visage introuvable sur le rendu : on repose à l'ancienne place");
      }
      /**
       * ═══ UN RENDU QUI N'EST PAS SA PHOTO RETOUCHÉE NE SE MONTRE PAS ══════
       *
       * « C'est pire qu'avant : c'est plus les mêmes habits, plus la même
       * tête, et en plus c'est pas la bonne coupe. »
       *
       * CE QU'IL A REÇU N'ÉTAIT PAS UN ESSAI RATÉ, C'ÉTAIT UNE AUTRE PERSONNE.
       * Un portrait en buste est parti, une photo EN PIED est revenue, avec
       * d'autres vêtements et un autre visage : le modèle n'a pas retouché, il
       * a fabriqué. Et on l'affichait tel quel.
       *
       * L'ALIGNEMENT SAIT DÉJÀ LE DIRE, et il le disait déjà. Il refuse une
       * similitude aberrante — échelle hors de [0,5 ; 2,2], angle au-delà de
       * dix-huit degrés — parce qu'à ce moment-là ce ne sont plus les repères
       * de la même tête. Ce refus ne servait qu'à ne PAS recoller ; on
       * montrait quand même l'image.
       *
       * J'AI DÉJÀ HÉSITÉ DEUX FOIS SUR CE POINT, ET LA TROISIÈME EST DIFFÉRENTE.
       * Premier tour : on rendait SA PHOTO inchangée — échec muet, écarté à
       * raison. Deuxième tour : on rend le portrait brut, « parce qu'il porte
       * la coupe ». Ce raisonnement vaut quand le rendu est elle, décalée de
       * quelques points. Il s'effondre quand le rendu est quelqu'un d'autre :
       * il ne porte plus SA coupe à ELLE, il porte la coupe de personne.
       *
       * LA DIFFÉRENCE SE MESURE, ELLE NE SE PRÉFÈRE PAS. C'est précisément ce
       * que l'alignement calcule. Quand il tient, on recompose et on montre.
       * Quand il ne tient pas, sur un métier qui cadre un visage, on le dit et
       * on propose de recommencer — un échec annoncé se refait en dix
       * secondes, une image d'inconnue se montre à des amis et décide de ce
       * qu'on pense du produit.
       *
       * ET ÇA NE CONCERNE QUE LES MÉTIERS DU VISAGE. Un buste — un vêtement
       * sous le menton — n'a pas de visage dans sa zone de travail : le repli
       * centré y reste bon, et c'est le métier qui s'en sert le plus.
       */
      if (zone === "coiffure" || zone === "lunettes") {
        const ali = vRendu ? alignementSurLeRendu(visage, vRendu) : null;
        if (!ali) {
          dire("le rendu n'est pas une retouche de sa photo : on ne le montre pas");
          return {
            erreur: "L’essai n’a pas abouti.",
            pourquoi:
              "le modèle a refabriqué un portrait au lieu de retoucher le vôtre — on peut recommencer",
          };
        }
      }
      const fidele = await reposerLeVisage(photo, j.image, visage, zone, vRendu);
      return { image: fidele, ms: j.ms ?? 0, visageRepose: true };
    } catch (e) {
      dire("la recomposition a échoué : on rend le portrait brut du modèle", e);
      return { image: j.image, ms: j.ms ?? 0 };
    }
  }
  return { image: j.image, ms: j.ms ?? 0 };
}

/** Distingue un rendu d'un souci sans avoir à tester `"image" in x` partout. */
export function estUnRendu(x: Rendu | Souci): x is Rendu {
  return "image" in x;
}
