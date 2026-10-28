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
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { epinglerMot, familleAuComptoir, fixerGate, publierBonPlan, retirerBonPlan } from "@/lib/direct/famille-serveur";
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
  const { data: row } = await supabase.from("human_vitrine_sites").select("id, pro_token").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const siteId = s(site.id);

  if (action === "lire") return NextResponse.json({ ok: true, ...(await familleAuComptoir(supabase, siteId)) });

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
