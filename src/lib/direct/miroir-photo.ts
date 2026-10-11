// 🪞 MON MIROIR — la photo de référence, gardée sur le téléphone.
//
// « L'utilisateur garde une photo de référence dans Ma Maison, et ClikMe peut
// ensuite la réutiliser pour lui faire essayer les propositions des
// commerçants avant de se déplacer. » Puis : « Votre photo reste privée. Vous
// décidez quand elle est utilisée. »
//
// ELLE NE QUITTE PAS LE TÉLÉPHONE TOUTE SEULE : ni synchronisation, ni copie
// sur le serveur. Elle ne part qu'avec un essai que l'on lance soi-même (la
// photo va alors au moteur d'essayage, comme une photo prise sur le moment).
// D'où IndexedDB, pas la Maison privée : une photo de visage n'a rien à faire
// dans une sauvegarde.
//
// RÉDUITE AVANT D'ÊTRE RANGÉE (1 200 points) : assez pour un essai, sans
// garder douze mégapixels qu'on renverrait à chaque fois. Décodée par une
// image ordinaire, pas par `createImageBitmap` : certaines versions d'iOS
// ignorent alors l'orientation de la photo, et un selfie arriverait couché.
//
// SAFARI EFFACE CE QU'UN SITE GARDE après sept jours sans visite (sauf une
// application ajoutée à l'écran d'accueil). On demande donc au navigateur
// de la garder (`navigator.storage.persist`) ; s'il refuse, le Miroir
// redevient vide et son tuto revient — rien ne casse.
//
// LE PORTRAIT D'ABORD. « Plus tard, dans la même pièce : Mon visage, Mes
// mains (ongles, bagues), Mon poignet (bracelet, montre) — mais seulement
// lorsque ces usages sont réellement développés. » Une seule photo, `moi`,
// pour l'instant ; d'autres clés le jour venu.

import { useEffect, useSyncExternalStore } from "react";
import { reduirePhoto } from "@/lib/direct/dressing-depot";

/** Réduit la photo en passant par une image (orientation respectée), sinon par la voie du dressing. */
async function reduire(f: Blob, max: number, qualite: number): Promise<string | null> {
  const url = URL.createObjectURL(f);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", qualite);
  } catch {
    const r = await reduirePhoto(f, max, qualite).catch(() => null);
    return r?.dataUrl ?? null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type EtatMiroir = { pret: boolean; photo: string | null; t?: number };

const BASE = "clikme-miroir";
const TIROIR = "photo";
const CLE = "moi";
const VIDE: EtatMiroir = { pret: false, photo: null };
let etat: EtatMiroir = VIDE;
let chargement: Promise<void> | null = null;
const abonnes = new Set<() => void>();

const publier = (suite: EtatMiroir) => {
  etat = suite;
  abonnes.forEach((f) => f());
};

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(TIROIR)) r.result.createObjectStore(TIROIR);
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

async function tiroir<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await ouvrir();
  return new Promise<T>((ok, ko) => {
    const t = db.transaction(TIROIR, mode);
    const r = f(t.objectStore(TIROIR));
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
    t.oncomplete = () => db.close();
  });
}

/** Lit la photo une fois par visite ; les pages qui s'abonnent après l'ont aussitôt. */
export function brancherMiroir(): Promise<void> {
  if (chargement) return chargement;
  chargement = (async () => {
    try {
      const v = await tiroir<{ photo?: string; t?: number } | undefined>("readonly", (s) => s.get(CLE));
      publier({ pret: true, photo: typeof v?.photo === "string" ? v.photo : null, t: v?.t });
    } catch {
      // NAVIGATION PRIVÉE, STOCKAGE REFUSÉ : pas de Miroir, et l'écran le dira comme un Miroir vide.
      publier({ pret: true, photo: null });
    }
  })();
  return chargement;
}

export function abonnerMiroir(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}
export const lireMiroir = () => etat;
const miroirServeur = () => VIDE;

/** L'état du Miroir, branché à la première lecture. Le serveur n'en sait rien. */
export function useMiroir(): EtatMiroir {
  useEffect(() => {
    void brancherMiroir();
  }, []);
  return useSyncExternalStore(abonnerMiroir, lireMiroir, miroirServeur);
}

/** Range la photo choisie (réduite). Rend `false` si elle n'a pas pu l'être. */
export async function garderPhotoMiroir(f: Blob): Promise<boolean> {
  const photo = await reduire(f, 1200, 0.86);
  if (!photo) return false;
  const t = Date.now();
  try {
    await tiroir("readwrite", (s) => s.put({ photo, t }, CLE));
  } catch {
    return false;
  }
  publier({ pret: true, photo, t });
  // QU'IL LA GARDE AU-DELÀ DE SEPT JOURS, S'IL L'ACCEPTE (voir plus haut).
  void navigator.storage?.persist?.().catch(() => false);
  return true;
}

/** « Retirer ma photo » : le Miroir redevient vide, et son tuto revient. */
export async function oublierPhotoMiroir(): Promise<void> {
  try {
    await tiroir("readwrite", (s) => s.delete(CLE));
  } catch {
    /* rien */
  }
  publier({ pret: true, photo: null });
}
