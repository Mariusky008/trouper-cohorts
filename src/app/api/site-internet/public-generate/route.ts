// Générateur PUBLIC de maquette (page d'accueil) — « entrez vos infos → je
// construis votre site en 1 minute → testez-le ». Le visiteur saisit nom + ville
// + activité ; on récupère ses VRAIES données Google (photos, avis, horaires) via
// Apify et on crée une maquette qu'il explore ensuite (Démo Vivante incluse).
//
// HONNÊTETÉ : on n'affiche que des contenus publics réels de sa fiche Google
// (jamais de faux avis / fausses photos). Si la fiche est introuvable, la maquette
// se construit quand même sur les contenus par métier (déterministes).
//
// GARDE-FOUS (Apify est payant à l'usage) :
//  - plafond par IP / 24 h (anti-abus) et plafond global / 24 h (budget) ;
//  - entrées bornées ; jeton Apify requis, sinon on refuse proprement.
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/popey-marketplace";
import { apifyGoogleMaps, normName } from "@/lib/site-internet/apify";
import { isDirectoryUrl } from "@/lib/site-internet/directories";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const str = (v: unknown) => String(v ?? "").trim();
const norm = normName;
const matchesBusiness = (title: string, self: string) => {
  const t = norm(title);
  return Boolean(t) && (t.includes(self) || self.includes(t));
};

type ReviewSnippet = { name: string; text: string; stars: number | null };

function extractMedia(item: Record<string, unknown>): { photos: string[]; reviews: ReviewSnippet[] } {
  const imgs = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  const photos = imgs.map((u) => String(u)).filter((u) => /^https?:\/\//i.test(u)).slice(0, 8);
  const rv = Array.isArray(item.reviews) ? (item.reviews as Array<Record<string, unknown>>) : [];
  const reviews = rv
    .map((r) => ({
      name: String(r?.name || "").trim(),
      text: String(r?.text || r?.textTranslated || "").replace(/\s+/g, " ").trim(),
      stars: typeof r?.stars === "number" ? (r.stars as number) : typeof r?.rating === "number" ? (r.rating as number) : null,
    }))
    .filter((r) => r.text.length >= 12);
  return { photos, reviews };
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const businessName = str(p?.businessName).slice(0, 90);
  const city = str(p?.city).slice(0, 60);
  const activite = str(p?.activite).slice(0, 60);
  if (businessName.length < 2 || city.length < 2 || activite.length < 2) {
    return NextResponse.json({ error: "Indiquez le nom, la ville et l'activité." }, { status: 400 });
  }

  const apifyToken = str(process.env.APIFY_TOKEN);
  if (!apifyToken) {
    return NextResponse.json({ error: "Le générateur est momentanément indisponible. Contactez-nous directement." }, { status: 503 });
  }

  const supabase = createAdminClient();

  // ── Garde-fous anti-abus / budget ──────────────────────────────────────────
  const ipRaw = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`popey:${ipRaw}`).digest("hex").slice(0, 32);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const perIpCap = Number(process.env.SITE_PUBLIC_GEN_PER_IP) || 3;
  const dailyCap = Number(process.env.SITE_PUBLIC_GEN_DAILY) || 150;
  try {
    const { count: ipCount } = await supabase
      .from("human_vitrine_sites")
      .select("id", { count: "exact", head: true })
      .eq("channel", "letter")
      .eq("metadata->>self_serve_ip", ipHash)
      .gte("created_at", since);
    if ((ipCount ?? 0) >= perIpCap) {
      return NextResponse.json(
        { error: "Vous avez déjà créé plusieurs aperçus aujourd'hui. Écrivez-nous sur WhatsApp pour la suite 🙂", limited: true },
        { status: 429 },
      );
    }
    const { count: dayCount } = await supabase
      .from("human_vitrine_sites")
      .select("id", { count: "exact", head: true })
      .eq("channel", "letter")
      .eq("metadata->>self_serve", "true")
      .gte("created_at", since);
    if ((dayCount ?? 0) >= dailyCap) {
      return NextResponse.json(
        { error: "Le générateur est très sollicité aujourd'hui. Réessayez plus tard ou contactez-nous directement.", limited: true },
        { status: 429 },
      );
    }
  } catch {
    /* colonne metadata absente → on continue sans compteur (best-effort) */
  }

  // ── 1. Fiche Google du commerce (Apify) : recherche par activité puis par nom ─
  const loc = `${city}, france`;
  const self = norm(businessName);
  let biz: Record<string, unknown> | null = null;
  try {
    const items = (await apifyGoogleMaps(apifyToken, [activite], loc, 12)).items;
    biz = items.find((it) => matchesBusiness(String(it.title || ""), self)) || null;
    if (!biz) {
      const byName = (await apifyGoogleMaps(apifyToken, [`${businessName} ${city}`], loc, 5)).items;
      biz = byName.find((it) => matchesBusiness(String(it.title || ""), self)) || byName[0] || null;
    }
  } catch {
    biz = null;
  }

  // ── 2. Photos + avis réels (contenus publics de sa fiche) ────────────────────
  let photos: string[] = [];
  let reviewsTop: ReviewSnippet[] = [];
  let rating: number | null = null;
  let reviews: number | null = null;
  let placeId = "";
  let address = "";
  let horaires: Array<{ jours: string; horaires: string }> = [];
  let rawWebsite = "";
  if (biz) {
    rating = typeof biz.totalScore === "number" ? biz.totalScore : null;
    reviews = typeof biz.reviewsCount === "number" ? biz.reviewsCount : null;
    placeId = String(biz.placeId || "");
    address = String(biz.address || "").trim();
    rawWebsite = String(biz.website || "").trim();
    const oh = Array.isArray(biz.openingHours) ? (biz.openingHours as Array<Record<string, unknown>>) : [];
    horaires = oh.slice(0, 7).map((h) => ({ jours: String(h.day || "").trim(), horaires: String(h.hours || "").trim() }));
    try {
      const media = (
        await apifyGoogleMaps(apifyToken, [`${businessName} ${city}`], loc, 2, { maxImages: 8, maxReviews: 8, reviewsSort: "newest" })
      ).items;
      const it = media.find((x) => matchesBusiness(String(x.title || ""), self)) || media[0];
      if (it) {
        const m = extractMedia(it);
        photos = m.photos;
        reviewsTop = m.reviews.filter((r) => r.stars == null || r.stars >= 4).slice(0, 3);
      }
    } catch {
      /* pas de média → maquette sur contenus métier */
    }
  }

  const websiteIsDirectory = isDirectoryUrl(rawWebsite);
  const profil = resolveMetier(activite).profil;
  const variant: "A" | "B" = rawWebsite && !websiteIsDirectory ? "B" : "A";

  // ── 3. Création de la maquette (channel "letter" pour être servie par /apercu) ─
  const baseSlug = slugify(businessName).slice(0, 50) || "site";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);

  const row = {
    slug,
    channel: "letter" as const,
    business_name: businessName,
    city,
    activite,
    address,
    source_website: websiteIsDirectory ? "" : rawWebsite,
    variant,
    google_rating: rating,
    google_reviews: reviews,
    google_place_id: placeId || null,
    diagnostic: {
      source: "apify",
      places_found: Boolean(biz),
      directory_url: websiteIsDirectory ? rawWebsite : null,
      profil,
      photos,
      reviews_top: reviewsTop,
      horaires,
      ran_at: new Date().toISOString(),
    },
    letter_status: "draft" as const,
    metadata: { self_serve: true, self_serve_ip: ipHash, self_serve_at: new Date().toISOString() },
  };

  const { error } = await supabase.from("human_vitrine_sites").insert(row);
  if (error) {
    return NextResponse.json({ error: "La création a échoué. Réessayez dans un instant." }, { status: 500 });
  }

  return NextResponse.json({ slug, found: Boolean(biz) }, { status: 201 });
}
