"use client";

/**
 * 📷 LA PHOTO AVEC LAQUELLE ON VIENT D'ESSAYER — gardée le temps de la visite.
 *
 * « Si l'expérience permet un essayage sur la personne, A et B doivent
 * idéalement être montrés sur la personne elle-même. » Le duel d'un salon ne
 * peut montrer le challenger sur vous que s'il a votre photo — celle que vous
 * venez de donner pour essayer chez ce commerce.
 *
 * ELLE NE VIT QU'EN MÉMOIRE : ni stockage, ni serveur. Fermer l'onglet
 * l'oublie. Une photo de quelqu'un n'a rien à faire dans un tiroir qu'il ne
 * voit pas ; sans elle, le duel montre les vraies photos des pièces.
 */
let derniere: { photo: string; commerce: string } | null = null;

export function retenirPhotoDEssai(photo: string, commerce: string) {
  if (photo && commerce) derniere = { photo, commerce };
}

/** Sa photo, s'il a essayé chez CE commerce pendant cette visite. */
export function photoDEssaiPour(commerce: string | undefined): string | null {
  return derniere && commerce && derniere.commerce === commerce ? derniere.photo : null;
}

/**
 * LES RENDUS RÉUSSIS DE CETTE VISITE, pièce par pièce. Le duel ne montre le
 * challenger sur la personne que si A y est aussi : deux images comparables,
 * ou deux photos de produit — jamais une de chaque.
 */
const rendus = new Map<string, string>();

export function retenirRendu(commerce: string, piece: string, image: string) {
  if (commerce && piece && image) rendus.set(`${commerce}|${piece}`, image);
}

export function renduPour(commerce: string | undefined, piece: string | undefined): string | null {
  return commerce && piece ? (rendus.get(`${commerce}|${piece}`) ?? null) : null;
}
