/**
 * 🖼️ SA PHOTOTHÈQUE — la liste, l'adresse où déposer un fichier, et le retrait.
 *
 * Voir `lib/site-internet/phototheque.ts`. Le même jeton que tout l'Espace Pro
 * (celui de son lien pro) ; trois actions :
 *   · `liste`   — ses fichiers, les plus récents d'abord ;
 *   · `signer`  — une adresse signée, à usage unique, où son téléphone dépose
 *                 UN fichier (photo réduite, ou vidéo d'une minute au plus) ;
 *   · `retirer` — un de SES fichiers, et seulement un des siens.
 *
 * Le seau se crée au premier envoi s'il n'existe pas encore (lecture publique :
 * ses photos finissent dans ses annonces). Tant qu'il n'existe pas, la liste est
 * simplement vide.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_ELEMENTS,
  MAX_OCTETS_PHOTO,
  MAX_OCTETS_VIDEO,
  SEAU_PHOTOTHEQUE,
  TYPES_PHOTOTHEQUE,
  cheminASoi,
  genreDuNom,
  type ElementPhototheque,
} from "@/lib/site-internet/phototheque";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

type Supabase = ReturnType<typeof createAdminClient>;

/** Le seau, créé au premier envoi s'il n'existe pas encore. */
async function seauPret(supabase: Supabase): Promise<string | null> {
  const { data } = await supabase.storage.getBucket(SEAU_PHOTOTHEQUE);
  if (data) return null;
  const reglages = { public: true, allowedMimeTypes: Object.keys(TYPES_PHOTOTHEQUE) };
  const { error } = await supabase.storage.createBucket(SEAU_PHOTOTHEQUE, { ...reglages, fileSizeLimit: MAX_OCTETS_VIDEO });
  if (!error || /exist/i.test(error.message)) return null;
  // LA LIMITE DU PROJET PEUT ÊTRE PLUS BASSE QUE LA NÔTRE : le seau prend alors la sienne.
  const encore = await supabase.storage.createBucket(SEAU_PHOTOTHEQUE, reglages);
  return !encore.error || /exist/i.test(encore.error.message) ? null : encore.error.message;
}

/** Ses fichiers, les plus récents d'abord. Un seau absent, c'est une photothèque vide. */
async function liste(supabase: Supabase, siteId: string): Promise<ElementPhototheque[]> {
  const { data, error } = await supabase.storage
    .from(SEAU_PHOTOTHEQUE)
    .list(siteId, { limit: MAX_ELEMENTS + 50, sortBy: { column: "created_at", order: "desc" } });
  if (error || !Array.isArray(data)) return [];
  const sortie: ElementPhototheque[] = [];
  for (const f of data) {
    const genre = genreDuNom(f.name);
    if (!genre) continue;
    const chemin = `${siteId}/${f.name}`;
    const taille = Number((f.metadata as Record<string, unknown> | null)?.size ?? 0);
    sortie.push({
      chemin,
      url: supabase.storage.from(SEAU_PHOTOTHEQUE).getPublicUrl(chemin).data.publicUrl,
      genre,
      octets: Number.isFinite(taille) ? taille : 0,
      ajouteLe: f.created_at ?? null,
    });
  }
  return sortie;
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "liste";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("id, pro_token").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const siteId = s(site.id);

  if (action === "liste") {
    return NextResponse.json({ ok: true, elements: await liste(supabase, siteId), max: MAX_ELEMENTS });
  }

  if (action === "signer") {
    const type = s(p?.type).split(";")[0].toLowerCase();
    const regle = TYPES_PHOTOTHEQUE[type];
    if (!regle) return NextResponse.json({ error: "Format non accepté : une photo (JPEG, PNG, WebP) ou une vidéo (MP4, MOV, WebM)." }, { status: 400 });
    const taille = Number(p?.taille);
    if (!Number.isFinite(taille) || taille <= 0) return NextResponse.json({ error: "Fichier vide." }, { status: 400 });
    if (regle.genre === "photo" && taille > MAX_OCTETS_PHOTO) return NextResponse.json({ error: "Photo trop lourde." }, { status: 400 });
    if (regle.genre === "video" && taille > MAX_OCTETS_VIDEO) {
      return NextResponse.json({ error: "Vidéo trop lourde (50 Mo au plus) : filme plus court, une minute au plus." }, { status: 400 });
    }
    if ((await liste(supabase, siteId)).length >= MAX_ELEMENTS) {
      return NextResponse.json({ error: `Ta photothèque est pleine (${MAX_ELEMENTS}). Retire d'anciennes prises pour en ajouter.` }, { status: 400 });
    }
    const pasPret = await seauPret(supabase).catch((e: unknown) => String((e as Error)?.message ?? e));
    if (pasPret) {
      console.error("[phototheque] seau indisponible :", pasPret);
      return NextResponse.json({ error: "La photothèque n'est pas encore active ici." }, { status: 503 });
    }
    // UN NOM PAR ENVOI, JAMAIS RÉUTILISÉ.
    const chemin = `${siteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${regle.ext}`;
    const { data: signe, error } = await supabase.storage.from(SEAU_PHOTOTHEQUE).createSignedUploadUrl(chemin);
    if (error || !signe?.token) return NextResponse.json({ error: "Envoi impossible. Réessaie." }, { status: 500 });
    const url = supabase.storage.from(SEAU_PHOTOTHEQUE).getPublicUrl(chemin).data.publicUrl;
    return NextResponse.json({ ok: true, seau: SEAU_PHOTOTHEQUE, chemin: signe.path ?? chemin, jeton: signe.token, url, genre: regle.genre });
  }

  if (action === "retirer") {
    const chemin = s(p?.chemin);
    if (!cheminASoi(siteId, chemin)) return NextResponse.json({ error: "Ce fichier n'est pas dans ta photothèque." }, { status: 400 });
    const { error } = await supabase.storage.from(SEAU_PHOTOTHEQUE).remove([chemin]);
    if (error) return NextResponse.json({ error: "Retrait impossible. Réessaie." }, { status: 500 });
    return NextResponse.json({ ok: true, elements: await liste(supabase, siteId), max: MAX_ELEMENTS });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
