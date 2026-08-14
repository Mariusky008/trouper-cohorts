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
/** L'express récompense la vitesse : au-delà de trois heures, il ne récompense
 *  plus rien et devient une remise ordinaire. */
const EXPRESS_MAX_MIN = 180;

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
  //
  // UNE ANNONCE, JUSQU'À TROIS FAÇONS D'EN PROFITER. Le commerçant coche celles
  // qu'il veut proposer, et elles partagent la même annonce dans le fil. C'est
  // la comparaison des trois prix qui donne son sens à chacun : proposée seule,
  // une remise se lit comme une promotion ; proposées ensemble, elles se lisent
  // comme un échange — payer moins contre venir vite, ou à plusieurs.
  const texte = s(p?.texte).slice(0, 140);
  if (!texte) return NextResponse.json({ error: "Écrivez ce que vous proposez." }, { status: 400 });

  const ville = s(site.city);
  if (!ville) return NextResponse.json({ error: "Votre ville n'est pas renseignée." }, { status: 400 });

  const heures = Math.min(DUREE_MAX_J * 24, Math.max(1, Math.round(n(p?.heures) || 24)));
  const finGenerale = new Date(Date.now() + heures * 3600 * 1000).toISOString();
  const prixNormal = n(p?.prixNormal);
  if (!Number.isFinite(prixNormal) || prixNormal <= 0) {
    return NextResponse.json({ error: "Indiquez votre prix habituel." }, { status: 400 });
  }

  // Chaque façon est validée AVANT toute écriture : on ne veut pas d'une
  // annonce publiée dans la ville alors que la deuxième façon sera refusée.
  type Facon = { ligne: Record<string, unknown>; lots: Array<{ libelle: string; condition_achat: string }> };
  const facons: Facon[] = [];
  const base = {
    site_id: siteId,
    ville_slug: villeSlug(ville),
    titre: texte,
    statut: "active",
    prix_initial: prixNormal,
  };

  // ① LE CADEAU — prix normal, plus un avantage. Il ne coûte rien sur le prix.
  if (p?.cadeau) {
    const quantite = Math.round(n(p?.cadeauQuantite));
    const libelle = s(p?.cadeauLibelle).slice(0, 120);
    const condition = s(p?.cadeauCondition).slice(0, 120);
    if (!Number.isFinite(quantite) || quantite < 1 || quantite > STOCK_MAX) {
      return NextResponse.json({ error: `Le cadeau : indiquez combien, entre 1 et ${STOCK_MAX}.` }, { status: 400 });
    }
    if (!libelle) return NextResponse.json({ error: "Le cadeau : dites ce que les premiers reçoivent." }, { status: 400 });
    // LA RÈGLE QUI REND L'OPÉRATION TENABLE, tenue aussi par un `NOT NULL` en
    // base : sans condition d'achat, on donne à des gens qui n'achètent rien.
    if (!condition) {
      return NextResponse.json({ error: "Le cadeau : indiquez à partir de quel achat il s'applique." }, { status: 400 });
    }
    facons.push({
      ligne: { ...base, type: "cadeau", ordre: 0, echeance: finGenerale },
      lots: Array.from({ length: quantite }, () => ({ libelle, condition_achat: condition })),
    });
  }

  // ② L'EXPRESS — prix réduit contre la vitesse. Sa fenêtre est COURTE par
  //    nature : un express valable jusqu'à demain ne récompense plus rien.
  if (p?.express) {
    const prix = n(p?.expressPrix);
    const minutes = Math.min(EXPRESS_MAX_MIN, Math.max(10, Math.round(n(p?.expressMinutes) || 60)));
    if (!Number.isFinite(prix) || prix <= 0) {
      return NextResponse.json({ error: "L'express : indiquez le prix réduit." }, { status: 400 });
    }
    if (prix >= prixNormal) {
      return NextResponse.json({ error: "L'express : le prix doit être inférieur à votre prix habituel." }, { status: 400 });
    }
    facons.push({
      ligne: {
        ...base, type: "express", ordre: 1, prix_groupe: prix,
        echeance: new Date(Date.now() + minutes * 60_000).toISOString(),
      },
      lots: [],
    });
  }

  // ③ LA TABLE À PARTAGER — le prix le plus bas contre le nombre.
  if (p?.partage) {
    const objectif = Math.round(n(p?.partageObjectif));
    const prix = n(p?.partagePrix);
    if (!Number.isFinite(objectif) || objectif < OBJECTIF_MIN || objectif > OBJECTIF_MAX) {
      return NextResponse.json({ error: `La table à partager : entre ${OBJECTIF_MIN} et ${OBJECTIF_MAX} personnes.` }, { status: 400 });
    }
    if (!Number.isFinite(prix) || prix <= 0 || prix >= prixNormal) {
      return NextResponse.json({ error: "La table à partager : le prix doit être inférieur à votre prix habituel." }, { status: 400 });
    }
    facons.push({
      ligne: { ...base, type: "collectif", ordre: 2, objectif, prix_groupe: prix, echeance: finGenerale },
      lots: [],
    });
  }

  if (!facons.length) {
    return NextResponse.json({ error: "Choisissez au moins une façon d'en profiter." }, { status: 400 });
  }

  try {
    // L'ANNONCE D'ABORD. Sans elle, les façons n'ont rien à quoi s'accrocher
    // dans le fil, et l'habitant ne les verrait jamais.
    //
    // Son échéance est la PLUS TARDIVE des façons : une annonce qui
    // disparaîtrait avant sa dernière porte fermerait le magasin en laissant
    // quelqu'un dedans.
    const finLaPlusTardive = facons
      .map((f) => String(f.ligne.echeance))
      .sort()
      .pop() as string;
    const pub = await publier(supabase, {
      ville,
      villeSlug: villeSlug(ville),
      famille: familleDuTexte(texte),
      texte,
      expireLe: echeanceDuTexte(texte)?.expireLe ?? finLaPlusTardive,
      site: { id: siteId, slug: s(site.slug), nom: s(site.business_name), activite: s(site.activite) },
    });

    const { data, error } = await supabase
      .from("clik_campaign")
      .insert(facons.map((f) => ({ ...f.ligne, publication_id: pub?.id ?? null })))
      .select("id, type, ordre");
    if (error) throw new Error(error.message);
    const creees = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
    if (!creees.length) throw new Error("campagnes non créées");

    // LE STOCK DU CADEAU, mélangé avant d'être écrit.
    // La séquence est figée à la création puis distribuée dans l'ordre : le
    // serveur ne choisit rien au moment du clic, ce qui rend la distribution
    // vérifiable et interdit tout favoritisme. Avec des lots identiques le
    // mélange ne change rien — il compte le jour où ils différeront, et il vaut
    // mieux qu'il soit déjà là que rajouté après coup.
    const lignesLots: Array<Record<string, unknown>> = [];
    for (const f of facons) {
      if (!f.lots.length) continue;
      const cible = creees.find((c) => s(c.type) === s(f.ligne.type));
      if (!cible) continue;
      const melange = [...f.lots];
      for (let i = melange.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [melange[i], melange[j]] = [melange[j], melange[i]];
      }
      melange.forEach((l, i) =>
        lignesLots.push({ campagne_id: s(cible.id), position: i, libelle: l.libelle, condition_achat: l.condition_achat })
      );
    }
    if (lignesLots.length) {
      const { error: e2 } = await supabase.from("clik_reward").insert(lignesLots);
      if (e2) throw new Error(e2.message);
    }

    return NextResponse.json({ ok: true, ids: creees.map((c) => s(c.id)), publicationId: pub?.id ?? null });
  } catch (e) {
    const msg = String(e);
    if (migrationManquante(msg)) {
      return NextResponse.json({ error: "Cette fonctionnalité n'est pas encore activée sur votre espace." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
