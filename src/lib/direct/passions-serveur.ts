/**
 * 🧭 SES PASSIONS (`decouvrir.ts` ; `docs/univers/decouvrir.md`, section 3 ; le lot D0) : de 3 à 5 thèmes, choisis la
 * première fois qu'il ouvre Découvrir (et plus tard depuis Moi). `<habitant>/passions.json` = { passions, poids, le } ;
 * les poids (un simple compte, pas d'IA) bougent avec ce qu'il regarde (lot D1) et restent quand il change d'avis.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { sesDixHuitAns } from "./majorite-serveur";
import { passionsValides, themesPour, type Passions, type ThemeDecouvrir } from "./decouvrir";
import { nouveauPoids } from "./tele-du-jour";

type Supabase = ReturnType<typeof createAdminClient>;
const chemin = (h: string) => `${h}/passions.json`;

/** Ses passions, s'il les a choisies. */
export async function lirePassions(supabase: Supabase, h: string): Promise<Passions | null> {
  const p = await lireJson<Partial<Passions>>(supabase, chemin(h)).catch(() => ({}) as Partial<Passions>);
  return Array.isArray(p.passions) && p.passions.length ? { passions: p.passions, poids: p.poids ?? {}, le: p.le ?? "" } : null;
}

/** Ce que l'écran « Tes passions » montre : ses passions, et les thèmes qu'il peut choisir. */
export async function vuePassions(supabase: Supabase, h: string): Promise<{ passions: string[]; themes: ThemeDecouvrir[]; adulte: boolean }> {
  const [p, adulte] = await Promise.all([lirePassions(supabase, h), sesDixHuitAns(supabase, h)]);
  const themes = themesPour(adulte);
  const permis = new Set(themes.map((t) => t.id as string));
  return { passions: (p?.passions ?? []).filter((id) => permis.has(id)), themes, adulte: adulte === true };
}

/** 📺 (lot D1) Un thème monte ou descend après une vidéo de sa télé du jour (`nouveauPoids`, `tele-du-jour.ts`). */
export async function changerPoids(supabase: Supabase, h: string, theme: string, quoi: "fin" | "garde" | "passee"): Promise<void> {
  const p = await lirePassions(supabase, h);
  if (!p) return;
  await ecrireJson(supabase, chemin(h), { ...p, poids: { ...p.poids, [theme]: nouveauPoids(p.poids[theme], quoi) } } satisfies Passions);
}

/** Il choisit ses passions (de 3 à 5) ; les poids d'avant restent. */
export async function choisirPassions(supabase: Supabase, h: string, ids: unknown): Promise<{ passions?: string[]; error?: string; statut?: number }> {
  const v = passionsValides(ids, await sesDixHuitAns(supabase, h));
  if ("error" in v) return { error: v.error, statut: 400 };
  const avant = await lirePassions(supabase, h);
  const ok = await ecrireJson(supabase, chemin(h), { passions: v.passions, poids: avant?.poids ?? {}, le: new Date().toISOString() } satisfies Passions);
  return ok ? { passions: v.passions } : { error: "Ça n’est pas passé. Réessaie.", statut: 502 };
}
