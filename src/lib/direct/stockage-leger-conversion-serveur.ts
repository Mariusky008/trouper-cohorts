/**
 * 🪶 CONVERTIR LES IMAGES DÉJÀ RANGÉES (27 novembre 2026 ; `stockage-leger-serveur.ts`). Réservé à l'administrateur,
 * par `/admin/humain/stockage`.
 *
 * Le seau des figurines est parcouru dossier par dossier ; chaque `….png` assez lourd, encore en PNG, est rangé à
 * nouveau en WebP sous le même nom. Par lots : la page rappelle avec `apres` (le dernier chemin traité, dans l'ordre
 * alphabétique) tant qu'il en reste. Une image qui n'y gagne rien est laissée telle quelle, et on passe à la suivante.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES, oublierAdresse } from "./ma-figurine-serveur";
import { SEUIL_LEGER, allegerImage, estPng } from "./stockage-leger-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
type Entree = { name?: string; id?: string | null; metadata?: { size?: number; mimetype?: string } | null };
export type ImageLourde = { chemin: string; taille: number };

/** Toutes les images PNG lourdes du seau, dans l'ordre alphabétique de leur chemin. */
export async function imagesLourdes(supabase: Supabase): Promise<ImageLourde[]> {
  const trouvees: ImageLourde[] = [];
  const aVoir = [""];
  while (aVoir.length) {
    const dossier = aVoir.shift() as string;
    for (let offset = 0; offset < 100_000; offset += 1000) {
      const { data, error } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 1000, offset });
      if (error) break;
      const l = (Array.isArray(data) ? data : []) as Entree[];
      for (const e of l) {
        const nom = String(e.name ?? "");
        if (!nom || nom === ".emptyFolderPlaceholder") continue;
        const chemin = dossier ? `${dossier}/${nom}` : nom;
        if (!e.id) aVoir.push(chemin);
        else if (/\.png$/i.test(nom) && e.metadata?.mimetype === "image/png" && (e.metadata.size ?? 0) >= SEUIL_LEGER) trouvees.push({ chemin, taille: e.metadata.size ?? 0 });
      }
      if (l.length < 1000) break;
    }
  }
  return trouvees.sort((a, b) => (a.chemin < b.chemin ? -1 : a.chemin > b.chemin ? 1 : 0));
}

/** Un lot : les images après `apres`, jusqu'à `avant` (l'heure limite). */
export async function convertirUnLot(
  supabase: Supabase,
  apres: string,
  avant: number,
): Promise<{ convertis: number; avant: number; apres: number; dernier: string; reste: boolean; restantes: number }> {
  const toutes = (await imagesLourdes(supabase)).filter((x) => x.chemin > apres);
  let convertis = 0;
  let octetsAvant = 0;
  let octetsApres = 0;
  let dernier = apres;
  let vues = 0;
  for (const x of toutes) {
    if (Date.now() > avant) break;
    vues++;
    dernier = x.chemin;
    const { data, error } = await supabase.storage.from(SEAU_FIGURINES).download(x.chemin);
    if (error || !data) continue;
    const brut = Buffer.from(await data.arrayBuffer());
    if (!estPng(brut)) continue;
    const leger = await allegerImage(brut, "image/png");
    if (leger.type !== "image/webp") continue;
    const { error: refus } = await supabase.storage.from(SEAU_FIGURINES).upload(x.chemin, leger.octets, { contentType: leger.type, upsert: true });
    oublierAdresse(x.chemin);
    if (refus) {
      console.error("[stockage léger] refusé :", x.chemin, refus.message);
      continue;
    }
    convertis++;
    octetsAvant += brut.length;
    octetsApres += leger.octets.length;
  }
  const restantes = toutes.length - vues;
  return { convertis, avant: octetsAvant, apres: octetsApres, dernier, reste: restantes > 0, restantes };
}
