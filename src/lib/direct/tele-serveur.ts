/**
 * 📺 LA TÉLÉ DE LA PIÈCE DU DUO — CE QU'ELLE PASSE (`tele.ts`, `docs/univers/piece-du-duo.md`).
 *
 * Le dernier lien vidéo que les deux se sont envoyé (YouTube : lu dans l'écran ; TikTok, Instagram : son aperçu et
 * « ▶ Ouvrir ») ; sinon le clip de secours du jour, dans la liste du propriétaire ; sinon, éteinte. Les messages qu'il a
 * signalés n'y passent pas (il ne les voit plus).
 *
 * LE SEAU : `tele/secours.json` = { clips: [{ id, debut?, titre? }], le } — la liste du propriétaire (la page d'essais).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { ecrireJson, lireJson, signer } from "./ma-figurine-serveur";
import { dossierMessages, hDeCle, nomsDuFil, pairDe, parolesCachees, seParlent, type FicheMessage } from "./talkie-serveur";
import { CLIPS_DU_PROPRIETAIRE, TELE, clipsDeSecours, clipsValides, plateformeDe, secoursDuJour, videoYouTube, vignetteYouTube, type ClipSecours, type ProgrammeTele } from "./tele";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const CHEMIN_SECOURS = "tele/secours.json";

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

/** Ce que la télé du duo passe, chez lui (`moi`). */
export async function programmeDuFil(supabase: Supabase, moi: string, pair: string, clips: ClipSecours[]): Promise<ProgrammeTele> {
  const noms = (await nomsDuFil(supabase, pair)).slice(-TELE.messagesLus).reverse();
  const caches = await parolesCachees(supabase, moi).catch(() => new Set<string>());
  // (du plus récent au plus ancien, dix à la fois : le dernier lien est presque toujours dans les premiers)
  for (let k = 0; k < noms.length; k += 10) {
    const fiches = await Promise.all(noms.slice(k, k + 10).map((n) => lireJson<FicheMessage>(supabase, `${dossierMessages(pair)}/${n.nom}`)));
    for (const f of fiches) {
      const url = s(f.lien?.url);
      if (!url || !s(f.id) || caches.has(s(f.id)) || (f.genre && f.genre !== "ecrit")) continue;
      const p = plateformeDe(url);
      if (!p) continue;
      const titre = s(f.lien?.titre).slice(0, 140);
      const image = s(f.lien?.image) ? await signer(supabase, s(f.lien?.image), 3600).catch(() => "") : "";
      const commun = { url, ...(titre ? { titre } : {}), moi: f.de === moi, le: s(f.le) };
      if (p === "youtube") {
        const v = videoYouTube(url)!;
        return { sorte: "youtube", id: v.id, ...(v.debut ? { debut: v.debut } : {}), ...commun, apercu: image || vignetteYouTube(v.id) };
      }
      return { sorte: "ouvrir", plateforme: p, ...commun, ...(image ? { apercu: image } : {}) };
    }
  }
  const c = secoursDuJour(clips, `${pair}:${jourParis()}`);
  return c ? { sorte: "secours", ...c } : { sorte: "eteinte" };
}

/** 📺 Sa télé, avec ce proche (sa clé de profil) : ce qu'elle passe, et les clips de secours (si une vidéo refuse). */
export async function teleDuDuo(supabase: Supabase, moi: string, avec: unknown): Promise<{ programme?: ProgrammeTele; secours?: ClipSecours[]; error?: string; statut?: number }> {
  const h = await hDeCle(supabase, avec);
  if (!h || h === moi) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const secours = await lireSecours(supabase);
  return { programme: await programmeDuFil(supabase, moi, pairDe(moi, h), secours), secours };
}
