// LE CARNET DE PARCOURS DE LA MAQUETTE HABITANT.
//
// POURQUOI. Cent personnes ont ouvert `/autour-de-moi` et ne sont pas revenues.
// On ne savait pas ce qu'elles y avaient fait : la page ne mesurait rien. Ce
// fichier répond à une seule question — OÙ EST-CE QU'ILS S'ARRÊTENT — et il
// s'arrête là. Voir `supabase/migrations/20260823120000_apercu_parcours.sql`
// pour ce qu'on refuse de stocker et pourquoi.
//
// TROIS RÈGLES QUI TIENNENT TOUT LE FICHIER :
//
//  1. AUCUN COOKIE, AUCUNE PERSISTANCE. Le jeton de session vit dans
//     `sessionStorage` : il meurt avec l'onglet, donc deux visites de la même
//     personne sont deux inconnus. On perd la capacité de suivre quelqu'un dans
//     le temps ; c'est exactement ce qu'on veut perdre.
//  2. RIEN DE CE QUE LA PERSONNE ÉCRIT NE PART. On compte qu'une demande est
//     partie, jamais son texte.
//  3. LA MESURE NE CASSE JAMAIS CE QU'ELLE MESURE. Tout est sous `try`, l'envoi
//     est un `sendBeacon` dont on ne lit pas la réponse, et l'absence de réseau
//     ne change rien à l'écran.
//
// L'ENVOI EST GROUPÉ. Un balayage produit deux ou trois événements ; un appel
// par événement ferait des dizaines de requêtes pendant qu'on fait glisser une
// carte au doigt. On accumule et on vide toutes les cinq secondes, plus une
// dernière fois quand l'onglet passe en arrière-plan — c'est le seul moment où
// l'on est sûr de pouvoir encore parler, `beforeunload` n'étant pas fiable sur
// téléphone.

/** Le vocabulaire est fermé des deux côtés : ici et dans la route. */
export type Evenement =
  | "ouverture"
  | "carte-vue"
  | "balayage"
  | "garde"
  | "pli-ouvert"
  | "champ-touche"
  | "demande-envoyee"
  | "invitation-recue"
  | "jy-vais"
  | "metier-change"
  | "embauches-vues"
  | "je-passe"
  | "reserve"
  | "note-donnee"
  | "rappel-demande"
  | "photo-ajoutee"
  | "partage"
  | "notif-proposee"
  | "notif-acceptee"
  | "notif-refusee"
  | "fin";

type Ligne = { evenement: Evenement; valeur?: number; contexte?: string };

const ROUTE = "/api/direct/apercu-parcours";
const CLE_SESSION = "clikme-parcours-session";
const VIDANGE_MS = 5000;

let file: Ligne[] = [];
let minuterie: ReturnType<typeof setTimeout> | null = null;
let branche = false;
/** Les événements qu'on ne veut compter qu'une fois par visite. */
const dejaVus = new Set<string>();

function session(): string {
  try {
    const su = window.sessionStorage.getItem(CLE_SESSION);
    if (su) return su;
    // Pas d'identifiant stable, pas d'empreinte : de l'aléatoire, et il meurt
    // avec l'onglet.
    const neuf = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    window.sessionStorage.setItem(CLE_SESSION, neuf);
    return neuf;
  } catch {
    return "";
  }
}

/** Un seuil, pas une taille : de quoi séparer téléphone et ordinateur, rien de plus. */
function largeur(): "petit" | "moyen" | "grand" {
  const l = window.innerWidth;
  return l < 380 ? "petit" : l < 900 ? "moyen" : "grand";
}

function vider() {
  minuterie = null;
  if (!file.length) return;
  const lot = file;
  file = [];
  try {
    const s = session();
    if (!s) return;
    const corps = JSON.stringify({ session: s, largeur: largeur(), lot });
    // `sendBeacon` survit à la fermeture de l'onglet, contrairement à `fetch`.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ROUTE, new Blob([corps], { type: "application/json" }));
    } else {
      void fetch(ROUTE, { method: "POST", body: corps, keepalive: true }).catch(() => {});
    }
  } catch {
    /* Sans réseau, la visite se passe exactement pareil. */
  }
}

/**
 * Note une étape. Sans effet côté serveur ni côté écran : appeler cette
 * fonction ne doit jamais pouvoir changer ce que la personne voit.
 */
export function noter(evenement: Evenement, valeur?: number, contexte?: string) {
  if (typeof window === "undefined") return;
  try {
    file.push({ evenement, valeur, contexte });
    if (!branche) {
      branche = true;
      // `visibilitychange` plutôt que `beforeunload` : sur téléphone, quitter
      // une page ne déclenche pas `beforeunload`, et on perdrait la fin de tous
      // les parcours — c'est-à-dire précisément ce qu'on cherche à mesurer.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") vider();
      });
    }
    if (!minuterie) minuterie = setTimeout(vider, VIDANGE_MS);
  } catch {
    /* idem */
  }
}

/** La même chose, mais une seule fois par visite. Pour les seuils de parcours. */
export function noterUneFois(cle: string, evenement: Evenement, valeur?: number, contexte?: string) {
  if (dejaVus.has(cle)) return;
  dejaVus.add(cle);
  noter(evenement, valeur, contexte);
}
