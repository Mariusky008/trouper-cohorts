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
/** Bornes du groupe. En dessous de deux, ce n'est pas un collectif ; au-delà de
 *  cinquante, aucun commerce de centre-ville ne peut absorber la vague. */
const OBJECTIF_MIN = 2;
const OBJECTIF_MAX = 50;
/** Un stock d'avantages reste un geste, pas un catalogue de bons. */
const STOCK_MAX = 200;

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
  const type = s(p?.type) === "cadeau" ? "cadeau" : "collectif";
  const texte = s(p?.texte).slice(0, 140);
  if (!texte) return NextResponse.json({ error: "Écrivez ce que vous proposez." }, { status: 400 });

  const jours = Math.min(DUREE_MAX_J, Math.max(1, Math.round(n(p?.jours) || 7)));
  const echeance = new Date(Date.now() + jours * 24 * 3600 * 1000).toISOString();

  const ville = s(site.city);
  if (!ville) return NextResponse.json({ error: "Votre ville n'est pas renseignée." }, { status: 400 });

  // La validation d'abord, l'écriture ensuite : on ne veut pas d'une annonce
  // publiée dans la ville alors que la campagne sera refusée deux lignes plus bas.
  let champs: Record<string, unknown>;
  let lots: Array<{ libelle: string; condition_achat: string }> = [];

  if (type === "collectif") {
    const objectif = Math.round(n(p?.objectif));
    const prixInitial = n(p?.prixInitial);
    const prixGroupe = n(p?.prixGroupe);
    if (!Number.isFinite(objectif) || objectif < OBJECTIF_MIN || objectif > OBJECTIF_MAX) {
      return NextResponse.json({ error: `Le groupe doit compter entre ${OBJECTIF_MIN} et ${OBJECTIF_MAX} personnes.` }, { status: 400 });
    }
    if (!Number.isFinite(prixInitial) || !Number.isFinite(prixGroupe) || prixInitial <= 0) {
      return NextResponse.json({ error: "Indiquez le prix habituel et le prix de groupe." }, { status: 400 });
    }
    if (prixGroupe >= prixInitial) {
      return NextResponse.json({ error: "Le prix de groupe doit être inférieur au prix habituel." }, { status: 400 });
    }
    champs = { objectif, prix_initial: prixInitial, prix_groupe: prixGroupe };
  } else {
    const quantite = Math.round(n(p?.quantite));
    const libelle = s(p?.libelle).slice(0, 120);
    const condition = s(p?.conditionAchat).slice(0, 120);
    if (!Number.isFinite(quantite) || quantite < 1 || quantite > STOCK_MAX) {
      return NextResponse.json({ error: `Indiquez combien d'avantages, entre 1 et ${STOCK_MAX}.` }, { status: 400 });
    }
    if (!libelle) return NextResponse.json({ error: "Dites ce que les premiers reçoivent." }, { status: 400 });
    // LA RÈGLE QUI REND L'OPÉRATION TENABLE. Elle est aussi `NOT NULL` en base :
    // deux verrous pour la seule chose qui empêche un commerce de se ruiner en
    // cadeaux à des gens qui n'achètent rien.
    if (!condition) {
      return NextResponse.json({ error: "Indiquez à partir de quel achat l'avantage s'applique." }, { status: 400 });
    }
    champs = {};
    lots = Array.from({ length: quantite }, () => ({ libelle, condition_achat: condition }));
  }

  try {
    // ① L'ANNONCE D'ABORD. Sans elle, la campagne n'a rien à quoi s'accrocher
    //    dans le fil, et l'habitant ne la verrait jamais.
    //
    //    L'échéance de l'annonce suit celle de la campagne : une annonce qui
    //    survivrait à son Clik enverrait sur un écran « c'est fini ».
    const pub = await publier(supabase, {
      ville,
      villeSlug: villeSlug(ville),
      famille: familleDuTexte(texte),
      texte,
      expireLe: echeanceDuTexte(texte)?.expireLe ?? echeance,
      site: { id: siteId, slug: s(site.slug), nom: s(site.business_name), activite: s(site.activite) },
    });

    const { data, error } = await supabase
      .from("clik_campaign")
      .insert({
        site_id: siteId,
        publication_id: pub?.id ?? null,
        ville_slug: villeSlug(ville),
        type,
        titre: texte,
        echeance,
        statut: "active",
        ...champs,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const campagneId = s((data as Record<string, unknown> | null)?.id);
    if (!campagneId) throw new Error("campagne non créée");

    // ② LE STOCK, mélangé avant d'être écrit.
    //    La séquence est figée à la création puis distribuée dans l'ordre : le
    //    serveur ne choisit rien au moment du clic, ce qui rend la distribution
    //    vérifiable et interdit tout favoritisme. Avec des lots identiques le
    //    mélange ne change rien — il compte le jour où ils différeront, et il
    //    vaut mieux qu'il soit déjà là que rajouté après coup.
    if (lots.length) {
      const melange = [...lots];
      for (let i = melange.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [melange[i], melange[j]] = [melange[j], melange[i]];
      }
      const { error: e2 } = await supabase.from("clik_reward").insert(
        melange.map((l, i) => ({ campagne_id: campagneId, position: i, libelle: l.libelle, condition_achat: l.condition_achat }))
      );
      if (e2) throw new Error(e2.message);
    }

    return NextResponse.json({ ok: true, id: campagneId, publicationId: pub?.id ?? null });
  } catch (e) {
    const msg = String(e);
    if (migrationManquante(msg)) {
      return NextResponse.json({ error: "Cette fonctionnalité n'est pas encore activée sur votre espace." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
