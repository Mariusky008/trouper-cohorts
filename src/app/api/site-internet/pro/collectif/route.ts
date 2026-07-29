// Participation au Collectif (Espace Pro, jeton privé). Actions "get" / "set".
//
// Réciprocité : qui ne partage pas ne reçoit pas. Se retirer, c'est à la fois ne
// plus apparaître chez les autres et ne plus afficher leurs annonces — c'est dit
// explicitement dans l'interface, pas caché dans des conditions.
//
// Garde-fou déonto : réservé au commerce. Une profession réglementée ne peut pas
// diffuser d'annonce chez des tiers, même en le demandant.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { peutParticiper } from "@/lib/site-internet/collectif";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const migrationMissing = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);

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
    .select("id, pro_token, activite, city")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  if (!peutParticiper(s(site.activite))) {
    return NextResponse.json({ error: "Non disponible pour cette profession." }, { status: 403 });
  }

  let actif = true;
  if (action === "set") {
    actif = p?.actif !== false;
    const { error } = await supabase
      .from("human_vitrine_sites")
      .update({ collectif_actif: actif })
      .eq("id", s(site.id));
    if (error) {
      return NextResponse.json(
        { error: migrationMissing(error.message) ? "La colonne n'est pas encore en place." : error.message },
        { status: 500 }
      );
    }
  } else {
    try {
      const { data, error } = await supabase
        .from("human_vitrine_sites")
        .select("collectif_actif")
        .eq("id", s(site.id))
        .maybeSingle();
      if (error) throw new Error(error.message);
      const r = (data as Record<string, unknown> | null) ?? null;
      if (r && r.collectif_actif === false) actif = false;
    } catch {
      /* colonne non migrée → participation par défaut */
    }
  }

  // Combien de commerces publiés dans la même ville : un ordre de grandeur RÉEL,
  // pour que le commerçant sache ce que sa participation vaut aujourd'hui.
  let voisins = 0;
  try {
    const { count } = await supabase
      .from("human_vitrine_sites")
      .select("id", { count: "exact", head: true })
      .eq("channel", "letter")
      .eq("city", s(site.city))
      .eq("published", true)
      .neq("id", s(site.id));
    if (typeof count === "number") voisins = count;
  } catch {
    /* best-effort */
  }

  return NextResponse.json({ ok: true, actif, voisins, ville: s(site.city) });
}
