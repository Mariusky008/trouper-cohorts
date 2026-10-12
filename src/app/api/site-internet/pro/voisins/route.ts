// 🏘️ MES VOISINS — les deux commerces que le commerçant présente dans sa rue.
//
// « Vous ou le commerçant pourriez les changer depuis l'admin : il sait qui il
// apprécie dans sa rue. » Sans choix de sa part, ce sont les deux plus proches
// (voir `lib/direct/voisins.ts`).
//
//   POST { slug, token, action: "get" }               → les commerces ClikMe autour, et ses choix ;
//   POST { slug, token, action: "set", voisins: [] }  → ses deux voisins (vide : les plus proches).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lesProches } from "@/lib/direct/voisins-serveur";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });
  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("id, pro_token, metadata").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  // Même réponse pour « commerce inconnu » et « mauvais jeton ».
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const autour = await lesProches(slug);
  if (!autour) return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });

  if (p?.action === "set") {
    const permis = new Set(autour.proches.map((x) => x.id));
    const voisins = (Array.isArray(p.voisins) ? p.voisins : []).map(s).filter((x) => permis.has(x));
    const choisis = [...new Set(voisins)].slice(0, 2);
    const meta = (site.metadata && typeof site.metadata === "object" ? site.metadata : {}) as Record<string, unknown>;
    const m = { ...meta };
    if (choisis.length) m.voisins = choisis;
    else delete m.voisins;
    const { error } = await supabase.from("human_vitrine_sites").update({ metadata: m }).eq("id", s(site.id));
    if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    return NextResponse.json({ ok: true, proches: autour.proches, choisis });
  }

  return NextResponse.json({ ok: true, ...autour });
}
