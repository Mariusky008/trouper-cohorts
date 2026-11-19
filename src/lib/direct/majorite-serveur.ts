/**
 * 🔞 SES 18 ANS — sorti de `voeu-serveur.ts` le 19 novembre 2026, quand « Mon vœu » est parti avec l'ancienne page de
 * Découvrir (`docs/univers/decouvrir.md`, section 11). L'appli ne demande que « 15 ans ou plus » à la création
 * (`ma-figurine.ts`, `AGE_MINIMUM`) ; savoir s'il a 18 ans sert ailleurs : le catalogue des pièces (`ma-maison.ts`,
 * `ordreDuCatalogue`), le salon des jeunes parents dans ses passions (`decouvrir.ts`), et plus tard les salons ouverts
 * (les 15-17 ans à part).
 *
 * Deux endroits le disent : `<habitant>/majeur.json` (`adulte`, la réponse donnée dans « Mon vœu » ; un « non » ne se
 * retourne pas d'un toucher) et `<habitant>/adulte.json` (déclaré pour ouvrir son univers à tous, `visites-serveur.ts`).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v));
const cheminMajeur = (h: string) => `${h}/majeur.json`;

/** `true` : 18 ans ou plus ; `false` : 15-17 ans ; `null` : il ne l'a pas encore dit. */
export async function sesDixHuitAns(supabase: Supabase, h: string): Promise<boolean | null> {
  const m = await lireJson<{ adulte?: boolean }>(supabase, cheminMajeur(h));
  if (typeof m.adulte === "boolean") return m.adulte;
  const a = await lireJson<{ le?: string }>(supabase, `${h}/adulte.json`).catch(() => ({}) as { le?: string });
  return s(a.le) ? true : null;
}

/** Il le dit (on ne revient pas sur un « non » : un 15-17 ans ne devient pas adulte d'un toucher). */
export async function direSesDixHuitAns(supabase: Supabase, h: string, oui: unknown): Promise<{ adulte?: boolean; error?: string; statut?: number }> {
  if (typeof oui !== "boolean") return { error: "Demande incomplète.", statut: 400 };
  const m = await lireJson<Record<string, unknown>>(supabase, cheminMajeur(h));
  if (m.adulte === false && oui) return { adulte: false };
  if (!(await ecrireJson(supabase, cheminMajeur(h), { ...m, le: s(m.le) || new Date().toISOString(), age: Number(m.age) || 15, adulte: oui, adulte_le: new Date().toISOString() })))
    return { error: "Ça n’est pas passé. Réessaie.", statut: 502 };
  return { adulte: oui };
}
