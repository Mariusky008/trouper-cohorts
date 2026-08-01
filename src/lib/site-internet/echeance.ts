// La façon d'écrire « jusqu'à quand » une annonce tient — partout pareil.
//
// La même annonce apparaît sur trois pages (le catalogue de la ville, le site du
// commerçant, le site d'un voisin). Si chacune formule l'échéance à sa manière,
// le visiteur croit lire trois informations différentes. Un seul endroit, donc.
//
// Volontairement sans dépendance : ce module est importé par des composants
// client, il ne doit rien tirer d'autre dans le bundle.

/**
 * « jusqu'à 18 h » · « jusqu'à demain » · « jusqu'au 9 août ».
 *
 * Chaîne vide si l'échéance est absente, illisible ou déjà passée — on préfère
 * ne rien dire plutôt qu'afficher une limite qui n'en est plus une.
 */
export function echeanceCourte(iso: string | null | undefined, maintenant = Date.now()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t) || t <= maintenant) return "";
  const h = (t - maintenant) / 3600000;
  if (h <= 24) {
    const d = new Date(t);
    const mn = d.getMinutes();
    return `jusqu'à ${d.getHours()} h${mn ? ` ${String(mn).padStart(2, "0")}` : ""}`;
  }
  if (h <= 48) return "jusqu'à demain";
  return `jusqu'au ${new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}
