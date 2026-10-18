/**
 * 🖼️ SA PHOTOTHÈQUE — toutes ses photos et vidéos, rangées une fois, où l'on pioche ensuite.
 *
 * « Il faudrait un endroit sur son admin où il peut placer toutes ses photos et
 * vidéos, dans lesquelles on peut piocher. » Il les dépose depuis son Espace Pro
 * (onglet « Photothèque ») ; au comptoir, à l'étape des photos, « Dans ma
 * photothèque » les lui propose au lieu de reprendre une photo.
 *
 * RIEN EN BASE : les fichiers vivent dans le seau `phototheque`, un dossier par
 * commerce (`<id du site>/…`), et la liste est celle du dossier. Pas de table à
 * tenir à jour, rien à désynchroniser : retirer un fichier, c'est le retirer.
 *
 * LES FICHIERS NE PASSENT PAS PAR LE SITE : une requête vers Vercel ne tient pas
 * plus de 4,5 Mo. La route rend une adresse signée, à usage unique, où son
 * téléphone dépose le fichier directement (comme l'interview vidéo).
 *
 * Ce fichier ne contient que des règles : il sert au serveur et au navigateur.
 */

export const SEAU_PHOTOTHEQUE = "phototheque";

/** Au plus, par commerce : de quoi garder un an de prises sans laisser le stockage filer. */
export const MAX_ELEMENTS = 300;
/** Une photo est réduite dans le téléphone avant de partir : 4 Mo est déjà large. */
export const MAX_OCTETS_PHOTO = 4 * 1024 * 1024;
/** Une vidéo d'une minute filmée au téléphone, en qualité normale. */
export const MAX_OCTETS_VIDEO = 50 * 1024 * 1024;
export const MAX_SECONDES_VIDEO = 60;

/** Les formats acceptés, et l'extension sous laquelle chacun est rangé. */
export const TYPES_PHOTOTHEQUE: Record<string, { ext: string; genre: "photo" | "video" }> = {
  "image/jpeg": { ext: "jpg", genre: "photo" },
  "image/png": { ext: "png", genre: "photo" },
  "image/webp": { ext: "webp", genre: "photo" },
  "video/mp4": { ext: "mp4", genre: "video" },
  "video/webm": { ext: "webm", genre: "video" },
  "video/quicktime": { ext: "mov", genre: "video" },
};

/** Ce qu'on sait d'un fichier de sa photothèque. */
export type ElementPhototheque = {
  /** `<id du site>/<horodatage>-<hasard>.<ext>` : ce qui sert à le retirer. */
  chemin: string;
  url: string;
  genre: "photo" | "video";
  octets: number;
  ajouteLe: string | null;
};

/** Le nom d'un fichier tel que la route le donne — rien d'autre ne se retire. */
const NOM = /^\d{10,16}-[a-z0-9]{4,12}\.(jpg|png|webp|mp4|webm|mov)$/;

export function genreDuNom(nom: string): "photo" | "video" | null {
  const m = NOM.exec(nom);
  if (!m) return null;
  return ["mp4", "webm", "mov"].includes(m[1]) ? "video" : "photo";
}

/** Un chemin qu'il peut retirer : dans SON dossier, et au nom que la route a donné. */
export function cheminASoi(siteId: string, chemin: string): boolean {
  if (!siteId || !chemin.startsWith(`${siteId}/`)) return false;
  return genreDuNom(chemin.slice(siteId.length + 1)) !== null;
}

/** « 42 photos · 5 vidéos ». */
export function compteEnMots(elements: ElementPhototheque[]): string {
  const photos = elements.filter((e) => e.genre === "photo").length;
  const videos = elements.length - photos;
  const p = `${photos} photo${photos > 1 ? "s" : ""}`;
  return videos ? `${p} · ${videos} vidéo${videos > 1 ? "s" : ""}` : p;
}
