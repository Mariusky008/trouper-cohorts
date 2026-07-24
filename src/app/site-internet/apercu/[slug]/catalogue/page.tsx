// « Le catalogue » en page AUTONOME, partageable par le commerçant à ses clients.
// Même deck à swiper que dans la maquette (photos + offre), en plein écran sombre.
// Lien : /site-internet/apercu/{slug}/catalogue
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PhotoDeck } from "../photo-deck";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => String(v ?? "").trim();
const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("business_name, city, activite, google_rating, google_reviews, diagnostic, gallery_photos, current_offer, metadata")
    .eq("slug", slug)
    .maybeSingle();
  const row = data as Record<string, unknown> | null;
  if (!row) return null;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const proPhotos = (Array.isArray(row.gallery_photos) ? row.gallery_photos : []).map(str).filter((u) => /^data:image\//i.test(u)).slice(0, 12);
  const googlePhotos = (Array.isArray(diag.photos) ? diag.photos : []).map(str).filter((u) => /^https?:\/\//i.test(u)).slice(0, 12);
  const photos = proPhotos.length ? proPhotos : googlePhotos;
  const videos = (Array.isArray(meta.gallery_videos) ? meta.gallery_videos : []).map(str).filter((u) => /^https?:\/\//i.test(u)).slice(0, 6);
  const rawOffer = row.current_offer && typeof row.current_offer === "object" ? (row.current_offer as Record<string, unknown>) : null;
  const offText = rawOffer ? str(rawOffer.text) : "";
  const until = rawOffer && typeof rawOffer.until === "string" ? rawOffer.until : null;
  const offer = offText && !(until && Date.parse(until) < Date.now()) ? { text: offText } : null;
  const nom = str(row.business_name) || "Ce commerce";
  const ville = capWords(str(row.city));
  const metier = capWords(str(row.activite) || "Commerce");
  return {
    nom,
    metierLabel: [metier, ville].filter(Boolean).join(" · "),
    photos,
    videos,
    offer,
    note: typeof row.google_rating === "number" ? String(row.google_rating).replace(".", ",") : null,
    reviewsCount: typeof row.google_reviews === "number" ? row.google_reviews : null,
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const d = await load(slug).catch(() => null);
  const nom = d?.nom || "Catalogue";
  const title = `${nom} — le catalogue à swiper`;
  const description = `Découvrez ${nom} en images, et l'offre du moment. Swipez 💚`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function CataloguePage({ params }: Params) {
  const { slug } = await params;
  const d = await load(slug).catch(() => null);
  if (!d || (d.photos.length === 0 && d.videos.length === 0)) notFound();
  return (
    <main style={{ background: "#0B0D12", minHeight: "100dvh" }}>
      <PhotoDeck
        slug={slug}
        photos={d.photos}
        videos={d.videos}
        nom={d.nom}
        metierLabel={d.metierLabel}
        note={d.note}
        reviewsCount={d.reviewsCount}
        offer={d.offer}
        accent="#00E0A0"
        standalone
      />
    </main>
  );
}
