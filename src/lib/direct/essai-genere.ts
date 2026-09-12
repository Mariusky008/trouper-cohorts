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

export type Rendu = {
  image: string;
  ms: number;
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
  signal?: AbortSignal;
}): Promise<Rendu | Souci> {
  let photo: string;
  let reference: string;
  try {
    [photo, reference] = await Promise.all([reduire(opts.photo), reduire(opts.reference)]);
  } catch (e) {
    return { erreur: "Photo illisible.", pourquoi: e instanceof Error ? e.message : String(e) };
  }

  let r: Response;
  try {
    r = await fetch("/api/direct/essayer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        photo,
        reference,
        partie: opts.partie,
        garder: opts.garder ?? [],
        change: opts.change ?? "",
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
  return { image: j.image, ms: j.ms ?? 0 };
}

/** Distingue un rendu d'un souci sans avoir à tester `"image" in x` partout. */
export function estUnRendu(x: Rendu | Souci): x is Rendu {
  return "image" in x;
}
