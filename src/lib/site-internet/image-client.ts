// Allègement d'une photo AVANT envoi, dans le navigateur.
//
// Une photo de téléphone fait 4 à 8 Mo. Envoyée telle quelle, elle est refusée
// par la route (plafond de taille) et le commerçant ne comprend pas pourquoi.
// On la réduit donc ici : 1200 px de large suffisent largement pour une carte
// de catalogue, et le JPEG à 0,72 divise le poids par vingt sans que l'œil
// s'en aperçoive à cette taille.
//
// Client uniquement (canvas, Image, URL.createObjectURL).

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
