// Allègement d'une photo AVANT envoi, dans le navigateur.
//
// Une photo de téléphone fait 4 à 8 Mo. Envoyée telle quelle, elle est refusée
// par la route (plafond de taille) et le commerçant ne comprend pas pourquoi.
// On la réduit donc ici : 1200 px de large suffisent largement pour une carte
// de catalogue, et le JPEG à 0,72 divise le poids par vingt sans que l'œil
// s'en aperçoive à cette taille.
//
// Client uniquement (canvas, Image, URL.createObjectURL).
import { zoneRecadrage, LARGEUR_SORTIE, RATIO_FIL } from "./cadrage";

/** Une photo ouverte dans le navigateur, prête à être mesurée puis recadrée.
 *
 *  `liberer()` n'est pas optionnel : chaque `createObjectURL` retient le
 *  fichier en mémoire jusqu'à ce qu'on le relâche, et un commerçant qui essaie
 *  cinq photos de 6 Mo à la suite s'en aperçoit. */
export type PhotoChargee = {
  img: HTMLImageElement;
  largeur: number;
  hauteur: number;
  url: string;
  liberer: () => void;
};

/** Ouvre le fichier et rend ses dimensions réelles, sans rien transformer. */
export function chargerImage(file: File): Promise<PhotoChargee> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () =>
      resolve({
        img,
        largeur: img.naturalWidth || img.width,
        hauteur: img.naturalHeight || img.height,
        url,
        liberer: () => URL.revokeObjectURL(url),
      });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

/**
 * Découpe la photo au rapport de la carte et rend un JPEG.
 *
 * On ne repasse PAS par `compresserImage` : recadrer puis recompresser, c'est
 * deux pertes JPEG au lieu d'une, et ça se voit sur les aplats.
 */
export function recadrerPourLeFil(p: PhotoChargee, decalage: number, qualite = 0.78): string {
  const z = zoneRecadrage(p.largeur, p.hauteur, decalage);
  const w = Math.min(LARGEUR_SORTIE, z.sw);
  const h = Math.round(w / RATIO_FIL);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  // Le lissage de qualité change vraiment quelque chose quand on réduit une
  // photo de 4000 px à 1200 : sans lui, les motifs fins (un tissu, une grille)
  // moirent.
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(p.img, z.sx, z.sy, z.sw, z.sh, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", qualite);
}

/** Redimensionne et recompresse une image en data URI JPEG. */
export function compresserImage(file: File, maxW = 1200, qualite = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / (img.width || maxW));
      const w = Math.max(1, Math.round((img.width || maxW) * scale));
      const h = Math.max(1, Math.round((img.height || maxW) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", qualite));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}
