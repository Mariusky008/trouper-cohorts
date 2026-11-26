/**
 * 🎞️ LA FICHE D'UNE VIDÉO (la discussion de la vidéo, lot A1 ; `docs/univers/discussions-video.md`) : ce qu'on sait d'une
 * vidéo, indépendamment de la télé ou du salon où on l'a vue — son titre, sa chaîne, sa durée. Rangée sous son identifiant
 * YouTube (11 signes, déjà dédoublonné par `videoYouTube` : youtu.be, /watch, /shorts, /embed, /live donnent le même) :
 * `videos/<id>.json`. Écrite quand on publie quelque chose sur elle ; relue pour retrouver sa discussion plus tard.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
export type FicheVideo = { id: string; titre: string; chaine: string; duree: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
export const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const cheminFiche = (id: string) => `videos/${id}.json`;

/** La fiche d'une vidéo (rien : on ne la connaît pas encore). */
export async function ficheVideo(supabase: Supabase, id: string): Promise<FicheVideo | null> {
  if (!ID_VIDEO.test(id)) return null;
  const f = await lireJson<Partial<FicheVideo>>(supabase, cheminFiche(id)).catch(() => ({}) as Partial<FicheVideo>);
  return s(f.titre) ? { id, titre: s(f.titre), chaine: s(f.chaine), duree: Number(f.duree) || 0 } : null;
}

/** Noter sa fiche (sans titre : rien). */
export async function noterFicheVideo(supabase: Supabase, v: { id: string; titre?: string; chaine?: string; duree?: number }): Promise<void> {
  if (!ID_VIDEO.test(v.id) || !s(v.titre)) return;
  await ecrireJson(supabase, cheminFiche(v.id), { id: v.id, titre: s(v.titre), chaine: s(v.chaine), duree: Number(v.duree) || 0 }).catch(() => false);
}
