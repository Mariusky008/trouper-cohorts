// QUAND LA CARTE A LE DROIT DE SORTIR.
//
// ─── LE DÉFAUT QUI L'A FAIT NAÎTRE ────────────────────────────────────────
//
// « Elle me donne le résultat de notre conversation après une seule question,
// et c'est APRÈS qu'elle me demande le prix. »
//
// La carte sortait vide de son prix, suivie de « et c'est à combien ? ». Le
// commerçant ne sait alors plus ce qu'on attend de lui : répondre, ou appuyer ?
// Et s'il appuie — ce que fait n'importe qui devant un gros bouton vert — il
// publie une annonce sans prix à toute la ville.
//
// ─── POURQUOI CE N'EST PAS QU'UNE LIGNE DE PROMPT ─────────────────────────
//
// La consigne est écrite dans le prompt, et elle doit y être. Mais une consigne
// n'est pas une garantie : le modèle la suivra la plupart du temps, et
// « la plupart du temps » ne convient pas pour quelque chose qui se publie. Ce
// fichier est le garde-fou mécanique, celui qui tient même le jour où le modèle
// se trompe — c'est-à-dire le jour de la démonstration.
//
// ─── LE SEUIL EST EXACTEMENT LÀ, ET PAS AILLEURS ──────────────────────────
//
// On ne peut pas exiger un prix sur toutes les cartes : un créneau qui se
// libère, une fermeture exceptionnelle, une table encore libre n'en ont pas, et
// ils doivent pouvoir se proposer tout de suite. Ce qu'on refuse, c'est la
// carte qui n'a NI prix NI quantité — celle-là ne récapitule rien — quand la
// réponse pose encore une question.

/** Le strict nécessaire pour juger : le reste de la carte ne change rien. */
export type CarteJugeable = { prix: string; quantite: number | null };

/**
 * Vrai si la carte peut être montrée avec cette réponse.
 *
 * `dire` est ce que l'assistante répond ; s'il contient un point
 * d'interrogation, elle attend encore quelque chose, et un récapitulatif
 * n'aurait pas de sens à côté d'une question.
 */
export function carteAMontrer(dire: string, carte: CarteJugeable | null): boolean {
  if (!carte) return false;
  const questionne = dire.includes("?");
  const vide = !carte.prix.trim() && carte.quantite == null;
  return !(questionne && vide);
}
