// De quelle FAMILLE relève une phrase écrite par un commerçant ?
//
// Le commerçant écrit « Il me reste deux créneaux à 16 h » — il ne remplit pas
// un formulaire à catégories, et lui en imposer un serait la meilleure façon
// qu'il ne publie plus rien. La famille est donc déduite du texte.
//
// L'ordre des tests est la logique : on cherche d'abord ce qui est le plus
// discriminant. « Deux places pour l'atelier de samedi » est un événement, pas
// une place libre — la date l'emporte sur le mot « place ».
//
// En cas de doute, « offre ». C'est la famille la plus neutre : annoncer une
// offre là où il y avait une place libre déçoit peu ; annoncer une place libre
// là où il n'y en a pas est un mensonge affiché en rouge dans le fil.
import type { Famille } from "./publications";

const norm = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Un jour, une date, un mois : ce qui se passe À une date.
const EVENEMENT =
  /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|week.?end|portes ouvertes|vernissage|degustation|atelier|concert|dedicace|vente privee|braderie|marche de|animation|soiree|matinee|inauguration|conference|salon\b|festival|exposition|stage)\b|\ble \d{1,2}\b|\b\d{1,2} (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\b/;

// Une place, un créneau, un rendez-vous qui se libère.
const PLACE =
  /\b(creneau|creneaux|place libre|places libres|places? de libre|annulation|desistement|il me reste|il reste|encore \d|disponibilit|rendez.?vous (de )?libre|couverts?\b|table libre|se (?:sont )?liber)/;

/**
 * La famille d'une phrase. `ville` n'est jamais déduite : une publication de la
 * collectivité est écrite depuis l'espace ville, pas devinée depuis un texte.
 */
export function familleDuTexte(texte: string): Famille {
  const t = norm(texte);
  if (EVENEMENT.test(t)) return "evenement";
  if (PLACE.test(t)) return "place";
  return "offre";
}
