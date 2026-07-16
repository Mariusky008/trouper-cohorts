// Normalisation de numéros de téléphone — CLIENT-SAFE (aucune dépendance
// serveur, importable dans un composant "use client"). Source unique partagée
// par l'API (validation/stockage) et par l'UI (liens wa.me).
//   toE164     : format international avec « + » pour le stockage (« +33612… »).
//   toWaDigits : chiffres seuls pour un lien wa.me/<digits> (« 33612… »).

export function toE164(raw: string): string {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  d = d.replace(/\D/g, "");
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("33")) return "+" + d;
  if (d.startsWith("0")) return "+33" + d.slice(1);
  if (d.length >= 6) return "+33" + d; // repli FR
  return "";
}

export function toWaDigits(raw: string): string {
  return toE164(raw).replace(/\D/g, "");
}

// Numéro lisible et discret pour l'affichage (masque les chiffres du milieu).
export function maskPhone(e164: string): string {
  const d = String(e164 || "").replace(/\D/g, "");
  if (d.length < 6) return e164 || "";
  return `+${d.slice(0, 2)} … ${d.slice(-2)}`;
}
