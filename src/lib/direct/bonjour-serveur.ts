/**
 * 🎙️ « MON BONJOUR », CÔTÉ SERVEUR (lot 4 ; `bonjour.ts` ; `docs/univers/ma-figurine.md`, section 6).
 *
 * Rangé : `<habitant>/bonjour.json` = { chemin, type, duree, le } et le son dans `<habitant>/bonjour/<le>.<ext>` (un
 * nouveau bonjour : un nouveau fichier, l'ancien s'efface). Les autres l'entendent par `/api/direct/bonjour/<clé>` : sa
 * clé de profil, jamais son compte.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { cleProfil } from "./autour-serveur";
import { SEAU_FIGURINES, deposer, ecrireJson, lireJson, telecharger } from "./ma-figurine-serveur";
import { hDeCle, sonDe } from "./talkie-serveur";
import { BONJOUR, adresseBonjour, type BonjourVu } from "./bonjour";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
type Fiche = { chemin?: string; type?: string; duree?: number; le?: number };

export const cheminBonjour = (h: string) => `${h}/bonjour.json`;

async function fiche(supabase: Supabase, h: string): Promise<Fiche | null> {
  const f = await lireJson<Fiche>(supabase, cheminBonjour(h)).catch(() => ({}) as Fiche);
  return s(f.chemin) && Number(f.duree) > 0 ? f : null;
}

/** Son bonjour, pour ceux qui touchent sa figurine (rien : il n'en a pas). */
export async function bonjourDe(supabase: Supabase, h: string): Promise<BonjourVu | null> {
  const f = await fiche(supabase, h);
  return f ? { src: adresseBonjour(cleProfil(h), Number(f.le) || 0), duree: Number(f.duree) } : null;
}

/** Garder son bonjour (sa voix, au micro). Un son illisible, trop court ou trop long : refusé. */
export async function garderBonjour(supabase: Supabase, h: string, son: unknown, duree: unknown): Promise<{ ok?: true; error?: string }> {
  const v = sonDe(son);
  const d = Number(duree);
  if (!v || !Number.isFinite(d) || d < BONJOUR.min || d > BONJOUR.max + 1.5) return { error: "Ton bonjour n’a pas pu se garder : refais-le (quelques secondes)." };
  const avant = await fiche(supabase, h);
  const le = Date.now();
  const chemin = `${h}/bonjour/${le}.${v.ext}`;
  if (!(await deposer(supabase, chemin, v.octets, v.type))) return { error: "Ça n’a pas marché. Réessaie." };
  if (!(await ecrireJson(supabase, cheminBonjour(h), { chemin, type: v.type, duree: Math.round(Math.min(BONJOUR.max, d) * 100) / 100, le }))) return { error: "Ça n’a pas marché. Réessaie." };
  if (avant?.chemin && avant.chemin !== chemin) await supabase.storage.from(SEAU_FIGURINES).remove([s(avant.chemin)]).catch(() => undefined);
  return { ok: true };
}

/** Enlever son bonjour : sa figurine redevient muette. */
export async function enleverBonjour(supabase: Supabase, h: string): Promise<void> {
  const avant = await fiche(supabase, h);
  await ecrireJson(supabase, cheminBonjour(h), {});
  if (avant?.chemin) await supabase.storage.from(SEAU_FIGURINES).remove([s(avant.chemin)]).catch(() => undefined);
}

/** Le son du bonjour de cette clé de profil (rien : pas de bonjour). */
export async function sonDuBonjour(supabase: Supabase, cle: unknown): Promise<{ octets: Buffer; type: string } | null> {
  const h = await hDeCle(supabase, cle);
  if (!h) return null;
  const f = await fiche(supabase, h);
  if (!f) return null;
  const octets = await telecharger(supabase, s(f.chemin));
  return octets ? { octets, type: s(f.type) || "audio/webm" } : null;
}
