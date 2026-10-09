/**
 * 🔔 LA CLOCHE DES SALONS — « Je vous préviens quand vos amis votent ? »
 *
 * DEMANDÉE AU BON MOMENT, ET UNE SEULE FOIS : quand il vient de lancer un
 * duel à plusieurs (ou de voter à celui d'un ami), c'est-à-dire quand « je
 * vous préviens » annonce quelque chose de précis. Un refus du navigateur est
 * définitif ; un « Non merci » est retenu sur ce téléphone, et on ne redemande
 * pas.
 *
 * DANS LA VRAIE VILLE, l'abonnement part au serveur (`/api/direct/push`), qui
 * prévient même téléphone en poche (voir `lib/direct/push-salons.ts`). DANS LA
 * DÉMONSTRATION, il n'y a personne d'autre : la notification est locale, et
 * ne sonne que si l'écran n'est pas regardé.
 */

const CLE = "clikme-cloche-v1";
const PORTEE = "/autour-de-moi/";

export type EtatCloche = "indisponible" | "refusee" | "a-demander" | "allumee" | "ecartee";

const abonnes = new Set<() => void>();
const prevenirLesAbonnes = () => abonnes.forEach((f) => f());
export function abonnerCloche(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

function lire(): string {
  try {
    return window.localStorage.getItem(CLE) || "";
  } catch {
    return "";
  }
}
function ecrire(v: string) {
  try {
    window.localStorage.setItem(CLE, v);
  } catch {
    /* refusé : on le redemandera, rien ne casse */
  }
  prevenirLesAbonnes();
}

export function etatDeLaCloche(): EtatCloche {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return "indisponible";
  if (Notification.permission === "denied") return "refusee";
  const v = lire();
  if (Notification.permission === "granted" && (v === "oui" || v === "serveur")) return "allumee";
  if (v === "non") return "ecartee";
  return "a-demander";
}

export const ecarterLaCloche = () => ecrire("non");

/** La clé publique VAPID, en octets — ce que `pushManager.subscribe` attend. */
function enOctets(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const brut = window.atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const o = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) o[i] = brut.charCodeAt(i);
  return o;
}

/** Le service worker de `/autour-de-moi/`, une fois actif : `ready` n'aboutit pas hors de sa portée (`/ville/…`). */
async function travailleur(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register(`${PORTEE}sw.js`, { scope: PORTEE });
  if (reg.active) return reg;
  const enCours = reg.installing ?? reg.waiting;
  if (enCours)
    await new Promise<void>((ok) => {
      const t = window.setTimeout(ok, 8000);
      enCours.addEventListener("statechange", () => {
        if (enCours.state === "activated") {
          window.clearTimeout(t);
          ok();
        }
      });
    });
  return reg;
}

/**
 * ALLUMER LA CLOCHE. `ville` : la vraie ville (son abonnement part au
 * serveur) ; absente, c'est la démonstration.
 */
export async function allumerLaCloche(ville?: string): Promise<EtatCloche> {
  if (etatDeLaCloche() === "indisponible") return "indisponible";
  try {
    const r = await Notification.requestPermission();
    if (r !== "granted") {
      prevenirLesAbonnes();
      return r === "denied" ? "refusee" : "a-demander";
    }
    const reg = await travailleur();
    const cle = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
    let serveur = false;
    // UN IPHONE DANS SAFARI N'A PAS DE PUSH (il faut l'application sur l'écran d'accueil) : la cloche
    // reste locale, et l'écran ne promettra pas « téléphone en poche ».
    if (ville && cle && "PushManager" in window) {
      try {
        const abo = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: enOctets(cle) }));
        const r = await fetch("/api/direct/push", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "abonner", ville, abonnement: abo.toJSON() }),
        });
        serveur = r.ok;
      } catch {
        serveur = false;
      }
    }
    ecrire(serveur ? "serveur" : "oui");
    return "allumee";
  } catch {
    prevenirLesAbonnes();
    return etatDeLaCloche();
  }
}

/**
 * DANS LA DÉMONSTRATION : une notification locale, seulement quand l'écran
 * n'est pas regardé — devant le salon, la carte suffit.
 */
export async function sonnerIci(n: { titre: string; corps: string; tag: string }) {
  if (etatDeLaCloche() !== "allumee" || document.visibilityState === "visible") return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(PORTEE);
    await reg?.showNotification(n.titre, {
      body: n.corps,
      tag: n.tag,
      icon: "/icon-512.png",
      badge: "/icon.svg",
      data: { url: window.location.pathname + window.location.search },
    });
  } catch {
    /* refusé : rien ne sonne, rien ne casse */
  }
}

/** Son abonnement est bien parti au serveur : il sera prévenu téléphone en poche. Sinon, seulement l'onglet ouvert. */
export const prevenuEnPoche = () => typeof window !== "undefined" && lire() === "serveur";

/** La vraie ville de la page, quand on y est : `/ville/dax/…` → « dax ». */
export const villeDeLaPage = () => (typeof window === "undefined" ? undefined : window.location.pathname.match(/^\/ville\/([^/]+)/)?.[1]);
