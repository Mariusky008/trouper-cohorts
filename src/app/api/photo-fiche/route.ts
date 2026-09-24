// 🖼️ LES PHOTOS DE LA FICHE GOOGLE PASSENT PAR NOUS.
//
// ═══ POURQUOI CETTE ROUTE EXISTE ═══════════════════════════════════════════
//
// « Les photos ne sont toujours pas lues. Elles semblent là mais pas
// lisibles, les deux dernières. »
//
// TROIS TOURS QUE J'ESSAIE DE DEVINER LA BONNE ADRESSE. Le suffixe d'une photo
// Google est une commande — `=w86-h86-k-no` — et je l'ai réécrit deux fois
// sans pouvoir vérifier une seule fois, parce que le mandataire de mon
// conteneur refuse la connexion vers `lh3.googleusercontent.com`. À chaque
// tour j'ai mis en ligne l'hypothèse la plus probable, et à chaque tour il a
// vu les mêmes vignettes cassées.
//
// LE SERVEUR DE PRODUCTION, LUI, JOINT GOOGLE SANS PROBLÈME. C'est lui qui a
// récupéré ces adresses. La question n'est donc plus « quelle écriture Google
// accepte-t-il ? » mais « pourquoi le fait-on deviner au NAVIGATEUR ? ».
//
// ON ARRÊTE DE DEVINER : le navigateur demande la photo à NOUS, nous la
// demandons à Google depuis le serveur, et nous lui rendons les octets. Ça
// change la nature du problème :
//
//   · ON ESSAIE PLUSIEURS ÉCRITURES POUR DE VRAI, dans l'ordre, et la première
//     qui répond gagne. Un navigateur ne peut pas faire ça sans afficher une
//     image cassée entre chaque essai.
//   · ON CONNAÎT LE CODE DE RETOUR. Un `<img>` qui échoue ne dit jamais
//     pourquoi ; ici un 403 et un 404 sont deux pannes différentes, et elles
//     s'écrivent dans les journaux.
//   · IL N'Y A PLUS DE REQUÊTE CROISÉE. Ni référent, ni politique d'origine,
//     ni cache tiers : la photo vient du même domaine que la page.
//
// ═══ CE QU'ON REFUSE DE FAIRE, ET POURQUOI ═════════════════════════════════
//
// UNE ROUTE QUI VA CHERCHER UNE ADRESSE QU'ON LUI DONNE EST UNE PORTE. Sans
// garde-fou, n'importe qui peut s'en servir pour faire lire à notre serveur
// une adresse interne — une base de données, un service d'administration, une
// adresse en `169.254` — et nous renvoyer la réponse. C'est pour ça que la
// liste des hôtes autorisés est FERMÉE et qu'elle ne contient que les serveurs
// d'images de Google, et que la redirection est revérifiée à l'arrivée : un
// hôte autorisé qui redirige vers un autre ne doit pas rouvrir la porte.

export const runtime = "nodejs";

/**
 * LES SEULS HÔTES QU'ON ACCEPTE D'ALLER LIRE.
 *
 * ON LES ÉCRIT EN ENTIER PLUTÔT QU'EN MOTIF. `*.googleusercontent.com` se
 * laisse attraper par un nom de domaine acheté pour ça ; une liste de fins de
 * noms vérifiée avec un point devant ne se laisse pas attraper.
 */
const HOTES = [
  ".googleusercontent.com",
  ".ggpht.com",
  ".googleapis.com",
  ".gstatic.com",
];

function hoteAutorise(u: URL): boolean {
  if (u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  return HOTES.some((f) => h.endsWith(f));
}

/**
 * LES ÉCRITURES QU'ON ESSAIE, DANS L'ORDRE.
 *
 * L'ORIGINALE EN PREMIER, ET C'EST LE RENVERSEMENT. On partait du principe
 * qu'il fallait la réécrire pour l'agrandir ; on essaie maintenant D'ABORD
 * celle que Google nous a donnée, parce que c'est la seule dont on soit sûr
 * qu'elle existe. La grande n'est qu'un confort — mieux vaut une vignette de
 * quatre-vingt-six points qui s'affiche qu'une grande qui ne vient pas.
 *
 * ET ON GARDE LA GRANDE EN TÊTE QUAND ELLE MARCHE : l'ordre est « grande,
 * autre grande, originale ». On ne dégrade que si les deux premières
 * échouent.
 */
function ecritures(brut: string): string[] {
  const l: string[] = [];
  const i = brut.lastIndexOf("=");
  const coupe = i > brut.lastIndexOf("/");
  const base = coupe ? brut.slice(0, i) : brut;
  const gardes = (coupe ? brut.slice(i + 1) : "")
    .split("-")
    .filter((j) => j && !/^[whs]\d+$/i.test(j) && j.toLowerCase() !== "c");
  l.push([`${base}=w1600-h1200`, ...gardes].join("-"));
  l.push(`${base}=s1600`);
  l.push(brut);
  // ON NE DEMANDE PAS DEUX FOIS LA MÊME CHOSE : une adresse sans suffixe rend
  // trois fois la même chaîne, et on paierait trois allers-retours pour rien.
  return [...new Set(l)];
}

export async function GET(requete: Request) {
  const u = new URL(requete.url).searchParams.get("u") || "";
  let cible: URL;
  try {
    cible = new URL(u);
  } catch {
    return new Response("adresse illisible", { status: 400 });
  }
  if (!hoteAutorise(cible)) {
    // ON NE DIT PAS « interdit » AVEC LA LISTE : une route qui énumère ce
    // qu'elle accepte apprend à qui la sonde comment s'y prendre.
    return new Response("hôte non autorisé", { status: 400 });
  }

  const essais = ecritures(cible.toString());
  const echecs: string[] = [];
  for (const adresse of essais) {
    let r: Response;
    try {
      r = await fetch(adresse, {
        // GOOGLE REFUSE PARFOIS SUR LE RÉFÉRENT, et c'est l'un des soupçons
        // qu'on n'a jamais pu écarter. Depuis le serveur, on n'en envoie
        // aucun.
        referrerPolicy: "no-referrer",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });
    } catch (e) {
      echecs.push(`${adresse.slice(-24)} → ${e instanceof Error ? e.message : "coupé"}`);
      continue;
    }
    if (!r.ok) {
      echecs.push(`${adresse.slice(-24)} → HTTP ${r.status}`);
      continue;
    }
    // UNE REDIRECTION PEUT SORTIR DE LA LISTE. On revérifie l'arrivée : c'est
    // la moitié de la garde, et c'est celle qu'on oublie.
    try {
      if (r.url && !hoteAutorise(new URL(r.url))) {
        echecs.push(`${adresse.slice(-24)} → redirigée hors liste`);
        continue;
      }
    } catch {
      echecs.push(`${adresse.slice(-24)} → arrivée illisible`);
      continue;
    }
    const type = r.headers.get("content-type") || "";
    // CE QUI N'EST PAS UNE IMAGE N'EN DEVIENT PAS UNE parce qu'on la sert.
    // Google rend une page d'erreur en HTML quand le suffixe ne lui plaît pas,
    // et la servir en `image/*` donnerait exactement la vignette cassée qu'on
    // essaie de faire disparaître.
    if (!type.startsWith("image/")) {
      echecs.push(`${adresse.slice(-24)} → ${type || "sans type"}`);
      continue;
    }
    const octets = await r.arrayBuffer();
    return new Response(octets, {
      headers: {
        "content-type": type,
        // ELLES NE CHANGENT PAS : une photo de fiche Google porte son identité
        // dans son adresse. Un jour de cache épargne autant d'allers-retours.
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  }

  /**
   * ═══ ET QUAND AUCUNE N'A RÉPONDU, ON L'ÉCRIT ══════════════════════════════
   *
   * C'EST TOUTE LA RAISON D'ÊTRE DE CETTE ROUTE. Trois tours durant, la seule
   * information disponible était « la vignette est cassée » — sans code, sans
   * adresse, sans écriture essayée. Cette ligne-là vaut les trois.
   */
  console.warn("[photo-fiche] aucune écriture n'a répondu", JSON.stringify({ u, echecs }));
  return new Response("photo indisponible", { status: 502 });
}
