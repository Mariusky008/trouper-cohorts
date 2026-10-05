/**
 * 🔐 QUI PEUT LIRE, ÉCRIRE, ENTRER DANS UN SALON — les règles, à un seul endroit.
 *
 * Voir la migration `20261008120000_salons_acces.sql`. Ces fonctions sont
 * pures : la route les applique à ce qu'elle a lu en base, et les essais les
 * vérifient sans base.
 *
 *   · SALON PRIVÉ : lisible par ses membres, et par eux seuls. Le titre et le
 *     prénom de celui qui invite sont tout ce qu'un lien montre à quelqu'un
 *     d'autre — ni messages, ni photos, ni participants.
 *   · SALON PUBLIC : lisible par tous ; écrire demande de l'avoir rejoint.
 *   · EXCLU : ne lit plus un salon privé, n'écrit plus nulle part, ne revient pas.
 *
 * FICHIER SERVEUR.
 */
import { createHmac, createHash } from "crypto";

export type Role = "createur" | "moderateur" | "membre";

export type LigneConversation = {
  id: string;
  ville_slug: string;
  createur: string | null;
  prive: boolean;
  supprime_le: string | null;
  base: Record<string, unknown>;
  activite: string;
};

export type LigneMembre = {
  conversation: string;
  habitant: string;
  role: Role;
  qui: string;
  sourdine: boolean;
  quitte_le: string | null;
  exclu_le: string | null;
};

/**
 * CE QUE JE SUIS POUR CE SALON :
 *   membre      — j'en fais partie ;
 *   lecture     — salon public que je lis sans l'avoir rejoint ;
 *   invite      — une invitation à mon nom m'attend ;
 *   a_demander  — salon privé ouvert par un lien : je peux demander à entrer ;
 *   demande     — ma demande attend la réponse du créateur ;
 *   refusee     — ma demande a été refusée ;
 *   exclu       — un modérateur m'en a exclu.
 */
export type Statut = "membre" | "lecture" | "invite" | "a_demander" | "demande" | "refusee" | "exclu";

export const actif = (m: LigneMembre | null | undefined): m is LigneMembre => Boolean(m && !m.quitte_le && !m.exclu_le);
export const exclu = (m: LigneMembre | null | undefined) => Boolean(m?.exclu_le);

export function peutLire(c: Pick<LigneConversation, "prive" | "supprime_le">, m: LigneMembre | null | undefined): boolean {
  if (c.supprime_le) return false;
  if (!c.prive) return true;
  return actif(m);
}

export function peutEcrire(c: Pick<LigneConversation, "supprime_le">, m: LigneMembre | null | undefined): boolean {
  return !c.supprime_le && actif(m);
}

export function estModerateur(m: LigneMembre | null | undefined): boolean {
  return actif(m) && (m.role === "createur" || m.role === "moderateur");
}

export function statutPour(
  c: Pick<LigneConversation, "prive" | "supprime_le">,
  m: LigneMembre | null | undefined,
  o: { demande?: "attente" | "acceptee" | "refusee" | null; invitationPourMoi?: boolean } = {},
): Statut {
  if (exclu(m)) return "exclu";
  if (actif(m)) return "membre";
  if (o.invitationPourMoi) return "invite";
  if (!c.prive) return "lecture";
  if (o.demande === "attente") return "demande";
  if (o.demande === "refusee") return "refusee";
  return "a_demander";
}

/** L'empreinte d'un habitant dans UNE conversation : la même pour tous ses gestes, différente ailleurs. */
export const empreinte = (habitant: string, conv: string) => createHash("sha1").update(`${habitant}|${conv}`).digest("hex").slice(0, 10);

/**
 * UNE PERSONNE VUE PAR UNE AUTRE — pour « Inviter une personne de mes
 * discussions ». Opaque, et propre à celui qui regarde : deux habitants ne
 * peuvent pas recouper leurs listes pour suivre quelqu'un de salon en salon.
 */
export function refPour(regardeur: string, habitant: string): string {
  const secret = process.env.SALONS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "clikme-salons";
  return createHmac("sha256", secret).update(`${regardeur}|${habitant}`).digest("hex").slice(0, 20);
}

/**
 * CE QU'UN LIEN MONTRE D'UN SALON PRIVÉ À QUI N'EN FAIT PAS PARTIE : son titre,
 * qui invite, et rien d'autre — comme une invitation de groupe ordinaire.
 */
export function apercuPrive(c: LigneConversation, invitePar: string) {
  const b = c.base ?? {};
  return { cle: c.id, sujet: String(b.sujet ?? "Un salon privé").slice(0, 200), parQui: invitePar || "Quelqu'un", prive: true, ou: "", quand: "" };
}
