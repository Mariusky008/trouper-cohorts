// 👔 LE DÉPÔT DU DRESSING, CÔTÉ TÉLÉPHONE — un seul, pour toutes les portes.
//
// ═══ POURQUOI UN SEUL DÉPÔT ════════════════════════════════════════════════
//
// Ma Maison, l'essai d'une boutique dans l'application et la page publique de
// cette boutique s'abonnent au MÊME état : une pièce rangée depuis le look
// d'un magasin apparaît dans Ma Maison sans recharger, et inversement. Écrit
// trois fois, on aurait trois dressings qui se rattrapent.
//
// ═══ OÙ IL VIT ═════════════════════════════════════════════════════════════
//
//   · DANS UNE VRAIE VILLE → SUR LE SERVEUR, dans la Maison privée (voir
//     `dressing-serveur.ts`). C'est ce qui le rend valable sur toutes les pages
//     de clikme.fr — l'application ET les pages des boutiques, qui partagent le
//     cookie d'habitant —, et sur un autre téléphone avec le code e-mail de
//     « Emportez votre Maison avec vous ». Safari n'efface pas ce qui est chez
//     nous au bout de sept jours.
//   · DANS LA DÉMONSTRATION, OU SI LE SERVEUR N'EST PAS LÀ → SUR LE TÉLÉPHONE
//     (IndexedDB), et l'écran le dit. La démo n'a pas de vraie ville à qui
//     rattacher un habitant ; la page démo d'une boutique et l'application démo
//     partagent quand même ce dépôt, puisqu'elles sont sur la même adresse.
//
// ═══ CE QUE LE TÉLÉPHONE FAIT AVANT D'ENVOYER ══════════════════════════════
//
// Il réduit la photo (1 200 points pour la ranger, 640 pour l'analyse) : douze
// mégapixels partis sur un réseau de rue pour être réduits à l'arrivée, c'est
// du temps et du forfait perdus. Et il mesure la couleur au centre de la
// photo : si l'analyse n'est pas branchée, c'est elle qui sert.
import { useEffect, useSyncExternalStore } from "react";
import {
  COULEURS,
  CLES_COULEUR,
  lireVetement,
  type CleCouleur,
  type Fiche,
  type Vetement,
} from "@/lib/direct/dressing";

export type OuVitLeDressing = "serveur" | "appareil" | "memoire";
export type EtatDressing = {
  pret: boolean;
  ou: OuVitLeDressing;
  pieces: Vetement[];
  /** Le serveur était attendu et n'a pas répondu : on garde sur le téléphone, et on le dit. */
  replie: boolean;
};

const ETAT_VIDE: EtatDressing = { pret: false, ou: "appareil", pieces: [], replie: false };
let etat: EtatDressing = ETAT_VIDE;
let ville: string | null = null;
let chargement: Promise<void> | null = null;
/** La ville que la page impose, quand son adresse ne la dit pas. Voir `imposerVilleDuDressing`. */
let villeImposee: string | null | undefined;
const abonnes = new Set<() => void>();

const publier = (suite: Partial<EtatDressing>) => {
  etat = { ...etat, ...suite };
  abonnes.forEach((f) => f());
};

export function abonnerDressing(f: () => void) {
  abonnes.add(f);
  return () => abonnes.delete(f);
}
export const lireDressing = () => etat;
export const dressingServeur = () => ETAT_VIDE;

// ─── LE TÉLÉPHONE (IndexedDB) ──────────────────────────────────────────────

type Rangee = { id: string; fiche: Fiche; blob: Blob; ajouteLe: number };
const BASE = "clikme-dressing";
const TIROIR = "pieces";
/** Les adresses locales qu'on a créées : à libérer quand on recharge. */
let adressesLocales: string[] = [];

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    try {
      const r = indexedDB.open(BASE, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(TIROIR)) r.result.createObjectStore(TIROIR, { keyPath: "id" });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    } catch (e) {
      ko(e);
    }
  });
}

async function tiroir<T>(mode: IDBTransactionMode, faire: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ouvrir();
  return new Promise((ok, ko) => {
    const t = db.transaction(TIROIR, mode);
    const req = faire(t.objectStore(TIROIR));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ko(req.error);
    t.oncomplete = () => db.close();
  });
}

function versVetement(r: Rangee): Vetement | null {
  const url = URL.createObjectURL(r.blob);
  adressesLocales.push(url);
  return lireVetement({ ...r.fiche, id: r.id, photo: url, ajouteLe: r.ajouteLe });
}

async function listerSurLeTelephone(): Promise<Vetement[]> {
  const rangees = (await tiroir<Rangee[]>("readonly", (s) => s.getAll())) ?? [];
  adressesLocales.forEach((u) => URL.revokeObjectURL(u));
  adressesLocales = [];
  return rangees
    .sort((a, b) => b.ajouteLe - a.ajouteLe)
    .map(versVetement)
    .filter((v): v is Vetement => Boolean(v));
}

/** Les photos gardées seulement le temps de la visite (navigation privée sans IndexedDB). */
const enMemoire = new Map<string, Rangee>();

// ─── CHARGER ───────────────────────────────────────────────────────────────

/**
 * LA VILLE QUE L'ADRESSE DIT. L'application d'une vraie ville vit sous
 * `/ville/<ville>` ; la démonstration sous `/autour-de-moi`, sans ville. La
 * page publique d'une boutique, elle, l'impose (`brancherDressing`).
 */
function villeDeLAdresse(): string | null {
  if (typeof window === "undefined") return null;
  return /^\/ville\/([a-z0-9-]{2,60})(\/|$)/.exec(window.location.pathname)?.[1] ?? null;
}

/**
 * BRANCHER LE DÉPÔT. `ville` : la vraie ville de la page ; `null` dans la
 * démonstration ; absent : celle qu'on a déjà, ou celle de l'adresse. Appelé
 * par chaque porte : la première charge, les suivantes réutilisent.
 */
export function brancherDressing(v?: string | null): Promise<void> {
  if (v === undefined) {
    if (chargement) return chargement;
    v = villeImposee !== undefined ? villeImposee : villeDeLAdresse();
  }
  if (chargement && v === ville) return chargement;
  ville = v;
  chargement = charger();
  return chargement;
}

/**
 * LA VILLE QU'UNE PAGE IMPOSE, SANS RIEN CHARGER. La page publique d'un vrai
 * magasin n'a pas `/ville/<ville>` dans son adresse : elle dit ici la ville du
 * commerce (ou `null` pour un commerce inventé). Le dressing n'est lu qu'au
 * premier écran qui en a besoin — la plupart des visiteurs n'en ouvrent aucun.
 */
export function imposerVilleDuDressing(v: string | null): void {
  if (villeImposee === v) return;
  villeImposee = v;
  // Un dépôt déjà branché ailleurs (une autre page de la même visite) se rebranchera au prochain écran.
  if (chargement && v !== ville) chargement = null;
}

/** La vraie ville où vit le dressing en ce moment (`null` : démonstration, ou pas encore branché). */
export const villeDuDepot = (): string | null => ville ?? (villeImposee !== undefined ? villeImposee : villeDeLAdresse());

/** L'état du dressing, pour un écran. Il branche le dépôt s'il ne l'est pas encore. */
export function useDressing(v?: string | null): EtatDressing {
  const e = useSyncExternalStore(abonnerDressing, lireDressing, dressingServeur);
  useEffect(() => {
    void brancherDressing(v);
  }, [v]);
  return e;
}

async function charger(): Promise<void> {
  if (ville) {
    try {
      const r = await fetch("/api/direct/ma-maison/dressing", { cache: "no-store" });
      const j = (await r.json()) as { ok?: boolean; serveur?: boolean; pieces?: unknown[] };
      if (r.ok && j.ok && j.serveur) {
        const pieces = (j.pieces ?? []).map(lireVetement).filter((x): x is Vetement => Boolean(x));
        return publier({ pret: true, ou: "serveur", pieces, replie: false });
      }
    } catch {
      /* le serveur ne répond pas : le téléphone prend le relais, et l'écran le dit */
    }
  }
  try {
    publier({ pret: true, ou: "appareil", pieces: await listerSurLeTelephone(), replie: Boolean(ville) });
  } catch {
    publier({ pret: true, ou: "memoire", pieces: [...enMemoire.values()].map(versVetement).filter((x): x is Vetement => Boolean(x)), replie: Boolean(ville) });
  }
}

// ─── RANGER, CORRIGER, RETIRER ─────────────────────────────────────────────

const nouvelId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/** Ranger une pièce. Rend la pièce rangée, ou la raison pour laquelle elle ne l'est pas. */
export async function rangerPiece(photo: { blob: Blob; dataUrl: string }, fiche: Fiche): Promise<Vetement | { erreur: string }> {
  if (etat.ou === "serveur" && ville) {
    try {
      const r = await fetch("/api/direct/ma-maison/dressing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ville, image: photo.dataUrl, fiche }),
      });
      const j = (await r.json()) as { piece?: unknown; error?: string };
      const v = lireVetement(j.piece);
      if (r.ok && v) {
        publier({ pieces: [v, ...etat.pieces] });
        return v;
      }
      if (r.status !== 503) return { erreur: j.error || "La pièce n'a pas pu être rangée." };
    } catch {
      /* réseau perdu : on garde la pièce sur le téléphone plutôt que de la perdre */
    }
    publier({ ou: "appareil", replie: true });
  }
  const rangee: Rangee = { id: nouvelId(), fiche, blob: photo.blob, ajouteLe: Date.now() };
  try {
    if (etat.ou === "memoire") throw new Error("mémoire");
    await tiroir("readwrite", (s) => s.put(rangee));
  } catch {
    enMemoire.set(rangee.id, rangee);
    publier({ ou: "memoire" });
  }
  const v = versVetement(rangee);
  if (!v) return { erreur: "La pièce n'a pas pu être rangée." };
  publier({ pieces: [v, ...etat.pieces] });
  return v;
}

export async function corrigerPiece(id: string, fiche: Fiche): Promise<boolean> {
  const avant = etat.pieces.find((p) => p.id === id);
  if (!avant) return false;
  if (etat.ou === "serveur") {
    try {
      const r = await fetch("/api/direct/ma-maison/dressing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, fiche }),
      });
      const v = lireVetement(((await r.json()) as { piece?: unknown }).piece);
      if (!r.ok || !v) return false;
      publier({ pieces: etat.pieces.map((p) => (p.id === id ? v : p)) });
      return true;
    } catch {
      return false;
    }
  }
  try {
    const rangee = enMemoire.get(id) ?? (await tiroir<Rangee | undefined>("readonly", (s) => s.get(id)));
    if (!rangee) return false;
    const suite = { ...rangee, fiche };
    if (enMemoire.has(id)) enMemoire.set(id, suite);
    else await tiroir("readwrite", (s) => s.put(suite));
    publier({ pieces: etat.pieces.map((p) => (p.id === id ? { ...p, ...fiche } : p)) });
    return true;
  } catch {
    return false;
  }
}

export async function retirerPiece(id: string): Promise<boolean> {
  if (etat.ou === "serveur") {
    try {
      const r = await fetch(`/api/direct/ma-maison/dressing?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!r.ok) return false;
    } catch {
      return false;
    }
  } else {
    try {
      if (enMemoire.has(id)) enMemoire.delete(id);
      else await tiroir("readwrite", (s) => s.delete(id));
    } catch {
      return false;
    }
  }
  publier({ pieces: etat.pieces.filter((p) => p.id !== id) });
  return true;
}

// ─── LA PHOTO, AVANT DE PARTIR ─────────────────────────────────────────────

/** Une photo du téléphone, remise d'aplomb et réduite. `null` : elle ne s'ouvre pas. */
export async function reduirePhoto(f: Blob, max: number, qualite = 0.86): Promise<{ blob: Blob; dataUrl: string; l: number; h: number } | null> {
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const l = Math.max(1, Math.round(bmp.width * k));
    const h = Math.max(1, Math.round(bmp.height * k));
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, l, h);
    bmp.close?.();
    const dataUrl = c.toDataURL("image/jpeg", qualite);
    const blob = await (await fetch(dataUrl)).blob();
    return { blob, dataUrl, l, h };
  } catch {
    return null;
  }
}

/**
 * LA COULEUR AU CENTRE DE LA PHOTO — la moitié du milieu, là où le vêtement
 * est quand on suit le conseil « bien visible, sur un fond neutre ». On prend
 * la couleur du vocabulaire la plus proche. C'est le repli quand l'analyse
 * n'est pas branchée ; avec elle, c'est elle qui décide.
 */
export async function couleurAuCentre(dataUrl: string): Promise<CleCouleur> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 40;
    c.height = 52;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "gris";
    ctx.drawImage(img, 0, 0, 40, 52);
    const d = ctx.getImageData(10, 13, 20, 26).data;
    let r = 0;
    let g = 0;
    let b = 0;
    const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i];
      g += d[i + 1];
      b += d[i + 2];
    }
    return couleurLaPlusProche(r / n, g / n, b / n);
  } catch {
    return "gris";
  }
}

export function couleurLaPlusProche(r: number, g: number, b: number): CleCouleur {
  let mieux: CleCouleur = "gris";
  let d0 = Infinity;
  for (const cle of CLES_COULEUR) {
    if (cle === "multicolore") continue;
    const h = COULEURS[cle].hex;
    const [R, G, B] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    // Distance pondérée : l'œil est plus sensible au vert qu'au bleu.
    const d = 2 * (r - R) ** 2 + 4 * (g - G) ** 2 + 3 * (b - B) ** 2;
    if (d < d0) {
      d0 = d;
      mieux = cle;
    }
  }
  return mieux;
}

/** Ce que l'analyse dit de la photo. `sansIA` : elle n'est pas branchée ou n'a pas répondu. */
export async function analyserPhoto(dataUrl640: string): Promise<{ fiche: Fiche | null; vetement: boolean; sansIA: boolean }> {
  try {
    const r = await fetch("/api/direct/ma-maison/dressing/analyser", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: dataUrl640 }),
    });
    const j = (await r.json()) as { ok?: boolean; vetement?: boolean; fiche?: Fiche | null };
    if (!r.ok || !j.ok) return { fiche: null, vetement: true, sansIA: true };
    return { fiche: j.fiche ?? null, vetement: j.vetement !== false, sansIA: false };
  } catch {
    return { fiche: null, vetement: true, sansIA: true };
  }
}

/** La photo d'une pièce rangée, en `data:` réduit — pour la confier au moteur du look. */
export async function photoEnDataUrl(v: Pick<Vetement, "photo">, max = 768): Promise<string | null> {
  try {
    const r = await fetch(v.photo);
    if (!r.ok) return null;
    return (await reduirePhoto(await r.blob(), max, 0.88))?.dataUrl ?? null;
  } catch {
    return null;
  }
}

// ─── LE DRESSING D'EXEMPLE, POUR LA DÉMONSTRATION SEULEMENT ───────────────

/**
 * QUATRE PIÈCES POUR ESSAYER SANS OUVRIR SON PLACARD. Dans la démonstration,
 * personne n'a ses vêtements sous la main au moment où il découvre le
 * parcours : sans exemple, l'écran « Bonne nouvelle ! » ne se verrait jamais.
 * Jamais proposé dans une vraie ville — un vrai dressing ne reçoit pas de
 * fausses pièces.
 */
const EXEMPLE: { image: string; fiche: Fiche }[] = [
  { image: "/direct/dressing/demo-tshirt.webp", fiche: { sorte: "haut", couleur: "gris", nom: "T-shirt gris", style: "decontracte", matiere: "coton", saison: "toutes" } },
  { image: "/direct/dressing/demo-jean.webp", fiche: { sorte: "bas", couleur: "jean", nom: "Jean bleu", style: "decontracte", matiere: "denim", saison: "toutes" } },
  { image: "/direct/dressing/demo-baskets.webp", fiche: { sorte: "chaussures", couleur: "blanc", nom: "Baskets blanches", style: "urbain", matiere: "cuir", saison: "toutes" } },
  { image: "/direct/dressing/demo-veste.webp", fiche: { sorte: "dessus", couleur: "camel", nom: "Blazer camel", style: "chic", matiere: "laine", saison: "automne-hiver" } },
];

export const exemplePossible = (e: EtatDressing) => e.pret && e.ou !== "serveur" && !e.replie;

export async function remplirAvecLExemple(): Promise<boolean> {
  if (!exemplePossible(etat)) return false;
  for (const x of EXEMPLE) {
    try {
      const r = await fetch(x.image);
      const p = r.ok ? await reduirePhoto(await r.blob(), 640) : null;
      if (p) await rangerPiece(p, x.fiche);
    } catch {
      /* une pièce d'exemple qui manque n'empêche pas les autres */
    }
  }
  return true;
}
