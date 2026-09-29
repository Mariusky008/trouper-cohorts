/**
 * 🔏 LE SCEAU DES PHRASES DU DOUBLE — pour que sa voix ne dise que les siennes.
 *
 * LA VOIX COÛTE, ET UNE ROUTE QUI LIT N'IMPORTE QUEL TEXTE SE FAIT UTILISER
 * PAR N'IMPORTE QUI. La voix du récit s'en gardait en n'acceptant aucun texte ;
 * le double, lui, invente ses phrases à chaque question, on ne peut donc pas
 * les écrire d'avance. Alors le serveur SIGNE chaque réponse qu'il vient
 * d'écrire, et la route de la voix ne lit que ce qui porte sa signature.
 *
 * FICHIER SERVEUR : le secret ne quitte jamais le serveur.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = () =>
  String(process.env.DOUBLE_VOIX_SECRET || process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY || "").trim();

export function scellerVoix(id: string, texte: string): string {
  const k = secret();
  if (!k) return "";
  return createHmac("sha256", k).update(`${id}\n${texte}`).digest("base64url");
}

export function sceauValide(id: string, texte: string, sig: string): boolean {
  const attendu = scellerVoix(id, texte);
  if (!attendu || !sig || attendu.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(attendu), Buffer.from(sig));
}
