// 👻 SA FAMILLE, AU COMPTOIR (jeton pro) — l'écran « Ma famille » et la carte en tête de l'accueil.
//
// « lire » : la foule d'aujourd'hui et le record à battre, les nouveaux du jour, combien en bronze,
// en argent, en or, ses fidèles (l'or puis l'argent), son parcours des sept derniers jours (sa page
// ouverte → une cage ouverte → venus pour de vrai), les petits mots d'aujourd'hui et d'hier, et le
// mot du jour. Jamais d'identifiant de personne : des prénoms, des numéros, des fantômes.
//
// « epingler » {id} : ce petit mot devient le mot du jour, en haut de sa page publique (`id` vide :
// il le retire). Un par jour. Voir `lib/direct/famille-serveur.ts`.
//
// 🔔 « bon-plan » {texte, duree} : « Il me reste des tables » — ses fantômes d'or le voient tout de
// suite, l'argent puis le bronze après (`OUVERTURE_BON_PLAN`) ; il remplace celui d'avant.
// « bon-plan-retirer » : c'est complet. Jamais d'alcool (loi Évin).
// 🎁 « gate » {quoi, combien} : ce qu'il peut offrir à sa famille ce mois-ci.
// 🎬 « video » : la famille d'hier pour la fin de ses vidéos — les fantômes, le record ; le prénom, le
// numéro et le petit mot seulement de ceux qui l'ont accepté (`familleDeLaVideo`). Seulement pour un client
// (`est_client`) : sans elle, ses vidéos se montent comme avant.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  epinglerMot,
  familleAuComptoir,
  familleDeLaVideo,
  fixerGate,
  fixerSurprises,
  publierBonPlan,
  retirerBonPlan,
  servirSurprise,
  surprisesDuJour,
  surprisesPrises,
} from "@/lib/direct/famille-serveur";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { tenueDu } from "@/lib/direct/double-metiers";
import { estDureeBonPlan } from "@/lib/direct/famille";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "lire";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase.from("human_vitrine_sites").select("id, pro_token, business_name, activite, est_client").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const siteId = s(site.id);

  if (action === "lire") return NextResponse.json({ ok: true, ...(await familleAuComptoir(supabase, siteId)) });

  if (action === "video") {
    // Sa page de la famille n'existe que pour un client : pas de fin de vidéo qui mène à une page introuvable.
    if (site.est_client !== true) return NextResponse.json({ error: "Sa page de la famille n’est pas encore ouverte." }, { status: 404 });
    const metier = s(site.activite);
    const branche = brancheDuMetier(metier);
    const hote = `${tenueDu({ branche, metier })?.enPied ?? "/direct/double/pied/"}salut-1.webp`;
    return NextResponse.json({ ok: true, ...(await familleDeLaVideo(supabase, siteId, { nom: s(site.business_name), slug, branche, hote })) });
  }

  // 🎁 LA SURPRISE DU CHEF : « surprises » {liste: [{libelle, stock}]} les écrit (et remplace) ; « surprises-lire » ;
  // « surprise-servie » {code} : le bon est servi (une venue, une seule fois, aujourd'hui).
  if (action === "surprises" || action === "surprises-lire" || action === "surprise-servie") {
    let servie: Awaited<ReturnType<typeof servirSurprise>> | null = null;
    if (action === "surprises") {
      const ennui = await fixerSurprises(supabase, siteId, p?.liste);
      if (ennui) return NextResponse.json({ error: ennui }, { status: /pas encore activées/.test(ennui) ? 503 : 400 });
    }
    if (action === "surprise-servie") {
      servie = await servirSurprise(supabase, siteId, s(p?.code));
      if (servie.ennui) return NextResponse.json({ error: servie.ennui }, { status: /pas encore activées/.test(servie.ennui) ? 503 : /Déjà/.test(servie.ennui) ? 409 : 404 });
    }
    const [{ actif, liste }, prises] = await Promise.all([surprisesDuJour(supabase, siteId), surprisesPrises(supabase, siteId)]);
    return NextResponse.json({ ok: true, actif, surprises: liste.map(({ libelle, stock, pris }) => ({ libelle, stock, pris })), prises, ...(servie ? { servie } : {}) });
  }

  if (action === "epingler") {
    const id = s(p?.id);
    if (id && !UUID.test(id)) return NextResponse.json({ error: "Ce mot n’existe pas." }, { status: 400 });
    const ennui = await epinglerMot(supabase, siteId, id);
    if (ennui) return NextResponse.json({ error: ennui }, { status: /pas encore activé/.test(ennui) ? 503 : 400 });
    return NextResponse.json({ ok: true, ...(await familleAuComptoir(supabase, siteId)) });
  }

  if (action === "bon-plan" || action === "bon-plan-retirer" || action === "gate") {
    let ennui: string | null;
    if (action === "bon-plan") {
      const duree = p?.duree;
      if (!estDureeBonPlan(duree)) return NextResponse.json({ error: "Pour combien de temps ?" }, { status: 400 });
      ennui = await publierBonPlan(supabase, siteId, s(p?.texte), duree);
    } else if (action === "bon-plan-retirer") {
      ennui = await retirerBonPlan(supabase, siteId);
    } else {
      ennui = await fixerGate(supabase, siteId, s(p?.quoi), Number(p?.combien));
    }
    if (ennui) return NextResponse.json({ error: ennui }, { status: /pas encore activé/.test(ennui) ? 503 : 400 });
    return NextResponse.json({ ok: true, ...(await familleAuComptoir(supabase, siteId)) });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
