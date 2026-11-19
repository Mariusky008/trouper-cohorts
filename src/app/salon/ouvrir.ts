/**
 * 🚪 OUVRIR UNE CONVERSATION DU SALON, VITE (`docs/univers/salon-du-duo.md`, sections 7.2, 7.4 et 7.6 ; lot S0b) — côté
 * téléphone, sans React :
 *
 * - `ouvrir(cle)` : une seule requête (`GET /api/direct/proches?ouvrir=`), partagée si elle est déjà partie (un
 *   préchargement), gardée 20 s (rouvrir tout de suite ne relit rien). ⚡ (lot S8) un préchargement ne marque rien
 *   (`&apercu=1`) : sans quoi, dans l'appli, les deux premières conversations de la liste seraient « lues » sans avoir été
 *   ouvertes ; l'ouverture pour de bon qui le reprend dit au serveur qu'elle est lue (`POST { action: "lu" }`) ;
 * - `prechargerImage(img)` : la plaque ou un calque, téléchargé ET décodé hors de l'affichage (`img.decode()`) ; ses
 *   adresses ne changent jamais : le téléphone les garde un an ;
 * - `precharger(cle)` : la conversation et ses images, dans un temps mort (`requestIdleCallback`) ou au premier contact
 *   du doigt (`pointerdown`) ;
 * - les marques de vitesse (`performance.mark`) : `salon:toucher`, `salon:plaque`, `salon:pret` ; `mesures()` les lit,
 *   `envoyerMesures()` les envoie une fois par ouverture, jamais pendant une animation.
 *
 * MODULE DU NAVIGATEUR : à n'importer que dans un composant client.
 */
import type { ImageSalon, OuvertureSalon } from "@/lib/direct/salon";

const GARDE_MS = 20_000;
const enCours = new Map<string, { le: number; p: Promise<OuvertureSalon>; apercu: boolean }>();

/** (✓ l'ouverture pour de bon d'une conversation préchargée : le serveur la marque lue — une fois, jamais bloquant) */
function direLue(cle: string): void {
  void fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "lu", cle }), keepalive: true }).catch(() => undefined);
}

/**
 * La conversation avec ce proche, en une requête (partagée avec un préchargement déjà parti). `apercu` : un
 * préchargement (rien n'est marqué lu).
 */
export function ouvrir(cle: string, { frais = false, apercu = false } = {}): Promise<OuvertureSalon> {
  const deja = enCours.get(cle);
  if (deja && !frais && Date.now() - deja.le < GARDE_MS) {
    // (un préchargement repris pour de bon : la conversation est lue)
    if (deja.apercu && !apercu) {
      deja.apercu = false;
      void deja.p.then(() => direLue(cle)).catch(() => undefined);
    }
    return deja.p;
  }
  const p = fetch(`/api/direct/proches?ouvrir=${encodeURIComponent(cle)}${apercu ? "&apercu=1" : ""}`, { cache: "no-store" }).then(async (r) => {
    const j = (await r.json().catch(() => null)) as { ouverture?: OuvertureSalon; error?: string } | null;
    if (!r.ok || !j?.ouverture) throw new Error(j?.error || "La conversation ne s’ouvre pas.");
    return j.ouverture;
  });
  enCours.set(cle, { le: Date.now(), p, apercu });
  p.catch(() => enCours.delete(cle));
  return p;
}

const decodees = new Map<string, Promise<HTMLImageElement>>();
/**
 * Une image de la scène, téléchargée et décodée hors de l'affichage ; la même promesse pour la même image. (La plus
 * grande largeur, `src` : celle que la scène montre — sur un téléphone, la pièce qui couvre l'écran dépasse 1 080 pixels
 * réels ; le préchargement et la scène prennent ainsi la même adresse, jamais deux téléchargements.)
 */
export function prechargerImage(img: Pick<ImageSalon, "src">): Promise<HTMLImageElement> {
  const deja = decodees.get(img.src);
  if (deja) return deja;
  const i = new Image();
  i.decoding = "async";
  i.src = img.src;
  const p = i.decode().then(
    () => i,
    () => i,
  );
  decodees.set(img.src, p);
  return p;
}

/** Les images d'une ouverture : la plaque, puis les calques des deux figurines (lot S1 : le corps, la tête). */
export function imagesDe(o: OuvertureSalon): Pick<ImageSalon, "src">[] {
  const sc = o.scene;
  if (!sc) return [];
  const c = sc.calques;
  return [sc.plaque, ...(c ? [c.a.corps, c.a.tete, c.b.corps, c.b.tete].map((x) => ({ src: x.fichier })) : [])];
}

/** Précharger une conversation (sa requête, ses images) ; jamais d'erreur. */
export function precharger(cle: string): void {
  ouvrir(cle, { apercu: true })
    .then((o) => Promise.all(imagesDe(o).map((i) => prechargerImage(i))))
    .catch(() => undefined);
}
/** Dans un temps mort (ou tout de suite si le navigateur ne sait pas attendre). */
export function prechargerQuandLibre(cles: string[]): () => void {
  if (typeof window === "undefined") return () => undefined;
  const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
  if (w.requestIdleCallback) {
    const n = w.requestIdleCallback(() => cles.forEach(precharger), { timeout: 3000 });
    return () => w.cancelIdleCallback?.(n);
  }
  const t = setTimeout(() => cles.forEach(precharger), 300);
  return () => clearTimeout(t);
}

// ─── les marques de vitesse ───
export type Marque = "salon:toucher" | "salon:plaque" | "salon:pret";
export function marquer(m: Marque): void {
  try {
    if (m === "salon:toucher") for (const x of ["salon:toucher", "salon:plaque", "salon:pret"]) performance.clearMarks(x);
    performance.mark(m);
  } catch {
    /* sans mesure : tant pis */
  }
}
/** Les durées de la dernière ouverture, depuis le toucher (ms) : la plaque à l'écran, la scène prête. */
export function mesures(): { plaque?: number; pret?: number } {
  try {
    const t = performance.getEntriesByName("salon:toucher", "mark").at(-1)?.startTime;
    if (t == null) return {};
    const d = (m: Marque) => {
      const x = performance.getEntriesByName(m, "mark").at(-1)?.startTime;
      return x == null ? undefined : Math.round(x - t);
    };
    return { plaque: d("salon:plaque"), pret: d("salon:pret") };
  } catch {
    return {};
  }
}
/** Envoyer les mesures d'une ouverture (une fois ; `deja` : la conversation était déjà vue sur ce téléphone). */
export function envoyerMesures(deja: boolean): void {
  const m = mesures();
  if (m.pret == null) return;
  const corps = JSON.stringify({ action: "vitesse", ...m, deja, ecran: Math.round(window.innerWidth) });
  // (après l'animation d'arrivée : jamais sur son chemin)
  setTimeout(() => {
    const ok = typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/direct/salon", new Blob([corps], { type: "application/json" }));
    if (!ok) void fetch("/api/direct/salon", { method: "POST", headers: { "content-type": "application/json" }, body: corps, keepalive: true }).catch(() => undefined);
  }, 2000);
}
