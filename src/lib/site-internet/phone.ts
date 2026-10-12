// Normalisation de numéros de téléphone — CLIENT-SAFE (aucune dépendance
// serveur, importable dans un composant "use client"). Source unique partagée
// par l'API (validation/stockage) et par l'UI (liens wa.me).
//   toE164     : format international avec « + » pour le stockage (« +33612… »).
//   toWaDigits : chiffres seuls pour un lien wa.me/<digits> (« 33612… »).

/** L'indicatif des pays où l'on écrit son numéro « à la maison » (0…) et où ClikMe a des commerçants. */
const INDICATIFS: Record<string, string> = { fr: "33", ch: "41", be: "32", lu: "352" };

/**
 * `pays` : celui du commerce (voir `paysDuCommerce`). « 079 123 45 67 » est
 * suisse à Vevey et ne doit pas devenir « +33 7 91 23 45 67 ». Sans pays, la
 * France, comme avant.
 */
export function toE164(raw: string, pays = "fr"): string {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  d = d.replace(/\D/g, "");
  if (d.startsWith("00")) return "+" + d.slice(2);
  const ind = INDICATIFS[pays] ?? "33";
  if (d.startsWith(ind)) return "+" + d;
  if (d.startsWith("0")) return "+" + ind + d.slice(1);
  if (d.length >= 6) return "+" + ind + d; // repli : le pays du commerce
  return "";
}

export function toWaDigits(raw: string): string {
  return toE164(raw).replace(/\D/g, "");
}

// Numéro français écrit comme on le lit à voix haute : « 06 12 34 56 78 ».
// Pour les écrans où le commerçant doit RECONNAÎTRE son propre numéro : en
// « +33612345678 » il ne le relit pas, il le devine — et un numéro qu'on ne
// relit pas est un numéro qu'on ne corrige jamais.
export function frLisible(e164: string): string {
  const d = String(e164 || "").replace(/\D/g, "");
  // En Suisse, « 079 123 45 67 » : c'est ainsi qu'un Veveysan relit le sien.
  if (d.startsWith("41") && d.length === 11) return ("0" + d.slice(2)).replace(/^(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4");
  const local = d.startsWith("33") ? "0" + d.slice(2) : d;
  if (local.length !== 10) return e164 || "";
  return local.replace(/(\d\d)(?=\d)/g, "$1 ").trim();
}

// Numéro lisible et discret pour l'affichage (masque les chiffres du milieu).
export function maskPhone(e164: string): string {
  const d = String(e164 || "").replace(/\D/g, "");
  if (d.length < 6) return e164 || "";
  return `+${d.slice(0, 2)} … ${d.slice(-2)}`;
}
