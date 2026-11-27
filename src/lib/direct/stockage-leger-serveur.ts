/**
 * 🪶 LE STOCKAGE LÉGER (27 novembre 2026). Ce matin-là, Supabase a coupé tout ClikMe : 1,13 Go de fichiers pour 1 Go
 * permis (« Storage Size Exceeded »). Presque tout était en PNG : une figurine du nouveau style range ses calques, ses
 * pièces, son perso, son monde, environ 100 Mo d'images.
 *
 * Désormais, une image PNG déposée dans le seau des figurines (`deposer`, `ma-figurine-serveur.ts`) y est rangée en
 * WebP, environ dix fois plus légère, la transparence gardée telle quelle (`alphaQuality: 100` : les calques se
 * superposent toujours au pixel près). **Son nom ne change pas** (`….png`) : aucune adresse, aucun dossier, aucun
 * code ne bouge. Le téléphone reçoit l'image par son adresse signée, avec le bon type (`image/webp`). Côté serveur,
 * `telecharger` rend toujours un PNG (`enPngSiBesoin`) : le moteur d'images, sharp, les découpes voient ce qu'ils
 * voyaient avant.
 *
 * Les images déjà rangées se convertissent par la page de l'administrateur (`/admin/humain/stockage`), par lots.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";

/** En dessous, une image ne vaut pas la peine d'être reconvertie. */
export const SEUIL_LEGER = 120_000;
/** Une image n'est rangée en WebP que si elle y gagne au moins ce quart. */
const GAIN_MINIMAL = 0.75;

/** Ces octets sont-ils un WebP ? (« RIFF….WEBP ») */
export function estWebp(octets: Buffer): boolean {
  return octets.length > 12 && octets.toString("latin1", 0, 4) === "RIFF" && octets.toString("latin1", 8, 12) === "WEBP";
}

/** Ces octets sont-ils un PNG ? */
export function estPng(octets: Buffer): boolean {
  return octets.length > 8 && octets[0] === 0x89 && octets.toString("latin1", 1, 4) === "PNG";
}

/**
 * Une image PNG assez lourde → la même en WebP (même taille en pixels, transparence gardée). Tout le reste, et toute
 * image qui n'y gagnerait pas, passe tel quel.
 */
export async function allegerImage(octets: Buffer, type: string): Promise<{ octets: Buffer; type: string }> {
  if (type !== "image/png" || octets.length < SEUIL_LEGER || !estPng(octets)) return { octets, type };
  try {
    const webp = await sharp(octets).webp({ quality: 88, alphaQuality: 100, effort: 4 }).toBuffer();
    return webp.length < octets.length * GAIN_MINIMAL ? { octets: webp, type: "image/webp" } : { octets, type };
  } catch {
    return { octets, type };
  }
}

/** Lu par le serveur : un `….png` rangé en WebP redevient un PNG (rapide : peu de compression, il ne voyage pas). */
export async function enPngSiBesoin(chemin: string, octets: Buffer): Promise<Buffer> {
  if (!/\.png$/i.test(chemin) || !estWebp(octets)) return octets;
  try {
    return await sharp(octets).png({ compressionLevel: 1 }).toBuffer();
  } catch {
    return octets;
  }
}
