/**
 * 🎙️ « LAISSER UN MOT AVEC MA FIGURINE », CÔTÉ SERVEUR (`mots-video.ts` ; `docs/univers/decouvrir.md`, section 38).
 *
 * Rangé dans le seau, **un fichier par personne et par vidéo** (personne n'écrit jamais celui d'un autre) :
 *
 * - `decouvrir/mots/<tranche>/<vidéo>/<q>.json` = { h, q, prenom, chemin, type, duree, le, tetes, repond? } ; le son dans
 *   `decouvrir/mots/<tranche>/<vidéo>/son/<q>-<le>.<ext>` (un nouveau mot : un nouveau son, l'ancien s'efface) ;
 * - `decouvrir/mots-signales/<tranche>/<vidéo>/<q du mot>/<q de qui signale>.json` : qui l'a signalé (il ne passe plus
 *   chez lui ; trois personnes différentes : caché pour tous) ; et une copie pour l'administrateur, avec les signalements
 *   des salons (`decouvrir/signalements/<q>/<ms>-<q de qui signale>.json`, `salon: "mot:<vidéo>"`).
 *
 * `<tranche>` : « adultes » ou « jeunes » (les 15-17 ans) — leurs suites ne se croisent jamais. `<q>` : l'identifiant
 * court de quelqu'un (`qui8`) ; son compte n'est jamais montré. Un mot plus vieux que `MOTS_VIDEO.conserveJours` ne
 * passe plus (il s'efface quand on le croise).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, deposer, ecrireJson, lireJson, prenomDe, prochesDe, signer } from "./ma-figurine-serveur";
import { qui8, sonDe } from "./talkie-serveur";
import { sesDixHuitAns } from "./majorite-serveur";
import { maisonDe } from "./salons-ouverts";
import { maVideo } from "./tele-du-jour-serveur";
import { figurineDeLaMaison } from "./ma-maison-serveur";
import { figurineVivante } from "./expressions-figurine-serveur";
import { MOTS_VIDEO, ordonnerMots, tetesValides, type MotVu, type SuiteVue, type TeteMot } from "./mots-video";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number; age?: true };
type Tranche = "adultes" | "jeunes";
type FicheMot = { h?: string; q?: string; prenom?: string; chemin?: string; type?: string; duree?: number; le?: number; tetes?: unknown; repond?: string };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const ID_Q = /^[A-Za-z0-9_-]{4,16}$/;
const JOUR_MS = 24 * 3600_000;

const dossierMots = (m: Tranche, video: string) => `decouvrir/mots/${m}/${video}`;
const cheminMot = (m: Tranche, video: string, q: string) => `${dossierMots(m, video)}/${q}.json`;
const dossierSignales = (m: Tranche, video: string) => `decouvrir/mots-signales/${m}/${video}`;

async function lister(supabase: Supabase, dossier: string, limite = 100): Promise<{ nom: string; ms: number }[]> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: limite, sortBy: { column: "name", order: "asc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string; updated_at?: string | null; created_at?: string | null }[])
    .map((f) => ({ nom: s(f.name), ms: Date.parse(s(f.updated_at) || s(f.created_at)) || 0 }))
    .filter((f) => f.nom && f.nom !== ".emptyFolderPlaceholder");
}
const effacer = (supabase: Supabase, chemins: string[]) => (chemins.length ? supabase.storage.from(SEAU_FIGURINES).remove(chemins).then(() => undefined, () => undefined) : Promise.resolve());

/** Sa tranche (rien : il n'a pas encore dit s'il a 18 ans). */
async function saTranche(supabase: Supabase, h: string): Promise<Tranche | null> {
  return maisonDe(await sesDixHuitAns(supabase, h).catch(() => null));
}

/** La vidéo : une de sa télé du jour (même déjà vue). */
async function laVideo(supabase: Supabase, h: string, id: unknown): Promise<{ id: string } | null> {
  const x = s(id);
  if (!ID_VIDEO.test(x)) return null;
  const v = await maVideo(supabase, h, x).catch(() => null);
  return v ? { id: v.id } : null;
}

async function lireMot(supabase: Supabase, m: Tranche, video: string, q: string): Promise<FicheMot | null> {
  const f = await lireJson<FicheMot>(supabase, cheminMot(m, video, q)).catch(() => ({}) as FicheMot);
  return s(f.chemin) && Number(f.duree) > 0 ? f : null;
}

/** Les mots cachés d'une vidéo : signalés par moi, ou par assez de monde. */
async function cachesDe(supabase: Supabase, m: Tranche, video: string, moi: string): Promise<Set<string>> {
  const cibles = await lister(supabase, dossierSignales(m, video));
  const caches = new Set<string>();
  await Promise.all(
    cibles.map(async (c) => {
      const par = (await lister(supabase, `${dossierSignales(m, video)}/${c.nom}`)).map((e) => e.nom.replace(/\.json$/, ""));
      if (par.includes(moi) || par.length >= MOTS_VIDEO.seuilSignalements) caches.add(c.nom);
    }),
  );
  return caches;
}

/** Le prénom de quelqu'un (son compte, sinon sa fiche de figurine). */
async function prenomDu(supabase: Supabase, h: string): Promise<string> {
  const { data } = await supabase.from("human_habitants").select("prenom").eq("id", h).maybeSingle();
  return s((data as { prenom?: string } | null)?.prenom) || s(await prenomDe(supabase, { id: h } as Habitant).catch(() => "")) || "Quelqu’un";
}

/**
 * 🎬 LA SUITE D'UNE VIDÉO : les mots de ma tranche (sans ceux qu'on a cachés ni les trop vieux), mes proches d'abord,
 * chaque réponse après le mot auquel elle répond ; leur son (signé, une heure), leurs têtes, leur figurine.
 */
export async function suiteDeLaVideo(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ suite?: SuiteVue }>> {
  const v = await laVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const m = await saTranche(supabase, moi.id);
  if (!m) return { error: "Dis-nous d’abord si tu as 18 ans.", statut: 403, age: true };
  const maintenant = Date.now();
  const mienQ = qui8(moi.id);
  const entrees = (await lister(supabase, dossierMots(m, v.id), 200)).filter((e) => e.nom.endsWith(".json"));
  // (les trop vieux : effacés en passant, avec leur son)
  const vieux = entrees.filter((e) => e.ms && maintenant - e.ms > MOTS_VIDEO.conserveJours * JOUR_MS);
  if (vieux.length) {
    const fiches = await Promise.all(vieux.map((e) => lireMot(supabase, m, v.id, e.nom.replace(/\.json$/, ""))));
    void effacer(supabase, [...vieux.map((e) => `${dossierMots(m, v.id)}/${e.nom}`), ...fiches.map((f) => s(f?.chemin)).filter(Boolean)]);
  }
  const frais = entrees
    .filter((e) => !vieux.includes(e))
    .sort((a, b) => b.ms - a.ms)
    .slice(0, MOTS_VIDEO.lusMax);
  const [caches, proches, fiches] = await Promise.all([
    cachesDe(supabase, m, v.id, mienQ),
    prochesDe(supabase, moi.id),
    Promise.all(frais.map((e) => lireMot(supabase, m, v.id, e.nom.replace(/\.json$/, "")))),
  ]);
  const lus = fiches.filter((f): f is FicheMot => Boolean(f) && Number(f?.le) > maintenant - MOTS_VIDEO.conserveJours * JOUR_MS && (s(f?.q) === mienQ || !caches.has(s(f?.q))));
  const prenomsParQ = new Map(lus.map((f) => [s(f.q), s(f.prenom)]));
  const sans = lus.map((f) => {
    const q = s(f.q);
    const r = s(f.repond);
    return {
      f,
      q,
      le: Number(f.le) || 0,
      proche: proches.has(s(f.h)),
      ...(r && prenomsParQ.has(r) ? { repond: { q: r, prenom: prenomsParQ.get(r) ?? "" } } : {}),
    };
  });
  const ordre = ordonnerMots(sans);
  const mots = await Promise.all(
    ordre.map(async (x, k): Promise<MotVu> => {
      const h = s(x.f.h);
      const [src, figurine, vivante] = await Promise.all([
        signer(supabase, s(x.f.chemin), 3600).catch(() => ""),
        k < MOTS_VIDEO.figurinesMax ? figurineDeLaMaison(supabase, h).catch(() => null) : Promise.resolve(null),
        k < MOTS_VIDEO.figurinesMax ? figurineVivante(supabase, h).catch(() => null) : Promise.resolve(null),
      ]);
      return {
        q: x.q,
        prenom: s(x.f.prenom) || "Quelqu’un",
        duree: Number(x.f.duree) || 0,
        src,
        le: x.le,
        tetes: tetesValides(x.f.tetes, Number(x.f.duree) || 0),
        ...(x.repond ? { repond: x.repond } : {}),
        proche: x.proche,
        moi: x.q === mienQ,
        figurine: figurine ? { src: figurine.src } : null,
        ...(vivante ? { vivante } : {}),
      };
    }),
  );
  return { suite: { mots: mots.filter((x) => x.src), montres: MOTS_VIDEO.montres, tranche: m } };
}

/**
 * 🎙️ PUBLIER MON MOT : sa vraie voix (une à dix secondes), ses têtes (si on les a), à qui il répond ; avec l'accord
 * donné à l'écran (« Tout le monde qui regarde cette vidéo… »). Un seul par vidéo : le nouveau remplace l'ancien.
 */
export async function publierMot(
  supabase: Supabase,
  moi: Habitant,
  p: { id?: unknown; son?: unknown; duree?: unknown; tetes?: unknown; repond?: unknown; accord?: unknown },
): Promise<Resultat<{ ok?: true }>> {
  const v = await laVideo(supabase, moi.id, p.id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const m = await saTranche(supabase, moi.id);
  if (!m) return { error: "Dis-nous d’abord si tu as 18 ans.", statut: 403, age: true };
  if (p.accord !== true) return { error: "Il nous faut ton accord pour publier ton mot.", statut: 400 };
  const son = sonDe(p.son);
  const d = Number(p.duree);
  if (!son || !Number.isFinite(d) || d < MOTS_VIDEO.min || d > MOTS_VIDEO.max + 1.5) return { error: "Ton mot n’a pas pu partir : refais-le (une à dix secondes).", statut: 400 };
  const duree = Math.round(Math.min(MOTS_VIDEO.max, d) * 100) / 100;
  const q = qui8(moi.id);
  // (↩ une réponse : à un mot qui est là, pas au sien)
  const repond = s(p.repond);
  if (repond) {
    if (!ID_Q.test(repond) || repond === q || !(await lireMot(supabase, m, v.id, repond))) return { error: "Ce mot n’est plus là.", statut: 404 };
  }
  const avant = await lireMot(supabase, m, v.id, q);
  const le = Date.now();
  const chemin = `${dossierMots(m, v.id)}/son/${q}-${le}.${son.ext}`;
  if (!(await deposer(supabase, chemin, son.octets, son.type))) return { error: "Ton mot n’est pas parti. Réessaie dans un instant.", statut: 502 };
  const fiche: FicheMot = { h: moi.id, q, prenom: await prenomDu(supabase, moi.id), chemin, type: son.type, duree, le, tetes: tetesValides(p.tetes, duree) as TeteMot[], ...(repond ? { repond } : {}) };
  if (!(await ecrireJson(supabase, cheminMot(m, v.id, q), fiche))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  if (avant?.chemin && avant.chemin !== chemin) await effacer(supabase, [s(avant.chemin)]);
  return { ok: true };
}

/** 🗑️ Effacer mon mot : il disparaît partout, tout de suite (et son son). */
export async function effacerMot(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ ok?: true }>> {
  const v = await laVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const m = await saTranche(supabase, moi.id);
  if (!m) return { ok: true };
  const q = qui8(moi.id);
  const avant = await lireMot(supabase, m, v.id, q);
  await effacer(supabase, [cheminMot(m, v.id, q), ...(avant?.chemin ? [s(avant.chemin)] : [])]);
  return { ok: true };
}

/**
 * 🚩 Signaler un mot : il ne passe plus chez moi ; signalé par trois personnes différentes, il ne passe plus chez
 * personne. L'administrateur le voit avec les signalements des salons.
 */
export async function signalerMot(supabase: Supabase, moi: Habitant, id: unknown, cible: unknown): Promise<Resultat<{ ok?: true; cache?: boolean }>> {
  const v = await laVideo(supabase, moi.id, id);
  if (!v) return { error: "Cette vidéo n’est plus à ta télé.", statut: 404 };
  const m = await saTranche(supabase, moi.id);
  if (!m) return { error: "Dis-nous d’abord si tu as 18 ans.", statut: 403, age: true };
  const q = s(cible);
  const auteur = qui8(moi.id);
  if (!ID_Q.test(q) || q === auteur) return { error: "Quel mot ?", statut: 400 };
  const f = await lireMot(supabase, m, v.id, q);
  if (!f) return { error: "Ce mot n’est plus là.", statut: 404 };
  const maintenant = Date.now();
  await ecrireJson(supabase, `${dossierSignales(m, v.id)}/${q}/${auteur}.json`, { le: maintenant });
  // (pour l'administrateur, avec ceux des salons : `/admin/humain/salons`)
  await ecrireJson(supabase, `decouvrir/signalements/${q}/${maintenant}-${auteur}.json`, {
    le: maintenant,
    motif: "mot",
    salon: `mot:${v.id}`,
    maison: m,
    q,
    h: s(f.h),
    prenom: s(f.prenom),
    auteur: { q: auteur, h: moi.id },
    texte: `🎙️ Un mot de ${Math.round(Number(f.duree) || 0)} s après la vidéo ${v.id}`,
  });
  const par = await lister(supabase, `${dossierSignales(m, v.id)}/${q}`);
  return { ok: true, cache: par.length >= MOTS_VIDEO.seuilSignalements };
}
