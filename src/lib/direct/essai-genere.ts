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
  signal?: AbortSignal;
}): Promise<Rendu | Souci> {
  let photo: string;
  let reference: string;
  try {
    [photo, reference] = await Promise.all([reduire(opts.photo), reduire(opts.reference)]);
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
  if (zone) {
    visage = await trouverLeVisage(photo);
    if (visage) {
      try {
        masque = masqueDEssai(visage, zone);
      } catch {
        // UN MASQUE QU'ON NE SAIT PAS DESSINER N'EMPÊCHE PAS L'ESSAI. On part
        // sans lui, et la recomposition tient encore : elle n'a besoin que du
        // contour, qu'on a déjà.
        masque = "";
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
      const fidele = await reposerLeVisage(photo, j.image, visage, zone, vRendu);
      return { image: fidele, ms: j.ms ?? 0, visageRepose: true };
    } catch {
      return { image: j.image, ms: j.ms ?? 0 };
    }
  }
  return { image: j.image, ms: j.ms ?? 0 };
}

/** Distingue un rendu d'un souci sans avoir à tester `"image" in x` partout. */
export function estUnRendu(x: Rendu | Souci): x is Rendu {
  return "image" in x;
}
