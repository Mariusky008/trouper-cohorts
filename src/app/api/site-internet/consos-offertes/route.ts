// 🎁 MES CONSOS OFFERTES — voir `lib/site-internet/consos-offertes.ts`.
//
// POST { slug, token, action: "lire" }                                → { ok, reglages }
// POST { slug, token, action: "poser", actif, nombre, quoi, duree }   → { ok, reglages }
//
// QUI : le commerçant, par le jeton privé de son Espace Pro.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireReglagesConsos, normaliserReglagesConsos } from "@/lib/site-internet/consos-offertes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export async function POST(requete: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await requete.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "lire";
  if (!/^[a-z0-9-]{2,120}$/i.test(slug) || !token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, metadata")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const metadata = site.metadata && typeof site.metadata === "object" ? (site.metadata as Record<string, unknown>) : {};

  if (action === "lire") return NextResponse.json({ ok: true, reglages: lireReglagesConsos(metadata) });
  if (action !== "poser") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });

  const reglages = normaliserReglagesConsos({ ...p, at: new Date().toISOString() });
  const { error } = await supabase
    .from("human_vitrine_sites")
    .update({ metadata: { ...metadata, consos_offertes: reglages } })
    .eq("id", s(site.id));
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true, reglages });
}
