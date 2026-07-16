// Maquette publique révélée par le QR de la lettre (le levier de conversion n°1).
// Data-loader : lit les données Google réelles du prospect + résout son PROFIL,
// puis rend la maquette UNIFIÉE (composant MaquetteSante) qui s'adapte au profil
// (A commerce / B santé praticité / C santé encadrée) — palette, avis, contact.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { resolveMetierContent } from "@/lib/site-internet/metier-content";
import { bookingPlatformName } from "@/lib/site-internet/directories";
import { MaquetteSante } from "./maquette-sante";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

// Aperçu de partage (WhatsApp, SMS, réseaux) PROPRE à la maquette — sinon la page
// héritait de l'Open Graph racine (« Popey — le club des bons plans… »). Non
// indexée (maquette privée), mais l'aperçu de partage reste soigné.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const noindex = { robots: { index: false, follow: false } };
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city, activite, diagnostic")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (!row) return { title: "Votre nouveau site", ...noindex };
    const nom = str(row.business_name) || "Votre commerce";
    const ville = str(row.city);
    const title = `${nom} — votre nouveau site`;
    const description = `La maquette du site de ${nom}${ville ? ` à ${ville}` : ""} : prise de rendez-vous, avis, et un assistant qui répond pour vous.`;
    // L'image de partage est fournie par opengraph-image.tsx (carte générée).
    return {
      title,
      description,
      ...noindex,
      openGraph: { title, description, type: "website" },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "Votre nouveau site", ...noindex };
  }
}

export default async function ApercuMaquette({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, address, google_rating, google_reviews, google_place_id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Lien introuvable</h1>
          <p style={{ color: "#666" }}>Ce lien n&apos;est plus valide. Contactez-nous directement.</p>
        </div>
      </main>
    );
  }

  // Tracking du scan (première fois).
  try {
    await supabase
      .from("human_vitrine_sites")
      .update({ contact_scanned_at: new Date().toISOString() })
      .eq("id", str(row.id))
      .is("contact_scanned_at", null);
  } catch {
    /* best-effort */
  }

  const nom = str(row.business_name) || "Votre commerce";
  const ville = str(row.city);
  const activite = str(row.activite) || "Commerce";
  const adresse = str(row.address);
  const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
  const villeAff = capWords(ville);
  const metierSing = activite.trim().toLowerCase().replace(/s$/u, "") || "professionnel";
  const rating = typeof row.google_rating === "number" ? row.google_rating : null;
  const reviews = typeof row.google_reviews === "number" ? row.google_reviews : null;

  // ── Profil métier : pilote ce que le site a le DROIT d'afficher ─────────────
  const mp = resolveMetier(activite);
  const profil = mp.profil;
  const termePublic = mp.entry?.terme || mp.def.terme_public;
  const avisShow = mp.def.avis_affichage; // afficher les avis existants (A, B)
  const avisHarvest = mp.def.avis_sollicitation; // récolte active (A seul)
  const avisMode: "prominent" | "doux" | "none" = avisHarvest ? "prominent" : avisShow ? "doux" : "none";
  const waAllowed = mp.def.contacts.includes("WhatsApp"); // WhatsApp = profil A seulement
  // Palette par profil (calée sur les références).
  const accent = profil === "A" ? "#8A4A3B" : profil === "B" ? "#2C5A6E" : "#2E4A3C";
  const accentSoft = profil === "A" ? "#F3E7E2" : profil === "B" ? "#E3EDF1" : "#E9F0EA";
  const showUrgence = mp.entry?.encartUrgence ?? false; // encart urgence (psychisme), découplé
  const confirmation = mp.entry?.confirmation ?? "reserve";
  const moteur = mp.entry?.moteur ?? "M1_acquisition";
  const busyWord = confirmation === "reserve" ? "en séance" : "en intervention";

  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;

  // Contenus RÉELS de la fiche Google.
  const photos = (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 6);
  const reviewsTop = (Array.isArray(diag.reviews_top) ? diag.reviews_top : [])
    .map((r) => (typeof r === "object" && r ? (r as Record<string, unknown>) : {}))
    .map((r) => ({ name: str(r.name), text: str(r.text), stars: typeof r.stars === "number" ? (r.stars as number) : null }))
    .filter((r) => r.text.length > 0)
    .slice(0, 3);

  const waDigits = (process.env.SITE_LETTER_WHATSAPP || "").replace(/\D/g, "");
  const phoneDisplay = process.env.SITE_LETTER_PHONE || "";
  const telHref = waDigits ? `tel:+${waDigits}` : "";
  const waHref = waAllowed && waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Bonjour, j'ai vu la maquette pour ${nom}, elle me plaît !`)}` : "";
  // Réservation en ligne existante (profil B) — lien Doctolib/Maiia détecté au diagnostic.
  const dirUrl = str(diag.directory_url);
  const doctolibHref = profil === "B" && bookingPlatformName(dirUrl) ? dirUrl : "";
  const mapsHref = `https://www.google.com/maps/search/${encodeURIComponent(`${nom} ${ville}`)}`;
  // Liens Google avis (client) : le deep link « écrire un avis » et la page des
  // avis existants si on a le place_id, sinon repli honnête vers la fiche Maps.
  const placeId = str(row.google_place_id);
  const reviewLink = placeId
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`
    : mapsHref;
  const reviewsUrl = placeId
    ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`
    : mapsHref;
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : null;

  return (
    <MaquetteSante
      slug={slug}
      profil={profil}
      nom={nom}
      metierLabel={capWords(metierSing)}
      villeAff={villeAff}
      adresse={adresse}
      horaires={horaires}
      photos={photos}
      accent={accent}
      accentSoft={accentSoft}
      showUrgence={showUrgence}
      termePublic={termePublic}
      confirmation={confirmation}
      moteur={moteur}
      busyWord={busyWord}
      content={resolveMetierContent(activite, profil)}
      avisMode={avisMode}
      note={note}
      reviewsCount={reviews}
      reviewsTop={reviewsTop}
      reviewLink={reviewLink}
      reviewsUrl={reviewsUrl}
      telHref={telHref}
      waHref={waHref}
      doctolibHref={doctolibHref}
      mapsHref={mapsHref}
      phoneDisplay={phoneDisplay}
    />
  );
}
