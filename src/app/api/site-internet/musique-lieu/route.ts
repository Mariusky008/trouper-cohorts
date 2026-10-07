// 🎶 LA MUSIQUE DE SON AMBIANCE — voir `lib/site-internet/musique-du-lieu.ts`.
//
// POST { slug, token, action: "lire" }                        → { ok, musique }
// POST { slug, token, action: "poser", son, titre }           → { ok, musique }
// POST { slug, token, action: "retirer" }                     → { ok, musique: null }
//
// QUI : le commerçant, par le jeton privé de son Espace Pro. Le son arrive en
// data URL ; il est rangé dans le stockage (`rangerSon`, deux mégaoctets au
// plus) et seule son adresse entre dans la base.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rangerSon } from "@/lib/direct/ranger-photo";
import { lireMusiqueDuLieu } from "@/lib/site-internet/musique-du-lieu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

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

  if (action === "lire") return NextResponse.json({ ok: true, musique: lireMusiqueDuLieu(metadata) });

  let musique: { url: string; titre: string; at: string } | null = null;
  if (action === "poser") {
    const url = await rangerSon("musiques-clikme", slug, p?.son);
    if (!url || !/^https:\/\//i.test(url))
      return NextResponse.json({ error: "Ce son n'a pas pu être enregistré : un fichier audio (mp3, m4a, wav…) de deux mégaoctets au plus." }, { status: 400 });
    musique = { url, titre: s(p?.titre).slice(0, 60), at: new Date().toISOString() };
  } else if (action !== "retirer") {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }
  // RELU JUSTE AVANT D'ÉCRIRE : une autre clé de `metadata` a pu bouger pendant le rangement du son.
  const { data: frais } = await supabase.from("human_vitrine_sites").select("metadata").eq("id", s(site.id)).maybeSingle();
  const actuel = (frais as Record<string, unknown> | null)?.metadata;
  const base = { ...(actuel && typeof actuel === "object" ? (actuel as Record<string, unknown>) : metadata) };
  if (musique) base.musique_ambiance = musique;
  else delete base.musique_ambiance;
  const { error } = await supabase.from("human_vitrine_sites").update({ metadata: base }).eq("id", s(site.id));
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true, musique });
}
