/**
 * 📷 UNE PHOTO D'HABITANT, RANGÉE CHEZ NOUS — jamais gardée en `data:` dans la base.
 *
 * Les conversations d'Ensemble et le fil de La ville reçoivent des photos
 * prises au téléphone. On les ramène à 1600 points, on les range dans le
 * stockage sous leur empreinte, et on ne garde que leur adresse. Une photo
 * déjà chez nous (https, ou un chemin du site) passe telle quelle.
 *
 * FICHIER SERVEUR.
 */
import { createHash } from "crypto";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

const s = (v: unknown) => String(v ?? "").trim();
const SEAU = s(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";

export async function rangerPhoto(dossier: string, nom: string, valeur: unknown): Promise<string | undefined> {
  const v = s(valeur);
  if (!v) return undefined;
  if (/^https:\/\//i.test(v) || /^\/[a-z0-9/_.-]+$/i.test(v)) return v.slice(0, 600);
  const m = /^data:(image\/(?:jpeg|jpg|png|webp|heic|heif));base64,(.+)$/i.exec(v);
  if (!m) return undefined;
  const brut = Buffer.from(m[2], "base64");
  if (brut.length > 8 * 1024 * 1024) return undefined;
  try {
    const octets = await sharp(brut).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
    const supabase = createAdminClient();
    const chemin = `${dossier}/${nom}-${createHash("sha1").update(brut).digest("hex").slice(0, 16)}.jpg`;
    const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg", upsert: true });
    if (error) return undefined;
    return supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
  } catch {
    return undefined;
  }
}

/**
 * 🎙️ UN MOT VOCAL D'HABITANT, RANGÉ CHEZ NOUS — même règle que les photos :
 * jamais gardé en `data:` dans la base. Rangé tel quel (webm/opus d'Android
 * et de Chrome, mp4 d'iPhone) : aucun convertisseur sur le serveur. Une
 * minute au plus, deux mégaoctets au plus. Un son déjà chez nous passe tel
 * quel.
 */
export async function rangerSon(dossier: string, nom: string, valeur: unknown): Promise<string | undefined> {
  const v = s(valeur);
  if (!v) return undefined;
  if (/^https:\/\//i.test(v) || /^\/[a-z0-9/_.-]+$/i.test(v)) return v.slice(0, 600);
  const m = /^data:(audio\/(?:webm|ogg|mp4|mpeg|x-m4a|wav))(?:;codecs=[^;,]+)?;base64,(.+)$/i.exec(v);
  if (!m) return undefined;
  const brut = Buffer.from(m[2], "base64");
  if (brut.length > 2 * 1024 * 1024) return undefined;
  const type = m[1].toLowerCase();
  const ext = type.includes("webm") ? "webm" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : type.includes("mpeg") ? "mp3" : "m4a";
  try {
    const supabase = createAdminClient();
    const chemin = `${dossier}/${nom}-${createHash("sha1").update(brut).digest("hex").slice(0, 16)}.${ext}`;
    const { error } = await supabase.storage.from(SEAU).upload(chemin, brut, { contentType: type, upsert: true });
    if (error) return undefined;
    return supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
  } catch {
    return undefined;
  }
}
