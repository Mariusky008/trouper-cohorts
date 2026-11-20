/**
 * 📺 MES CHAÎNES YOUTUBE, CÔTÉ SERVEUR (`chaines.ts` ; `docs/univers/decouvrir.md`, section 23.1 ; le lot D8).
 *
 *   - suivre une chaîne (son lien, son `@nom`, une de ses vidéos) : YouTube la retrouve (`channels.list` : 1 unité) ;
 *     10 au plus ; ne plus la suivre ;
 *   - ses dernières vidéos : la liste « mises en ligne » de la chaîne (`playlistItems.list` : 1 unité), puis
 *     `videos.list` (1 unité pour 50) et les filtres de la sélection (de 60 s à 60 min ; publiées dans les sept derniers
 *     jours) — tout de suite quand quelqu'un la suit, puis chaque nuit (la même tâche que la sélection) ;
 *   - mes chaînes dans ma télé du jour : leurs nouvelles vidéos, en premier ;
 *   - l'administrateur : les chaînes les plus suivies ; en retirer une (elle ne peut plus être suivie, ses vidéos
 *     disparaissent de toutes les télés).
 *
 * LE SEAU : `<h>/chaines.json` = { chaines: [{ id, nom, image }], le } ; `decouvrir/chaines/<id>.json` = { id, nom,
 * image, videos, le, abonnes, erreur? } — `abonnes` : l'identifiant court de chacun de ceux qui la suivent (jamais un
 * compte) ; `decouvrir/chaines-retirees.json` = { ids }.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { SEAU_FIGURINES, ecrireJson, lireJson } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { appeler, details, youtubeBranche } from "./selection-serveur";
import { CHAINES, ID_CHAINE, PHRASES_CHAINES as P, chaineDuLien, encoreNouvelle, type ChaineSuivie } from "./chaines";
import type { VideoDuJour } from "./decouvrir";
import type { VideoTele } from "./tele-du-jour";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
type FicheMesChaines = { chaines?: ChaineSuivie[]; le?: string };
type FicheChaine = { id: string; nom: string; image?: string; videos: VideoDuJour[]; le: string; abonnes: string[]; erreur?: string };

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const DOSSIER = "decouvrir/chaines";
const cheminMesChaines = (h: string) => `${h}/chaines.json`;
const cheminChaine = (id: string) => `${DOSSIER}/${id}.json`;
const CHEMIN_RETIREES = "decouvrir/chaines-retirees.json";
/** (une chaîne qu'on vient de suivre : ses vidéos sont refaites si elles ont plus de six heures) */
const FRAICHE = 6 * 3600_000;

const laChaine = (x: unknown): ChaineSuivie | null => {
  const c = x as Partial<ChaineSuivie> | null;
  const id = s(c?.id);
  if (!ID_CHAINE.test(id)) return null;
  const image = s(c?.image);
  return { id, nom: s(c?.nom).slice(0, 80) || "Une chaîne", ...(/^https:\/\//.test(image) ? { image } : {}) };
};

async function lireChaine(supabase: Supabase, id: string): Promise<FicheChaine | null> {
  const f = await lireJson<Partial<FicheChaine>>(supabase, cheminChaine(id)).catch(() => ({}) as Partial<FicheChaine>);
  if (!f || s(f.id) !== id) return null;
  return { id, nom: s(f.nom) || "Une chaîne", ...(f.image ? { image: f.image } : {}), videos: Array.isArray(f.videos) ? f.videos : [], le: s(f.le), abonnes: Array.isArray(f.abonnes) ? f.abonnes.filter((x) => typeof x === "string") : [], ...(f.erreur ? { erreur: f.erreur } : {}) };
}

async function retirees(supabase: Supabase): Promise<Set<string>> {
  const r = await lireJson<{ ids?: string[] }>(supabase, CHEMIN_RETIREES).catch(() => ({}) as { ids?: string[] });
  return new Set(Array.isArray(r.ids) ? r.ids : []);
}

/** 📺 Mes chaînes (celles que l'administrateur a retirées n'y sont plus). */
export async function mesChaines(supabase: Supabase, h: string): Promise<ChaineSuivie[]> {
  const [f, non] = await Promise.all([lireJson<FicheMesChaines>(supabase, cheminMesChaines(h)).catch(() => ({}) as FicheMesChaines), retirees(supabase)]);
  return (Array.isArray(f.chaines) ? f.chaines : []).map(laChaine).filter((c): c is ChaineSuivie => Boolean(c) && !non.has(c!.id)).slice(0, CHAINES.max);
}

/** Retrouver une chaîne sur YouTube : par son identifiant, son `@nom`, ou une de ses vidéos ; sinon `null`. */
async function trouverChaine(q: { id: string } | { poignee: string } | { video: string }): Promise<ChaineSuivie | null> {
  let id = "id" in q ? q.id : "";
  if ("video" in q) {
    const j = await appeler<{ items?: { snippet?: { channelId?: string } }[] }>("videos", { part: "snippet", id: q.video });
    id = s(j.items?.[0]?.snippet?.channelId);
    if (!ID_CHAINE.test(id)) return null;
  }
  const j = await appeler<{ items?: { id?: string; snippet?: { title?: string; thumbnails?: { default?: { url?: string } } } }[] }>("channels", {
    part: "snippet",
    ...("poignee" in q ? { forHandle: q.poignee } : { id }),
  });
  const c = j.items?.[0];
  return c ? laChaine({ id: c.id, nom: c.snippet?.title, image: c.snippet?.thumbnails?.default?.url }) : null;
}

/** 🔄 Les dernières vidéos d'une chaîne : sa liste « mises en ligne », puis les filtres (de 60 s à 60 min, de moins de sept jours). */
export async function rafraichirChaine(supabase: Supabase, id: string): Promise<{ n: number; erreur?: string }> {
  const f = await lireChaine(supabase, id);
  if (!f) return { n: 0, erreur: "Chaîne inconnue." };
  try {
    const j = await appeler<{ items?: { contentDetails?: { videoId?: string } }[] }>("playlistItems", { part: "contentDetails", playlistId: `UU${id.slice(2)}`, maxResults: String(CHAINES.parChaine) });
    const ids = (j.items ?? []).map((i) => s(i.contentDetails?.videoId)).filter((x) => /^[\w-]{11}$/.test(x));
    const videos = (ids.length ? await details(ids, { min: CHAINES.dureeMin, max: CHAINES.dureeMax }) : [])
      .filter((v) => encoreNouvelle(v.publiee))
      .map((v) => ({ ...v, chaineId: id }))
      .sort((a, b) => Date.parse(b.publiee) - Date.parse(a.publiee));
    const { erreur: _ancienne, ...reste } = f;
    void _ancienne;
    await ecrireJson(supabase, cheminChaine(id), { ...reste, videos, le: new Date().toISOString() } satisfies FicheChaine);
    return { n: videos.length };
  } catch (e) {
    // (une panne de YouTube : les vidéos d'avant restent ; l'erreur est notée pour l'administration)
    const erreur = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    console.error("[decouvrir] chaîne", id, erreur);
    await ecrireJson(supabase, cheminChaine(id), { ...f, erreur } satisfies FicheChaine);
    return { n: f.videos.length, erreur };
  }
}

/**
 * 📺 Suivre une chaîne : `lien` (son lien, son `@nom`, le lien d'une de ses vidéos) ou `video` (l'identifiant d'une
 * vidéo de ma télé : « Suivre cette chaîne »). 10 au plus. Ses vidéos sont cherchées tout de suite.
 */
export async function suivreChaine(supabase: Supabase, moi: Habitant, x: { lien?: unknown; video?: unknown }): Promise<Resultat<{ chaine?: ChaineSuivie; chaines?: ChaineSuivie[]; deja?: true }>> {
  const video = s(x.video);
  const q = /^[\w-]{11}$/.test(video) ? { video } : chaineDuLien(x.lien);
  if (!q) return { error: P.pasUnLien, statut: 400 };
  if (!youtubeBranche()) return { error: "La clé YouTube n’est pas branchée.", statut: 503 };
  const miennes = await mesChaines(supabase, moi.id);
  let chaine: ChaineSuivie | null = "id" in q ? (miennes.find((c) => c.id === q.id) ?? null) : null;
  if (!chaine) {
    try {
      chaine = await trouverChaine(q);
    } catch (e) {
      console.error("[decouvrir] trouver une chaîne", e instanceof Error ? e.message : e);
      return { error: "YouTube ne répond pas : réessaie dans un instant.", statut: 502 };
    }
  }
  if (!chaine) return { error: P.introuvable, statut: 404 };
  if ((await retirees(supabase)).has(chaine.id)) return { error: P.retiree, statut: 403 };
  if (miennes.some((c) => c.id === chaine.id)) return { chaine, chaines: miennes, deja: true };
  if (miennes.length >= CHAINES.max) return { error: P.max, statut: 400 };
  const chaines = [...miennes, chaine];
  if (!(await ecrireJson(supabase, cheminMesChaines(moi.id), { chaines, le: new Date().toISOString() } satisfies FicheMesChaines))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  // (la fiche de la chaîne, partagée par tous ceux qui la suivent : moi en plus ; ses vidéos, si elles sont vieilles)
  const f = await lireChaine(supabase, chaine.id);
  const q8 = qui8(moi.id);
  await ecrireJson(supabase, cheminChaine(chaine.id), {
    id: chaine.id,
    nom: chaine.nom,
    ...(chaine.image ? { image: chaine.image } : {}),
    videos: f?.videos ?? [],
    le: f?.le ?? "",
    abonnes: [...new Set([...(f?.abonnes ?? []), q8])].slice(-5000),
  } satisfies FicheChaine);
  if (!f || !f.le || Date.now() - Date.parse(f.le) > FRAICHE) await rafraichirChaine(supabase, chaine.id);
  return { chaine, chaines };
}

/** ✕ Ne plus suivre une chaîne. */
export async function nePlusSuivre(supabase: Supabase, moi: Habitant, id: unknown): Promise<Resultat<{ chaines?: ChaineSuivie[] }>> {
  const i = s(id);
  if (!ID_CHAINE.test(i)) return { error: "Demande incomplète.", statut: 400 };
  const f = await lireJson<FicheMesChaines>(supabase, cheminMesChaines(moi.id)).catch(() => ({}) as FicheMesChaines);
  const chaines = (Array.isArray(f.chaines) ? f.chaines : []).map(laChaine).filter((c): c is ChaineSuivie => Boolean(c) && c!.id !== i);
  await ecrireJson(supabase, cheminMesChaines(moi.id), { chaines, le: new Date().toISOString() } satisfies FicheMesChaines);
  const fc = await lireChaine(supabase, i);
  if (fc) await ecrireJson(supabase, cheminChaine(i), { ...fc, abonnes: fc.abonnes.filter((x) => x !== qui8(moi.id)) } satisfies FicheChaine);
  return { chaines: await mesChaines(supabase, moi.id) };
}

/** 🆕 Les nouvelles vidéos de mes chaînes (des sept derniers jours), les plus récentes d'abord. */
export async function videosDeMesChaines(supabase: Supabase, h: string, miennes?: ChaineSuivie[]): Promise<VideoTele[]> {
  const chaines = miennes ?? (await mesChaines(supabase, h));
  const fiches = await Promise.all(chaines.map((c) => lireChaine(supabase, c.id)));
  const l: VideoTele[] = [];
  fiches.forEach((f, k) => {
    if (!f) return;
    const c = chaines[k];
    for (const v of f.videos) if (encoreNouvelle(v.publiee)) l.push({ ...v, theme: null, suivie: { id: c.id, nom: f.nom || c.nom, ...(f.image || c.image ? { image: f.image || c.image } : {}) } });
  });
  const vus = new Set<string>();
  return l.sort((a, b) => Date.parse(b.publiee) - Date.parse(a.publiee)).filter((v) => !vus.has(v.id) && Boolean(vus.add(v.id)));
}

/** Toutes les fiches de chaînes (pour la nuit et pour l'administration). */
async function toutesLesChaines(supabase: Supabase): Promise<string[]> {
  const ids: string[] = [];
  for (let debut = 0; debut < 20_000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(DOSSIER, { limit: 1000, offset: debut });
    const noms = (data ?? []).map((e) => e.name.replace(/\.json$/, "")).filter((x) => ID_CHAINE.test(x));
    ids.push(...noms);
    if ((data ?? []).length < 1000) break;
  }
  return ids;
}

/** 🌙 Chaque nuit : les chaînes suivies par au moins une personne (et pas retirées), cinq à la fois, tant qu'il reste du temps. */
export async function rafraichirLesChaines(supabase: Supabase, o: { fin?: number } = {}): Promise<{ faites: number; erreurs: number }> {
  if (!youtubeBranche()) return { faites: 0, erreurs: 0 };
  const [ids, non] = await Promise.all([toutesLesChaines(supabase), retirees(supabase)]);
  let faites = 0;
  let erreurs = 0;
  for (let i = 0; i < ids.length; i += 5) {
    if (o.fin && Date.now() > o.fin) break;
    const lot = await Promise.all(
      ids.slice(i, i + 5).map(async (id) => {
        if (non.has(id)) return null;
        const f = await lireChaine(supabase, id);
        if (!f?.abonnes.length) return null;
        return rafraichirChaine(supabase, id);
      }),
    );
    for (const r of lot) {
      if (!r) continue;
      if (r.erreur) erreurs++;
      else faites++;
    }
  }
  return { faites, erreurs };
}

/** 🛡️ Pour l'administration : les chaînes suivies, les plus suivies d'abord (50 au plus). */
export async function chainesSuivies(supabase: Supabase): Promise<{ id: string; nom: string; image?: string; abonnes: number; videos: number; le: string; erreur?: string; retiree?: true }[]> {
  const [ids, non] = await Promise.all([toutesLesChaines(supabase), retirees(supabase)]);
  const fiches = (await Promise.all(ids.map((id) => lireChaine(supabase, id)))).filter((f): f is FicheChaine => Boolean(f));
  return fiches
    .filter((f) => f.abonnes.length > 0 || non.has(f.id))
    .map((f) => ({ id: f.id, nom: f.nom, ...(f.image ? { image: f.image } : {}), abonnes: f.abonnes.length, videos: f.videos.length, le: f.le, ...(f.erreur ? { erreur: f.erreur } : {}), ...(non.has(f.id) ? { retiree: true as const } : {}) }))
    .sort((a, b) => b.abonnes - a.abonnes)
    .slice(0, 50);
}

/** 🗑️ L'administrateur retire une chaîne : elle ne peut plus être suivie ; ses vidéos disparaissent de toutes les télés. */
export async function retirerChaine(supabase: Supabase, id: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const i = s(id);
  if (!ID_CHAINE.test(i)) return { error: "Demande incomplète.", statut: 400 };
  const deja = await retirees(supabase);
  await ecrireJson(supabase, CHEMIN_RETIREES, { ids: [...new Set([...deja, i])].slice(-2000), le: new Date().toISOString() });
  return { ok: true };
}
