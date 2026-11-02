/**
 * 🏆 LA FIGURINE D'UN COMMERCE, ET LE CADEAU DE SA COLLECTION COMPLÈTE (`collection.ts`, `docs/figurines.md`).
 *
 * SA FIGURINE : celle que ClikMe a faite pour lui (`FIGURINES`, une image par commerce, faite à la main pour les
 * premiers — l'étape 4 la fera toute seule) ; en attendant, son double, le fantôme habillé de son métier qui salue
 * déjà sur sa page (`tenueDu`).
 *
 * SON CADEAU : seulement s'il l'a choisi (`metadata.collection_cadeau` de sa fiche, « Un repas pour 2 ») ; jamais un
 * cadeau inventé à sa place. Pas d'alcool (loi Évin).
 *
 * FICHIER PARTAGÉ (navigateur et serveur) : aucun accès à la base ici.
 */
import { tenueDu } from "./double-metiers";
import { plusPermis } from "./previens-les";

/** Les figurines faites pour un commerce (son lien → l'image, carrée ou en portrait, fond transparent ou rose). */
export const FIGURINES: Record<string, string> = {};

export function figurineDu(
  slug: string,
  c: { branche?: string | null; metier?: string | null },
): string {
  return (
    FIGURINES[slug] ??
    `${tenueDu(c)?.enPied ?? "/direct/double/pied/"}salut-1.webp`
  );
}

export const CADEAU_MAX = 60;

export function cadeauDeCollection(metadata: unknown): string {
  const brut =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>).collection_cadeau
      : "";
  const t = String(brut ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CADEAU_MAX);
  return t && plusPermis(t) ? t : "";
}
