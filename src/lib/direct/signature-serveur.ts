/**
 * 🧾 LA SIGNATURE D'UNE IMAGE — chantier « Univers », lot 1, le socle (`perso.ts`, type `Signature`).
 *
 * Chaque image que le moteur fait pour une figurine ou un univers garde ce qui l'a faite : le moteur, la consigne mot
 * pour mot, les réglages, les images données en entrée, la date, la durée, et l'empreinte de ses octets. Les moteurs
 * changent : c'est ce qui permet de la refaire à l'identique, ou de savoir pourquoi ce n'est plus identique.
 *
 * FICHIER SERVEUR (l'empreinte se calcule ici).
 */
import { createHash } from "node:crypto";
import type { Signature } from "./perso";

/** L'empreinte d'une image rangée (sha256, 16 caractères). */
export const empreinteImage = (octets: Buffer) => createHash("sha256").update(octets).digest("hex").slice(0, 16);

/** La signature d'une image qu'on vient de ranger. `debut` : quand on a demandé l'image (pour sa durée). */
export function signatureDe(
  octets: Buffer,
  x: { moteur: string; consigne: string; reglages?: Record<string, string>; fidelite?: "high" | "low"; fond?: "transparent" | "opaque"; entrees: string[]; debut?: number; jetons?: number },
): Signature {
  const sig: Signature = { moteur: x.moteur || "inconnu", consigne: x.consigne, entrees: x.entrees, le: new Date().toISOString(), empreinte: empreinteImage(octets) };
  const qualite = x.reglages?.quality;
  if (qualite) sig.qualite = qualite;
  const fidelite = x.fidelite ?? (x.reglages?.input_fidelity === "low" ? "low" : x.reglages?.input_fidelity === "high" ? "high" : undefined);
  if (fidelite) sig.fidelite = fidelite;
  if (x.fond) sig.fond = x.fond;
  if (x.debut) sig.dureeS = Math.round((Date.now() - x.debut) / 1000);
  if (x.jetons) sig.jetons = x.jetons;
  return sig;
}
