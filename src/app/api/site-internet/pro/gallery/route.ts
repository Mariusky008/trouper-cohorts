// Galerie gérée par le pro (Espace Pro, jeton privé). Photos compressées côté
// navigateur (data URI) → ajout / retrait / liste. Cap à 10 photos et taille par
// photo bornée. Si des photos sont présentes, la maquette les utilise à la place
// des photos Google.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const MAX_PHOTOS = 10;
const MAX_LEN = 900_000; // ~0,6 Mo par photo (data URI) — le client compresse avant.

const isPhoto = (v: unknown) => typeof v === "string" && /^data:image\/(jpe?g|png|webp);base64,/.test(v) && v.length <= MAX_LEN;

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
    .select("id, pro_token, gallery_photos")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let photos: string[] = Array.isArray(site.gallery_photos) ? (site.gallery_photos as unknown[]).filter(isPhoto).map((x) => x as string) : [];

  if (action === "add") {
    const photo = p?.photo;
    if (!isPhoto(photo)) return NextResponse.json({ error: "Image invalide ou trop lourde." }, { status: 400 });
    if (photos.length >= MAX_PHOTOS) return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos.` }, { status: 400 });
    photos = [...photos, photo as string];
    const { error } = await supabase.from("human_vitrine_sites").update({ gallery_photos: photos }).eq("id", s(site.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === "remove") {
    const i = Math.round(Number(p?.index));
    if (Number.isFinite(i) && i >= 0 && i < photos.length) {
      photos = photos.filter((_, k) => k !== i);
      const { error } = await supabase.from("human_vitrine_sites").update({ gallery_photos: photos }).eq("id", s(site.id));
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, photos });
}
