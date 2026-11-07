/**
 * 😂 ❤️ 🔥 LES RÉACTIONS SUR LES MÈMES, CÔTÉ SERVEUR — voir `reactions-memes.ts` pour la règle.
 *
 * SANS TABLE : un fichier vide par personne et par mème, dans le seau privé des figurines :
 * `reac/<mème>/<habitant>.<réaction>.json` (le mème : `<id>` pour un habitant, `c-<id>` pour un commerçant). Une seule
 * par personne (la nouvelle remplace l'ancienne) ; compter, c'est lister le dossier.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { memeCommerce } from "./memes-commerces-serveur";
import { REAC_VIDE, cleMemeValide, reacValide, type CleReac, type ReacMeme } from "./reactions-memes";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
// (le même seau que `ma-figurine-serveur.ts`, sans l'importer : pas de boucle entre les deux fichiers)
const SEAU = s(process.env.FIGURINES_CLIENTS_BUCKET) || "figurines-clients";
const dossier = (cle: string) => `reac/${cle}`;
const lu = (nom: string) => /^([0-9a-f-]{36})\.(rire|coeur|feu)\.json$/.exec(nom);

/** Les réactions de chaque mème (combien de chaque, et la sienne). */
export async function reactionsDe(supabase: Supabase, cles: string[], moi?: string): Promise<Record<string, ReacMeme>> {
  const res: Record<string, ReacMeme> = {};
  await Promise.all(
    [...new Set(cles.filter((c) => cleMemeValide(c)))].map(async (c) => {
      const { data } = await supabase.storage.from(SEAU).list(dossier(c), { limit: 1000 });
      const r: ReacMeme = { n: { ...REAC_VIDE.n } };
      for (const f of (Array.isArray(data) ? data : []) as { name?: string }[]) {
        const m = lu(s(f.name));
        if (!m) continue;
        r.n[m[2] as CleReac] += 1;
        if (moi && m[1] === moi) r.moi = m[2] as CleReac;
      }
      res[c] = r;
    }),
  );
  return res;
}

/** Il réagit à un mème (`reac` : `null` la retire). Une seule par personne : la nouvelle remplace l'ancienne. */
export async function reagir(supabase: Supabase, habitant: Habitant, cle: unknown, reac: unknown): Promise<{ reac?: ReacMeme; error?: string; statut?: number }> {
  const c = cleMemeValide(cle);
  if (!c) return { error: "Ce mème n’existe pas.", statut: 400 };
  const r = reac == null ? null : reacValide(reac);
  if (reac != null && !r) return { error: "Cette réaction n’existe pas.", statut: 400 };
  // le mème existe (et n'est pas signalé)
  if (c.startsWith("c-")) {
    if (!(await memeCommerce(supabase, c.slice(2)).catch(() => null))) return { error: "Ce mème n’existe plus.", statut: 404 };
  } else {
    const { data } = await supabase.from("clik_figurine_message").select("id, signale_le").eq("id", c).maybeSingle();
    if (!data || (data as { signale_le?: string | null }).signale_le) return { error: "Ce mème n’existe plus.", statut: 404 };
  }
  const { data } = await supabase.storage.from(SEAU).list(dossier(c), { limit: 10, search: habitant.id });
  const avant = ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter((n) => n.startsWith(habitant.id));
  if (avant.length) await supabase.storage.from(SEAU).remove(avant.map((n) => `${dossier(c)}/${n}`));
  if (r) {
    const { error } = await supabase.storage.from(SEAU).upload(`${dossier(c)}/${habitant.id}.${r}.json`, Buffer.from("{}"), { contentType: "application/json", upsert: true });
    if (error) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  }
  return { reac: (await reactionsDe(supabase, [c], habitant.id))[c] ?? REAC_VIDE };
}
