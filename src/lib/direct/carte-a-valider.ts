// QUAND LA CARTE A LE DROIT DE SORTIR.
//
// ─── LE DÉFAUT QUI L'A FAIT NAÎTRE, ET QUI EST REVENU ─────────────────────
//
// « Elle me donne le résultat de notre conversation après une seule question,
// et c'est APRÈS qu'elle me demande le prix. » Puis, deux semaines plus tard,
// exactement le même : « on me donne le résultat et ensuite on me demande le
// nombre de portions ».
//
// LA DEUXIÈME FOIS, C'EST NOUS QUI L'AVIONS RÉINTRODUIT. Pour gagner du
// rythme, on avait autorisé la carte à sortir dès qu'un chiffre était connu,
// en se disant que le reste se demanderait « par-dessus ». Sur l'écran, ça
// donne une carte qui affiche « — » à la case QUANTITÉ pendant qu'on demande
// les portions, avec un gros bouton « C'est bon » dessous. Le commerçant ne
// sait plus s'il doit répondre ou appuyer — et s'il appuie, il publie une
// annonce trouée à toute la ville.
//
// LA LEÇON, ET ELLE VAUT AU-DELÀ DE CE FICHIER : le rythme ne se gagne pas en
// montrant le résultat plus tôt, il se gagne en posant moins de questions. La
// carte est un REÇU. Un reçu ne se présente pas avant la fin.
//
// ─── POURQUOI CE N'EST PAS QU'UNE LIGNE DE PROMPT ─────────────────────────
//
// La consigne est écrite dans le prompt, et elle doit y être. Mais une consigne
// n'est pas une garantie : le modèle la suivra la plupart du temps, et
// « la plupart du temps » ne convient pas pour quelque chose qui se publie. Ce
// fichier est le garde-fou mécanique, celui qui tient même le jour où le modèle
// se trompe — c'est-à-dire le jour de la démonstration.
//
// ─── LA SEULE QUESTION QUI A LE DROIT D'ACCOMPAGNER UNE CARTE ─────────────
//
// La photo. Elle n'est pas une VALEUR que la carte affiche et qui manquerait :
// c'est une ACTION, et le bouton pour la faire est dans la carte elle-même.
// « Vous me le photographiez ? » à côté d'une carte complète ne crée aucune
// hésitation — l'appareil photo est là, sous les yeux. Toutes les autres
// questions portent sur quelque chose que la carte devrait déjà montrer.

// ─── UN CHAMP VIDE N'EST PAS UN TROU ──────────────────────────────────────
//
// Première version du correctif : on refusait la carte dès qu'un champ était
// vide à côté d'une question. Trop grossier, et le vérificateur l'a attrapé —
// un créneau qui se libère n'a PAS de prix, une fermeture non plus, et ces
// annonces-là doivent pouvoir se proposer tout de suite.
//
// CE QUI FAIT LE DÉFAUT N'EST PAS LE VIDE, C'EST LA CONTRADICTION : elle
// demande une chose que la carte affiche en « — » juste en dessous. « Combien
// de portions ? » au-dessus d'une case QUANTITÉ vide — c'est ça, sa capture,
// et rien d'autre. On regarde donc DE QUOI parle la question.

/** Le strict nécessaire pour juger : le reste de la carte ne change rien. */
export type CarteJugeable = { prix: string; quantite: number | null };

/** Une question qui ne parle que de l'image : elle a son bouton dans la carte. */
const IMAGE = /photograph|photo\b|une image|film|vid[ée]o|montrez|montrer/i;

/** Elle demande le prix. « À combien ? », « c'est à combien ? », « quel prix ? ». */
const PRIX = /[àa] combien|quel prix|quel est le prix|combien (ça|ca|cela) co[uû]te|tarif/i;

/** Elle demande une quantité. « Combien de parts ? », « combien vous en reste-t-il ? ». */
const QUANTITE =
  /combien de |combien vous en|combien il (vous )?en reste|combien en reste|portions?\s*\?|parts?\s*\?/i;

/**
 * Vrai si la carte peut être montrée avec cette réponse.
 *
 * L'ORDRE DES CAS EST LA RÈGLE :
 * - elle ne demande rien → la carte sort ;
 * - elle ne demande que l'image → la carte sort, le bouton est dedans ;
 * - elle demande LE PRIX et la carte n'en a pas → la carte attend ;
 * - elle demande UNE QUANTITÉ et la carte n'en a pas → la carte attend ;
 * - question qu'on n'a pas su lire, sur une carte qui n'a NI prix NI quantité
 *   → la carte attend aussi. C'est la règle d'origine, gardée comme filet :
 *   une carte qui ne récapitule rien ne récapitule rien, quelle que soit la
 *   question qu'on n'a pas comprise.
 */
export function carteAMontrer(dire: string, carte: CarteJugeable | null): boolean {
  if (!carte) return false;
  if (!dire.includes("?")) return true;
  if (IMAGE.test(dire)) return true;
  const surLePrix = PRIX.test(dire);
  const surLaQuantite = QUANTITE.test(dire);
  if (surLePrix && !carte.prix.trim()) return false;
  if (surLaQuantite && carte.quantite == null) return false;
  if (!surLePrix && !surLaQuantite && !carte.prix.trim() && carte.quantite == null) return false;
  return true;
}
