// RÉSERVER UNE TABLE, DEPUIS UNE CARTE DU JOUR.
//
// LE DÉFAUT : une carte du jour ne propose aucune façon d'en profiter — et c'est
// volontaire, un menu n'est pas un stock limité à saisir. Mais du coup, un
// habitant qui la lisait et qui avait faim n'avait AUCUN moyen de réserver.
// Le seul bouton du pied de carte menait au site du restaurant, en doublon du
// lien « Voir le restaurant » ajouté sous l'image.
//
// COMMENT ON RÉSERVE ICI, et c'est déjà la règle du reste du produit : c'est le
// client qui écrit, sur WhatsApp. Rien à installer, rien à créer côté commerce,
// le numéro du client arrive avec le message, et le commerçant reçoit la demande
// là où il regarde déjà. Aucune campagne, aucune base : un lien.
import { lienWhatsapp } from "./whatsapp-reservation";

const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * Le message de réservation, écrit par l'habitant.
 *
 * COURT ET COMPLET. Le commerçant doit pouvoir répondre « oui, à quelle heure »
 * sans rien demander d'autre : d'où le jour (« aujourd'hui »), et le rappel de
 * ce qui a donné envie. On ne met NI nombre de couverts NI heure : on ne les
 * connaît pas, et les inventer ferait envoyer au commerçant une demande fausse
 * signée par quelqu'un d'autre.
 */
export function messageTable(commerce: string): string {
  const lignes = [
    `Bonjour${commerce ? ` ${commerce}` : ""} !`,
    "Je viens de voir votre carte du jour et je voudrais réserver une table pour aujourd'hui.",
    "(envoyé depuis Le Direct)",
  ];
  return lignes.join("\n");
}

/** Le lien « Je réserve » d'une carte du jour, ou "" si on n'a pas de numéro. */
export function lienReserverTable(telephone: unknown, commerce: unknown): string {
  return lienWhatsapp(str(telephone), messageTable(str(commerce)));
}
