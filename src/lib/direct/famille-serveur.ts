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
  BON_PLAN_MAX,
  GATE_MAX,
  gradeDe,
  ouvertureDuBonPlan,
  type BonPlanComptoir,
  type BonPlanPublic,
  type DureeBonPlan,
  FANTOMES_VIDEO_MAX,
  type EtatFamille,
  type FamilleVideo,
  type FantomeVideo,
  type Gate,
  type FamilleAuComptoir,
  type Grade,
  type MaFamille,
  type MembreAuComptoir,
  type MotDuJour,
  type Parcours,
  SURPRISES_MAX,
  SURPRISE_LIBELLE_MAX,
  SURPRISE_STOCK_MAX,
  type SurpriseDuJour,
  type SurprisePublique,
} from "@/lib/direct/famille";
import { lookValide } from "@/lib/direct/look";
import { plusPermis, plusPropre } from "@/lib/direct/previens-les";
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
    const { data: accord } = await supabase.from("clik_accord").select("video").eq("site_id", siteId).eq("habitant_id", habitantId).maybeSingle();
    moi = {
      numero,
      prenom: s(derniere?.prenom),
      cage: estCage(derniere?.cage) ? derniere.cage : null,
      grade: gradeDe(parcours),
      parcours,
      present: f.actif ? f.lignes.some((p) => s(p.habitant_id) === habitantId && s(p.jour).slice(0, 10) === auj) : false,
      code: codeFantome(siteId, habitantId),
      video: (accord as Ligne | null)?.video === true,
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
  const [foule, recents, compteurs, mdj, bp, gt] = await Promise.all([
    fouleDe(supabase, siteId, f),
    motsRecents(supabase, siteId),
    supabase.from("human_compteurs_jour").select("jour, famille").eq("site_id", siteId).gte("jour", semaine).limit(20),
    motDuJour(supabase, siteId, f),
    bonPlanEnCours(supabase, siteId),
    gateDuMois(supabase, siteId),
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
    bonPlan: bp.plan ? bonPlanAuComptoir(bp.plan) : null,
    bonsPlansActifs: bp.actif,
    gate: gt.gate,
    gateDernier: gt.dernier,
  };
}

// ═══ 🔔 LE BON PLAN, PAR PALIER ════════════════════════════════════════════

/** Son bon plan en cours (ni retiré, ni fini) ; `actif` : la table existe. */
export async function bonPlanEnCours(supabase: Supabase, siteId: string): Promise<{ actif: boolean; plan: Ligne | null }> {
  const { data, error } = await supabase
    .from("clik_bon_plan")
    .select("id, texte, publie_le, fin_le, retire_le")
    .eq("site_id", siteId)
    .order("publie_le", { ascending: false })
    .limit(1);
  if (error) return { actif: false, plan: null };
  const p = ((Array.isArray(data) ? data : []) as Ligne[])[0];
  const enCours = p && !p.retire_le && Date.parse(s(p.fin_le)) > Date.now();
  return { actif: true, plan: enCours ? p : null };
}

const bonPlanAuComptoir = (p: Ligne): BonPlanComptoir => ({
  id: s(p.id),
  texte: s(p.texte),
  publieLe: s(p.publie_le),
  finLe: s(p.fin_le),
  ouvertures: { or: ouvertureDuBonPlan(s(p.publie_le), "or"), argent: ouvertureDuBonPlan(s(p.publie_le), "argent"), bronze: ouvertureDuBonPlan(s(p.publie_le), "bronze") },
});

/**
 * LE BON PLAN TEL QUE CETTE PERSONNE LE VOIT : le texte seulement quand son palier est ouvert. Un
 * visiteur qui n'est pas de la famille ne l'a jamais (« ouvre une cage ») ; il saura seulement
 * quand il s'ouvrira pour lui, une fois en bronze.
 */
export function bonPlanPour(p: Ligne, grade: Grade | null, maintenant = Date.now()): BonPlanPublic {
  const ouvertA = ouvertureDuBonPlan(s(p.publie_le), grade ?? "bronze");
  const ouvert = grade !== null && maintenant >= Date.parse(ouvertA);
  return { membre: grade !== null, grade, ouvert, ...(ouvert ? { texte: s(p.texte) } : {}), ouvertA, finLe: s(p.fin_le) };
}

/** 23 h ce soir, heure de Paris (ISO). */
function ceSoir(maintenant = Date.now()): number {
  const d = new Date(maintenant);
  const ecart = Date.parse(d.toLocaleString("en-US", { timeZone: "Europe/Paris" })) - Date.parse(d.toLocaleString("en-US", { timeZone: "UTC" }));
  const [a, m, j] = jourParis(d).split("-").map(Number);
  return Date.UTC(a, m - 1, j, 23, 0) - ecart;
}

/** Il écrit un bon plan : il remplace celui d'avant. Rend l'erreur à dire, ou `null`. */
export async function publierBonPlan(supabase: Supabase, siteId: string, texte: string, duree: DureeBonPlan): Promise<string | null> {
  const propre = texte.replace(/\s+/g, " ").trim().slice(0, BON_PLAN_MAX);
  if (!propre) return "Écris ton bon plan.";
  if (!plusPermis(propre)) return "Pas de promotion d’alcool (loi Évin).";
  const maintenant = Date.now();
  let fin = duree === "1h" ? maintenant + 3_600_000 : duree === "3h" ? maintenant + 3 * 3_600_000 : ceSoir(maintenant);
  // Après 22 h, « ce soir » laisse au moins une heure.
  if (fin - maintenant < 3_600_000) fin = maintenant + 3_600_000;
  const { error: e1 } = await supabase.from("clik_bon_plan").update({ retire_le: new Date(maintenant).toISOString() }).eq("site_id", siteId).is("retire_le", null);
  if (e1) return /does not exist|schema cache|Could not find/i.test(s(e1.message)) ? "Les bons plans ne sont pas encore activés." : s(e1.message);
  const { error } = await supabase.from("clik_bon_plan").insert({ site_id: siteId, texte: propre, publie_le: new Date(maintenant).toISOString(), fin_le: new Date(fin).toISOString() });
  return error ? s(error.message) : null;
}

/** « C'est complet » : il retire son bon plan. */
export async function retirerBonPlan(supabase: Supabase, siteId: string): Promise<string | null> {
  const { error } = await supabase.from("clik_bon_plan").update({ retire_le: new Date().toISOString() }).eq("site_id", siteId).is("retire_le", null);
  if (!error) return null;
  return /does not exist|schema cache|Could not find/i.test(s(error.message)) ? "Les bons plans ne sont pas encore activés." : s(error.message);
}

// ═══ 🎁 « JE TE GÂTE » ═════════════════════════════════════════════════════

/** Ce qu'il offre ce mois-ci (heure de Paris), combien il en a offert, et son dernier choix pour le reprendre. */
export async function gateDuMois(supabase: Supabase, siteId: string): Promise<{ actif: boolean; gate: Gate | null; dernier: { quoi: string; combien: number } | null }> {
  const mois = jourParis().slice(0, 7);
  const { data, error } = await supabase.from("clik_gate").select("mois, quoi, combien").eq("site_id", siteId).order("mois", { ascending: false }).limit(2);
  if (error) return { actif: false, gate: null, dernier: null };
  const lignes = (Array.isArray(data) ? data : []) as Ligne[];
  const ce = lignes.find((l) => s(l.mois) === mois);
  const dernier = lignes[0] ? { quoi: s(lignes[0].quoi), combien: Number(lignes[0].combien) || 0 } : null;
  if (!ce) return { actif: true, gate: null, dernier };
  // SES CADEAUX DU MOIS : les 🎁 des petits mots (le mois de Paris commence la veille au soir en UTC).
  const { data: ms } = await supabase.from("clik_mot").select("cadeau_le").eq("site_id", siteId).gte("cadeau_le", `${jourAvant(`${mois}-01`, 1)}T00:00:00Z`).limit(2000);
  const offerts = ((Array.isArray(ms) ? ms : []) as Ligne[]).filter((m) => m.cadeau_le && jourParis(new Date(s(m.cadeau_le))).slice(0, 7) === mois).length;
  return { actif: true, gate: { mois, quoi: s(ce.quoi), combien: Number(ce.combien) || 0, offerts }, dernier };
}

/** Il fixe ce qu'il peut offrir ce mois-ci. Rend l'erreur à dire, ou `null`. */
export async function fixerGate(supabase: Supabase, siteId: string, quoi: string, combien: number): Promise<string | null> {
  const propre = plusPropre(quoi);
  if (!propre) return "Dis ce que tu offres.";
  if (!plusPermis(propre)) return "Pas d’alcool offert (loi Évin).";
  if (!Number.isInteger(combien) || combien < 0 || combien > GATE_MAX) return `Un nombre entre 0 et ${GATE_MAX}.`;
  const { error } = await supabase
    .from("clik_gate")
    .upsert({ site_id: siteId, mois: jourParis().slice(0, 7), quoi: propre, combien, updated_at: new Date().toISOString() }, { onConflict: "site_id,mois" });
  if (!error) return null;
  return /does not exist|schema cache|Could not find/i.test(s(error.message)) ? "« Je te gâte » n’est pas encore activé." : s(error.message);
}

// ═══ 🎬 LA FAMILLE DANS SES VIDÉOS ══════════════════════════════════════════

/** Ceux qui ont dit oui : leur prénom et leur petit mot peuvent apparaître dans ses vidéos. */
export async function accordsVideo(supabase: Supabase, siteId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("clik_accord").select("habitant_id, video").eq("site_id", siteId).limit(20000);
  if (error) return new Set();
  return new Set(((Array.isArray(data) ? data : []) as Ligne[]).filter((a) => a.video === true).map((a) => s(a.habitant_id)));
}

/** Il dit oui (ou non) : son prénom et son petit mot dans les vidéos de ce commerce. Rend l'erreur à dire, ou `null`. */
export async function enregistrerAccordVideo(supabase: Supabase, siteId: string, habitantId: string, oui: boolean): Promise<string | null> {
  const { error } = await supabase
    .from("clik_accord")
    .upsert({ site_id: siteId, habitant_id: habitantId, video: oui, updated_at: new Date().toISOString() }, { onConflict: "site_id,habitant_id" });
  if (!error) return null;
  return /does not exist|schema cache|Could not find/i.test(s(error.message)) ? "Ce choix n’est pas encore possible." : s(error.message);
}

/**
 * 🎬 LA FAMILLE D'HIER, POUR LA FIN DE SES VIDÉOS : les fantômes présents hier (ou, si hier était
 * vide, ceux de la semaine), l'or d'abord ; le prénom, le numéro et le petit mot seulement pour ceux
 * qui l'ont accepté — et dont le prénom n'est pas caché —, le mot seulement s'il est déjà public (de
 * la liste, avec son 💛, ou épinglé).
 */
export async function familleDeLaVideo(supabase: Supabase, siteId: string, o: { nom: string; slug: string; branche: string; hote: string }): Promise<FamilleVideo> {
  const auj = jourParis();
  const hier = jourAvant(auj, 1);
  const semaine = jourAvant(auj, 7);
  const f = await lireFamille(supabase, siteId);
  const [foule, accords, motsRes] = await Promise.all([
    fouleDe(supabase, siteId, f),
    accordsVideo(supabase, siteId),
    supabase.from("clik_mot").select("habitant_id, texte, liste, coeur_le, epingle_le, jour, created_at").eq("site_id", siteId).gte("jour", semaine).order("created_at", { ascending: false }).limit(500),
  ]);
  const parJour = new Map<string, number>();
  for (const p of f.lignes) {
    const j = s(p.jour).slice(0, 10);
    parJour.set(j, (parJour.get(j) ?? 0) + 1);
  }
  const avantHier = Math.max(0, ...[...parJour].filter(([j]) => j < hier).map(([, n]) => n));
  const dHier = [...new Set(f.lignes.filter((p) => s(p.jour).slice(0, 10) === hier).map((p) => s(p.habitant_id)))];
  const quand: FamilleVideo["quand"] = dHier.length ? "hier" : "semaine";
  const qui = dHier.length ? dHier : [...new Set(f.lignes.filter((p) => s(p.jour).slice(0, 10) >= semaine && s(p.jour).slice(0, 10) < auj).map((p) => s(p.habitant_id)))];
  // LEUR DERNIER MOT DÉJÀ PUBLIC
  const motDe = new Map<string, string>();
  for (const m of ((motsRes.error ? [] : motsRes.data) ?? []) as Ligne[]) {
    const h = s(m.habitant_id);
    if (!motDe.has(h) && (m.liste === true || m.coeur_le || m.epingle_le)) motDe.set(h, s(m.texte));
  }
  const caches = new Set<string>();
  const avecAccord = qui.filter((h) => accords.has(h));
  if (avecAccord.length) {
    const { data, error } = await supabase.from("human_habitants").select("id, prenom_vitrine").in("id", avecAccord);
    if (!error) for (const x of (Array.isArray(data) ? data : []) as Ligne[]) if (x.prenom_vitrine === false) caches.add(s(x.id));
  }
  const rangGrade = { or: 0, argent: 1, bronze: 2 } as const;
  const fantomes: FantomeVideo[] = qui
    .filter((h) => f.numeroDe(h))
    .map((h) => {
      const grade = f.gradeDe(h);
      const fiche = f.ficheDe(h);
      const oui = accords.has(h) && !caches.has(h);
      const prenom = oui ? (fiche?.prenom ?? "") : "";
      const mot = oui ? motDe.get(h) : undefined;
      return { look: fiche?.look || "", grade, ...(oui ? { numero: f.numeroDe(h) } : {}), ...(prenom ? { prenom } : {}), ...(mot ? { mot } : {}) };
    })
    // Ceux qui ont un mot à dire d'abord (ils s'avancent), puis l'or, l'argent, le bronze.
    .sort((a, b) => Number(Boolean(b.mot)) - Number(Boolean(a.mot)) || rangGrade[a.grade] - rangGrade[b.grade])
    .slice(0, FANTOMES_VIDEO_MAX);
  return {
    nom: o.nom,
    lien: `clikme.fr/f/${o.slug}`,
    branche: o.branche,
    hote: o.hote,
    hier: foule.hier,
    record: foule.record,
    recordBattuHier: foule.record !== null && avantHier > 0 && foule.hier > avantHier,
    membres: f.ordre.length,
    quand,
    fantomes,
  };
}

// ═══ 🎁 LA SURPRISE DU CHEF ═══════════════════════════════════════════════
// Le commerçant prévoit ses surprises du jour, chacune avec son stock. Un fantôme ouvre la cage dorée : une surprise
// lui est tirée au hasard parmi celles qui restent (une par personne et par jour, gardée : rouvrir ne la change pas).
// « Je prends ça » la lui donne et la retire du stock. Plus de stock : la cage se referme. Pas de priorité de palier.
const pasEncoreSurprises = (m: string) => (/does not exist|schema cache|Could not find/i.test(m) ? "Les surprises ne sont pas encore activées." : m);

/** Ses surprises d'aujourd'hui (heure de Paris), dans l'ordre où il les a écrites. */
export async function surprisesDuJour(supabase: Supabase, siteId: string): Promise<{ actif: boolean; liste: SurpriseDuJour[] }> {
  const { data, error } = await supabase
    .from("clik_surprise")
    .select("id, libelle, stock, pris")
    .eq("site_id", siteId)
    .eq("jour", jourParis())
    .is("retire_le", null)
    .order("created_at", { ascending: true });
  if (error) return { actif: false, liste: [] };
  return {
    actif: true,
    liste: ((Array.isArray(data) ? data : []) as Ligne[]).map((x) => ({ id: s(x.id), libelle: s(x.libelle), stock: Number(x.stock) || 0, pris: Number(x.pris) || 0 })),
  };
}

/** Il écrit ses surprises du jour : elles remplacent celles d'avant (ce qui a été pris reste pris). */
export async function fixerSurprises(supabase: Supabase, siteId: string, brut: unknown): Promise<string | null> {
  const liste = (Array.isArray(brut) ? brut : [])
    .map((x) => ({ libelle: s((x as Ligne)?.libelle).replace(/\s+/g, " ").slice(0, SURPRISE_LIBELLE_MAX), stock: Math.floor(Number((x as Ligne)?.stock)) }))
    .filter((x) => x.libelle);
  if (liste.length > SURPRISES_MAX) return `${SURPRISES_MAX} surprises au plus.`;
  if (liste.some((x) => !(x.stock >= 1 && x.stock <= SURPRISE_STOCK_MAX))) return `Combien ? Entre 1 et ${SURPRISE_STOCK_MAX}.`;
  if (liste.some((x) => !plusPermis(x.libelle))) return "Pas d’alcool dans les surprises (loi Évin).";
  const maintenant = new Date().toISOString();
  const { error: e1 } = await supabase.from("clik_surprise").update({ retire_le: maintenant }).eq("site_id", siteId).eq("jour", jourParis()).is("retire_le", null);
  if (e1) return pasEncoreSurprises(s(e1.message));
  if (!liste.length) return null;
  const { error } = await supabase.from("clik_surprise").insert(liste.map((x) => ({ site_id: siteId, jour: jourParis(), libelle: x.libelle, stock: x.stock })));
  return error ? pasEncoreSurprises(s(error.message)) : null;
}

async function tirageDe(supabase: Supabase, siteId: string, habitantId: string): Promise<Ligne | null> {
  const { data, error } = await supabase.from("clik_surprise_tirage").select("surprise_id, pris_le, laisse_le").eq("site_id", siteId).eq("jour", jourParis()).eq("habitant_id", habitantId).maybeSingle();
  return error ? null : ((data as Ligne | null) ?? null);
}
const oublierTirage = (supabase: Supabase, siteId: string, habitantId: string) =>
  supabase.from("clik_surprise_tirage").delete().eq("site_id", siteId).eq("jour", jourParis()).eq("habitant_id", habitantId);

/** Ce que voit la page : ce qu'il reste dans la cage dorée, et sa surprise à lui s'il l'a déjà tirée. */
export async function surprisePour(supabase: Supabase, siteId: string, habitantId: string | null): Promise<SurprisePublique | null> {
  const { actif, liste } = await surprisesDuJour(supabase, siteId);
  if (!actif || !liste.length) return null;
  const reste = liste.reduce((n, x) => n + Math.max(0, x.stock - x.pris), 0);
  const t = habitantId ? await tirageDe(supabase, siteId, habitantId) : null;
  const sienne = t ? liste.find((x) => x.id === s(t.surprise_id)) : undefined;
  const moi = t && sienne && (t.pris_le || t.laisse_le || sienne.pris < sienne.stock) ? { libelle: sienne.libelle, prise: Boolean(t.pris_le), laissee: Boolean(t.laisse_le) && !t.pris_le } : null;
  return { reste, moi };
}

/** Il ouvre la cage dorée : sa surprise du jour (tirée au hasard parmi celles qui restent, puis gardée). */
export async function ouvrirSurprise(supabase: Supabase, siteId: string, habitantId: string): Promise<{ ennui?: string; libelle?: string; prise?: boolean }> {
  const { actif, liste } = await surprisesDuJour(supabase, siteId);
  if (!actif) return { ennui: "Les surprises ne sont pas encore activées." };
  const t = await tirageDe(supabase, siteId, habitantId);
  // « NON MERCI » : une par personne et par jour, laisser ne permet pas d'en tirer une autre
  if (t?.laisse_le && !t.pris_le) return { ennui: "Tu as laissé ta surprise pour aujourd’hui. Une nouvelle demain !" };
  if (t) {
    const sienne = liste.find((x) => x.id === s(t.surprise_id));
    if (sienne && (t.pris_le || sienne.pris < sienne.stock)) return { libelle: sienne.libelle, prise: Boolean(t.pris_le) };
    await oublierTirage(supabase, siteId, habitantId);
  }
  const restantes = liste.filter((x) => x.pris < x.stock);
  if (!restantes.length) return { ennui: "Toutes les surprises du jour sont parties. Reviens demain !" };
  // AU HASARD, selon ce qu'il en reste : la surprise dont il reste 4 sort plus souvent que celle dont il reste 1
  let n = Math.random() * restantes.reduce((a, x) => a + (x.stock - x.pris), 0);
  const tiree = restantes.find((x) => (n -= x.stock - x.pris) < 0) ?? restantes[0];
  const { error } = await supabase.from("clik_surprise_tirage").insert({ site_id: siteId, jour: jourParis(), habitant_id: habitantId, surprise_id: tiree.id });
  if (error) {
    // Deux appuis en même temps : on garde la première.
    const deja = await tirageDe(supabase, siteId, habitantId);
    const sienne = deja ? liste.find((x) => x.id === s(deja.surprise_id)) : undefined;
    return sienne ? { libelle: sienne.libelle, prise: Boolean(deja?.pris_le) } : { ennui: pasEncoreSurprises(s(error.message)) };
  }
  return { libelle: tiree.libelle, prise: false };
}

/** « Je prends ça » : la surprise est à lui, et une de moins dans le stock (jamais deux fois la dernière). */
export async function prendreSurprise(supabase: Supabase, siteId: string, habitantId: string): Promise<{ ennui?: string; libelle?: string }> {
  const t = await tirageDe(supabase, siteId, habitantId);
  if (!t) return { ennui: "Ouvre d’abord la cage dorée." };
  const id = s(t.surprise_id);
  for (let essai = 0; essai < 5; essai++) {
    const { data } = await supabase.from("clik_surprise").select("libelle, stock, pris, retire_le").eq("id", id).maybeSingle();
    const x = (data as Ligne | null) ?? null;
    if (t.pris_le && x) return { libelle: s(x.libelle) };
    if (!x || x.retire_le || Number(x.pris) >= Number(x.stock)) {
      await oublierTirage(supabase, siteId, habitantId);
      return { ennui: "Trop tard, elle vient de partir. Rouvre la cage : il en reste peut-être une autre !" };
    }
    // Une de moins, seulement si personne n'en a pris une entre-temps (sinon, on relit et on recommence).
    const { data: fait } = await supabase.from("clik_surprise").update({ pris: Number(x.pris) + 1 }).eq("id", id).eq("pris", Number(x.pris)).select("id");
    if (Array.isArray(fait) && fait.length) {
      await supabase.from("clik_surprise_tirage").update({ pris_le: new Date().toISOString() }).eq("site_id", siteId).eq("jour", jourParis()).eq("habitant_id", habitantId);
      return { libelle: s(x.libelle) };
    }
  }
  return { ennui: "Beaucoup de monde en même temps : réessaie dans un instant." };
}

/** « Non merci » : il laisse sa surprise (elle reste pour les autres) ; pas d'autre tirage pour lui aujourd'hui. */
export async function laisserSurprise(supabase: Supabase, siteId: string, habitantId: string): Promise<{ ennui?: string; libelle?: string }> {
  const t = await tirageDe(supabase, siteId, habitantId);
  if (!t) return { ennui: "Ouvre d’abord la cage dorée." };
  if (t.pris_le) return { ennui: "Elle est déjà à toi." };
  const { data } = await supabase.from("clik_surprise").select("libelle").eq("id", s(t.surprise_id)).maybeSingle();
  const { error } = await supabase
    .from("clik_surprise_tirage")
    .update({ laisse_le: new Date().toISOString() })
    .eq("site_id", siteId)
    .eq("jour", jourParis())
    .eq("habitant_id", habitantId);
  if (error) return { ennui: pasEncoreSurprises(s(error.message)) };
  return { libelle: s((data as Ligne | null)?.libelle) || "ta surprise" };
}

/** Pour le comptoir : qui a pris quelle surprise aujourd'hui (prénom et numéro, jamais d'identifiant). */
export async function surprisesPrises(supabase: Supabase, siteId: string): Promise<{ libelle: string; prenom: string; numero: number }[]> {
  const [{ liste }, tirages, f] = await Promise.all([
    surprisesDuJour(supabase, siteId),
    supabase.from("clik_surprise_tirage").select("habitant_id, surprise_id, pris_le").eq("site_id", siteId).eq("jour", jourParis()).not("pris_le", "is", null),
    lireFamille(supabase, siteId),
  ]);
  const libelleDe = new Map(liste.map((x) => [x.id, x.libelle]));
  return ((tirages.error ? [] : tirages.data ?? []) as Ligne[])
    .filter((x) => libelleDe.has(s(x.surprise_id)))
    .map((x) => ({ libelle: libelleDe.get(s(x.surprise_id)) ?? "", prenom: f.ficheDe(s(x.habitant_id))?.prenom ?? "", numero: f.numeroDe(s(x.habitant_id)) }));
}
