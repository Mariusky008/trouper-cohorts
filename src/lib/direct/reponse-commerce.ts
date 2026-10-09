/**
 * ✅ LA RÉPONSE DU COMMERÇANT À UNE DEMANDE NÉE D'UN DUEL — d'un appui.
 *
 * « Ne jamais afficher "réservé" si le commerçant ne l'a pas réellement
 * confirmé. » Le salon ne peut donc écrire « Mise de côté confirmée » que si
 * LUI l'a dit. Or il n'est pas dans le salon, et il ne lira pas son espace
 * pro dans l'heure : la demande lui arrive sur WhatsApp. C'est donc là qu'on
 * lui tend la réponse — un lien dans le message, une page, deux boutons.
 *
 * LE LIEN EST SIGNÉ ET N'OUVRE QU'UNE PAGE. Signé : personne ne fabrique la
 * réponse d'un commerce à la main. Une page et pas une action : WhatsApp
 * ouvre lui-même l'adresse pour en faire l'aperçu, au moment où le client
 * envoie le message — un lien qui confirmerait en s'ouvrant se confirmerait
 * tout seul. Rien ne s'écrit avant qu'il appuie.
 *
 * FICHIER SERVEUR : le secret ne quitte jamais le serveur.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type JetonReponse = {
  /** La conversation. */
  c: string;
  /** Le duel. */
  d: string;
  /** Ce qui est demandé, et son prix. */
  o: string;
  p?: string;
  /** Le prénom du client, quand il en a donné un. */
  q?: string;
  /** Le commerce, tel qu'il s'affiche. */
  m?: string;
  /** Le geste demandé : « Mettre de côté », « Réserver »… */
  a?: string;
  /** Quand le lien a été fait (ms). */
  t: number;
};

/** Sept jours : au-delà, une mise de côté ne veut plus rien dire. */
const DUREE_MS = 7 * 24 * 3600_000;

const secret = () => String(process.env.SALONS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const signer = (corps: string, k: string) => createHmac("sha256", k).update(`reponse|${corps}`).digest("base64url").slice(0, 32);

/** Le jeton du lien ; vide quand le serveur n'a pas de quoi signer. */
export function signerReponse(j: JetonReponse): string {
  const k = secret();
  if (!k) return "";
  const corps = Buffer.from(JSON.stringify(j)).toString("base64url");
  return `${corps}.${signer(corps, k)}`;
}

/** Le jeton relu, s'il est intact et encore valable. */
export function lireJetonReponse(jeton: string): JetonReponse | null {
  const k = secret();
  const [corps, sig] = String(jeton || "").split(".");
  if (!k || !corps || !sig || corps.length > 1200) return null;
  const attendu = signer(corps, k);
  if (attendu.length !== sig.length || !timingSafeEqual(Buffer.from(attendu), Buffer.from(sig))) return null;
  try {
    const j = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as JetonReponse;
    if (!j || typeof j.c !== "string" || typeof j.d !== "string" || typeof j.o !== "string") return null;
    if (!Number.isFinite(j.t) || Date.now() - j.t > DUREE_MS) return null;
    return j;
  } catch {
    return null;
  }
}
