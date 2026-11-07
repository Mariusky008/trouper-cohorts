/**
 * 🗨️ CE QU'IL A DIT DE LUI — ses dernières réponses à la question du jour (`connaitre-serveur.ts`), les 8 dernières.
 * « Répondre à 3 questions du jour », dans ses premiers pas (`etapes-serveur.ts`), les compte.
 *
 * Le carnet s'appelle encore `<habitant>/rencontres.json` : c'est là que ces réponses étaient rangées du temps de
 * « Rencontres » (effacé le 7 novembre 2026, à la demande du propriétaire). On garde le fichier pour ne rien perdre
 * de ce qu'il avait déjà dit ; ce qui reste d'autre dedans (ses anciennes rencontres, ses amis) n'est plus écrit, et
 * ses proches (`prochesDe`, `ma-figurine-serveur.ts`) lisent encore ses amis d'alors.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrire, lire } from "./personnage-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
/** Le carnet : ce qu'il a dit (`dit`) et, d'avant, les phrases où il s'était reconnu ou pas (`oui`, `non`). */
type Carnet = { dit?: { q: string; r: string }[]; oui?: string[]; non?: string[]; moi?: number; pas?: number } & Record<string, unknown>;
const cheminCarnet = (h: string) => `${h}/rencontres.json`;
const carnetDe = async (supabase: Supabase, h: string): Promise<Carnet> => (await lire<Carnet>(supabase, cheminCarnet(h))) ?? {};

/** Sa réponse à la question du jour rejoint ce qu'il a dit (une par question, les 8 dernières). */
export async function retenirCeQuIlDit(supabase: Supabase, habitantId: string, q: string, r: string): Promise<void> {
  const c = await carnetDe(supabase, habitantId);
  await ecrire(supabase, cheminCarnet(habitantId), { ...c, dit: [...(c.dit ?? []).filter((x) => x.q !== q), { q, r }].slice(-8) });
}

/** 🗑️ Il a effacé une chose de son journal : le carnet l'oublie aussi. */
export async function oublierDansLeCarnet(supabase: Supabase, habitantId: string, e: { type: string; texte?: string; phrase?: string }): Promise<void> {
  const c = await carnetDe(supabase, habitantId);
  if ((e.type === "reponse" || e.type === "question") && e.texte) {
    await ecrire(supabase, cheminCarnet(habitantId), { ...c, dit: (c.dit ?? []).filter((x) => x.r !== e.texte) });
  } else if (e.type === "verdict" && e.phrase) {
    const oui = c.oui ?? [],
      non = c.non ?? [];
    await ecrire(supabase, cheminCarnet(habitantId), {
      ...c,
      oui: oui.filter((x) => x !== e.phrase),
      non: non.filter((x) => x !== e.phrase),
      moi: Math.max(0, (c.moi ?? 0) - (oui.includes(e.phrase) ? 1 : 0)),
      pas: Math.max(0, (c.pas ?? 0) - (non.includes(e.phrase) ? 1 : 0)),
    });
  }
}

/** 🗑️ Il a tout effacé : le carnet oublie ce qu'il a dit de lui. */
export async function toutOublierDansLeCarnet(supabase: Supabase, habitantId: string): Promise<void> {
  const c = await carnetDe(supabase, habitantId);
  await ecrire(supabase, cheminCarnet(habitantId), { ...c, dit: [], oui: [], non: [], moi: 0, pas: 0 });
}
