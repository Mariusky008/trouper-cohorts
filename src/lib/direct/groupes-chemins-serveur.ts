/**
 * 👥 MES GROUPES (lot G4) — où les groupes gardés sont rangés dans le seau, et qui en est membre. À part, pour que les
 * salons (`salons-ouverts-serveur.ts`) puissent ouvrir le salon d'un groupe sans dépendre de tout Mes groupes.
 *
 * Un fichier par personne, comme partout : personne n'écrit jamais le fichier d'un autre.
 * - `groupes/groupes/<id>.json` : son identité (nom, mot, passion), écrite une fois, par celui qui le fait naître ;
 * - `groupes/membres/<id>/<q>.json` : un membre (son prénom, sa figurine), écrit par lui-même quand il le garde ;
 * - `groupes/miens/<q>.json` : mes groupes (leurs identifiants) ;
 * - `groupes/invites/<id>/<q>.json` et `groupes/invitations/<q>/<id>.json` : un proche invité par celui qui l'a créé ;
 * - `groupes/passages/<id>/<q>.json` : mon dernier passage dans son salon ;
 * - (lot G5) `groupes/rdv/<id>/<rdv>.json` : un rendez-vous (écrit par celui qui le propose) ;
 *   `groupes/reponses/<id>/<rdv>/<q>.json` : ma réponse (Je viens, Absent, Plus tard) pour sa prochaine fois ;
 *   `groupes/discussion/<id>/<ms>-<q>-<hex>.json` : un message ; `groupes/rappels-rdv/<id>/<rdv>.json` : le dernier rappel.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES, lireJson } from "./ma-figurine-serveur";
import { ID_GROUPE, type PlaceGroupe } from "./groupes";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const cheminGroupe = (id: string) => `groupes/groupes/${id}.json`;
export const dossierMembres = (id: string) => `groupes/membres/${id}`;
export const cheminMembre = (id: string, q: string) => `${dossierMembres(id)}/${q}.json`;
export const cheminMiens = (q: string) => `groupes/miens/${q}.json`;
export const dossierInvites = (id: string) => `groupes/invites/${id}`;
export const dossierInvitationsGroupe = (q: string) => `groupes/invitations/${q}`;
export const dossierPassages = (id: string) => `groupes/passages/${id}`;

export const idGroupeValide = (x: unknown) => (ID_GROUPE.test(s(x)) ? s(x) : null);

/** Un membre, dans le seau (son compte n'est jamais montré). */
export type FicheMembre = PlaceGroupe & { h: string; le: number };

/** Suis-je membre de ce groupe ? (ma fiche de membre existe) */
export async function estMembre(supabase: Supabase, id: string, q: string): Promise<boolean> {
  const f = await lireJson<Partial<FicheMembre>>(supabase, cheminMembre(id, q)).catch(() => ({}) as Partial<FicheMembre>);
  return f.q === q && Boolean(f.h);
}

/** 🛋️ Le salon d'un groupe : « groupe-<id du groupe> » (un salon privé, comme les séances). */
export const PREFIXE_SALON_GROUPE = "groupe-";
export const idSalonDuGroupe = (id: string) => `${PREFIXE_SALON_GROUPE}${id}`;
export function groupeDuSalon(salon: unknown): string | null {
  const x = s(salon);
  return x.startsWith(PREFIXE_SALON_GROUPE) ? idGroupeValide(x.slice(PREFIXE_SALON_GROUPE.length)) : null;
}

export const dossierRdv = (id: string) => `groupes/rdv/${id}`;
export const dossierReponses = (id: string, rdv: string) => `groupes/reponses/${id}/${rdv}`;
export const dossierDiscussion = (id: string) => `groupes/discussion/${id}`;
export const cheminRappelRdv = (id: string, rdv: string) => `groupes/rappels-rdv/${id}/${rdv}.json`;

/** Les noms (`.json`) d'un dossier du seau, les plus récents d'abord (les noms commencent par l'heure). */
export async function listerGroupes(supabase: Supabase, dossier: string, limite = 100): Promise<string[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: limite, sortBy: { column: "name", order: "desc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.endsWith(".json"));
}

/** Les membres d'un groupe, dans l'ordre où ils l'ont gardé. */
export async function membresDe(supabase: Supabase, id: string): Promise<FicheMembre[]> {
  const noms = await listerGroupes(supabase, dossierMembres(id), 20);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FicheMembre>>(supabase, `${dossierMembres(id)}/${n}`).catch(() => ({}) as Partial<FicheMembre>)));
  return l.filter((x): x is FicheMembre => Boolean(x.q && x.h)).sort((a, b) => a.le - b.le);
}
