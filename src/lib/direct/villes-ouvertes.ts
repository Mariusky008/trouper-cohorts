// 🟢 LES VILLES OUVERTES : celles où ClikMe est lancé en entier — la page du commerçant, le Direct de sa ville
// et « dépenser moins » (l'échange entre commerçants).
//
// UNE LISTE QU'ON TIENT, PAS UN SEUIL. « Tu décides quand une ville ouvre » : le jour où une ville ouvre, on ajoute
// son slug ici (celui de `villeSlug`, « saint-paul-les-dax »). Ailleurs, la page d'inscription (`/inscription`)
// montre le Direct et l'échange verrouillés, « ils s'ouvriront avec votre ville », et combien de commerçants de la
// ville sont déjà inscrits.
import { villeSlug } from "./ville";

export const VILLES_OUVERTES: readonly string[] = ["dax"];

/** Sa ville est-elle ouverte ? (le nom tel qu'il l'a tapé, ou son slug) */
export function villeOuverte(nomOuSlug: string): boolean {
  const s = villeSlug(nomOuSlug);
  return Boolean(s) && VILLES_OUVERTES.includes(s);
}
