/**
 * 📷 UNE PHOTO RAMENÉE À UNE TAILLE RAISONNABLE, DANS LE NAVIGATEUR — avant de partir au serveur (une photo de
 * téléphone fait 4 à 12 Mo ; le serveur n'en accepte pas plus de 4,5). Rend une adresse `data:` en JPEG.
 *
 * FICHIER DU NAVIGATEUR (il dessine dans un canvas).
 */
export async function reduireImage(fichier: File, cote = 1600, qualite = 0.86, type: "image/jpeg" | "image/webp" = "image/jpeg"): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("image"));
      i.src = url;
    });
    const k = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(type, qualite);
  } finally {
    URL.revokeObjectURL(url);
  }
}
