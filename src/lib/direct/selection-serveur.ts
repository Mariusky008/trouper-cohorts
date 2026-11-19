/**
 * 📺 LA SÉLECTION DU JOUR (`decouvrir.ts` ; `docs/univers/decouvrir.md`, section 4.1 ; le lot D0) — YouTube seulement,
 * la même pour tout le monde par thème, et une pour les 15-17 ans.
 *
 * CHAQUE NUIT (`/api/cron/decouvrir-selection`) : pour chaque thème, ses trois recherches (`search.list`, 100 unités
 * chacune : en France, en français, lisibles ailleurs, publiées dans les sept derniers jours ; `safeSearch=strict` pour
 * les 15-17 ans), puis `videos.list` (1 unité) pour la durée et le droit d'être lue ailleurs. On garde une quinzaine de
 * vidéos par thème, entre 30 secondes et 20 minutes, sans rien d'alcoolisé. 12 thèmes × 2 (sans « jeunes parents » pour
 * les 15-17 ans) × 3 recherches = 6 900 unités sur les 10 000 du jour.
 *
 * L'ADMINISTRATEUR (`/admin/humain/decouvrir`) voit la sélection du jour ; il retire une vidéo (elle disparaît de toutes
 * les télés, et ne revient plus les nuits suivantes : `decouvrir/retirees.json`) ou en ajoute une par son lien ; il peut
 * refaire un thème.
 *
 * LE SEAU (le seau privé des figurines) : `decouvrir/selection/<jour>/<thème>[-jeunes].json` = `SelectionDuJour`.
 * LA CLÉ : `YOUTUBE_API_KEY` (créée par le propriétaire, rangée dans Vercel ; jamais dans la discussion) ;
 * `YOUTUBE_API_BASE_URL` pour les essais (le faux YouTube du faux Supabase).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { videoYouTube } from "./tele";
import { DUREE_MAX, DUREE_MIN, FRAICHEUR_JOURS, MOTS_EXCLUS, THEMES_DECOUVRIR, VIDEOS_PAR_THEME, dureeIso, themeDe, type IdTheme, type SelectionDuJour, type VideoDuJour } from "./decouvrir";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const base = () => (s(process.env.YOUTUBE_API_BASE_URL) || "https://www.googleapis.com/youtube/v3").replace(/\/$/, "");
const cle = () => s(process.env.YOUTUBE_API_KEY);
export const youtubeBranche = () => Boolean(cle());
const PAS_BRANCHE = "La clé YouTube n’est pas branchée (YOUTUBE_API_KEY, dans Vercel).";

export const cheminSelection = (jour: string, theme: string, jeunes: boolean) => `decouvrir/selection/${jour}/${theme}${jeunes ? "-jeunes" : ""}.json`;
const CHEMIN_RETIREES = "decouvrir/retirees.json";
/** (les variantes d'un thème : les adultes, et les 15-17 ans — sauf le salon des jeunes parents) */
const variantes = (theme: IdTheme) => (themeDe(theme)?.adultes ? [false] : [false, true]);

async function appeler<T>(chemin: string, params: Record<string, string>): Promise<T> {
  const u = new URL(`${base()}/${chemin}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("key", cle());
  const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`YouTube ${chemin} : ${r.status} ${(await r.text().catch(() => "")).slice(0, 160)}`);
  return (await r.json()) as T;
}

/** Une recherche : les identifiants des vidéos trouvées (25 au plus). */
async function chercher(q: string, jeunes: boolean, depuis: string): Promise<string[]> {
  const j = await appeler<{ items?: { id?: { videoId?: string } }[] }>("search", {
    part: "snippet",
    type: "video",
    maxResults: "25",
    q,
    regionCode: "FR",
    relevanceLanguage: "fr",
    videoEmbeddable: "true",
    safeSearch: jeunes ? "strict" : "moderate",
    publishedAfter: depuis,
  });
  return (j.items ?? []).map((i) => s(i.id?.videoId)).filter((id) => /^[\w-]{11}$/.test(id));
}

/** Les vidéos qui passent : lisibles ailleurs, ni en direct ni à venir, de la bonne durée, sans rien d'alcoolisé. */
async function details(ids: string[]): Promise<VideoDuJour[]> {
  const l: VideoDuJour[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const j = await appeler<{
      items?: { id?: string; snippet?: { title?: string; channelTitle?: string; publishedAt?: string; liveBroadcastContent?: string }; contentDetails?: { duration?: string }; status?: { embeddable?: boolean; privacyStatus?: string } }[];
    }>("videos", { part: "snippet,contentDetails,status", id: ids.slice(i, i + 50).join(",") });
    for (const v of j.items ?? []) {
      const titre = s(v.snippet?.title);
      const duree = dureeIso(v.contentDetails?.duration);
      if (!v.id || v.status?.embeddable === false || (v.status?.privacyStatus && v.status.privacyStatus !== "public")) continue;
      if (v.snippet?.liveBroadcastContent && v.snippet.liveBroadcastContent !== "none") continue;
      if (duree < DUREE_MIN || duree > DUREE_MAX || !titre || MOTS_EXCLUS.test(titre)) continue;
      l.push({ id: v.id, titre: titre.slice(0, 140), chaine: s(v.snippet?.channelTitle).slice(0, 80), duree, publiee: s(v.snippet?.publishedAt) });
    }
  }
  return l;
}

async function retirees(supabase: Supabase): Promise<Set<string>> {
  const r = await lireJson<{ ids?: string[] }>(supabase, CHEMIN_RETIREES).catch(() => ({}) as { ids?: string[] });
  return new Set(Array.isArray(r.ids) ? r.ids : []);
}

/** La sélection d'un thème, un jour donné (sinon `null`). */
export async function lireSelection(supabase: Supabase, jour: string, theme: IdTheme, jeunes: boolean): Promise<SelectionDuJour | null> {
  const x = await lireJson<Partial<SelectionDuJour>>(supabase, cheminSelection(jour, theme, jeunes)).catch(() => ({}) as Partial<SelectionDuJour>);
  return Array.isArray(x.videos) ? ({ jour, theme, jeunes, videos: x.videos, le: s(x.le), ...(x.erreur ? { erreur: x.erreur } : {}) } as SelectionDuJour) : null;
}

/** 🌙 Un thème (ses deux variantes) : ses trois recherches, puis les vidéos qui passent ; ce que l'administrateur a ajouté reste. */
async function selectionnerUnTheme(supabase: Supabase, jour: string, theme: IdTheme, exclues: Set<string>): Promise<{ theme: IdTheme; jeunes: boolean; n: number; erreur?: string }[]> {
  const t = themeDe(theme)!;
  const depuis = new Date(Date.now() - FRAICHEUR_JOURS * 86400_000).toISOString();
  return Promise.all(
    variantes(theme).map(async (jeunes) => {
      const avant = await lireSelection(supabase, jour, theme, jeunes);
      const ajoutees = (avant?.videos ?? []).filter((v) => v.ajoutee && !exclues.has(v.id));
      try {
        // (les trois recherches, mêlées une à une : la première de chacune, puis la deuxième…)
        const listes = await Promise.all(t.recherches.map((q) => chercher(q, jeunes, depuis)));
        const ids: string[] = [];
        for (let k = 0; k < 25; k++) for (const l of listes) if (l[k] && !ids.includes(l[k]) && !exclues.has(l[k])) ids.push(l[k]);
        const trouvees = await details(ids);
        const videos = [...ajoutees, ...trouvees.filter((v) => !ajoutees.some((a) => a.id === v.id))].slice(0, VIDEOS_PAR_THEME);
        await ecrireJson(supabase, cheminSelection(jour, theme, jeunes), { jour, theme, jeunes, videos, le: new Date().toISOString() } satisfies SelectionDuJour);
        return { theme, jeunes, n: videos.length };
      } catch (e) {
        // (une panne de YouTube : la sélection d'avant reste ; l'erreur est notée pour la page d'administration)
        const erreur = e instanceof Error ? e.message : String(e);
        console.error("[decouvrir] sélection", theme, jeunes ? "jeunes" : "", erreur);
        await ecrireJson(supabase, cheminSelection(jour, theme, jeunes), { jour, theme, jeunes, videos: avant?.videos ?? [], le: new Date().toISOString(), erreur: erreur.slice(0, 300) } satisfies SelectionDuJour);
        return { theme, jeunes, n: avant?.videos.length ?? 0, erreur };
      }
    }),
  );
}

/** 🌙 LA SÉLECTION DE LA NUIT : tous les thèmes (ou ceux demandés), trois à la fois, tant qu'il reste du temps. */
export async function faireLaSelection(supabase: Supabase, o: { jour?: string; themes?: IdTheme[]; fin?: number } = {}): Promise<{ jour: string; faites: { theme: IdTheme; jeunes: boolean; n: number; erreur?: string }[]; error?: string }> {
  const jour = o.jour ?? jourParis();
  if (!youtubeBranche()) return { jour, faites: [], error: PAS_BRANCHE };
  const exclues = await retirees(supabase);
  const themes = o.themes?.length ? o.themes : THEMES_DECOUVRIR.map((t) => t.id);
  const faites: { theme: IdTheme; jeunes: boolean; n: number; erreur?: string }[] = [];
  for (let i = 0; i < themes.length; i += 3) {
    if (o.fin && Date.now() > o.fin) break;
    for (const r of await Promise.all(themes.slice(i, i + 3).map((t) => selectionnerUnTheme(supabase, jour, t, exclues)))) faites.push(...r);
  }
  return { jour, faites };
}

/** 🗑️ L'administrateur retire une vidéo : elle disparaît de toutes les télés du jour, et ne revient plus. */
export async function retirerVideo(supabase: Supabase, jour: string, theme: unknown, id: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const t = themeDe(theme);
  const v = s(id);
  if (!t || !/^[\w-]{11}$/.test(v)) return { error: "Demande incomplète.", statut: 400 };
  const deja = await retirees(supabase);
  await ecrireJson(supabase, CHEMIN_RETIREES, { ids: [...deja, v].slice(-2000), le: new Date().toISOString() });
  // (de toutes les sélections du jour : une même vidéo peut sortir dans deux thèmes)
  await Promise.all(
    THEMES_DECOUVRIR.flatMap((x) =>
      variantes(x.id).map(async (jeunes) => {
        const sel = await lireSelection(supabase, jour, x.id, jeunes);
        if (sel?.videos.some((w) => w.id === v)) await ecrireJson(supabase, cheminSelection(jour, x.id, jeunes), { ...sel, videos: sel.videos.filter((w) => w.id !== v) });
      }),
    ),
  );
  return { ok: true };
}

/** ➕ L'administrateur ajoute une vidéo par son lien, en tête du thème (pour les adultes, et pour les 15-17 ans). */
export async function ajouterVideo(supabase: Supabase, jour: string, theme: unknown, lien: unknown): Promise<{ video?: VideoDuJour; error?: string; statut?: number }> {
  const t = themeDe(theme);
  if (!t) return { error: "Ce thème n’existe pas.", statut: 400 };
  const yt = videoYouTube(s(lien));
  if (!yt) return { error: "Ce n’est pas une vidéo YouTube.", statut: 400 };
  if (!youtubeBranche()) return { error: PAS_BRANCHE, statut: 503 };
  let v: VideoDuJour | undefined;
  try {
    v = (await details([yt.id]))[0];
  } catch (e) {
    console.error("[decouvrir] ajout", e instanceof Error ? e.message : e);
    return { error: "YouTube ne répond pas : réessayez dans un instant.", statut: 502 };
  }
  if (!v) return { error: `Cette vidéo ne peut pas passer : introuvable, privée, ne se lit pas ailleurs, hors de ${DUREE_MIN} s à ${DUREE_MAX / 60} min, ou son titre parle d’alcool.`, statut: 422 };
  const video: VideoDuJour = { ...v, ajoutee: true };
  for (const jeunes of variantes(t.id)) {
    const sel = (await lireSelection(supabase, jour, t.id, jeunes)) ?? { jour, theme: t.id, jeunes, videos: [], le: new Date().toISOString() };
    await ecrireJson(supabase, cheminSelection(jour, t.id, jeunes), { ...sel, videos: [video, ...sel.videos.filter((w) => w.id !== video.id)].slice(0, VIDEOS_PAR_THEME + 5) });
  }
  return { video };
}

/** Pour la page d'administration : chaque thème, ses deux variantes du jour. */
export async function selectionsDuJour(supabase: Supabase, jour: string): Promise<{ theme: IdTheme; adultes: SelectionDuJour | null; jeunes: SelectionDuJour | null }[]> {
  return Promise.all(
    THEMES_DECOUVRIR.map(async (t) => ({ theme: t.id, adultes: await lireSelection(supabase, jour, t.id, false), jeunes: t.adultes ? null : await lireSelection(supabase, jour, t.id, true) })),
  );
}
