// 👻 LA FAMILLE D'UN COMMERCE, CÔTÉ SERVEUR — sa présence du jour, et ce que la page publique en montre.
//
// Voir `famille.ts` pour la règle (le numéro, la foule du jour, le record, les paliers) et
// `supabase/migrations/20261101090000_clik_famille.sql` pour la table.
//
// LE NUMÉRO, C'EST L'ORDRE D'ARRIVÉE : la première cage qu'il a libérée chez ce commerce
// (`clik_cage.created_at`, que l'upsert ne réécrit pas). Pas de colonne à tenir à jour : un
// numéro qu'on stockerait pourrait se dédoubler le jour où deux arrivent à la même seconde.
//
// TANT QUE LA TABLE N'EST PAS CRÉÉE, la page marche quand même : la foule du jour se lit dans
// les cages ouvertes aujourd'hui, le record ne se montre pas, et rien n'est écrit.
import { createHash } from "node:crypto";
import { jourParis } from "@/lib/jour-paris";
import { gradeDe, type EtatFamille, type MaFamille, type Parcours } from "@/lib/direct/famille";
import { estCage } from "@/lib/direct/cages";

type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
type Ligne = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();

/** Son numéro d'écran chez ce commerce (le même que dans la vitrine) : son code d'invitation. */
export const codeFantome = (siteId: string, habitantId: string) => `f${createHash("sha256").update(`${siteId}:${habitantId}`).digest("hex").slice(0, 12)}`;

/** Les gens de la famille, dans l'ordre de leur première cage ici. */
async function arrivees(supabase: Supabase, siteId: string): Promise<string[]> {
  const { data } = await supabase.from("clik_cage").select("habitant_id, created_at").eq("site_id", siteId).order("created_at", { ascending: true }).limit(20000);
  const vus = new Set<string>();
  const ordre: string[] = [];
  for (const c of (Array.isArray(data) ? data : []) as Ligne[]) {
    const h = s(c.habitant_id);
    if (h && !vus.has(h)) {
      vus.add(h);
      ordre.push(h);
    }
  }
  return ordre;
}

/**
 * IL VIENT D'OUVRIR UNE CAGE : il est dans la foule d'aujourd'hui (une fois par jour). Si c'est
 * son tout premier jour ici et qu'il est venu par le lien d'un autre (`de`), on note qui l'a amené.
 * Rend `false` si la table n'existe pas encore.
 */
export async function noterPresence(supabase: Supabase, siteId: string, habitantId: string, de?: string): Promise<boolean> {
  const jour = jourParis();
  const { data: avant, error } = await supabase.from("clik_presence").select("jour").eq("site_id", siteId).eq("habitant_id", habitantId).limit(400);
  if (error) return false;
  const jours = ((Array.isArray(avant) ? avant : []) as Ligne[]).map((r) => s(r.jour).slice(0, 10));
  if (jours.includes(jour)) return true;
  let amenePar: string | null = null;
  if (!jours.length && /^f[0-9a-f]{12}$/.test(s(de))) {
    for (const h of await arrivees(supabase, siteId)) if (h !== habitantId && codeFantome(siteId, h) === de) amenePar = h;
  }
  const { error: e2 } = await supabase.from("clik_presence").insert({ site_id: siteId, habitant_id: habitantId, jour, ...(amenePar ? { amene_par: amenePar } : {}) });
  // Deux cages le même jour, à la même seconde : la ligne est déjà là, c'est ce qu'on voulait.
  return !e2 || /duplicate|unique|23505/i.test(s(e2.message));
}

/**
 * TOUTE LA FAMILLE D'UN COMMERCE, EN TROIS LECTURES : l'ordre d'arrivée (le numéro), la présence
 * des 400 derniers jours (la foule, les jours de cage, les amis amenés) et les passages notés au
 * comptoir. La page, la vitrine et Ma Maison en tirent chacune ce qu'elles montrent.
 */
export async function lireFamille(supabase: Supabase, siteId: string) {
  const [ordre, presences, passages] = await Promise.all([
    arrivees(supabase, siteId),
    supabase
      .from("clik_presence")
      .select("habitant_id, jour, amene_par")
      .eq("site_id", siteId)
      .gte("jour", jourParis(new Date(Date.now() - 400 * 86_400_000)))
      .limit(50000),
    supabase.from("clik_visite").select("habitant_id").eq("site_id", siteId).limit(20000),
  ]);
  const actif = !presences.error;
  const lignes = (actif && Array.isArray(presences.data) ? presences.data : []) as Ligne[];
  const compter = (cle: (p: Ligne) => string, valeur: (p: Ligne) => string, depuis: Ligne[]) => {
    const m = new Map<string, Set<string>>();
    for (const p of depuis) {
      const k = cle(p);
      if (!k) continue;
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(valeur(p));
    }
    return m;
  };
  const jours = compter((p) => s(p.habitant_id), (p) => s(p.jour).slice(0, 10), lignes);
  const amis = compter((p) => s(p.amene_par), (p) => s(p.habitant_id), lignes);
  const visites = new Map<string, number>();
  for (const v of (passages.error || !Array.isArray(passages.data) ? [] : passages.data) as Ligne[]) {
    const h = s(v.habitant_id);
    visites.set(h, (visites.get(h) ?? 0) + 1);
  }
  const rang = new Map(ordre.map((h, k) => [h, k + 1]));
  const parcoursDe = (h: string): Parcours => ({ visites: visites.get(h) ?? 0, jours: jours.get(h)?.size ?? 0, amis: amis.get(h)?.size ?? 0 });
  return {
    ordre,
    actif,
    lignes,
    /** Son numéro chez ce commerce (0 : pas de la famille). */
    numeroDe: (h: string) => rang.get(h) ?? 0,
    parcoursDe,
    gradeDe: (h: string) => gradeDe(parcoursDe(h)),
  };
}

/** La foule, le record, et lui (`habitantId`) s'il est de la famille. */
export async function etatFamille(supabase: Supabase, siteId: string, habitantId?: string | null): Promise<EtatFamille> {
  const auj = jourParis();
  const hier = jourParis(new Date(Date.now() - 86_400_000));
  const f = await lireFamille(supabase, siteId);
  const parJour = new Map<string, number>();
  for (const p of f.lignes) {
    const j = s(p.jour).slice(0, 10);
    parJour.set(j, (parJour.get(j) ?? 0) + 1);
  }
  let aujourdhui = parJour.get(auj) ?? 0;
  if (!f.actif) {
    // SANS LA TABLE : ceux dont la cage a bougé aujourd'hui.
    const { data } = await supabase.from("clik_cage").select("habitant_id, updated_at").eq("site_id", siteId).gte("updated_at", new Date(Date.now() - 36 * 3_600_000).toISOString()).limit(5000);
    aujourdhui = new Set(((Array.isArray(data) ? data : []) as Ligne[]).filter((c) => jourParis(new Date(s(c.updated_at))) === auj).map((c) => s(c.habitant_id))).size;
  }
  // Le record à battre : les jours d'avant (aujourd'hui, on est en train de le battre).
  const record = f.actif ? Math.max(0, ...[...parJour].filter(([j]) => j !== auj).map(([, n]) => n)) : null;

  let moi: EtatFamille["moi"] = null;
  const numero = habitantId ? f.numeroDe(habitantId) : 0;
  if (habitantId && numero) {
    const { data: c } = await supabase
      .from("clik_cage")
      .select("prenom, cage, updated_at")
      .eq("site_id", siteId)
      .eq("habitant_id", habitantId)
      .order("updated_at", { ascending: false })
      .limit(1);
    const derniere = ((Array.isArray(c) ? c : []) as Ligne[])[0] as Ligne | undefined;
    const parcours = f.parcoursDe(habitantId);
    moi = {
      numero,
      prenom: s(derniere?.prenom),
      cage: estCage(derniere?.cage) ? derniere.cage : null,
      grade: gradeDe(parcours),
      parcours,
      present: f.actif ? f.lignes.some((p) => s(p.habitant_id) === habitantId && s(p.jour).slice(0, 10) === auj) : false,
      code: codeFantome(siteId, habitantId),
    };
  }
  return { aujourdhui, hier: parJour.get(hier) ?? 0, record, membres: f.ordre.length, moi };
}

/** 🏠 SES FAMILLES, pour Ma Maison : chaque commerce client où il a libéré son fantôme, du plus récent au plus ancien. */
export async function famillesDe(supabase: Supabase, habitantId: string): Promise<MaFamille[]> {
  const { data } = await supabase.from("clik_cage").select("site_id, updated_at").eq("habitant_id", habitantId).order("updated_at", { ascending: false }).limit(500);
  const ids = [...new Set(((Array.isArray(data) ? data : []) as Ligne[]).map((c) => s(c.site_id)).filter(Boolean))].slice(0, 12);
  if (!ids.length) return [];
  const { data: sites } = await supabase.from("human_vitrine_sites").select("id, slug, business_name, est_client").in("id", ids);
  const site = new Map(((Array.isArray(sites) ? sites : []) as Ligne[]).filter((x) => x.est_client === true).map((x) => [s(x.id), x]));
  const out = await Promise.all(
    ids
      .filter((id) => site.has(id))
      .map(async (id): Promise<MaFamille | null> => {
        const f = await lireFamille(supabase, id);
        const numero = f.numeroDe(habitantId);
        if (!numero) return null;
        const x = site.get(id)!;
        return { slug: s(x.slug), nom: s(x.business_name), numero, membres: f.ordre.length, grade: f.gradeDe(habitantId), parcours: f.parcoursDe(habitantId) };
      }),
  );
  return out.filter((x): x is MaFamille => Boolean(x));
}
