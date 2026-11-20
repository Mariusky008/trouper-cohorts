/**
 * ✨ MA PASSION À MOI, CÔTÉ SERVEUR (`passion-perso.ts` ; `docs/univers/decouvrir.md`, section 23.2 ; le lot D9).
 *
 *   - la choisir (relue, partagée par ceux qui écrivent la même chose), la changer, l'enlever ;
 *   - ses vidéos : une recherche YouTube (`search.list`, 100 unités ; en France, en français, lisibles ailleurs, des trente
 *     derniers jours ; `safeSearch=strict` pour les 15-17 ans, qui ont la leur), puis `videos.list` et les filtres de la
 *     sélection (30 s à 20 min, jamais réservée aux adultes, rien d'alcoolisé) — tout de suite quand quelqu'un la choisit
 *     (s'il reste de quoi dans la journée : 10 recherches), puis tous les trois jours la nuit (20 recherches ; les
 *     passions suivies par le plus de monde d'abord). Avec la sélection des thèmes (6 900 unités), 9 900 sur 10 000 ;
 *   - l'administrateur : les passions à soi (les mots, combien de personnes, la dernière recherche) ; en refuser.
 *
 * LE SEAU : `<h>/passions.json` gagne `perso: { mots, cle }` ; `decouvrir/perso/<clé>[.jeunes].json` = { mots, videos,
 * le, cherche, gens, erreur? } — `gens` : l'identifiant court de chacun (jamais un compte) ; `decouvrir/perso-budget.json`
 * = { jour, nuit, journee } ; `decouvrir/perso-refusees.json` = { cles }.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { sesDixHuitAns } from "./majorite-serveur";
import { appeler, details, youtubeBranche } from "./selection-serveur";
import { PASSION_PERSO, PHRASES_PASSION_PERSO as P, passionValide, type PassionPerso } from "./passion-perso";
import type { Passions, VideoDuJour } from "./decouvrir";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
type FichePerso = { mots: string; videos: VideoDuJour[]; le: string; cherche: string; gens: string[]; erreur?: string };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const DOSSIER = "decouvrir/perso";
const cheminPassions = (h: string) => `${h}/passions.json`;
const cheminPerso = (cle: string, jeunes: boolean) => `${DOSSIER}/${cle}${jeunes ? ".jeunes" : ""}.json`;
const CHEMIN_BUDGET = "decouvrir/perso-budget.json";
const CHEMIN_REFUSEES = "decouvrir/perso-refusees.json";
const CLE = /^[a-z0-9-]{2,60}$/;

async function lireFiche(supabase: Supabase, cle: string, jeunes: boolean): Promise<FichePerso | null> {
  const f = await lireJson<Partial<FichePerso>>(supabase, cheminPerso(cle, jeunes)).catch(() => ({}) as Partial<FichePerso>);
  if (!f || !s(f.mots)) return null;
  return { mots: s(f.mots), videos: Array.isArray(f.videos) ? f.videos : [], le: s(f.le), cherche: s(f.cherche), gens: Array.isArray(f.gens) ? f.gens.filter((x) => typeof x === "string") : [], ...(f.erreur ? { erreur: f.erreur } : {}) };
}

export async function refusees(supabase: Supabase): Promise<Set<string>> {
  const r = await lireJson<{ cles?: string[] }>(supabase, CHEMIN_REFUSEES).catch(() => ({}) as { cles?: string[] });
  return new Set(Array.isArray(r.cles) ? r.cles : []);
}

/** Le budget de recherches du jour (heure de Paris) : `quand` — la nuit ou la journée ; vrai s'il en restait une (comptée). */
async function prendreUneRecherche(supabase: Supabase, quand: "nuit" | "journee"): Promise<boolean> {
  const jour = jourParis();
  const b = await lireJson<{ jour?: string; nuit?: number; journee?: number }>(supabase, CHEMIN_BUDGET).catch(() => ({}) as { jour?: string; nuit?: number; journee?: number });
  const n = b.jour === jour ? { nuit: Number(b.nuit) || 0, journee: Number(b.journee) || 0 } : { nuit: 0, journee: 0 };
  const max = quand === "nuit" ? PASSION_PERSO.budgetNuit : PASSION_PERSO.budgetJournee;
  if (n[quand] >= max) return false;
  await ecrireJson(supabase, CHEMIN_BUDGET, { jour, ...n, [quand]: n[quand] + 1 });
  return true;
}

/** 🔎 Ses vidéos : une recherche, puis les filtres de la sélection. */
async function chercherSesVideos(supabase: Supabase, cle: string, jeunes: boolean): Promise<{ n: number; erreur?: string }> {
  const f = await lireFiche(supabase, cle, jeunes);
  if (!f) return { n: 0, erreur: "Passion inconnue." };
  try {
    const depuis = new Date(Date.now() - PASSION_PERSO.fraicheurJours * 86400_000).toISOString();
    const j = await appeler<{ items?: { id?: { videoId?: string } }[] }>("search", {
      part: "snippet",
      type: "video",
      maxResults: "25",
      q: f.mots,
      regionCode: "FR",
      relevanceLanguage: "fr",
      videoEmbeddable: "true",
      safeSearch: jeunes ? "strict" : "moderate",
      publishedAfter: depuis,
    });
    const ids = (j.items ?? []).map((i) => s(i.id?.videoId)).filter((id) => /^[\w-]{11}$/.test(id));
    const videos = (ids.length ? await details(ids) : []).slice(0, PASSION_PERSO.videos);
    const { erreur: _ancienne, ...reste } = f;
    void _ancienne;
    const maintenant = new Date().toISOString();
    await ecrireJson(supabase, cheminPerso(cle, jeunes), { ...reste, videos, le: maintenant, cherche: maintenant } satisfies FichePerso);
    return { n: videos.length };
  } catch (e) {
    // (une panne de YouTube : les vidéos d'avant restent ; l'erreur est notée pour l'administration)
    const erreur = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    console.error("[decouvrir] passion à soi", cle, erreur);
    await ecrireJson(supabase, cheminPerso(cle, jeunes), { ...f, cherche: new Date().toISOString(), erreur } satisfies FichePerso);
    return { n: f.videos.length, erreur };
  }
}

const aRefaire = (f: FichePerso) => !f.cherche || Date.now() - Date.parse(f.cherche) > PASSION_PERSO.jours * 86400_000 - 3600_000;

/** Ses passions (le fichier tel quel, avec `perso`). */
async function lirePassionsBrutes(supabase: Supabase, h: string): Promise<Partial<Passions>> {
  return lireJson<Partial<Passions>>(supabase, cheminPassions(h)).catch(() => ({}) as Partial<Passions>);
}

/** ✨ Sa passion à soi (et si l'administrateur l'a refusée). */
export async function maPassionPerso(supabase: Supabase, h: string): Promise<(PassionPerso & { refusee?: true }) | null> {
  const [p, non] = await Promise.all([lirePassionsBrutes(supabase, h), refusees(supabase)]);
  const x = p.perso;
  if (!x || !s(x.mots) || !CLE.test(s(x.cle))) return null;
  return { mots: s(x.mots), cle: s(x.cle), ...(non.has(s(x.cle)) ? { refusee: true as const } : {}) };
}

/**
 * ✨ Il écrit sa passion (ou l'enlève : des mots vides). Relue ; partagée par ceux qui écrivent la même chose ; ses vidéos
 * cherchées tout de suite si elles n'existent pas encore (ou ont plus de trois jours), s'il reste de quoi aujourd'hui.
 */
export async function choisirPassionPerso(supabase: Supabase, moi: Habitant, mots: unknown): Promise<Resultat<{ perso?: PassionPerso | null; bientot?: true }>> {
  const p = await lirePassionsBrutes(supabase, moi.id);
  if (!Array.isArray(p.passions) || !p.passions.length) return { error: "Choisis d’abord tes passions.", statut: 400 };
  const adulte = await sesDixHuitAns(supabase, moi.id);
  const jeunes = adulte !== true;
  const q8 = qui8(moi.id);
  const avant = p.perso && CLE.test(s(p.perso.cle)) ? s(p.perso.cle) : null;
  // (l'enlever)
  if (typeof mots === "string" && !mots.trim()) {
    const { perso: _p, ...reste } = p;
    void _p;
    await ecrireJson(supabase, cheminPassions(moi.id), reste);
    if (avant) await quitter(supabase, avant, jeunes, q8);
    return { perso: null };
  }
  const v = passionValide(mots);
  if ("error" in v) return { error: v.error, statut: 400 };
  if ((await refusees(supabase)).has(v.passion.cle)) return { error: P.refusee, statut: 400 };
  if (!(await ecrireJson(supabase, cheminPassions(moi.id), { ...p, perso: v.passion }))) return { error: "Ça n’est pas passé. Réessaie.", statut: 502 };
  if (avant && avant !== v.passion.cle) await quitter(supabase, avant, jeunes, q8);
  const f = await lireFiche(supabase, v.passion.cle, jeunes);
  await ecrireJson(supabase, cheminPerso(v.passion.cle, jeunes), {
    mots: f?.mots ?? v.passion.mots,
    videos: f?.videos ?? [],
    le: f?.le ?? "",
    cherche: f?.cherche ?? "",
    gens: [...new Set([...(f?.gens ?? []), q8])].slice(-5000),
    ...(f?.erreur ? { erreur: f.erreur } : {}),
  } satisfies FichePerso);
  const fraiche = (await lireFiche(supabase, v.passion.cle, jeunes))!;
  let bientot = !fraiche.videos.length;
  if (aRefaire(fraiche) && youtubeBranche() && (await prendreUneRecherche(supabase, "journee"))) {
    const r = await chercherSesVideos(supabase, v.passion.cle, jeunes);
    bientot = r.n === 0;
  }
  return { perso: v.passion, ...(bientot ? { bientot: true as const } : {}) };
}

async function quitter(supabase: Supabase, cle: string, jeunes: boolean, q8: string): Promise<void> {
  const f = await lireFiche(supabase, cle, jeunes);
  if (f) await ecrireJson(supabase, cheminPerso(cle, jeunes), { ...f, gens: f.gens.filter((x) => x !== q8) } satisfies FichePerso);
}

/** 📺 Les vidéos de sa passion à soi, pour sa télé du jour (rien si elle est refusée). */
export async function videosDeMaPassion(supabase: Supabase, h: string, adulte: boolean | null): Promise<{ mots: string; videos: VideoDuJour[] } | null> {
  const p = await maPassionPerso(supabase, h);
  if (!p || p.refusee) return null;
  const f = await lireFiche(supabase, p.cle, adulte !== true);
  return f ? { mots: p.mots, videos: f.videos } : { mots: p.mots, videos: [] };
}

/** Toutes les passions à soi (leurs fichiers). */
async function toutesLesPassions(supabase: Supabase): Promise<{ cle: string; jeunes: boolean }[]> {
  const l: { cle: string; jeunes: boolean }[] = [];
  for (let debut = 0; debut < 20_000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(DOSSIER, { limit: 1000, offset: debut });
    for (const e of data ?? []) {
      const m = /^([a-z0-9-]+)(\.jeunes)?\.json$/.exec(e.name);
      if (m && CLE.test(m[1])) l.push({ cle: m[1], jeunes: Boolean(m[2]) });
    }
    if ((data ?? []).length < 1000) break;
  }
  return l;
}

/**
 * 🌙 La nuit : les passions à soi qui ont plus de trois jours (ou n'ont jamais été cherchées), suivies par au moins une
 * personne, les plus suivies d'abord ; 20 recherches au plus.
 */
export async function rafraichirLesPassionsPerso(supabase: Supabase, o: { fin?: number } = {}): Promise<{ faites: number; erreurs: number; attendent: number }> {
  if (!youtubeBranche()) return { faites: 0, erreurs: 0, attendent: 0 };
  const [toutes, non] = await Promise.all([toutesLesPassions(supabase), refusees(supabase)]);
  const fiches = (await Promise.all(toutes.map(async (x) => ({ ...x, f: await lireFiche(supabase, x.cle, x.jeunes) })))).filter(
    (x): x is { cle: string; jeunes: boolean; f: FichePerso } => Boolean(x.f) && !non.has(x.cle) && x.f!.gens.length > 0 && aRefaire(x.f!),
  );
  fiches.sort((a, b) => b.f.gens.length - a.f.gens.length);
  let faites = 0;
  let erreurs = 0;
  let k = 0;
  for (; k < fiches.length; k++) {
    if (o.fin && Date.now() > o.fin) break;
    if (!(await prendreUneRecherche(supabase, "nuit"))) break;
    const r = await chercherSesVideos(supabase, fiches[k].cle, fiches[k].jeunes);
    if (r.erreur) erreurs++;
    else faites++;
  }
  return { faites, erreurs, attendent: fiches.length - k };
}

/** 🛡️ Pour l'administration : les passions à soi, les plus suivies d'abord (50 au plus) ; le budget du jour. */
export async function passionsPerso(supabase: Supabase): Promise<{ passions: { cle: string; jeunes: boolean; mots: string; gens: number; videos: number; cherche: string; erreur?: string; refusee?: true }[]; budget: { jour: string; nuit: number; journee: number } }> {
  const [toutes, non, b] = await Promise.all([toutesLesPassions(supabase), refusees(supabase), lireJson<{ jour?: string; nuit?: number; journee?: number }>(supabase, CHEMIN_BUDGET).catch(() => ({}) as { jour?: string; nuit?: number; journee?: number })]);
  const fiches = await Promise.all(toutes.map(async (x) => ({ ...x, f: await lireFiche(supabase, x.cle, x.jeunes) })));
  const passions = fiches
    .filter((x): x is { cle: string; jeunes: boolean; f: FichePerso } => Boolean(x.f) && (x.f!.gens.length > 0 || non.has(x.cle)))
    .map((x) => ({ cle: x.cle, jeunes: x.jeunes, mots: x.f.mots, gens: x.f.gens.length, videos: x.f.videos.length, cherche: x.f.cherche, ...(x.f.erreur ? { erreur: x.f.erreur } : {}), ...(non.has(x.cle) ? { refusee: true as const } : {}) }))
    .sort((a, b2) => b2.gens - a.gens)
    .slice(0, 50);
  const jour = jourParis();
  return { passions, budget: { jour, nuit: b.jour === jour ? Number(b.nuit) || 0 : 0, journee: b.jour === jour ? Number(b.journee) || 0 : 0 } };
}

/** 🗑️ L'administrateur refuse des mots : ils disparaissent pour tout le monde (chacun choisit autre chose). */
export async function refuserPassion(supabase: Supabase, cle: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const c = s(cle);
  if (!CLE.test(c)) return { error: "Demande incomplète.", statut: 400 };
  const deja = await refusees(supabase);
  await ecrireJson(supabase, CHEMIN_REFUSEES, { cles: [...new Set([...deja, c])].slice(-2000), le: new Date().toISOString() });
  return { ok: true };
}
