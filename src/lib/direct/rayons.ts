// LES RAYONS — quatre portes dans une collection, et rien de plus.
//
// ═══ POURQUOI ILS NE VIENNENT PAS DU CATALOGUE DU COMMERÇANT ════════════════
//
// SES RAYONS À LUI SONT DES RAYONS DE MARCHANDISAGE, pas des familles de
// vêtements : « Arrivages », « Toujours en rayon », « Le service ». Ils disent
// depuis quand une pièce est là, pas ce que c'est. Devant une vitrine on ne
// cherche pas « les arrivages », on cherche une robe.
//
// ET ILS NE SURVIVENT PAS À LA FUSION. `murDeLaCarte` mélange le catalogue du
// commerçant et les pièces du modèle en dédoublonnant sur la photo ou le nom :
// chez la friperie, dont aucune entrée n'est photographiée, ce sont les pièces
// du modèle qui restent — et elles n'ont pas de rayon du tout. Un classement
// fondé dessus marcherait chez un commerce et pas chez son voisin, pour une
// raison invisible depuis l'écran.
//
// ═══ CE QUE CE FICHIER FAIT, ET CE QU'IL NE PRÉTEND PAS FAIRE ═══════════════
//
// IL LIT LE NOM DE LA PIÈCE, ET C'EST TOUT. « Robe midi, col lavallière » va
// dans les robes, « Jean droit » dans les bas. C'est une aide à la navigation,
// jamais une donnée : le commerçant n'a rien rempli, on ne lui fait donc rien
// dire. Une pièce que personne ne reconnaît reste dans la collection entière —
// elle n'est jamais cachée, seulement pas rangée.
//
// QUATRE FAMILLES, PAS DOUZE. « ClikMe doit réduire le choix, pas recréer un
// Zalando local. » Douze pastilles redeviennent un menu de site marchand, et
// un menu est exactement ce qu'on est venu éviter en poussant la porte.

export type CleRayon = "hauts" | "bas" | "robes" | "accessoires";

export type Rayon = {
  cle: CleRayon;
  /** Sur la pastille : « Robes ». */
  label: string;
  /** Ce qui, dans un nom de pièce, désigne cette famille. */
  mots: RegExp;
};

/**
 * L'ORDRE EST CELUI DE LA MAQUETTE, et il n'est pas alphabétique : on habille
 * le corps de haut en bas, puis on ajoute. C'est l'ordre dans lequel on
 * s'habille le matin, donc celui qu'on lit sans y penser.
 */
export const RAYONS: Rayon[] = [
  {
    cle: "robes",
    label: "Robes",
    mots: /\b(robes?|combinaisons?)\b/i,
  },
  {
    cle: "hauts",
    label: "Hauts",
    mots: /\b(pull|pulls|chemise|chemises|blouse|marinière|mariniere|polo|veste|vestes|manteau|doudoune|blouson|gilet|top|tee-shirt|sweat|cardigan|costume|ensemble)\b/i,
  },
  {
    cle: "bas",
    label: "Bas",
    mots: /\b(jean|jeans|pantalon|chino|jupe|short|bermuda)\b/i,
  },
  {
    cle: "accessoires",
    label: "Accessoires",
    mots: /\b(écharpe|echarpe|sac|ceinture|chapeau|bonnet|foulard|collier|bracelet|bijou|lunettes|baskets|chaussures|bottes)\b/i,
  },
];

/** Dans quelle famille tombe ce nom. `null` : aucune, et elle reste au large. */
export function rayonDuNom(nom: string): CleRayon | null {
  for (const r of RAYONS) if (r.mots.test(nom)) return r.cle;
  return null;
}

/**
 * LES RAYONS QUI ONT VRAIMENT QUELQUE CHOSE DEDANS.
 *
 * UNE PASTILLE QUI OUVRE SUR RIEN EST PIRE QU'UNE PASTILLE EN MOINS : elle
 * promet un rayon, on appuie, la grille est vide, et on apprend à ne plus
 * appuyer. On ne dessine donc que ce qui est garni — et à deux pièces près,
 * un rayon d'une seule pièce n'est pas un rayon : c'est cette pièce-là, qu'on
 * verra de toute façon dans la collection.
 */
export function rayonsGarnis(noms: string[]): Rayon[] {
  const compte = new Map<CleRayon, number>();
  for (const n of noms) {
    const c = rayonDuNom(n);
    if (c) compte.set(c, (compte.get(c) ?? 0) + 1);
  }
  return RAYONS.filter((r) => (compte.get(r.cle) ?? 0) >= 2);
}
