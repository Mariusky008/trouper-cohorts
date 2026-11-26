/**
 * 💬 LA DISCUSSION D'UNE VIDÉO, CÔTÉ SERVEUR (`discussion-video.ts` ; `docs/univers/discussions-video.md`, le lot A1).
 *
 * Rien de nouveau n'est rangé pour la lire : elle réunit ce qui est déjà attaché à la vidéo — les réactions de mes proches
 * (`decouvrir/reactions/<vidéo>/`) et les mots de ma tranche (`decouvrir/mots/<tranche>/<vidéo>/`). Seule la fiche de la
 * vidéo (`videos/<id>.json`) est nouvelle : elle dit son titre quand la vidéo a quitté ma télé.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { lireJson } from "./ma-figurine-serveur";
import { maVideo } from "./tele-du-jour-serveur";
import { dansMonHistorique } from "./revoir-serveur";
import { cheminReactions, reactionsDesProches } from "./reactions-video-serveur";
import { aMonMot, laVideo, suiteDeLaVideo } from "./mots-video-serveur";
import { ID_VIDEO, ficheVideo, noterFicheVideo } from "./fiche-video-serveur";
import type { DiscussionVue, VideoDiscussion } from "./discussion-video";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/**
 * La vidéo d'une discussion, si je peux l'ouvrir : à ma télé, dans mon historique, dans une séance où je suis ou un
 * salon de ma tranche (`laVideo` des mots) ; ou connue (sa fiche) et j'y ai déjà dit quelque chose. Sinon `null`.
 */
export async function videoDeLaDiscussion(supabase: Supabase, moi: Habitant, id: unknown, seance?: unknown): Promise<(VideoDiscussion & { aMaTele: boolean }) | null> {
  const i = s(id);
  if (!ID_VIDEO.test(i)) return null;
  const tele = await maVideo(supabase, moi.id, i).catch(() => null);
  if (tele) return { id: i, titre: s(tele.titre), chaine: s(tele.chaine), duree: Number(tele.duree) || 0, aMaTele: true };
  const vue = await dansMonHistorique(supabase, moi.id, i).catch(() => null);
  if (vue) return { ...vue, aMaTele: false };
  const ailleurs = await laVideo(supabase, moi, i, seance).catch(() => null);
  if (ailleurs) return { ...ailleurs, aMaTele: false };
  const fiche = await ficheVideo(supabase, i);
  if (!fiche) return null;
  const [reactions, mot] = await Promise.all([lireJson<{ vu?: number }>(supabase, cheminReactions(i, moi.id)).catch(() => ({}) as { vu?: number }), aMonMot(supabase, moi, i).catch(() => false)]);
  return Number(reactions.vu) > 0 || mot ? { ...fiche, aMaTele: false } : null;
}

/** 💬 La discussion : la vidéo, ce que mes proches en ont dit, les mots de ma tranche. */
export async function laDiscussion(supabase: Supabase, moi: Habitant, id: unknown, seance?: unknown): Promise<Resultat<{ discussion?: DiscussionVue }>> {
  const v = await videoDeLaDiscussion(supabase, moi, id, seance);
  if (!v) return { error: "Cette discussion n’est plus là.", statut: 404 };
  const { aMaTele, ...video } = v;
  const [r, suite] = await Promise.all([
    reactionsDesProches(supabase, moi, video.id, { id: video.id, titre: video.titre, duree: video.duree }),
    suiteDeLaVideo(supabase, moi, video.id, undefined, { id: video.id }),
    // (sa fiche, pour plus tard : la discussion se retrouvera quand elle aura quitté ma télé)
    noterFicheVideo(supabase, video),
  ]);
  if (r.error) return { error: r.error, statut: r.statut };
  return {
    discussion: { video, vue: r.vue === true, aMaTele, proches: r.proches ?? [], miennes: r.miennes ?? [], tous: suite.suite ?? null },
  };
}
