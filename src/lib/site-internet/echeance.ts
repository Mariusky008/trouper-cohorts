// La façon d'écrire « jusqu'à quand » une annonce tient — partout pareil.
//
// La même annonce apparaît sur trois pages (le catalogue de la ville, le site du
// commerçant, le site d'un voisin). Si chacune formule l'échéance à sa manière,
// le visiteur croit lire trois informations différentes. Un seul endroit, donc.
//
// Volontairement sans dépendance : ce module est importé par des composants
// client, il ne doit rien tirer d'autre dans le bundle.

/**
 * L'heure à PARIS, et pas celle du serveur.
 *
 * `new Date(t).getHours()` lit l'horloge de la machine. En production, cette
 * machine est en UTC : une carte du jour qui s'arrête à 23 h 59 heure de Dax
 * s'affichait « jusqu'à 21 h 59 » — deux heures de moins, sur toutes les
 * annonces, et personne ne pouvait le voir en développement puisque la machine
 * de développement, elle, est à l'heure locale.
 *
 * `Intl` avec un fuseau explicite rend le MÊME texte au serveur et dans le
 * navigateur : c'est aussi ce qui évite une divergence d'hydratation.
 */
function heureParis(t: number): string {
  try {
    const s = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(t));
    const [hh, mn] = s.split(":");
    // « 09 h » et non « 9 h » serait une notation d'horloge ; et « 18 h 00 » se
    // dit « 18 h ».
    return `${hh.replace(/^0/, "")} h${mn && mn !== "00" ? ` ${mn}` : ""}`;
  } catch {
    return "";
  }
}

function dateParis(t: number): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }).format(new Date(t));
  } catch {
    return "";
  }
}

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
  if (h <= 24) return `jusqu'à ${heureParis(t)}`;
  if (h <= 48) return "jusqu'à demain";
  return `jusqu'au ${dateParis(t)}`;
}
