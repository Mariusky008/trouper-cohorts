/**
 * 📺 LA TÉLÉ DE LA PIÈCE DU DUO — CE QU'ELLE PASSE (`tele.ts`, `docs/univers/piece-du-duo.md`).
 *
 * Le dernier lien vidéo que les deux se sont envoyé (YouTube : lu dans l'écran ; TikTok, Instagram : son aperçu et
 * « ▶ Ouvrir ») ; sinon le clip de secours du jour, dans la liste du propriétaire ; sinon, éteinte. Les messages qu'il a
 * signalés n'y passent pas (il ne les voit plus).
 *
 * LE SEAU : `tele/secours.json` = { clips: [{ id, debut?, titre? }], le } — la liste du propriétaire (la page d'essais).
 * `fils/<paire>/tele.json` = { message, par8, le } (lot S6, le salon du duo) : ce que l'un des deux a mis à la télé
 * lui-même (« 📺 La mettre à la télé ? » : une vidéo de leur conversation, un lien) ; il passe tant qu'un lien plus récent
 * ne le remplace pas.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { battre } from "./pouls-serveur";
import { jourParis } from "@/lib/jour-paris";
import { ecrireJson, lireJson, signer } from "./ma-figurine-serveur";
import { dossierMessages, hDeCle, nomsDuFil, pairDe, parolesCachees, qui8, seParlent, vueDeLaVideo, type FicheMessage } from "./talkie-serveur";
import { CLIPS_DU_PROPRIETAIRE, PHRASES_TELE, TELE, clipsDeSecours, clipsValides, filmDe, plateformeDe, secoursDuJour, videoYouTube, vignetteYouTube, type ClipSecours, type ProgrammeTele } from "./tele";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const CHEMIN_SECOURS = "tele/secours.json";
/** (lot S6) ce que l'un des deux a mis à la télé lui-même */
export const cheminTele = (pair: string) => `fils/${pair}/tele.json`;
export type FicheTele = { message?: string; par8?: string; le?: string };

/** Les clips de secours du propriétaire : sa liste rangée, sinon ses cinq premiers (`CLIPS_DU_PROPRIETAIRE`). */
export async function lireSecours(supabase: Supabase): Promise<ClipSecours[]> {
  const f = await lireJson<{ clips?: unknown }>(supabase, CHEMIN_SECOURS);
  return Array.isArray(f.clips) ? clipsValides(f.clips) : CLIPS_DU_PROPRIETAIRE;
}

/**
 * Ranger les clips de secours (une adresse YouTube par ligne) ; ce qui n'en est pas une est refusé, et rendu. Aucune
 * vidéo : rien n'est rangé (la liste d'avant reste).
 */
export async function ecrireSecours(supabase: Supabase, liens: unknown): Promise<{ clips: ClipSecours[]; refuses: string[] }> {
  const r = clipsDeSecours(liens);
  if (r.clips.length) await ecrireJson(supabase, CHEMIN_SECOURS, { clips: r.clips, le: new Date().toISOString() });
  return r;
}

/**
 * Le programme d'un message : un lien YouTube (lu dans l'écran), TikTok ou Instagram (son aperçu, « ▶ Ouvrir ») ; avec
 * `videos` (lot S6 : ce que l'un des deux y met lui-même), aussi une vidéo de leur conversation (ses adresses signées) et
 * un film, une série (son affiche « Ce soir »). Sinon, rien.
 */
async function programmeDuMessage(supabase: Supabase, f: FicheMessage, moi: string, videos: boolean): Promise<ProgrammeTele | null> {
  if (!s(f.id)) return null;
  if (f.genre === "video") {
    if (!videos) return null;
    const v = await vueDeLaVideo(supabase, f, moi).catch(() => null);
    if (!v?.video) return null;
    const titre = s(f.legende).slice(0, 140);
    return { sorte: "video", message: v.id, url: v.video.url, vignette: v.video.vignette, l: v.video.l, h: v.video.h, duree: v.video.duree, ...(titre ? { titre } : {}), moi: f.de === moi, le: s(f.le) };
  }
  const url = s(f.lien?.url);
  if (!url || (f.genre && f.genre !== "ecrit")) return null;
  const p = plateformeDe(url);
  const film = !p && videos ? filmDe(url) : null;
  if (!p && !film) return null;
  const titre = s(f.lien?.titre).slice(0, 140);
  const image = s(f.lien?.image) ? await signer(supabase, s(f.lien?.image), 3600).catch(() => "") : "";
  if (film) return { sorte: "film", message: s(f.id), url, site: film, ...(titre ? { titre } : {}), ...(image ? { affiche: image } : {}), moi: f.de === moi, le: s(f.le) };
  if (!p) return null;
  const commun = { url, ...(titre ? { titre } : {}), moi: f.de === moi, le: s(f.le), message: s(f.id) };
  if (p === "youtube") {
    const v = videoYouTube(url)!;
    return { sorte: "youtube", id: v.id, ...(v.debut ? { debut: v.debut } : {}), ...commun, apercu: image || vignetteYouTube(v.id) };
  }
  return { sorte: "ouvrir", plateforme: p, ...commun, ...(image ? { apercu: image } : {}) };
}

/**
 * Ce que la télé du duo passe, chez lui (`moi`) : le dernier lien qu'ils se sont envoyé — ou, s'il est plus récent, ce
 * que l'un des deux y a mis lui-même (`tele.json`, lot S6) ; sinon le clip de secours du jour ; sinon, éteinte.
 */
export async function programmeDuFil(supabase: Supabase, moi: string, pair: string, clips: ClipSecours[]): Promise<ProgrammeTele> {
  const [tous, caches, choix] = await Promise.all([nomsDuFil(supabase, pair), parolesCachees(supabase, moi).catch(() => new Set<string>()), lireJson<FicheTele>(supabase, cheminTele(pair)).catch((): FicheTele => ({}))]);
  const noms = tous.slice(-TELE.messagesLus).reverse();
  // (du plus récent au plus ancien, dix à la fois : le dernier lien est presque toujours dans les premiers)
  let dernier: ProgrammeTele | null = null;
  for (let k = 0; k < noms.length && !dernier; k += 10) {
    const fiches = await Promise.all(noms.slice(k, k + 10).map((n) => lireJson<FicheMessage>(supabase, `${dossierMessages(pair)}/${n.nom}`)));
    for (const f of fiches) {
      if (!s(f.id) || caches.has(s(f.id))) continue;
      dernier = await programmeDuMessage(supabase, f, moi, false);
      if (dernier) break;
    }
  }
  // 📺 (lot S6) ce que l'un des deux y a mis lui-même, s'il n'a pas été remplacé par un lien plus récent
  const id = s(choix.message);
  const mis = Date.parse(s(choix.le)) || 0;
  if (id && !caches.has(id) && (!dernier || dernier.sorte === "secours" || dernier.sorte === "eteinte" || mis >= (Date.parse(dernier.le) || 0))) {
    const n = tous.find((x) => x.id === id);
    const f = n ? await lireJson<FicheMessage>(supabase, `${dossierMessages(pair)}/${n.nom}`).catch((): FicheMessage => ({})) : null;
    const p = f ? await programmeDuMessage(supabase, f, moi, true) : null;
    if (p && p.sorte !== "secours" && p.sorte !== "eteinte") return { ...p, mis: { par: s(choix.par8) === qui8(moi) ? "moi" : "lui", le: s(choix.le) } };
  }
  if (dernier) return dernier;
  const c = secoursDuJour(clips, `${pair}:${jourParis()}`);
  return c ? { sorte: "secours", ...c } : { sorte: "eteinte" };
}

/**
 * 📺 (lot S6) « LA METTRE À LA TÉLÉ » : une vidéo de leur conversation, ou un lien YouTube, TikTok ou Instagram, passe
 * à leur télé (chez les deux) ; le pouls bat. → `{ programme }`. 404 : un message inconnu (ou qu'il a signalé) ; 422 :
 * un message qui ne passe pas à la télé (un écrit sans lien vidéo, une photo…).
 */
export async function mettreALaTele(supabase: Supabase, moi: Habitant, avec: unknown, message: unknown): Promise<{ programme?: ProgrammeTele; error?: string; statut?: number }> {
  const h = await hDeCle(supabase, avec);
  if (!h || h === moi.id) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const id = s(message);
  if (!/^[a-z0-9]{4,40}$/.test(id)) return { error: "Ce message n’existe plus.", statut: 404 };
  const pair = pairDe(moi.id, h);
  const [noms, caches] = await Promise.all([nomsDuFil(supabase, pair), parolesCachees(supabase, moi.id).catch(() => new Set<string>())]);
  const n = noms.find((x) => x.id === id);
  if (!n || caches.has(id)) return { error: "Ce message n’existe plus.", statut: 404 };
  const f = await lireJson<FicheMessage>(supabase, `${dossierMessages(pair)}/${n.nom}`);
  const p = await programmeDuMessage(supabase, f, moi.id, true);
  if (!p || p.sorte === "secours" || p.sorte === "eteinte") return { error: PHRASES_TELE.pasALaTele, statut: 422 };
  const le = new Date().toISOString();
  if (!(await ecrireJson(supabase, cheminTele(pair), { message: id, par8: qui8(moi.id), le }))) return { error: "La télé ne répond pas. Réessaie.", statut: 503 };
  await battre(supabase, moi, avec).catch(() => undefined);
  return { programme: { ...p, mis: { par: "moi", le } } };
}

/** 📺 Sa télé, avec ce proche (sa clé de profil) : ce qu'elle passe, et les clips de secours (si une vidéo refuse). */
export async function teleDuDuo(supabase: Supabase, moi: string, avec: unknown): Promise<{ programme?: ProgrammeTele; secours?: ClipSecours[]; error?: string; statut?: number }> {
  const h = await hDeCle(supabase, avec);
  if (!h || h === moi) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const secours = await lireSecours(supabase);
  return { programme: await programmeDuFil(supabase, moi, pairDe(moi, h), secours), secours };
}
