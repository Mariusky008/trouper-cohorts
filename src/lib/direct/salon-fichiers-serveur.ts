/**
 * 🗂️ LES FICHIERS DU SALON, À ADRESSE STABLE (`docs/univers/salon-du-duo.md`, section 7.2 ; lot S0b).
 *
 * Les images de la scène (la pièce, les calques des figurines) se lisaient par des adresses signées neuves à chaque
 * lecture : le navigateur ne retrouvait jamais rien en cache et retéléchargeait tout à chaque ouverture. Ici, une image
 * du stockage devient une fois pour toutes :
 *
 * - **des fichiers nommés par leur empreinte** (`salon/fichiers/<empreinte>-<largeur>.webp`) : l'empreinte est celle du
 *   contenu de l'image source (128 bits : impossible à deviner) ; une nouvelle image donne un nouveau nom ;
 * - **en WebP** (qualité 80), **en deux largeurs** au plus (720 et 1080 points, jamais plus grandes que la source), la
 *   transparence gardée (les calques) ;
 * - **une vignette floue** (quelques centaines d'octets, en `data:`) qui s'affiche tout de suite ;
 * - **servis par `/api/direct/salon/fichier/<nom>`** avec `Cache-Control: private, max-age=31536000, immutable` : le
 *   téléphone les garde, le service worker aussi.
 *
 * Un index par image source (`salon/index/<empreinte du chemin>.json`) retient sa version (date et taille, lues dans la
 * liste du dossier, sans la télécharger) : tant qu'elle ne change pas, rien n'est refait.
 *
 * La lecture : une session d'habitant (ou d'administrateur) suffit, comme pour une adresse signée — le nom, que seuls les
 * deux du duo reçoivent (`?ouvrir=`), en est la clé.
 */
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { ImageSalon } from "./salon";
import { SEAU_FIGURINES, deposer, telecharger } from "./ma-figurine-serveur";

type Supabase = ReturnType<typeof createAdminClient>;

const DOSSIER = "salon";
export const LARGEURS_SALON = [720, 1080] as const;
/** Le nom d'un fichier du salon : son empreinte (32 signes), sa largeur. */
export const NOM_FICHIER_SALON = /^([0-9a-f]{32})-(\d{2,4})\.webp$/;
export const adresseFichierSalon = (nom: string) => `/api/direct/salon/fichier/${nom}`;
export const cheminFichierSalon = (nom: string) => `${DOSSIER}/fichiers/${nom}`;
const cheminIndex = (chemin: string) => `${DOSSIER}/index/${createHash("sha1").update(chemin).digest("hex").slice(0, 24)}.json`;

type Index = { version: string; image: ImageSalon };

/** La version d'un fichier du stockage (sa date, sa taille), lue dans la liste de son dossier ; `null` s'il n'y est pas. */
async function versionDe(supabase: Supabase, chemin: string): Promise<string | null> {
  const i = chemin.lastIndexOf("/");
  const dossier = i < 0 ? "" : chemin.slice(0, i);
  const nom = chemin.slice(i + 1);
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 100, search: nom });
  const f = ((Array.isArray(data) ? data : []) as { name?: string; updated_at?: string | null; metadata?: { size?: number } | null }[]).find((x) => x.name === nom);
  if (!f) return null;
  return `${f.updated_at ?? ""}|${f.metadata?.size ?? ""}`;
}

async function lireIndex(supabase: Supabase, chemin: string): Promise<Index | null> {
  const b = await telecharger(supabase, cheminIndex(chemin)).catch(() => null);
  if (!b) return null;
  try {
    const x = JSON.parse(b.toString("utf8")) as Partial<Index>;
    return typeof x.version === "string" && x.image && typeof x.image.src === "string" ? (x as Index) : null;
  } catch {
    return null;
  }
}

/** Une image et ses largeurs, l'adresse de la plus grande en `src`. */
function imageDe(empreinte: string, largeurs: number[], largeur: number, hauteur: number, flou: string): ImageSalon {
  const nom = (w: number) => `${empreinte}-${w}.webp`;
  const plus = Math.max(...largeurs);
  return {
    src: adresseFichierSalon(nom(plus)),
    srcset: largeurs.map((w) => `${adresseFichierSalon(nom(w))} ${w}w`).join(", "),
    largeur,
    hauteur,
    flou,
  };
}

/**
 * 🗂️ L'image du stockage `chemin`, à adresse stable : faite une fois (WebP, deux largeurs, la vignette floue), puis
 * retrouvée dans son index tant que la source ne change pas. `null` si la source n'existe pas, ou ne se lit pas.
 * `largeurs` : celles du salon par défaut ; 🏠 « Ma maison » demande les siennes pour ses panoramas (3584 × 1024 : 720
 * points de large n'en feraient que 206 de haut, `ma-maison-serveur.ts`) ; chaque jeu de largeurs a son index.
 */
export async function imageSalon(supabase: Supabase, chemin: string, largeursVoulues: readonly number[] = LARGEURS_SALON): Promise<ImageSalon | null> {
  const version = await versionDe(supabase, chemin).catch(() => null);
  if (!version) return null;
  // (d'autres largeurs : un autre index — la même image peut servir en vignette et en grand)
  const cle = largeursVoulues.join(",") === LARGEURS_SALON.join(",") ? chemin : `${chemin}#${largeursVoulues.join(",")}`;
  const index = await lireIndex(supabase, cle);
  if (index && index.version === version) return index.image;
  const source = await telecharger(supabase, chemin).catch(() => null);
  if (!source) return null;
  try {
    const empreinte = createHash("sha256").update(source).digest("hex").slice(0, 32);
    const meta = await sharp(source).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (!W || !H) return null;
    const largeurs = [...new Set(largeursVoulues.map((w) => Math.min(w, W)))];
    await Promise.all(
      largeurs.map(async (w) => {
        const octets = await sharp(source).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80, alphaQuality: 90 }).toBuffer();
        await deposer(supabase, cheminFichierSalon(`${empreinte}-${w}.webp`), octets, "image/webp");
      }),
    );
    const petit = await sharp(source).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
    const image = imageDe(empreinte, largeurs, W, H, `data:image/webp;base64,${petit.toString("base64")}`);
    await deposer(supabase, cheminIndex(cle), Buffer.from(JSON.stringify({ version, image } satisfies Index)), "application/json");
    return image;
  } catch {
    return null;
  }
}
