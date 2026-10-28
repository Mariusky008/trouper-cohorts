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
//
// AU COMPTOIR (`familleAuComptoir`) : la foule, les paliers, les nouveaux, ses fidèles, son
// parcours de la semaine, et le mot du jour qu'il épingle (`epinglerMot`, voir la migration
// `20261102090000_clik_famille_comptoir.sql`).
import { createHash } from "node:crypto";
import { jourAvant, jourParis } from "@/lib/jour-paris";
import {
  gradeDe,
  type EtatFamille,
  type FamilleAuComptoir,
  type Grade,
  type MaFamille,
  type MembreAuComptoir,
  type MotDuJour,
  type Parcours,
} from "@/lib/direct/famille";
import { lookValide } from "@/lib/direct/look";
import { estCage } from "@/lib/direct/cages";

type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any
type Ligne = Record<string, unknown>;
const s = (v: unknown) => String(v ?? "").trim();

/** Son numéro d'écran chez ce commerce (le même que dans la vitrine) : son code d'invitation. */
export const codeFantome = (siteId: string, habitantId: string) => `f${createHash("sha256").update(`${siteId}:${habitantId}`).digest("hex").slice(0, 12)}`;

type Fiche = { premiere: string; prenom: string; look: string };

/** Les gens de la famille, dans l'ordre de leur première cage ici ; et pour chacun, ce jour-là, son prénom et son fantôme. */
async function arrivees(supabase: Supabase, siteId: string): Promise<{ ordre: string[]; fiches: Map<string, Fiche> }> {
  const { data } = await supabase
    .from("clik_cage")
    .select("habitant_id, created_at, prenom, look")
    .eq("site_id", siteId)
    .order("created_at", { ascending: true })
    .limit(20000);
  const fiches = new Map<string, Fiche>();
  const ordre: string[] = [];
  for (const c of (Array.isArray(data) ? data : []) as Ligne[]) {
    const h = s(c.habitant_id);
    if (!h) continue;
    const f = fiches.get(h);
    if (!f) {
      ordre.push(h);
      fiches.set(h, { premiere: s(c.created_at), prenom: s(c.prenom), look: lookValide(c.look) ? s(c.look) : "" });
      continue;
    }
    // Sa cage la plus récente dit son prénom et son fantôme d'aujourd'hui.
    if (s(c.prenom)) f.prenom = s(c.prenom);
    if (lookValide(c.look)) f.look = s(c.look);
  }
  return { ordre, fiches };
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
    for (const h of (await arrivees(supabase, siteId)).ordre) if (h !== habitantId && codeFantome(siteId, h) === de) amenePar = h;
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
  const [{ ordre, fiches }, presences, passages] = await Promise.all([
    arrivees(supabase, siteId),
    supabase
      .from("clik_presence")
      .select("habitant_id, jour, amene_par")
      .eq("site_id", siteId)
      .gte("jour", jourAvant(jourParis(), 400))
      .limit(50000),
    supabase.from("clik_visite").select("habitant_id, jour").eq("site_id", siteId).limit(20000),
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
  const venues = (passages.error || !Array.isArray(passages.data) ? [] : passages.data) as Ligne[];
  const visites = new Map<string, number>();
  for (const v of venues) {
    const h = s(v.habitant_id);
    visites.set(h, (visites.get(h) ?? 0) + 1);
  }
  const rang = new Map(ordre.map((h, k) => [h, k + 1]));
  const parcoursDe = (h: string): Parcours => ({ visites: visites.get(h) ?? 0, jours: jours.get(h)?.size ?? 0, amis: amis.get(h)?.size ?? 0 });
  return {
    ordre,
    actif,
    lignes,
    /** Les passages notés au comptoir (qui, quel jour). */
    venues,
    /** Son premier jour ici, son prénom et son fantôme. */
    ficheDe: (h: string) => fiches.get(h),
    /** Son numéro chez ce commerce (0 : pas de la famille). */
    numeroDe: (h: string) => rang.get(h) ?? 0,
    parcoursDe,
    gradeDe: (h: string) => gradeDe(parcoursDe(h)),
  };
}

type Famille = Awaited<ReturnType<typeof lireFamille>>;

/** La foule d'aujourd'hui, celle d'hier, et le record à battre (les jours d'avant : aujourd'hui, on est en train de le battre). */
async function fouleDe(supabase: Supabase, siteId: string, f: Famille) {
  const auj = jourParis();
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
  const record = f.actif ? Math.max(0, ...[...parJour].filter(([j]) => j !== auj).map(([, n]) => n)) : null;
  return { aujourdhui, hier: parJour.get(jourAvant(auj, 1)) ?? 0, record };
}

/** La foule, le record, et lui (`habitantId`) s'il est de la famille. */
export async function etatFamille(supabase: Supabase, siteId: string, habitantId?: string | null): Promise<EtatFamille> {
  const auj = jourParis();
  const f = await lireFamille(supabase, siteId);
  const { aujourdhui, hier, record } = await fouleDe(supabase, siteId, f);

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
  return { aujourdhui, hier, record, membres: f.ordre.length, moi };
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

/** Ses petits mots d'aujourd'hui et d'hier — avec `epingle_le` si la migration du comptoir est passée. */
async function motsRecents(supabase: Supabase, siteId: string): Promise<{ mots: Ligne[]; epinglable: boolean }> {
  const depuis = jourAvant(jourParis(), 1);
  for (const [colonnes, epinglable] of [
    ["id, habitant_id, texte, jour, created_at, epingle_le", true],
    ["id, habitant_id, texte, jour, created_at", false],
  ] as const) {
    const { data, error } = await supabase.from("clik_mot").select(colonnes).eq("site_id", siteId).gte("jour", depuis).order("created_at", { ascending: false }).limit(200);
    if (!error) return { mots: (Array.isArray(data) ? data : []) as Ligne[], epinglable };
    if (!/epingle_le/.test(s(error.message))) return { mots: [], epinglable: false };
  }
  return { mots: [], epinglable: false };
}

/** Le prénom qu'il montre dans les vitrines (vide s'il l'a caché). */
async function prenomMontre(supabase: Supabase, habitantId: string, prenom: string): Promise<string> {
  if (!prenom) return "";
  const { data, error } = await supabase.from("human_habitants").select("prenom_vitrine").eq("id", habitantId).maybeSingle();
  return !error && (data as Ligne | null)?.prenom_vitrine === false ? "" : prenom;
}

/** 📌 Le mot du jour : celui qu'il a épinglé aujourd'hui (heure de Paris), avec le prénom (s'il ne l'a pas caché) et le numéro de son auteur. */
export async function motDuJour(supabase: Supabase, siteId: string, f?: Famille): Promise<MotDuJour | null> {
  const auj = jourParis();
  const { mots, epinglable } = await motsRecents(supabase, siteId);
  if (!epinglable) return null;
  const m = mots.filter((x) => x.epingle_le && jourParis(new Date(s(x.epingle_le))) === auj).sort((a, b) => s(b.epingle_le).localeCompare(s(a.epingle_le)))[0];
  if (!m) return null;
  const fam = f ?? (await lireFamille(supabase, siteId));
  const h = s(m.habitant_id);
  const numero = fam.numeroDe(h);
  return { texte: s(m.texte), prenom: await prenomMontre(supabase, h, fam.ficheDe(h)?.prenom ?? ""), numero, grade: numero ? fam.gradeDe(h) : null };
}

/**
 * 📌 IL ÉPINGLE UN PETIT MOT COMME MOT DU JOUR (`id` vide : il le retire). Un seul par jour : en
 * épingler un autre décroche celui d'avant. Le mot doit être un mot de SON commerce, d'aujourd'hui
 * ou d'hier. Rend l'erreur à dire, ou `null`.
 */
export async function epinglerMot(supabase: Supabase, siteId: string, id: string): Promise<string | null> {
  const auj = jourParis();
  const { mots, epinglable } = await motsRecents(supabase, siteId);
  if (!epinglable) return "Le mot du jour n’est pas encore activé.";
  if (id && !mots.some((m) => s(m.id) === id)) return "Ce mot n’est pas un des tiens d’aujourd’hui ou d’hier.";
  for (const m of mots) {
    if (s(m.id) !== id && m.epingle_le && jourParis(new Date(s(m.epingle_le))) === auj) {
      const { error } = await supabase.from("clik_mot").update({ epingle_le: null }).eq("id", s(m.id)).eq("site_id", siteId);
      if (error) return error.message;
    }
  }
  if (!id) return null;
  const { error } = await supabase.from("clik_mot").update({ epingle_le: new Date().toISOString() }).eq("id", id).eq("site_id", siteId);
  return error ? error.message : null;
}

/** 👻 CE QUE LE COMPTOIR MONTRE DE SA FAMILLE : la foule, les paliers, les nouveaux, ses fidèles, son parcours, le mot du jour. */
export async function familleAuComptoir(supabase: Supabase, siteId: string): Promise<FamilleAuComptoir> {
  const auj = jourParis();
  const semaine = jourAvant(auj, 6);
  const f = await lireFamille(supabase, siteId);
  const [foule, recents, compteurs, mdj] = await Promise.all([
    fouleDe(supabase, siteId, f),
    motsRecents(supabase, siteId),
    supabase.from("human_compteurs_jour").select("jour, famille").eq("site_id", siteId).gte("jour", semaine).limit(20),
    motDuJour(supabase, siteId, f),
  ]);
  const paliers: Record<Grade, number> = { bronze: 0, argent: 0, or: 0 };
  const fideles: MembreAuComptoir[] = [];
  let nouveaux = 0;
  for (const h of f.ordre) {
    const g = f.gradeDe(h);
    paliers[g] += 1;
    const fiche = f.ficheDe(h);
    if (fiche && jourParis(new Date(fiche.premiere)) === auj) nouveaux += 1;
    if (g !== "bronze") fideles.push({ prenom: fiche?.prenom ?? "", numero: f.numeroDe(h), grade: g, look: fiche?.look ?? "" });
  }
  fideles.sort((a, b) => Number(b.grade === "or") - Number(a.grade === "or") || a.numero - b.numero);
  const pages = compteurs.error ? null : ((Array.isArray(compteurs.data) ? compteurs.data : []) as Ligne[]).reduce((n, r) => n + (Number(r.famille) || 0), 0);
  const cages = new Set(f.lignes.filter((p) => s(p.jour).slice(0, 10) >= semaine).map((p) => s(p.habitant_id))).size;
  const venues = new Set(f.venues.filter((v) => s(v.jour).slice(0, 10) >= semaine).map((v) => s(v.habitant_id))).size;
  return {
    ...foule,
    membres: f.ordre.length,
    nouveaux,
    paliers,
    fideles: fideles.slice(0, 12),
    parcours: { pages, cages, venues },
    mots: recents.mots.slice(0, 8).map((m) => {
      const h = s(m.habitant_id);
      return {
        id: s(m.id),
        texte: s(m.texte),
        prenom: f.ficheDe(h)?.prenom ?? "",
        numero: f.numeroDe(h),
        epingle: Boolean(m.epingle_le) && jourParis(new Date(s(m.epingle_le))) === auj,
      };
    }),
    motDuJour: mdj,
    epinglable: recents.epinglable,
  };
}
