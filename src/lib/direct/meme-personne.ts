/**
 * 🪞 LE RENDU MONTRE-T-IL BIEN LA CLIENTE ? — une garde, côté serveur.
 *
 * « J'ai essayé la robe, et ça a donné une photo qui n'est pas vraiment la
 * même robe » — et surtout pas elle : le rendu montrait la femme de la photo
 * de la boutique, celle qui portait la pièce sur la fiche Google. Le moteur
 * d'image reçoit deux photos de deux personnes ; il lui arrive de rendre la
 * mauvaise. L'écran présentait alors quelqu'un d'autre comme « vous ».
 *
 * UN ESSAI GARDE LA PHOTO DE LA CLIENTE : sa pose, son cadrage, son fond. Seul
 * le vêtement change. Un vrai rendu ressemble donc, en gros, à SA photo bien
 * plus qu'à celle de la boutique. On compare des empreintes grossières (32 × 24
 * en gris, centrées-réduites) : si le rendu ressemble nettement plus à la
 * référence qu'à sa photo, c'est la référence qu'il a rendue — on l'écarte,
 * et on le dit, plutôt que de le montrer.
 *
 * FICHIER SERVEUR (sharp).
 */
import sharp from "sharp";

const L = 24;
const H = 32;

/** L'empreinte d'une image en base64 : sa luminance réduite, centrée-réduite. `null` si illisible. */
async function empreinte(base64: string): Promise<Float64Array | null> {
  try {
    const brut = await sharp(Buffer.from(base64, "base64")).rotate().resize(L, H, { fit: "fill" }).greyscale().raw().toBuffer();
    const v = Float64Array.from(brut.subarray(0, L * H));
    const moy = v.reduce((a, x) => a + x, 0) / v.length;
    const ec = Math.sqrt(v.reduce((a, x) => a + (x - moy) ** 2, 0) / v.length) || 1;
    return v.map((x) => (x - moy) / ec);
  } catch {
    return null;
  }
}

const correlation = (a: Float64Array, b: Float64Array) => a.reduce((s, x, i) => s + x * b[i], 0) / a.length;

/** Le base64 d'une image `data:` (ou déjà nu). */
const nu = (image: string) => image.replace(/^data:[^,]*,/, "");

/** À quoi le rendu ressemble-t-il : à sa photo, ou à la référence ? (corrélations de -1 à 1) */
export async function ressemblances(rendu: string, photo: string, reference: string): Promise<{ photo: number; reference: number } | null> {
  const [r, p, f] = await Promise.all([empreinte(nu(rendu)), empreinte(nu(photo)), empreinte(nu(reference))]);
  if (!r || !p || !f) return null;
  return { photo: correlation(r, p), reference: correlation(r, f) };
}

/**
 * LE RENDU A REPRIS LA PERSONNE DE LA RÉFÉRENCE : il lui ressemble beaucoup, et
 * nettement plus qu'à la photo de la cliente. Les deux seuils laissent passer
 * le cas où sa photo et la référence se ressemblent déjà (même pose sur fond
 * blanc) : l'écart reste alors faible, et le rendu passe.
 */
export const aReprisLaReference = (m: { photo: number; reference: number }) => m.reference >= 0.6 && m.reference - m.photo >= 0.15;
