/**
 * 🛡️ LA MODÉRATION DES MÈMES DES GENS — la page admin `/admin/humain/figurines-clients` (7 novembre 2026, le point 5 de
 * la suite d'« Autour »).
 *
 * Un mème signalé (« ⋯ Signaler » : `signalerMessage`) disparaît aussitôt, partout ; il attend ici. On le voit tel que
 * les gens l'ont vu : sa vidéo, ses mots, sa voix, et OÙ il était montré — un lieu d'« Autour » (avec le petit mot du
 * dépôt, et qui pouvait le voir), « Découvrir », les réponses au mème du jour. Deux gestes :
 *   · « Remettre » : un signalement à tort ; il revient là où il était ;
 *   · « Retirer pour de bon » : il quitte aussi la carte (son dépôt est effacé), « Découvrir » et le mème du jour.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { memeAModerer, retirerDeLaVille } from "@/lib/direct/ma-figurine-serveur";
import { depotPourModeration, retirerDepot } from "@/lib/direct/autour-serveur";
import { nomVille } from "@/lib/direct/theme-du-jour";

type Supabase = ReturnType<typeof createAdminClient>;
type Ligne = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));

/** Un mème signalé, tel que la modération le voit. `ou` : là où il était montré, en clair. */
export type MemeSignale = { id: string; prenom: string; le: string; texte: string; son: string; video: string; ou: string[]; mot?: string };

const QUI = { tous: "pour tout le monde", proches: "pour ses proches", moi: "pour son auteur seulement" } as const;

export async function memesSignales(supabase: Supabase): Promise<MemeSignale[]> {
  const { data } = await supabase.from("clik_figurine_message").select("id, habitant_id, signale_le").not("signale_le", "is", null).is("retire_le", null).order("signale_le", { ascending: false }).limit(100);
  const lignes = (Array.isArray(data) ? data : []) as Ligne[];
  const auteurs = [...new Set(lignes.map((l) => s(l.habitant_id)).filter(Boolean))];
  const { data: figs } = auteurs.length ? await supabase.from("clik_ma_figurine").select("habitant_id, prenom").in("habitant_id", auteurs) : { data: [] };
  const prenoms = new Map(((Array.isArray(figs) ? figs : []) as Ligne[]).map((f) => [s(f.habitant_id), s(f.prenom)]));
  const memes = await Promise.all(
    lignes.map(async (l) => {
      const m = await memeAModerer(supabase, s(l.id));
      if (!m) return null;
      const depot = await depotPourModeration(supabase, m.h, m.id);
      const ou = [
        ...(depot ? [`📍 Autour : ${depot.nom} (${QUI[depot.qui]})`] : []),
        ...(m.public ? [`🌍 Découvrir, à ${nomVille(m.public.ville) || m.public.ville}`] : []),
        ...(m.duJour ? ["🔥 Les réponses au mème du jour"] : []),
      ];
      return { id: m.id, prenom: prenoms.get(m.h) ?? "", le: m.signaleLe, texte: m.texte, son: m.son, video: m.video, ou: ou.length ? ou : ["✉️ Envoyé à quelqu’un (un lien)"], ...(depot?.mot ? { mot: depot.mot } : {}) };
    }),
  );
  return memes.filter((x): x is MemeSignale => x !== null);
}

/** « Remettre » (signalé à tort : il revient) ou « Retirer pour de bon » (il quitte la carte, « Découvrir », le mème du jour). */
export async function modererMeme(supabase: Supabase, id: string, geste: unknown): Promise<{ error?: string }> {
  if (geste !== "remettre" && geste !== "retirer") return { error: "Demande incomplète." };
  const m = await memeAModerer(supabase, id);
  if (!m) return { error: "Ce mème n’existe pas." };
  if (geste === "retirer") {
    await Promise.all([retirerDepot(supabase, m.h, m.id), retirerDeLaVille(supabase, m)]);
  }
  const { error } = await supabase
    .from("clik_figurine_message")
    .update(geste === "remettre" ? { signale_le: null } : { retire_le: new Date().toISOString() })
    .eq("id", m.id);
  return error ? { error: "Pas enregistré." } : {};
}
