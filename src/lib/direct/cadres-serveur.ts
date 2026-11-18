/**
 * 🖼️ LES CADRES DE LA PIÈCE DU DUO — CE QUI Y EST ACCROCHÉ (`cadres.ts`, `docs/univers/salon-du-duo.md` 4.9 ; le lot S6).
 *
 * LE SEAU : `fils/<paire>/cadres.json` = { cadres: { "<numéro>": { message, par8, le } } } — une photo de leur
 * conversation par cadre (de 0 à 3). Une photo qu'il a signalée n'y est plus, chez lui ; une photo effacée non plus.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { battre } from "./pouls-serveur";
import { dossierMessages, hDeCle, nomsDuFil, pairDe, parolesCachees, qui8, seParlent, vueDeLaPhoto, type FicheMessage } from "./talkie-serveur";
import { CADRES_MAX, PHRASES_CADRES, type CadreVu } from "./cadres";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const cheminCadres = (pair: string) => `fils/${pair}/cadres.json`;
export type FicheCadres = { cadres?: Record<string, { message?: string; par8?: string; le?: string }> };

/** Ce qui est accroché, tel que `moi` le voit (les photos qu'il a signalées, ou effacées, n'y sont plus). */
export async function cadresDuDuo(supabase: Supabase, moi: string, pair: string, fiche?: FicheCadres): Promise<CadreVu[]> {
  const f = fiche ?? (await lireJson<FicheCadres>(supabase, cheminCadres(pair)).catch((): FicheCadres => ({})));
  const entrees = Object.entries(f.cadres ?? {})
    .map(([k, v]) => ({ cadre: Number(k), message: s(v?.message), par8: s(v?.par8), le: s(v?.le) }))
    .filter((x) => Number.isInteger(x.cadre) && x.cadre >= 0 && x.cadre < CADRES_MAX && x.message);
  if (!entrees.length) return [];
  const [noms, caches] = await Promise.all([nomsDuFil(supabase, pair), parolesCachees(supabase, moi).catch(() => new Set<string>())]);
  const vus = await Promise.all(
    entrees.map(async (e): Promise<CadreVu | null> => {
      const n = noms.find((x) => x.id === e.message);
      if (!n || caches.has(e.message)) return null;
      const fm = await lireJson<FicheMessage>(supabase, `${dossierMessages(pair)}/${n.nom}`).catch((): FicheMessage => ({}));
      if (fm.genre !== "photo") return null;
      const v = await vueDeLaPhoto(supabase, fm, moi).catch(() => null);
      if (!v?.photo) return null;
      return { cadre: e.cadre, message: e.message, url: v.photo.url, l: v.photo.l, h: v.photo.h, ...(v.texte ? { legende: v.texte } : {}), par: e.par8 === qui8(moi) ? "moi" : "lui", le: e.le };
    }),
  );
  return vus.filter((x): x is CadreVu => Boolean(x)).sort((a, b) => a.cadre - b.cadre);
}

/** Les deux, et leur paire ; sinon l'erreur (inconnu : 404 ; pas proches : 403). */
async function leDuo(supabase: Supabase, moi: string, avec: unknown): Promise<{ h?: string; pair?: string; error?: string; statut?: number }> {
  const h = await hDeCle(supabase, avec);
  if (!h || h === moi) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  return { h, pair: pairDe(moi, h) };
}

/** 🖼️ Leurs cadres, avec ce proche (sa clé de profil). */
export async function lesCadres(supabase: Supabase, moi: string, avec: unknown): Promise<{ cadres?: CadreVu[]; error?: string; statut?: number }> {
  const d = await leDuo(supabase, moi, avec);
  if (!d.pair) return { error: d.error, statut: d.statut };
  return { cadres: await cadresDuDuo(supabase, moi, d.pair) };
}

/**
 * 🖼️ ACCROCHER UNE PHOTO de leur conversation dans un cadre (de 0 à 3 ; celui qui y était s'en va), chez les deux ; le
 * pouls bat. → `{ cadres }`. 404 : un message inconnu (ou qu'il a signalé) ; 422 : ce n'est pas une photo ; 400 : pas de
 * cadre.
 */
export async function accrocher(supabase: Supabase, moi: Habitant, avec: unknown, message: unknown, cadre: unknown): Promise<{ cadres?: CadreVu[]; error?: string; statut?: number }> {
  const d = await leDuo(supabase, moi.id, avec);
  if (!d.pair) return { error: d.error, statut: d.statut };
  const i = Number(cadre);
  if (!Number.isInteger(i) || i < 0 || i >= CADRES_MAX) return { error: "Ce cadre n’existe pas.", statut: 400 };
  const id = s(message);
  if (!/^[a-z0-9]{4,40}$/.test(id)) return { error: "Ce message n’existe plus.", statut: 404 };
  const [noms, caches, fiche] = await Promise.all([nomsDuFil(supabase, d.pair), parolesCachees(supabase, moi.id).catch(() => new Set<string>()), lireJson<FicheCadres>(supabase, cheminCadres(d.pair)).catch((): FicheCadres => ({}))]);
  const n = noms.find((x) => x.id === id);
  if (!n || caches.has(id)) return { error: "Ce message n’existe plus.", statut: 404 };
  const fm = await lireJson<FicheMessage>(supabase, `${dossierMessages(d.pair)}/${n.nom}`);
  if (fm.genre !== "photo" || !s(fm.media?.chemin)) return { error: PHRASES_CADRES.pasUnePhoto, statut: 422 };
  const neuve: FicheCadres = { cadres: { ...(fiche.cadres ?? {}), [String(i)]: { message: id, par8: qui8(moi.id), le: new Date().toISOString() } } };
  if (!(await ecrireJson(supabase, cheminCadres(d.pair), neuve))) return { error: "Le mur ne répond pas. Réessaie.", statut: 503 };
  await battre(supabase, moi, avec).catch(() => undefined);
  return { cadres: await cadresDuDuo(supabase, moi.id, d.pair, neuve) };
}
