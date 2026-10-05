// 📸 LES PHOTOS DE SON LIEU, AVEC LEUR INTITULÉ — voir `lib/site-internet/photos-du-lieu.ts`.
//
// POST { slug, token | jeton, action: "lire" }                    → { ok, photos }
// POST { slug, token | jeton, action: "poser", cle, photo }        → { ok, photos }
// POST { slug, token | jeton, action: "retirer", cle }             → { ok, photos }
//
// QUI : le commerçant, par le jeton privé de son Espace Pro (`token`) — ou,
// juste après l'inscription, par le jeton que `public-generate` vient de lui
// rendre (`jeton`), valable trois heures : c'est lui qui a rempli le
// formulaire, et il n'a pas encore d'Espace Pro.
//
// La photo arrive en data URL réduite par le navigateur ; elle est rangée
// dans le stockage (`rangerPhoto`) et seule son adresse entre dans la base.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rangerPhoto } from "@/lib/direct/ranger-photo";
import { estCleLieu, lirePhotosDuLieu } from "@/lib/site-internet/photos-du-lieu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const JETON_VIE_MS = 3 * 3600_000;

export async function POST(requete: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await requete.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const jeton = s(p?.jeton);
  const action = s(p?.action) || "lire";
  if (!/^[a-z0-9-]{2,120}$/i.test(slug) || (!token && !jeton)) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

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
  const metadata = site?.metadata && typeof site.metadata === "object" ? { ...(site.metadata as Record<string, unknown>) } : {};
  const parToken = Boolean(token && site?.pro_token && s(site.pro_token) === token);
  const neLe = Date.parse(s(metadata.jeton_photos_at));
  const parJeton = Boolean(jeton && s(metadata.jeton_photos) === jeton && Number.isFinite(neLe) && Date.now() - neLe < JETON_VIE_MS);
  if (!site || (!parToken && !parJeton)) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const photos = lirePhotosDuLieu(metadata);
  if (action === "lire") return NextResponse.json({ ok: true, photos });

  const cle = p?.cle;
  if (!estCleLieu(cle)) return NextResponse.json({ error: "Intitulé inconnu." }, { status: 400 });

  if (action === "poser") {
    const url = await rangerPhoto("lieux-clikme", `${slug}-${cle}`, p?.photo);
    if (!url || !/^https:\/\//i.test(url)) return NextResponse.json({ error: "Cette photo n'a pas pu être enregistrée. Essayez-en une autre." }, { status: 400 });
    photos[cle] = { url, at: new Date().toISOString() };
  } else if (action === "retirer") {
    delete photos[cle];
  } else {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }
  // RELU JUSTE AVANT D'ÉCRIRE : une autre clé de `metadata` a pu bouger
  // pendant le rangement de la photo.
  const { data: frais } = await supabase.from("human_vitrine_sites").select("metadata").eq("id", s(site.id)).maybeSingle();
  const actuel = (frais as Record<string, unknown> | null)?.metadata;
  const base = actuel && typeof actuel === "object" ? (actuel as Record<string, unknown>) : metadata;
  const { error } = await supabase
    .from("human_vitrine_sites")
    .update({ metadata: { ...base, photos_du_lieu: photos } })
    .eq("id", s(site.id));
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true, photos });
}
