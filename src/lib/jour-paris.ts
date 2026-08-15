// LA DATE DU JOUR, à l'heure de Paris.
//
// Le serveur peut tourner ailleurs (Vercel déploie où il veut) : `new Date()`
// côté serveur ne dit pas quel jour il est CHEZ LE COMMERÇANT. Tout ce qui se
// compte en journées — l'histoire du jour, la fin d'un remplacement pendant les
// congés — doit passer par ici, et par ici seulement.

/** « 2026-08-15 », l'heure murale de Paris. */
export function jourParis(maintenant = new Date()): string {
  // `en-CA` rend « 2026-08-15 », le seul format que PostgreSQL lit sans
  // ambiguïté. `fr-FR` rendrait « 15/08/2026 », qui serait relu à l'envers.
  return maintenant.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}
