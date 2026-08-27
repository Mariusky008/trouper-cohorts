// METTRE L'APPLICATION SUR L'ÉCRAN D'ACCUEIL.
//
// POURQUOI ÇA VAUT UN MODULE. Tout était déjà en place —
// `manifest.webmanifest` porte `display: "standalone"` et `start_url:
// "/autour-de-moi"`, `page.tsx` déclare `appleWebApp` — mais PERSONNE NE SAIT
// QUE C'EST POSSIBLE. Une capacité que rien ne montre n'existe pas.
//
// DEUX RAISONS DE LE FAIRE, ET LA PREMIÈRE EST MESURÉE :
//
//  1. LA PLACE. Sur un iPhone 14 Pro, l'écran fait 852 points et Safari n'en
//     rend que 659 : la barre d'adresse et la barre d'onglets en mangent près
//     de deux cents. Installée, la page les perd toutes les deux. C'est le
//     plus gros gain de place disponible, et il ne coûte pas une ligne de
//     mise en page — c'est ce qui a motivé ce travail.
//  2. LE RETOUR. Cent personnes ont ouvert la page et ne sont pas revenues.
//     Un lien dans une conversation se perd le lendemain ; une icône sur
//     l'écran d'accueil, non. Ça ne remplace pas une raison de revenir, mais
//     ça enlève la raison de ne pas revenir.
//
// DEUX MONDES, ET IL FAUT LE DIRE PLUTÔT QUE LE CACHER :
//
//  · ANDROID / CHROME donne un vrai bouton. Le navigateur émet
//    `beforeinstallprompt`, on le garde de côté, et l'appui ouvre la vraie
//    boîte d'installation du système.
//  · IPHONE N'A AUCUNE API. Apple ne laisse aucun site déclencher
//    l'installation : le seul chemin est Partager → « Sur l'écran d'accueil ».
//    On ne peut donc que MONTRER le geste. Prétendre le contraire avec un
//    bouton qui ne ferait rien serait pire que ne rien proposer.
//
// CE QUI NE SORT PAS DU TÉLÉPHONE. On lit `navigator.userAgent` ici pour
// choisir quelle explication afficher — c'est une lecture locale, et elle ne
// part nulle part. Le carnet de parcours n'enregistre que « proposé »,
// « accepté », « refusé » : pas la marque du téléphone, pas le système. Voir
// `parcours.ts`, qui s'interdit explicitement d'envoyer l'agent.

/** Ce que la page peut proposer, et par quel chemin. */
export type Installation = {
  /** Déjà posée sur l'écran d'accueil : on ne propose plus rien. */
  deja: boolean;
  /**
   * `invite` : le navigateur a offert le vrai bouton.
   * `ios` : pas d'API, on montre le geste.
   * `aucune` : ni l'un ni l'autre — ordinateur, ou navigateur qui ne sait pas.
   */
  chemin: "invite" | "ios" | "aucune";
};

type Invite = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let invite: Invite | null = null;
const abonnes = new Set<() => void>();

/**
 * L'INSTANTANÉ EST GARDÉ, PAS RECALCULÉ.
 *
 * `useSyncExternalStore` compare les instantanés par identité : rendre un
 * objet neuf à chaque appel fait boucler React jusqu'à l'écran blanc. Le
 * défaut a déjà été payé une fois sur cette page, avec l'horloge. On ne
 * remplace donc cet objet que lorsque quelque chose change vraiment.
 */
let etat: Installation = { deja: false, chemin: "aucune" };
export const RIEN_A_INSTALLER: Installation = { deja: false, chemin: "aucune" };

function prevenir() {
  for (const f of abonnes) f();
}

/** Posée sur l'écran d'accueil ? Les deux navigateurs ne le disent pas pareil. */
function dejaPosee(): boolean {
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
    // Safari sur iPhone ignore `display-mode` et pose ce drapeau à la place.
    const n = window.navigator as Navigator & { standalone?: boolean };
    return n.standalone === true;
  } catch {
    return false;
  }
}

/** iPhone ou iPad — le seul cas où l'on doit expliquer au lieu de proposer. */
function surIphone(): boolean {
  try {
    const ua = window.navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) return true;
    // Depuis iPadOS 13, un iPad se présente comme un Mac : le seul écart qui
    // reste est l'écran tactile.
    return /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1;
  } catch {
    return false;
  }
}

function recalculer() {
  const deja = dejaPosee();
  const chemin: Installation["chemin"] = deja
    ? "aucune"
    : invite
      ? "invite"
      : surIphone()
        ? "ios"
        : "aucune";
  if (etat.deja === deja && etat.chemin === chemin) return;
  etat = { deja, chemin };
  prevenir();
}

let branche = false;

/**
 * ON ÉCOUTE DÈS L'IMPORT, PAS AU MONTAGE.
 *
 * `beforeinstallprompt` part très tôt — souvent avant que React n'ait rendu
 * quoi que ce soit. Un écouteur posé dans un effet arriverait après, et le
 * bouton ne s'afficherait jamais sur les téléphones où il fonctionne.
 */
function brancher() {
  if (branche || typeof window === "undefined") return;
  branche = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    // Sans ça, Chrome affiche sa propre bannière au moment qui l'arrange. On
    // la garde pour la proposer là où c'est vrai, comme la permission de
    // notification qu'on ne demande qu'au seul instant où elle a un sens.
    e.preventDefault();
    invite = e as Invite;
    recalculer();
  });
  window.addEventListener("appinstalled", () => {
    invite = null;
    recalculer();
  });
  recalculer();
}

brancher();

export function chargerInstallation(): Installation {
  return etat;
}

export function abonnerInstallation(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/**
 * Ouvre la vraie boîte d'installation. Ne rend « accepte » que si la personne
 * a réellement accepté — on ne compte pas une proposition comme une pose.
 */
export async function poserSurLEcran(): Promise<"accepte" | "refuse" | "impossible"> {
  if (!invite) return "impossible";
  try {
    await invite.prompt();
    const { outcome } = await invite.userChoice;
    // Une invitation ne sert qu'une fois : le navigateur en émettra une autre
    // s'il juge que c'est encore pertinent.
    invite = null;
    recalculer();
    return outcome === "accepted" ? "accepte" : "refuse";
  } catch {
    return "impossible";
  }
}
