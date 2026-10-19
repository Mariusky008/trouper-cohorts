/**
 * 🎬 SON INTERVIEW PART EN LIGNE — l'adresse où son téléphone la dépose.
 *
 * « Envoyer l'interview dans Le Direct et en Reels Instagram et Facebook. »
 * Le montage est fait par son téléphone (`interview-montage.ts`) : une à deux
 * minutes de vidéo, donc dix à quarante mégaoctets. Une requête vers le site
 * ne tient pas plus de 4,5 Mo (la limite de Vercel) : la vidéo ne passe donc
 * PAS par ici. Cette route vérifie son jeton pro et rend une ADRESSE SIGNÉE,
 * à usage unique, où son téléphone dépose le fichier directement dans notre
 * stockage. Puis l'annonce part par le chemin de toutes les annonces
 * (`/api/site-internet/pro/offer`, avec `video`), qui ne joue que des vidéos
 * de NOTRE stockage.
 *
 * UN SEAU À ELLE, `interviews` : celui des annonces (`annonces`) s'arrête à
 * dix mégaoctets, et c'est voulu — « au-delà, ce n'est plus une annonce de
 * quinze secondes ». Il se crée tout seul au premier envoi (la migration
 * `20261018120000_interviews_video.sql` dit la même chose, pour mémoire).
 * Lecture publique : la vidéo est lue par Le Direct, et par Instagram qui
 * vient la chercher.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

const SEAU_INTERVIEWS = "interviews";
/** Quarante mégaoctets pour le montage (voir `debitDuMontage`), un peu de marge au-dessus. */
const MAX_OCTETS = 50 * 1024 * 1024;
const TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };

type Supabase = ReturnType<typeof createAdminClient>;

/** Le seau, créé au premier envoi s'il n'existe pas encore. */
async function seauPret(supabase: Supabase): Promise<string | null> {
  const { data } = await supabase.storage.getBucket(SEAU_INTERVIEWS);
  if (data) return null;
  const reglages = { public: true, allowedMimeTypes: Object.keys(TYPES) };
  const { error } = await supabase.storage.createBucket(SEAU_INTERVIEWS, { ...reglages, fileSizeLimit: MAX_OCTETS });
  if (!error || /exist/i.test(error.message)) return null;
  // LA LIMITE DU PROJET PEUT ÊTRE PLUS BASSE QUE LA NÔTRE : le seau prend alors la sienne.
  const encore = await supabase.storage.createBucket(SEAU_INTERVIEWS, reglages);
  return !encore.error || /exist/i.test(encore.error.message) ? null : encore.error.message;
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = s(p?.slug);
  const token = s(p?.token);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });
  const type = s(p?.type).split(";")[0].toLowerCase();
  const ext = TYPES[type];
  if (!ext) return NextResponse.json({ error: "Format non accepté (mp4 ou webm)." }, { status: 400 });
  const taille = Number(p?.taille);
  if (!Number.isFinite(taille) || taille <= 0) return NextResponse.json({ error: "Vidéo vide." }, { status: 400 });
  if (taille > MAX_OCTETS) return NextResponse.json({ error: "Vidéo trop lourde (50 Mo au plus) : refais-la plus courte." }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("id, pro_token").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const pasPret = await seauPret(supabase).catch((e: unknown) => String((e as Error)?.message ?? e));
  if (pasPret) {
    console.error("[interview] seau indisponible :", pasPret);
    return NextResponse.json({ error: "L'envoi des interviews n'est pas encore actif ici." }, { status: 503 });
  }
  // UN NOM PAR ENVOI, JAMAIS RÉUTILISÉ — comme les vidéos d'annonces.
  const chemin = `${s(site.id)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data: signe, error } = await supabase.storage.from(SEAU_INTERVIEWS).createSignedUploadUrl(chemin);
  if (error || !signe?.token) return NextResponse.json({ error: "Envoi impossible. Réessaie." }, { status: 500 });
  const url = supabase.storage.from(SEAU_INTERVIEWS).getPublicUrl(chemin).data.publicUrl;
  return NextResponse.json({ ok: true, seau: SEAU_INTERVIEWS, chemin: signe.path ?? chemin, jeton: signe.token, url });
}
