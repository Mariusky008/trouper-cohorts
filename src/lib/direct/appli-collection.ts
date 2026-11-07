/**
 * 📲 CLIKME SUR SON TÉLÉPHONE, ET 🔔 LE MÈME DU JOUR À 11 H 30 (le lot 3, 7 novembre 2026) — le côté téléphone.
 * Le serveur : `appli-collection-serveur.ts` ; l'écran : `app/collection/mon-telephone.tsx`.
 *
 * L'INSTALLER :
 *   · iPhone : pas de bouton « Installer » possible, Safari ne le permet pas. On montre le geste : Partager, puis « Sur
 *     l'écran d'accueil ». D'abord, la page se recharge sur `?appli=<jeton>` : l'appli posée s'ouvrira sur cette adresse,
 *     et y retrouvera SA figurine, même sans les cookies de Safari (`preparerInstallation`, `lierAppli`).
 *   · Android (Chrome) : la vraie proposition du téléphone (`beforeinstallprompt`), gardée pour le bon moment.
 *   · Dans le navigateur d'Instagram, de TikTok… : rien ne s'installe ; on dit comment ouvrir la page dans le vrai.
 *
 * LA NOTIFICATION, DEMANDÉE AU BON MOMENT : juste après sa réponse au mème du jour (« demain, je te préviens ? »), ou à la
 * première ouverture de l'appli posée sur l'iPhone, qui n'a été installée que pour ça. Un refus du navigateur est
 * définitif ; un « plus tard » est retenu une semaine. Il la coupe dans « Moi ». Sur iPhone, une notification n'existe
 * QUE dans l'appli posée sur l'écran d'accueil (`a-installer`).
 */
const CLE_NOTIF = "clikme-notif-jour-v1"; // "oui" | "coupee"
const CLE_PLUS_TARD = "clikme-notif-plus-tard-v1"; // la date du « plus tard »
const SW = "/collection-sw.js";
const PORTEE = "/collection";
const ROUTE = "/api/direct/ma-figurine";

// ─── qui écoute (les écrans se redessinent quand ça change) ───
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());
export function abonnerAppli(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

function lire(cle: string): string {
  try {
    return window.localStorage.getItem(cle) || "";
  } catch {
    return "";
  }
}
function ecrire(cle: string, v: string) {
  try {
    if (v) window.localStorage.setItem(cle, v);
    else window.localStorage.removeItem(cle);
  } catch {
    /* refusé : on redemandera, rien ne casse */
  }
  prevenir();
}

// ─── 📲 l'installer ─────────────────────────────────────────────────────────────────────────────────────────────
export type Plateforme = "iphone" | "android" | "ordinateur" | "dans-une-appli";
export function plateforme(): Plateforme {
  if (typeof navigator === "undefined") return "ordinateur";
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|Instagram|Snapchat|TikTok|musical_ly|BytedanceWebview|LinkedInApp|Line\//i.test(ua)) return "dans-une-appli";
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iphone";
  if (/Android/i.test(ua)) return "android";
  return "ordinateur";
}

/** Ouverte depuis l'icône de l'écran d'accueil (et pas dans un onglet). */
export const estInstallee = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

type Proposition = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let proposition: Proposition | null = null;
let capte = false;
/** Android : la proposition d'installer du téléphone arrive quand il le décide ; on la garde pour le bon moment. */
export function capterLaProposition() {
  if (capte || typeof window === "undefined") return;
  capte = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    proposition = e as Proposition;
    prevenir();
  });
  window.addEventListener("appinstalled", () => {
    proposition = null;
    prevenir();
  });
}
export const peutProposer = () => Boolean(proposition);
export async function proposerInstallation(): Promise<boolean> {
  const p = proposition;
  if (!p) return false;
  proposition = null;
  await p.prompt();
  const choix = await p.userChoice.catch(() => ({ outcome: "dismissed" as const }));
  prevenir();
  return choix.outcome === "accepted";
}

// (la feuille « Comment l'installer », ouverte de n'importe où)
let feuille = false;
export const feuilleOuverte = () => feuille;
export function ouvrirInstallation(oui = true) {
  feuille = oui;
  prevenir();
}

/**
 * IL VEUT L'INSTALLER. Android : la proposition du téléphone, s'il l'a faite. iPhone : la page se recharge sur
 * `?appli=<jeton>#installer` (le manifeste suivra), et la feuille s'ouvre sur le geste à faire. Sans compte, pas de jeton :
 * la feuille s'ouvre tout de suite.
 */
export async function preparerInstallation(): Promise<void> {
  if (proposition) {
    await proposerInstallation();
    return;
  }
  if (plateforme() === "iphone" && !estInstallee()) {
    try {
      const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "appli-jeton" }) });
      const j = (await r.json().catch(() => ({}))) as { jeton?: string };
      if (j.jeton) {
        const u = new URL(window.location.href);
        u.searchParams.set("appli", j.jeton);
        u.hash = "installer";
        window.location.replace(u.toString());
        return;
      }
    } catch {
      /* rien : la feuille s'ouvre quand même, l'appli retrouvera sa figurine par son adresse e-mail */
    }
  }
  ouvrirInstallation();
}

/**
 * L'APPLI S'OUVRE POUR LA PREMIÈRE FOIS sur l'écran d'accueil, avec son jeton : il pose le cookie de SA figurine, puis la
 * page repart sur le mème du jour. Dans Safari (pas encore installée), le jeton attend.
 */
export async function lierSiBesoin(): Promise<void> {
  if (typeof window === "undefined" || !estInstallee()) return;
  const u = new URL(window.location.href);
  const jeton = u.searchParams.get("appli");
  if (!jeton) return;
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "appli-lier", jeton }) }).catch(() => null);
  u.searchParams.delete("appli");
  u.hash = "jour";
  if (r?.ok) window.location.replace(u.toString());
  else window.history.replaceState(null, "", u.toString());
}

// ─── 🔔 la notification du mème du jour ────────────────────────────────────────────────────────────────────────────
export type EtatNotif = "indisponible" | "a-installer" | "refusee" | "a-demander" | "allumee" | "coupee";
const clePublique = () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function etatNotif(): EtatNotif {
  if (typeof window === "undefined") return "indisponible";
  const pf = plateforme();
  // (iPhone : une notification n'existe que dans l'appli posée sur l'écran d'accueil ; dans Instagram & co, nulle part)
  if (pf === "dans-une-appli" || (pf === "iphone" && !estInstallee())) return "a-installer";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window) || !clePublique()) return "indisponible";
  if (Notification.permission === "denied") return "refusee";
  const v = lire(CLE_NOTIF);
  if (Notification.permission === "granted" && v === "oui") return "allumee";
  if (v === "coupee") return "coupee";
  return "a-demander";
}

/** Un « plus tard » de moins d'une semaine : on ne redemande pas. */
export function plusTard(): boolean {
  const t = Date.parse(lire(CLE_PLUS_TARD));
  return Number.isFinite(t) && Date.now() - t < 7 * 86400_000;
}
export const direPlusTard = () => ecrire(CLE_PLUS_TARD, new Date().toISOString());

/** La clé publique VAPID, en octets — ce que `pushManager.subscribe` attend. */
function enOctets(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const brut = window.atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const o = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) o[i] = brut.charCodeAt(i);
  return o;
}

/** Le service worker de `/collection`, une fois actif. */
async function travailleur(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register(SW, { scope: PORTEE });
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

/** « Préviens-moi » : la permission (son geste), l'abonnement, et le serveur le garde ; « C'est réglé ! » arrive. */
export async function allumerNotif(): Promise<{ etat: EtatNotif; erreur?: string }> {
  const avant = etatNotif();
  if (avant === "indisponible" || avant === "a-installer") return { etat: avant };
  try {
    const p = await Notification.requestPermission();
    if (p !== "granted") {
      prevenir();
      return { etat: p === "denied" ? "refusee" : "a-demander" };
    }
    const reg = await travailleur();
    const abo = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: enOctets(clePublique()) }));
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "notif", abonnement: abo.toJSON() }) });
    const j = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) return { etat: etatNotif(), erreur: j.error || "Ça n’a pas marché. Réessaie." };
    ecrire(CLE_NOTIF, "oui");
    ecrire(CLE_PLUS_TARD, "");
    return { etat: "allumee" };
  } catch {
    prevenir();
    return { etat: etatNotif(), erreur: "Ton téléphone n’a pas voulu. Réessaie dans un instant." };
  }
}

/** Il coupe : ce téléphone ne reçoit plus le mème du jour. */
export async function couperNotif(): Promise<EtatNotif> {
  let endpoint = "";
  try {
    const reg = await navigator.serviceWorker.getRegistration(PORTEE);
    const abo = await reg?.pushManager.getSubscription();
    endpoint = abo?.endpoint ?? "";
    await abo?.unsubscribe();
  } catch {
    /* rien : le serveur coupe quand même */
  }
  await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "notif-couper", endpoint }) }).catch(() => null);
  ecrire(CLE_NOTIF, "coupee");
  return "coupee";
}

/** Le serveur a-t-il toujours ce téléphone ? (un abonnement abandonné est effacé là-bas) — sinon, on le redemandera. */
export async function verifierNotif(): Promise<void> {
  if (etatNotif() !== "allumee") return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(PORTEE);
    const abo = await reg?.pushManager.getSubscription();
    const r = abo ? await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "notif-etat", endpoint: abo.endpoint }) }) : null;
    const j = (await r?.json().catch(() => ({}))) as { abonne?: boolean } | undefined;
    if (!abo || (r?.ok && j?.abonne === false)) ecrire(CLE_NOTIF, "");
  } catch {
    /* rien : on garde ce qu'on croyait */
  }
}

/** Tout ce que l'écran doit savoir, en une chaîne (`useSyncExternalStore` compare des valeurs simples). */
export function instantane(): string {
  if (typeof window === "undefined") return "serveur";
  return [etatNotif(), plateforme(), estInstallee() ? "installee" : "", peutProposer() ? "proposable" : "", plusTard() ? "plus-tard" : "", feuille ? "feuille" : ""].join("|");
}
export type Instantane = { notif: EtatNotif; plateforme: Plateforme; installee: boolean; proposable: boolean; plusTard: boolean; feuille: boolean; serveur: boolean };
export function lireInstantane(x: string): Instantane {
  if (x === "serveur") return { notif: "indisponible", plateforme: "ordinateur", installee: false, proposable: false, plusTard: true, feuille: false, serveur: true };
  const [notif, pf, installee, proposable, pt, f] = x.split("|");
  return { notif: notif as EtatNotif, plateforme: pf as Plateforme, installee: installee === "installee", proposable: proposable === "proposable", plusTard: pt === "plus-tard", feuille: f === "feuille", serveur: false };
}
