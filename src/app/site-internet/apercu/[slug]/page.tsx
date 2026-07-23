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
    .select("id, business_name, city, activite, address, google_rating, google_reviews, google_place_id, diagnostic, published, gallery_photos")
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

  // Tracking du scan (première fois) + compteur de vues (best-effort).
  try {
    await supabase
      .from("human_vitrine_sites")
      .update({ contact_scanned_at: new Date().toISOString() })
      .eq("id", str(row.id))
      .is("contact_scanned_at", null);
  } catch {
    /* best-effort */
  }
  // Colonnes RÉCENTES (site_views, services) : lecture séparée et défensive. Si
  // la migration n'est pas encore appliquée, cette requête échoue seule — la page
  // (et toutes les sections pilotées par la config métier) s'affiche quand même.
  let siteViews = 0;
  let proServicesRaw: unknown = [];
  let proUseCasesRaw: unknown = [];
  try {
    const { data: extra } = await supabase
      .from("human_vitrine_sites")
      .select("site_views, services, usecases")
      .eq("id", str(row.id))
      .maybeSingle();
    const ex = (extra as Record<string, unknown> | null) ?? null;
    if (ex) {
      siteViews = typeof ex.site_views === "number" ? ex.site_views : 0;
      proServicesRaw = ex.services;
      proUseCasesRaw = ex.usecases;
    }
    await supabase.from("human_vitrine_sites").update({ site_views: siteViews + 1 }).eq("id", str(row.id));
  } catch {
    /* colonnes non migrées → best-effort, la page reste complète */
  }
  // « Offre du moment » : bandeau piloté par le pro (colonne récente → défensif).
  // Affiché seulement si actif ET non expiré. Null sinon.
  let offer: { text: string; until: string | null } | null = null;
  try {
    const { data: o } = await supabase
      .from("human_vitrine_sites")
      .select("current_offer")
      .eq("id", str(row.id))
      .maybeSingle();
    const raw = (o as Record<string, unknown> | null)?.current_offer;
    if (raw && typeof raw === "object") {
      const oo = raw as Record<string, unknown>;
      const text = str(oo.text);
      const until = typeof oo.until === "string" && oo.until ? oo.until : null;
      const expired = until ? Date.parse(until) < Date.now() : false;
      if (text && !expired) offer = { text, until };
    }
  } catch {
    /* colonne non migrée → pas d'offre */
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
  // Restauration : vocabulaire « tables » (sinon « créneaux ») pour la Démo Vivante.
  const isResto = /restaur|resto|bistrot|brasser|pizz|cr[eê]per|gastronomi|caf[eé]|salon de th[eé]|\bbar\b|\bpub\b|brunch/i.test(activite);
  const clientWord = (termePublic || "client").replace(/s$/u, "");

  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;

  // Photos : celles gérées par le pro en priorité (data URI), sinon Google.
  const proPhotos = (Array.isArray(row.gallery_photos) ? row.gallery_photos : [])
    .map((p) => str(p))
    .filter((u) => /^data:image\//i.test(u))
    .slice(0, 10);
  const googlePhotos = (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 6);
  const photos = proPhotos.length ? proPhotos : googlePhotos;
  // Prestations RÉELLES saisies par le pro (« Mes accompagnements »). Bornées et
  // nettoyées. Les exemples de la maquette viennent de la config métier (côté
  // composant) : ici, aucun tarif inventé.
  const proServices = (Array.isArray(proServicesRaw) ? proServicesRaw : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({
      name: str(x.name).slice(0, 80),
      duration: str(x.duration).slice(0, 40) || undefined,
      price: str(x.price).slice(0, 40) || undefined,
      desc: str(x.desc).slice(0, 160) || undefined,
    }))
    .filter((x) => x.name.length > 0)
    .slice(0, 12);
  // Motifs RÉELS saisis par le pro (« Pour quoi venir me voir ? »). Override des
  // motifs proposés par la config métier (côté composant).
  const proMotifs = (Array.isArray(proUseCasesRaw) ? proUseCasesRaw : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({ icon: str(x.icon).slice(0, 8) || "🔹", title: str(x.title).slice(0, 60), desc: str(x.desc).slice(0, 120) }))
    .filter((x) => x.title.length > 0)
    .slice(0, 8);
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

  // Mini-agenda : si le pro a configuré des disponibilités, « Prendre rendez-vous »
  // ouvre la vraie page de réservation ; sinon on garde l'accueil (démo).
  let bookingEnabled = false;
  try {
    const { count } = await supabase
      .from("human_site_availability")
      .select("id", { count: "exact", head: true })
      .eq("site_id", str(row.id));
    bookingEnabled = (count ?? 0) > 0;
  } catch {
    /* table non migrée → pas de réservation réelle, accueil démo */
  }
  const bookingHref = bookingEnabled ? `/site-internet/rdv/${slug}` : "";

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
      bookingHref={bookingHref}
      services={proServices}
      proMotifs={proMotifs}
      published={Boolean(row.published)}
      telHref={telHref}
      waHref={waHref}
      doctolibHref={doctolibHref}
      mapsHref={mapsHref}
      phoneDisplay={phoneDisplay}
      offer={offer}
      isResto={isResto}
      clientWord={clientWord}
    />
  );
}
