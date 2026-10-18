/**
 * 👻 L'AVIS DU CLIENT À LA FIN D'UN FILM — J'aime pas / Sympa, sans plus / J'adore.
 *
 * « On a oublié, à la fin de l'interview, de mettre nos petits fantômes pour
 * récolter l'avis du client. » Le client regarde l'interview du commerçant
 * jusqu'au bout ; les trois fantômes de l'essayage apparaissent ; un geste, et
 * le commerçant le lit dans son espace, à côté de ses réactions.
 *
 * Voir la table `clik_avis_film` (un avis par personne et par film) et la
 * route `api/direct/avis-film`.
 *
 * FICHIER SERVEUR.
 */

export type SensAvis = -1 | 0 | 1;

export const estSensAvis = (v: unknown): v is SensAvis => v === -1 || v === 0 || v === 1;

/** Ce que le commerçant lit : des PERSONNES, sur les trente derniers jours. */
export type ResumeAvisFilms = { adore: number; sympa: number; non: number };

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

const str = (v: unknown) => (v == null ? "" : String(v));

/** Le film est-il bien de ce commerce ? Son annonce en cours, ou une de ses publications. */
export async function filmDuCommerce(supabase: unknown, siteId: string, film: string): Promise<boolean> {
  if (!siteId || !film) return false;
  const sb = supabase as Supabase;
  try {
    const { data } = await sb.from("human_vitrine_sites").select("current_offer").eq("id", siteId).maybeSingle();
    const o = (data as Record<string, unknown> | null)?.current_offer as Record<string, unknown> | null | undefined;
    if (o && str(o.video) === film) return true;
  } catch {
    /* on regarde ses publications */
  }
  try {
    const { data } = await sb.from("human_publications").select("id").eq("site_id", siteId).eq("video", film).limit(1);
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * LE RÉSUMÉ DU COMMERÇANT. Table absente (migration non appliquée) : des zéros,
 * pas une erreur — son espace s'affiche quand même.
 */
export async function resumeAvisFilms(supabase: unknown, siteId: string, jours = 30): Promise<ResumeAvisFilms> {
  const vide: ResumeAvisFilms = { adore: 0, sympa: 0, non: 0 };
  if (!siteId) return vide;
  try {
    const depuis = new Date(Date.now() - jours * 86_400_000).toISOString();
    const { data, error } = await (supabase as Supabase)
      .from("clik_avis_film")
      .select("sens")
      .eq("site_id", siteId)
      .gte("updated_at", depuis);
    if (error || !Array.isArray(data)) return vide;
    for (const r of data as Record<string, unknown>[]) {
      const s = Number(r.sens);
      if (s === 1) vide.adore += 1;
      else if (s === 0) vide.sympa += 1;
      else if (s === -1) vide.non += 1;
    }
    return vide;
  } catch {
    return vide;
  }
}
