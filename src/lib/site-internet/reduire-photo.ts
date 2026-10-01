/**
 * 📷 REDUIT UNE PHOTO DANS LE NAVIGATEUR AVANT DE L'ENVOYER.
 *
 * Une photo de téléphone pèse de trois à dix mégaoctets ; la couverture n'en a
 * besoin que d'un côté de seize cents points. On la redessine donc ici, en
 * JPEG, et c'est cette version qui part — un envoi de quelques centaines de
 * kilo-octets, qui passe même sur la 4G d'une rue commerçante.
 *
 * FICHIER NAVIGATEUR : il se sert d'un `canvas`.
 */
export async function reduirePhoto(fichier: File, cote = 1600): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(new Error("photo illisible"));
      i.src = url;
    });
    const k = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("photo illisible");
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}
