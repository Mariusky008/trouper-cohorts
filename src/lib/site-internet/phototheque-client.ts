/**
 * 🖼️ SA PHOTOTHÈQUE, CÔTÉ TÉLÉPHONE — déposer, lister, retirer, et piocher.
 *
 * Une photo est réduite ICI avant de partir (1800 points, JPEG) : une photo de
 * téléphone pèse 4 à 8 Mo, et il en dépose des dizaines d'un coup. Une vidéo
 * part telle quelle, une minute au plus (sa durée se lit ici : le serveur ne
 * sait pas la lire sans outil). Le fichier va directement dans notre stockage,
 * par l'adresse signée que rend `/api/site-internet/pro/phototheque`.
 *
 * FICHIER NAVIGATEUR.
 */
import { createClient } from "@/lib/supabase/client";
import { MAX_SECONDES_VIDEO, TYPES_PHOTOTHEQUE, type ElementPhototheque } from "./phototheque";

type Reponse = { ok: boolean; erreur?: string; elements?: ElementPhototheque[]; json?: Record<string, unknown> };

export async function appelPhototheque(slug: string, token: string, corps: Record<string, unknown>): Promise<Reponse> {
  try {
    const r = await fetch("/api/site-internet/pro/phototheque", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, token, ...corps }),
    });
    const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok) return { ok: false, erreur: String(json.error ?? `Erreur ${r.status}`) };
    return { ok: true, json, elements: Array.isArray(json.elements) ? (json.elements as ElementPhototheque[]) : undefined };
  } catch {
    return { ok: false, erreur: "Pas de connexion. Réessaie dans un instant." };
  }
}

/** La photo réduite à 1800 points au plus, en JPEG. */
async function photoReduite(fichier: File, large = 1800): Promise<Blob> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("illisible"));
      i.src = url;
    });
    const k = Math.min(1, large / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const toile = document.createElement("canvas");
    toile.width = Math.max(1, Math.round((img.naturalWidth || img.width) * k));
    toile.height = Math.max(1, Math.round((img.naturalHeight || img.height) * k));
    const ctx = toile.getContext("2d");
    if (!ctx) throw new Error("illisible");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, toile.width, toile.height);
    ctx.drawImage(img, 0, 0, toile.width, toile.height);
    const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, "image/jpeg", 0.85));
    if (!blob) throw new Error("illisible");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** La durée d'une vidéo, en secondes ; `null` si le téléphone ne sait pas la lire. */
function dureeVideo(fichier: File): Promise<number | null> {
  return new Promise((ok) => {
    const url = URL.createObjectURL(fichier);
    const v = document.createElement("video");
    const fin = (d: number | null) => {
      URL.revokeObjectURL(url);
      ok(d);
    };
    v.preload = "metadata";
    v.onloadedmetadata = () => fin(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => fin(null);
    window.setTimeout(() => fin(null), 8000);
    v.src = url;
  });
}

/**
 * DÉPOSER UN FICHIER DANS SA PHOTOTHÈQUE.
 * Rend l'élément rangé, ou ce qui l'en a empêché, dit simplement.
 */
export async function deposerDansPhototheque(
  slug: string,
  token: string,
  fichier: File,
): Promise<{ ok: true; element: ElementPhototheque } | { ok: false; erreur: string }> {
  const video = fichier.type.startsWith("video/");
  let corps: Blob = fichier;
  let type = fichier.type.split(";")[0].toLowerCase();
  if (video) {
    if (!TYPES_PHOTOTHEQUE[type]) return { ok: false, erreur: `« ${fichier.name} » : ce format de vidéo n’est pas accepté (MP4, MOV ou WebM).` };
    const d = await dureeVideo(fichier);
    if (d !== null && d > MAX_SECONDES_VIDEO + 0.5) {
      return { ok: false, erreur: `« ${fichier.name} » dure ${Math.round(d)} s : une minute au plus.` };
    }
  } else if (fichier.type.startsWith("image/")) {
    try {
      corps = await photoReduite(fichier);
      type = "image/jpeg";
    } catch {
      return { ok: false, erreur: `« ${fichier.name} » n’a pas pu s’ouvrir. Essaie en JPEG.` };
    }
  } else {
    return { ok: false, erreur: `« ${fichier.name} » n’est ni une photo ni une vidéo.` };
  }

  const signe = await appelPhototheque(slug, token, { action: "signer", type, taille: corps.size });
  const j = signe.json as { seau?: string; chemin?: string; jeton?: string; url?: string; genre?: "photo" | "video" } | undefined;
  if (!signe.ok || !j?.seau || !j.chemin || !j.jeton || !j.url) return { ok: false, erreur: signe.erreur ?? "L’envoi n’a pas pu commencer." };
  try {
    const { error } = await createClient().storage.from(j.seau).uploadToSignedUrl(j.chemin, j.jeton, new Blob([corps], { type }), { contentType: type });
    if (error) throw new Error(error.message);
  } catch {
    return { ok: false, erreur: video ? "La vidéo n’a pas pu partir. Réessaie, de préférence en wifi." : "La photo n’a pas pu partir. Réessaie." };
  }
  return {
    ok: true,
    element: { chemin: j.chemin, url: j.url, genre: j.genre ?? (video ? "video" : "photo"), octets: corps.size, ajouteLe: new Date().toISOString() },
  };
}

/**
 * PIOCHER UNE PHOTO : la récupérer comme un fichier, pour qu'elle suive
 * exactement le même chemin qu'une photo prise à l'instant.
 */
export async function photoDeLaPhototheque(url: string): Promise<File> {
  const r = await fetch(url, { mode: "cors" });
  if (!r.ok) throw new Error("introuvable");
  const blob = await r.blob();
  return new File([blob], url.split("/").pop() || "photo.jpg", { type: blob.type || "image/jpeg" });
}
