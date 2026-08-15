// LANCER UN CLIK, DEPUIS L'ESPACE PRO.
//
// Le modèle de données et l'écran habitant existaient depuis une semaine sans
// que personne puisse créer une campagne : rien ne pouvait donc apparaître. Ce
// fichier est le maillon qui manquait.
//
// UNE CAMPAGNE CRÉE AUSSI SON ANNONCE. C'est le point le plus important ici :
// le fil accroche les Cliks aux publications (`clik_campaign.publication_id`).
// Une campagne sans annonce n'apparaîtrait nulle part — elle existerait en base
// et serait invisible, ce qui est exactement le défaut qu'on est en train de
// corriger.
//
// LES GARDE-FOUS SONT ICI, PAS DANS L'ÉCRAN. Un formulaire se contourne ; une
// route, non. Notamment : tout avantage exige une condition d'achat. Sans elle,
// le fleuriste distribue des roses à des gens qui n'achètent rien, et il arrête
// au bout de deux semaines.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { peutParticiper } from "@/lib/site-internet/collectif";
import { publier } from "@/lib/direct/publications";
import { familleDuTexte } from "@/lib/direct/famille-texte";
import { villeSlug } from "@/lib/direct/ville";
import { echeanceDuTexte } from "@/lib/direct/echeance-texte";
import { preparerFacons, ecrireFacons } from "@/lib/direct/facons-creation";
import { engagementsDuCommerce } from "@/lib/direct/engagements";
import { resumeReactions } from "@/lib/direct/reactions";
import { diagnostiquerFacons } from "@/lib/direct/diagnostic-facons";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const n = (v: unknown): number => {
  const x = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : NaN;
};

/** Un Clik ne court jamais plus d'un mois : au-delà, l'urgence qui le rend
 *  intéressant n'existe plus, et un groupe qui met trois semaines à se former
 *  n'est plus un groupe, c'est une liste d'attente. */
const DUREE_MAX_J = 30;

const migrationManquante = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "get";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, activite, city, slug, business_name")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  // Même garde déontologique que le Collectif : une profession réglementée ne
  // fait pas de prix de groupe ni de cadeaux d'accueil.
  if (!peutParticiper(s(site.activite))) {
    return NextResponse.json({ error: "Non disponible pour cette profession." }, { status: 403 });
  }
  const siteId = s(site.id);

  // ── Lire ses campagnes ────────────────────────────────────────────────────
  if (action === "get") {
    try {
      const { data } = await supabase
        .from("clik_campaign")
        .select("id, type, titre, objectif, participants, prix_initial, prix_groupe, echeance, statut, created_at")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(20);
      const lignes = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

      // Le stock restant, pour les campagnes « cadeau ». Sans lui, le
      // commerçant ne sait pas s'il lui reste des lots à honorer.
      const idsCadeau = lignes.filter((r) => s(r.type) === "cadeau").map((r) => s(r.id));
      const stock = new Map<string, { restants: number; total: number }>();
      if (idsCadeau.length) {
        const { data: rw } = await supabase.from("clik_reward").select("campagne_id, statut").in("campagne_id", idsCadeau);
        for (const r of (Array.isArray(rw) ? rw : []) as Record<string, unknown>[]) {
          const k = s(r.campagne_id);
          const e = stock.get(k) || { restants: 0, total: 0 };
          e.total += 1;
          if (s(r.statut) === "disponible") e.restants += 1;
          stock.set(k, e);
        }
      }
      return NextResponse.json({
        ok: true,
        campagnes: lignes.map((r) => ({ ...r, ...(stock.get(s(r.id)) ?? {}) })),
      });
    } catch (e) {
      // Migration non appliquée : une liste vide, pas une page en erreur.
      if (migrationManquante(String(e))) return NextResponse.json({ ok: true, campagnes: [] });
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // ── QUI VIENT, ET COMMENT LE JOINDRE ──────────────────────────────────────
  //
  // Le code donné à l'habitant (« RR-8863 ») n'existait nulle part côté
  // commerçant : il ne servait donc à rien. Et « vous serez prévenu dès que le
  // groupe est complet » était une promesse que personne ne pouvait tenir,
  // faute de contact.
  if (action === "engagements") {
    try {
      const [engagements, reactions] = await Promise.all([
        engagementsDuCommerce(supabase, siteId),
        resumeReactions(supabase, siteId),
      ]);
      return NextResponse.json({ ok: true, engagements, reactions });
    } catch (e) {
      if (migrationManquante(String(e))) return NextResponse.json({ ok: true, engagements: [], reactions: null });
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // ── POURQUOI MES FAÇONS N'APPARAISSENT PAS ────────────────────────────────
  //
  // Six causes possibles, indiscernables de l'extérieur — j'en ai déduit la
  // mauvaise faute d'avoir regardé la vraie base. Celle-ci constate au lieu de
  // supposer.
  if (action === "diagnostic") {
    try {
      const d = await diagnostiquerFacons(supabase, siteId, villeSlug(s(site.city)));
      return NextResponse.json({ ok: true, diagnostic: d });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  // ── Arrêter une campagne ──────────────────────────────────────────────────
  if (action === "arreter") {
    const id = s(p?.id);
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    try {
      // `eq(site_id)` n'est pas décoratif : sans lui, un jeton pro valide
      // permettrait d'annuler la campagne d'un autre commerce.
      const { error } = await supabase
        .from("clik_campaign")
        .update({ statut: "annulee" })
        .eq("id", id)
        .eq("site_id", siteId);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  if (action !== "creer") return NextResponse.json({ error: "action inconnue" }, { status: 400 });

  // ── Créer ─────────────────────────────────────────────────────────────────
  //
  // La validation vit dans `facons-creation` : ce parcours et celui de
  // « Faire une annonce » doivent produire exactement la même chose, et deux
  // copies de la même règle finissent toujours par diverger.
  const texte = s(p?.texte).slice(0, 140);
  if (!texte) return NextResponse.json({ error: "Écrivez ce que vous proposez." }, { status: 400 });

  const ville = s(site.city);
  if (!ville) return NextResponse.json({ error: "Votre ville n'est pas renseignée." }, { status: 400 });

  const heures = Math.min(DUREE_MAX_J * 24, Math.max(1, Math.round(n(p?.heures) || 24)));
  const finGenerale = new Date(Date.now() + heures * 3600 * 1000).toISOString();

  const prep = preparerFacons(p ?? {}, { finGenerale });
  if (!prep.ok) return NextResponse.json({ error: prep.erreur }, { status: 400 });

  try {
    // L'ANNONCE D'ABORD. Sans elle, les façons n'ont rien à quoi s'accrocher
    // dans le fil, et l'habitant ne les verrait jamais.
    //
    // Son échéance est la PLUS TARDIVE des façons : une annonce qui
    // disparaîtrait avant sa dernière porte fermerait le magasin en laissant
    // quelqu'un dedans.
    const finLaPlusTardive = prep.facons.map((f) => String(f.ligne.echeance)).sort().pop() as string;
    const pub = await publier(supabase, {
      ville,
      villeSlug: villeSlug(ville),
      famille: familleDuTexte(texte),
      texte,
      expireLe: echeanceDuTexte(texte)?.expireLe ?? finLaPlusTardive,
      // Les deux mêmes champs que l'autre parcours de publication : une seule
      // façon de renseigner ce qu'il reste, quel que soit l'écran d'où l'on part.
      reste: s(p?.reste).slice(0, 40),
      ardoise: /^https?:\/\//i.test(s(p?.ardoise)) ? s(p?.ardoise).slice(0, 500) : null,
      site: { id: siteId, slug: s(site.slug), nom: s(site.business_name), activite: s(site.activite) },
    });

    const ids = await ecrireFacons(supabase, prep.facons, {
      siteId,
      villeSlug: villeSlug(ville),
      titre: texte,
      publicationId: pub?.id ?? null,
    });
    return NextResponse.json({ ok: true, ids, publicationId: pub?.id ?? null });
  } catch (e) {
    const msg = String(e);
    if (migrationManquante(msg)) {
      return NextResponse.json({ error: "Cette fonctionnalité n'est pas encore activée sur votre espace." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
