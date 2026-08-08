// Envoi d'une vidéo d'annonce depuis le téléphone du commerçant.
//
// Le fichier part dans le seau `annonces` (Supabase Storage), jamais en base :
// une vidéo en `data:` dans une colonne JSON alourdirait chaque lecture de fiche
// pour tout le monde, y compris ceux qui ne la regarderont jamais.
//
// La durée est vérifiée CÔTÉ CLIENT (le navigateur sait lire la durée d'un
// fichier vidéo, pas le serveur sans outil dédié). Le serveur, lui, tient les
// deux garde-fous qu'il peut tenir seul : le poids et le type. C'est suffisant —
// un fichier de 10 Mo au bon format reste un fichier qu'on peut servir, quelle
// que soit sa durée.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const s = (v: unknown) => String(v ?? "").trim();

const MAX_OCTETS = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envoi illisible." }, { status: 400 });
  }

  const slug = s(form.get("slug"));
  const token = s(form.get("token"));
  const file = form.get("video");
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucune vidéo reçue." }, { status: 400 });

  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Format non accepté (mp4, webm ou mov)." }, { status: 400 });
  if (file.size > MAX_OCTETS) {
    return NextResponse.json(
      { error: "Vidéo trop lourde (10 Mo maximum). Filmez plus court, ou en qualité inférieure." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Un nom par envoi, jamais réutilisé : remplacer un fichier en place
  // laisserait l'ancienne vidéo dans les caches et les aperçus déjà partagés,
  // et on afficherait une annonce avec la vidéo de la précédente.
  const chemin = `${s(site.id)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const { error } = await supabase.storage.from("annonces").upload(chemin, file, {
      contentType: file.type,
      // Un an : ces fichiers ne changent jamais, leur nom est unique. Sans ça,
      // la vidéo serait retéléchargée à chaque affichage de la carte.
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/bucket|not found/i.test(msg)) {
      return NextResponse.json({ error: "L'envoi de vidéos n'est pas encore actif ici." }, { status: 503 });
    }
    return NextResponse.json({ error: "Envoi impossible. Réessayez." }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("annonces").getPublicUrl(chemin);
  return NextResponse.json({ ok: true, url: pub?.publicUrl ?? "" });
}
