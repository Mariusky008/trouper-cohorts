// De quelle FAMILLE relève une phrase écrite par un commerçant ?
//
// Le commerçant écrit « Il me reste deux créneaux à 16 h » — il ne remplit pas
// un formulaire à catégories, et lui en imposer un serait la meilleure façon
// qu'il ne publie plus rien. La famille est donc déduite du texte.
//
// L'ordre des tests est la logique : on cherche d'abord ce qui est le plus
// discriminant. « Deux places pour l'atelier de samedi » est un événement, pas
// une place libre — le mot « place » seul ne suffit pas à en faire une.
//
// MAIS LA DATE NE PEUT PAS L'EMPORTER SUR TOUT. La règle a d'abord été écrite
// « un nom de jour ⇒ événement », et elle classait « Un créneau s'est libéré
// lundi 10 » en événement, avec la pastille violette au lieu du lime — donc au
// mauvais rang dans le fil, et sans l'urgence qui est tout l'intérêt d'une
// place qui se libère. Pire : « Annulation ce jeudi, la place est libre »
// devenait un événement.
//
// Ce qui distingue un événement, ce n'est pas qu'une date apparaisse — c'est
// qu'on VIENNE À quelque chose d'organisé. Une phrase qui dit qu'un créneau
// S'EST LIBÉRÉ décrit l'inverse : quelque chose qui était pris ne l'est plus.
// Ce signal-là passe donc AVANT la date.
//
// En cas de doute, « offre ». C'est la famille la plus neutre : annoncer une
// offre là où il y avait une place libre déçoit peu ; annoncer une place libre
// là où il n'y en a pas est un mensonge affiché en rouge dans le fil.
import type { Famille } from "./publications";

const norm = (s: string) =>
  String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// UNE PLACE QUI SE LIBÈRE — le signal le plus fort du fil, et le seul qui
// l'emporte sur une date. Volontairement étroit : ce sont des tournures qui
// décrivent quelque chose qui SE DÉFAIT (une annulation, un désistement, un
// créneau rendu), pas simplement des places disponibles.
//
// « Il me reste deux places pour l'atelier de samedi » n'est PAS ici, et c'est
// exprès : il reste des places à un événement, l'événement tient toujours.
//
// PAS DE `\b` FINAL SUR LES RADICAUX : « liber » suivi du « é » de « libéré »
// n'est pas une frontière de mot, et un `\b` de fermeture faisait échouer
// toutes les formes conjuguées d'un coup. Chaque alternative porte donc sa
// propre fermeture, là où elle a un sens.
const LIBERATION =
  /\b(?:creneaux?\b|s['’ ]?est liber|(?:vient|viennent) de se liber|se (?:sont |est )?liber|annulation\b|desistement\b|se desist|places? libres?\b|place de libre\b|rendez.?vous (?:de )?libre\b|table libre\b)/;

// UN ÉVÉNEMENT SE RECONNAÎT À SON NOM, PAS À SA DATE.
//
// La liste contenait les jours de la semaine et les dates. C'était une prise
// beaucoup trop large : « promo mardi », « ouvert dimanche », « le brushing à
// plusieurs mardi après-midi » devenaient tous des événements, avec la pastille
// violette sur des offres ordinaires. Presque toutes les annonces d'un commerce
// portent un jour ou une heure — la date ne distingue donc rien.
//
// Ce qui distingue un événement, c'est qu'on VIENNE À quelque chose d'organisé,
// et ça se dit par un nom : un concert, une braderie, un vernissage.
//
// CONSÉQUENCE ASSUMÉE : « Venez le 12 septembre à 18 h », sans nom, tombe en
// « offre ». C'est le repli neutre, et il est cohérent avec la règle du bas de
// ce fichier — annoncer une offre là où il y avait un événement déçoit peu.
const EVENEMENT =
  /\b(portes ouvertes|vernissage|degustation|atelier|concert|dedicace|vente privee|braderie|marche de|animation|soiree|matinee|inauguration|conference|salon\b|festival|exposition|stage|spectacle|projection|loto|kermesse|tournoi|defile|carnaval|feria|bal\b)\b/;

// Une place, un créneau, un rendez-vous qui se libère.
const PLACE =
  /\b(creneau|creneaux|place libre|places libres|places? de libre|annulation|desistement|il me reste|il reste|encore \d|disponibilit|rendez.?vous (de )?libre|couverts?\b|table libre|se (?:sont )?liber)/;

/**
 * La famille d'une phrase. `ville` n'est jamais déduite : une publication de la
 * collectivité est écrite depuis l'espace ville, pas devinée depuis un texte.
 */
export function familleDuTexte(texte: string): Famille {
  const t = norm(texte);
  if (LIBERATION.test(t)) return "place";
  if (EVENEMENT.test(t)) return "evenement";
  if (PLACE.test(t)) return "place";
  return "offre";
}
