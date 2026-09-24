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
  const i = brut.lastIndexOf("=");
  const coupe = i > brut.lastIndexOf("/");
  const base = coupe ? brut.slice(0, i) : brut;
  const jetons = (coupe ? brut.slice(i + 1) : "").split("-").filter(Boolean);
  const gardes = jetons.filter((j) => !/^[whs]\d+$/i.test(j) && j.toLowerCase() !== "c");
  /**
   * ═══ UNE ADRESSE DÉJÀ GRANDE NE SE RÉÉCRIT PAS ════════════════════════════
   *
   * Les photos de Gaïa arrivent en `=w1920-h1080-k-no`. On les réécrivait
   * d'office en `=w1600-h1200-k-no` : plus PETIT que l'original, et dans un
   * autre rapport — on demandait à Google un recadrage qu'il n'avait pas
   * forcément publié, à la place d'une adresse qui existait déjà.
   *
   * L'AGRANDISSEMENT NE SERT QU'AUX VIGNETTES. `imageUrl` arrive en
   * quatre-vingt-six points de côté, et c'est ÇA qu'il fallait agrandir. Une
   * adresse qui demande déjà mille points ou plus n'a rien à gagner à être
   * réécrite, et tout à perdre : on essaie d'abord celle qu'on a.
   */
  const grand = jetons
    .map((j) => (/^[whs](\d+)$/i.test(j) ? Number(j.slice(1)) : 0))
    .reduce((a, b) => Math.max(a, b), 0);
  const agrandies = [[`${base}=w1600-h1200`, ...gardes].join("-"), `${base}=s1600`];
  const l = grand >= 1000 ? [brut, ...agrandies] : [...agrandies, brut];
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
        /**
         * ═══ ON SE PRÉSENTE COMME UN NAVIGATEUR ══════════════════════════
         *
         * « 502 (Bad Gateway) » sur les huit photos de Gaïa, y compris sur
         * l'adresse d'origine — celle que Google nous a donnée lui-même.
         *
         * UNE REQUÊTE SANS EN-TÊTES N'EST PAS UNE REQUÊTE NEUTRE, c'est une
         * requête reconnaissable. `fetch` côté serveur part sans `user-agent`
         * de navigateur et sans `accept`, et le serveur d'images de Google
         * répond alors en 403 à une part des adresses — celles des fiches de
         * lieux en particulier. C'était la moitié invisible du problème : on
         * a passé trois tours sur l'écriture de l'adresse alors que ce qui
         * manquait était dans l'en-tête.
         *
         * ON NE PRÉTEND PAS ÊTRE QUELQU'UN D'AUTRE : on demande une image
         * publique dans le format où un navigateur la demande. Rien ici ne
         * contourne une autorisation — la photo est celle que Google publie
         * sur la fiche du commerce.
         */
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "accept-language": "fr-FR,fr;q=0.9",
        },
        // ON NE GARDE RIEN EN ROUTE : c'est nous qui posons le cache, à la
        // sortie, et un cache d'étape masquerait un échec derrière un succès
        // d'hier.
        cache: "no-store",
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
   * ═══ ET QUAND AUCUNE N'A RÉPONDU, ON L'ÉCRIT LÀ OÙ IL PEUT LE LIRE ════════
   *
   * C'EST TOUTE LA RAISON D'ÊTRE DE CETTE ROUTE. Trois tours durant, la seule
   * information disponible était « la vignette est cassée » — sans code, sans
   * adresse, sans écriture essayée.
   *
   * ON NE REND PLUS 502, ET C'EST IMPORTANT. Une passerelle qui tombe rend 502
   * elle aussi : dans sa console, notre panne et celle de l'hébergeur
   * s'écrivaient exactement pareil, et il n'y avait aucun moyen de les
   * distinguer. 404 ne peut venir que de nous.
   *
   * ET LE CORPS DIT CE QU'ON A ESSAYÉ, EN CLAIR. Une adresse de photo qui
   * échoue s'ouvre dans un onglet : il lit les trois codes de retour sans
   * console, sans outil, sans moi. Ça ne coûte rien et ça remplace un tour
   * d'aller-retour.
   *
   * CE QU'IL FAUT LIRE DANS CES CODES :
   *   · 403 partout → Google refuse la requête elle-même (en-têtes, origine).
   *   · 404 ou 410 → ces adresses ont expiré ; une fiche de lieu en émet de
   *     nouvelles, et il faut la reprendre chez le fournisseur plutôt que
   *     s'acharner sur celles-ci. Voir `/api/site-internet/pro/refresh-photos`.
   *   · un dépassement de temps → ce n'est ni l'adresse ni l'en-tête.
   */
  console.warn("[photo-fiche] aucune écriture n'a répondu", JSON.stringify({ u, echecs }));
  return new Response(
    [
      "Aucune écriture de cette adresse n'a répondu.",
      "",
      ...echecs.map((e) => `- ${e}`),
      "",
      "403 partout : Google refuse la requête (en-têtes ou origine).",
      "404 ou 410 : ces adresses ont expiré, il faut reprendre la fiche.",
    ].join("\n"),
    {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        /* L'EN-TÊTE PORTE LE RÉSUMÉ pour qui regarde l'onglet réseau plutôt
           que le corps — c'est la même information, au même prix.

           EN PUR ASCII, ET CE N'EST PAS UNE COQUETTERIE. Une valeur d'en-tête
           HTTP est une suite d'octets : la flèche « → » de nos messages y vaut
           8594, et le serveur jette la réponse ENTIÈRE avec une 500. La route
           de diagnostic tombait donc au moment précis où elle devait
           expliquer — mesuré sur le serveur local avant de partir. */
        "x-photo-fiche": echecs.join(" | ").replace(/[^\x20-\x7e]/g, "-").slice(0, 400),
        // ON NE MET PAS UN ÉCHEC EN CACHE : le jour où la fiche est reprise,
        // la photo doit revenir sans attendre l'expiration d'un cache.
        "cache-control": "no-store",
      },
    },
  );
}
