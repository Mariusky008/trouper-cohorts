// 🏪 LA VITRINE D'UN COMMERCE — les fantômes libérés à la fin de ses vidéos, et son ardoise.
//
// GET ?slug= : les fantômes des sept derniers jours (un par personne : sa dernière cage),
// avec leur prénom — sauf qui l'a caché —, le sien marqué (« Vous »), et l'ardoise du jour.
// 💌 Et leurs petits mots (étape 2) : ceux de la liste, et les mots écrits qui ont eu le 💛 du
// commerçant (le sien, toujours) ; son dernier coup de cœur ; s'il a déjà écrit aujourd'hui.
// 🧵 Et leurs écussons (étape 3) : la parole tenue, le pin de ce commerce, le coup de cœur.
// 👻 Et leur place dans la famille : leur numéro d'arrivée et leur palier (`lib/direct/famille.ts`).
// Jamais l'identifiant de personne : chaque fantôme a un numéro d'écran. Voir
// `lib/direct/vitrine-fantomes.ts`.
//
// GET ?moi=1 : son réglage seul (Ma Maison). POST { action: "prenom", visible } : montrer ou cacher son
// prénom dans les vitrines.
//
// Jamais d'habitant créé ici : sans cookie, on voit la vitrine, sans « Vous ».
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { estCage } from "@/lib/direct/cages";
import { lookValide } from "@/lib/direct/look";
import { jourParis } from "@/lib/jour-paris";
import type { FantomeVitrine } from "@/lib/direct/vitrine-fantomes";
import { ecussonsIci, promessesTenues } from "@/lib/direct/ecussons";
import { lireFamille } from "@/lib/direct/famille-serveur";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const migrationManquante = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);
type Ligne = Record<string, unknown>;

/** Son choix : son prénom dans les vitrines (vrai tant que la colonne n'existe pas, ou qu'il n'a rien dit). */
async function prenomsVisibles(supabase: ReturnType<typeof createAdminClient>, ids: string[]): Promise<Map<string, boolean>> {
  const m = new Map<string, boolean>();
  if (!ids.length) return m;
  const { data, error } = await supabase.from("human_habitants").select("id, prenom_vitrine").in("id", ids);
  if (error) return m;
  for (const h of (data ?? []) as Ligne[]) m.set(s(h.id), h.prenom_vitrine !== false);
  return m;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // ?moi=1 : son seul réglage (Ma Maison), sans vitrine.
  if (url.searchParams.get("moi")) {
    const supabase = createAdminClient();
    const moi = await habitantCourant(supabase);
    const prenomVisible = moi ? (await prenomsVisibles(supabase, [moi.id])).get(moi.id) !== false : true;
    return NextResponse.json({ ok: true, prenomVisible });
  }
  const slug = s(url.searchParams.get("slug"));
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const supabase = createAdminClient();
  const { data: site } = await supabase.from("human_vitrine_sites").select("id").eq("slug", slug).maybeSingle();
  const siteId = s((site as Ligne | null)?.id);
  if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });

  const depuis = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [cages, moi, ardoise, mots] = await Promise.all([
    supabase
      .from("clik_cage")
      .select("habitant_id, cage, prenom, look, updated_at")
      .eq("site_id", siteId)
      .gte("updated_at", depuis)
      .order("updated_at", { ascending: false })
      .limit(400),
    habitantCourant(supabase),
    supabase.from("clik_ardoise").select("texte, ecrite_le").eq("site_id", siteId).maybeSingle(),
    supabase
      .from("clik_mot")
      .select("habitant_id, texte, liste, jour, coeur_le, cadeau, created_at")
      .eq("site_id", siteId)
      .gte("created_at", new Date(Date.now() - 30 * 86_400_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (cages.error && !migrationManquante(cages.error.message)) return NextResponse.json({ error: cages.error.message }, { status: 500 });

  // UNE PAR PERSONNE : sa dernière cage (elles arrivent de la plus récente à la plus ancienne).
  const vues = new Set<string>();
  const lignes: Ligne[] = [];
  for (const c of (cages.data ?? []) as Ligne[]) {
    const h = s(c.habitant_id);
    if (!h || vues.has(h) || !estCage(c.cage)) continue;
    vues.add(h);
    lignes.push(c);
  }
  // 🧵 LEURS ÉCUSSONS : leurs promesses tenues (partout : la parole ; ici : le pin) et leurs coups de cœur.
  const ids = [...vues];
  const [visibles, promis, passes, coeursDe, famille] = await Promise.all([
    prenomsVisibles(supabase, ids),
    ids.length
      ? supabase.from("clik_cage").select("habitant_id, site_id, cage, created_at").in("habitant_id", ids).in("cage", ["un-jour", "aujourdhui"]).limit(3000)
      : null,
    ids.length ? supabase.from("clik_visite").select("habitant_id, site_id, jour").in("habitant_id", ids).limit(5000) : null,
    ids.length ? supabase.from("clik_mot").select("habitant_id").in("habitant_id", ids).not("coeur_le", "is", null).limit(3000) : null,
    ids.length ? lireFamille(supabase, siteId).catch(() => null) : null,
  ]);
  const tenues = promessesTenues(
    ((promis && !promis.error ? promis.data : null) ?? []).map((c: Ligne) => ({ qui: s(c.habitant_id), site: s(c.site_id), cage: s(c.cage), le: s(c.created_at) })),
    ((passes && !passes.error ? passes.data : null) ?? []).map((v: Ligne) => ({ qui: s(v.habitant_id), site: s(v.site_id), jour: s(v.jour) })),
  );
  const ontCoeur = new Set(((coeursDe && !coeursDe.error ? coeursDe.data : null) ?? []).map((m: Ligne) => s(m.habitant_id)));
  // 💌 SON DERNIER MOT, par personne — que les autres ne voient que s'il vient de la liste, ou a eu le 💛.
  const motDe = new Map<string, Ligne>();
  for (const m of (mots.error ? [] : (mots.data ?? [])) as Ligne[]) if (!motDe.has(s(m.habitant_id))) motDe.set(s(m.habitant_id), m);
  const fantomes: FantomeVitrine[] = lignes.slice(0, 60).map((c) => {
    const h = s(c.habitant_id);
    const estMoi = Boolean(moi && moi.id === h);
    const m = motDe.get(h);
    const montre = m && (estMoi || m.liste === true || Boolean(m.coeur_le));
    const ecussons = ecussonsIci({ tenues: tenues.get(h), site: siteId, coeur: ontCoeur.has(h) });
    const numero = famille?.numeroDe(h) ?? 0;
    return {
      // Un numéro d'écran qui ne bouge pas quand un autre arrive (sinon la bulle ouverte change de personne).
      id: `f${createHash("sha256").update(`${siteId}:${h}`).digest("hex").slice(0, 12)}`,
      prenom: estMoi || visibles.get(h) !== false ? s(c.prenom) : "",
      look: lookValide(c.look) ? s(c.look) : "",
      cage: c.cage as FantomeVitrine["cage"],
      le: s(c.updated_at),
      ...(estMoi ? { moi: true } : {}),
      ...(montre ? { mot: s(m.texte) } : {}),
      ...(m && m.coeur_le ? { coeur: true } : {}),
      ...(m && s(m.cadeau) ? { cadeau: s(m.cadeau) } : {}),
      ...(ecussons.length ? { ecussons } : {}),
      ...(numero && famille ? { numero, grade: famille.gradeDe(h) } : {}),
    };
  });

  const a = ardoise.error ? null : (ardoise.data as Ligne | null);
  const duJour = a && jourParis(new Date(s(a.ecrite_le))) === jourParis() ? s(a.texte) : null;
  const prenomVisible = moi ? (await prenomsVisibles(supabase, [moi.id])).get(moi.id) !== false : true;
  // LE DERNIER COUP DE CŒUR (sept jours), avec le prénom de son auteur s'il ne l'a pas caché.
  const coeurs = ((mots.error ? [] : (mots.data ?? [])) as Ligne[]).filter((m) => m.coeur_le && Date.now() - Date.parse(s(m.coeur_le)) < 7 * 86_400_000);
  const dernier = coeurs.sort((a, b) => s(b.coeur_le).localeCompare(s(a.coeur_le)))[0];
  const auteur = dernier ? lignes.find((c) => s(c.habitant_id) === s(dernier.habitant_id)) : undefined;
  const coupDeCoeur = dernier
    ? { texte: s(dernier.texte), prenom: auteur && visibles.get(s(dernier.habitant_id)) !== false ? s(auteur.prenom) : "" }
    : null;
  const ecritAujourdhui = Boolean(moi && motDe.get(moi.id) && s(motDe.get(moi.id)?.jour).slice(0, 10) === jourParis());
  return NextResponse.json({ ok: true, fantomes, ardoise: duJour, prenomVisible, coupDeCoeur, ecritAujourdhui });
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  if (s(p?.action) !== "prenom" || typeof p?.visible !== "boolean") return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Aucun fantôme ici." }, { status: 401 });
  const { error } = await supabase.from("human_habitants").update({ prenom_vitrine: p.visible }).eq("id", moi.id);
  if (error) {
    if (migrationManquante(error.message)) return NextResponse.json({ error: "Pas encore possible. Réessaie plus tard." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
