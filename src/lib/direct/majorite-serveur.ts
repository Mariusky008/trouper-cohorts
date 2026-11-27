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
import { SEAU_FIGURINES, ecrireJson } from "./ma-figurine-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v));
const cheminMajeur = (h: string) => `${h}/majeur.json`;

/**
 * Un petit fichier du seau, lu avec soin (27 novembre 2026 : « on me redemande mon âge alors que je l'ai déjà donné
 * plusieurs fois ») : un fichier absent, c'est « pas encore dit » ; mais une lecture qui échoue (le seau qui hoquette) se
 * retente, au lieu de passer pour « pas encore dit » et de reposer la question.
 */
async function lireAvecSoin<T>(supabase: Supabase, chemin: string): Promise<Partial<T> | null> {
  for (let essai = 0; essai < 3; essai++) {
    try {
      const { data, error } = await supabase.storage.from(SEAU_FIGURINES).download(chemin);
      if (data) return JSON.parse((await data.text()) || "{}") as Partial<T>;
      const e = error as { message?: string; status?: number; statusCode?: string | number } | null;
      const absent = /not.?found|introuvable|does not exist/i.test(s(e?.message)) || [400, 404].includes(Number(e?.status ?? e?.statusCode));
      if (absent) return {};
    } catch {
      /* (on retente) */
    }
    await new Promise((r) => setTimeout(r, 150 * (essai + 1)));
  }
  return null;
}

/** `true` : 18 ans ou plus ; `false` : 15-17 ans ; `null` : il ne l'a pas encore dit (ou le seau ne répond pas). */
export async function sesDixHuitAns(supabase: Supabase, h: string): Promise<boolean | null> {
  const m = await lireAvecSoin<{ adulte?: boolean }>(supabase, cheminMajeur(h));
  if (typeof m?.adulte === "boolean") return m.adulte;
  const a = await lireAvecSoin<{ le?: string }>(supabase, `${h}/adulte.json`);
  return s(a?.le) ? true : null;
}

/** Il le dit (on ne revient pas sur un « non » : un 15-17 ans ne devient pas adulte d'un toucher). */
export async function direSesDixHuitAns(supabase: Supabase, h: string, oui: unknown): Promise<{ adulte?: boolean; error?: string; statut?: number }> {
  if (typeof oui !== "boolean") return { error: "Demande incomplète.", statut: 400 };
  const m = (await lireAvecSoin<Record<string, unknown>>(supabase, cheminMajeur(h))) ?? {};
  if (m.adulte === false && oui) return { adulte: false };
  if (!(await ecrireJson(supabase, cheminMajeur(h), { ...m, le: s(m.le) || new Date().toISOString(), age: Number(m.age) || 15, adulte: oui, adulte_le: new Date().toISOString() })))
    return { error: "Ça n’est pas passé. Réessaie.", statut: 502 };
  return { adulte: oui };
}
