// Comment on nomme une heure dans les menus du commerçant.
//
// Les menus sont en 24 h — c'est la seule façon d'éviter qu'un navigateur
// configuré en anglais affiche « 02:14 PM » à un commerçant français. Mais
// beaucoup pensent encore en douze heures, d'où le rappel familier à côté.
//
// Ce rappel disait « de l'après-midi » pour TOUTE heure supérieure à 12. On
// lisait donc « 22 h · 10 h de l'après-midi » dans un groupe intitulé « Soir » :
// l'aide contredisait l'intitulé juste au-dessus, ce qui est pire que pas
// d'aide du tout — on doute alors de l'heure qu'on vient de choisir.
//
// Un seul endroit pour les deux écrans qui affichent cette liste (l'espace pro
// et la maquette de démonstration) : c'est exactement le genre de détail qu'on
// corrige d'un côté en oubliant l'autre.

/** Les groupes du menu déroulant, dans l'ordre d'affichage. */
export const MOMENTS = [
  { titre: "Matin", de: 6, a: 11 },
  { titre: "Après-midi", de: 12, a: 17 },
  { titre: "Soir", de: 18, a: 23 },
  { titre: "Nuit", de: 0, a: 5 },
] as const;

export const MINUTES = ["00", "15", "30", "45"] as const;

/**
 * « 16 h · 4 h de l'après-midi », « 22 h · 10 h du soir », « 12 h · midi ».
 *
 * Le rappel n'apparaît que là où il APPREND quelque chose. « 8 h » ne peut être
 * que le matin : ajouter « 8 h du matin » alourdit une liste de vingt-quatre
 * lignes pour ne rien dire.
 */
export function libelleHeure(h: number): string {
  if (h === 0) return "0 h  ·  minuit";
  if (h === 12) return "12 h  ·  midi";
  if (h >= 1 && h <= 5) return `${h} h  ·  ${h} h du matin`;
  if (h >= 13 && h <= 17) return `${h} h  ·  ${h - 12} h de l'après-midi`;
  if (h >= 18 && h <= 23) return `${h} h  ·  ${h - 12} h du soir`;
  return `${h} h`;
}
