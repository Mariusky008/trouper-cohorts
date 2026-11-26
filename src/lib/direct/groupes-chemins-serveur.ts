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
 * - (lot G6) `groupes/jour/<id>/<jour>/<q>.json` : ma vidéo du jour pour le groupe, et mon mot ;
 *   `groupes/envies/<id>/<jour>/<q>.json` : les vidéos que je veux ce soir (🙋).
 * - (lot G8) `groupes/themes/<id>/<thème>.json` : un thème de plus (écrit par celui qui l'ajoute) ;
 *   `groupes/accueils/<id>/<q>.json` : quelqu'un qu'un membre propose d'accueillir ;
 *   `groupes/accueils-partants/<id>/<q de l'accueilli>/<q>.json` : je suis partant pour l'accueillir.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES, lireJson } from "./ma-figurine-serveur";
import { ENVIES_RETENUE, ID_GROUPE, THEMES_EN_PLUS_MAX, themeDuGroupe, type PlaceGroupe } from "./groupes";
import type { IdTheme } from "./decouvrir";
import type { VideoSalon } from "./salons-ouverts";

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

export const dossierJourGroupe = (id: string, jour: string) => `groupes/jour/${id}/${jour}`;
export const dossierEnvies = (id: string, jour: string) => `groupes/envies/${id}/${jour}`;
/** 🙋 Mes envies du jour : les vidéos (entières, pour que le salon puisse les passer) que je veux ce soir. */
export type FicheEnvies = { q: string; videos: VideoSalon[]; le: number };

/** Les envies du jour de chacun (une fiche par personne). */
export async function enviesDuJour(supabase: Supabase, id: string, jour: string): Promise<FicheEnvies[]> {
  const noms = await listerGroupes(supabase, dossierEnvies(id, jour), 40);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FicheEnvies>>(supabase, `${dossierEnvies(id, jour)}/${n}`).catch(() => ({}) as Partial<FicheEnvies>)));
  return l.filter((x): x is FicheEnvies => Boolean(x.q && Array.isArray(x.videos)));
}

/**
 * 🎬 (lot G6) Les vidéos retenues ce soir (deux mains levées au moins), dans l'ordre où elles ont été voulues : elles
 * ouvrent la télé du salon du groupe.
 */
export async function videosRetenues(supabase: Supabase, id: string, jour: string): Promise<VideoSalon[]> {
  const envies = (await enviesDuJour(supabase, id, jour)).sort((a, b) => a.le - b.le);
  const par = new Map<string, { v: VideoSalon; n: number }>();
  for (const f of envies)
    for (const v of f.videos) {
      if (!v?.id) continue;
      const x = par.get(v.id) ?? { v: { id: v.id, titre: s(v.titre), chaine: s(v.chaine), duree: Number(v.duree) || 0 }, n: 0 };
      x.n++;
      par.set(v.id, x);
    }
  return [...par.values()].filter((x) => x.n >= ENVIES_RETENUE).map((x) => x.v);
}

export const dossierThemes = (id: string) => `groupes/themes/${id}`;
/** 🌱 (lot G8) Un thème de plus. */
export type FicheTheme = { theme: IdTheme; q: string; prenom: string; le: number };
/** Les thèmes ajoutés au groupe, dans l'ordre où ils l'ont été. */
export async function themesEnPlus(supabase: Supabase, id: string): Promise<FicheTheme[]> {
  const noms = await listerGroupes(supabase, dossierThemes(id), 20);
  const l = await Promise.all(noms.map((n) => lireJson<Partial<FicheTheme>>(supabase, `${dossierThemes(id)}/${n}`).catch(() => ({}) as Partial<FicheTheme>)));
  return l
    .filter((x): x is FicheTheme => Boolean(x.theme && themeDuGroupe(x.theme) && x.q))
    .sort((a, b) => a.le - b.le)
    .slice(0, THEMES_EN_PLUS_MAX);
}
/** Tous les thèmes du groupe : sa passion d'abord. */
export async function themesDuGroupe(supabase: Supabase, id: string, passion: unknown): Promise<IdTheme[]> {
  const t = themeDuGroupe(passion);
  const plus = (await themesEnPlus(supabase, id).catch(() => [] as FicheTheme[])).map((x) => x.theme).filter((x) => x !== t?.id);
  return [...(t ? [t.id] : []), ...new Set(plus)];
}
export const dossierAccueils = (id: string) => `groupes/accueils/${id}`;
export const dossierPartantsAccueil = (id: string, q: string) => `groupes/accueils-partants/${id}/${q}`;
