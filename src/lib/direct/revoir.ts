/**
 * 📼 REVOIR (`docs/univers/decouvrir.md`, section 31) — l'historique des vidéos que j'ai vues, et ce qui s'y est passé
 * depuis : le propriétaire, le 21 novembre 2026 — « lorsque j'ai vu une vidéo et que je l'ai commentée, et que je pars, et
 * que des amis la commentent aussi, alors comment puis-je la revoir ? Peut-être faudrait-il que sur la page Ma maison et
 * Découverte il y ait l'historique des vidéos regardées, avec une petite modification si de nouveaux commentaires
 * apparaissent. »
 *
 * FICHIER PARTAGÉ (l'écran et le serveur).
 */

/** Une vidéo que j'ai vue ; `nouveaux` : des amis y ont réagi depuis (leurs prénoms, combien). */
export type VideoARevoir = { id: string; titre: string; chaine: string; duree: number; le: number; nouveaux?: { n: number; de: string[] } };
/** Combien en garder, combien en montrer. */
export const REVOIR = { gardees: 60, montrees: 24, boite: 30 } as const;

export const PHRASES_REVOIR = {
  titre: "📼 Revoir",
  feuille: "📼 Tes vidéos déjà vues",
  chapo: "Revois-les dans ton salon : les réactions de tes amis passent à leur seconde.",
  vide: "Tes vidéos déjà vues viendront ici.",
  puce: "📼 Revoir",
  nouveaux: (de: string[]) => `💬 ${de.length > 1 ? `${de.slice(0, -1).join(", ")} et ${de[de.length - 1]}` : de[0]} ${de.length > 1 ? "ont" : "a"} réagi`,
  ligne: (de: string[], titre: string) => `${de.length > 1 ? `${de.slice(0, -1).join(", ")} et ${de[de.length - 1]} ont` : `${de[0]} a`} réagi à « ${titre} »`,
  revoir: "Revoir",
} as const;

/** Où la revoir : mon salon, calé sur elle (ses réactions rejouées). */
export const lienRevoir = (id: string) => `/univers/salons?chez=moi&video=${encodeURIComponent(id)}`;
