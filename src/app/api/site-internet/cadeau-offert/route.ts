// 🎁 MON CADEAU OFFERT — voir `lib/site-internet/cadeau-offert.ts`.
//
// POST { slug, token, action: "lire" }                                        → { ok, reglages, branche }
// POST { slug, token, action: "poser", actif, nombre, quoi, duree, canaux }   → { ok, reglages, branche }
//
// QUI : le commerçant, par le jeton privé de son Espace Pro. Un métier sans
// cadeau (profession réglementée) est refusé ici aussi, pas seulement caché.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireReglagesCadeau, normaliserReglagesCadeau } from "@/lib/site-internet/cadeau-offert";
import { cadeauDuMetier } from "@/lib/site-internet/cadeau-du-metier";

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
    .select("id, pro_token, metadata, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const metier = cadeauDuMetier(s(site.activite));
  if (!metier) return NextResponse.json({ error: "Ce métier ne propose pas de cadeau." }, { status: 403 });
  const metadata = site.metadata && typeof site.metadata === "object" ? (site.metadata as Record<string, unknown>) : {};

  if (action === "lire") return NextResponse.json({ ok: true, reglages: lireReglagesCadeau(metadata, metier.branche), branche: metier.branche });
  if (action !== "poser") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });

  const reglages = normaliserReglagesCadeau({ ...p, at: new Date().toISOString() }, metier.branche);
  const base: Record<string, unknown> = { ...metadata, cadeau_offert: reglages };
  // L'ANCIENNE CLÉ DES BARS S'EFFACE une fois le réglage réécrit sous la nouvelle.
  delete base.consos_offertes;
  const { error } = await supabase.from("human_vitrine_sites").update({ metadata: base }).eq("id", s(site.id));
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true, reglages, branche: metier.branche });
}
