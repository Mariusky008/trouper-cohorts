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
import { NextResponse, after } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/popey-marketplace";
import { lireFicheGoogle } from "@/lib/site-internet/fiche-google";
import { isDirectoryUrl } from "@/lib/site-internet/directories";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { fabriquerCouverture } from "@/lib/site-internet/couverture";
import { nomPropre } from "@/lib/site-internet/nom-propre";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const str = (v: unknown) => String(v ?? "").trim();
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
  /**
   * ═══ LA PHOTO DE SA DEVANTURE, S'IL EN A UNE — FACULTATIVE ═══════════════
   *
   * « Peut-être même que la meilleure solution pour le commerçant lors de
   * l'inscription serait de mettre la photo de son commerce, s'il en a une
   * (optionnel). »
   *
   * C'EST LA MEILLEURE PHOTO DE DEPART QUI SOIT : c'est lui qui l'a choisie, et
   * elle montre sa porte. Elle entre dans SES photos (`gallery_photos`), qui
   * passent avant celles de Google partout — donc aussi pour la couverture.
   * Réduite par le navigateur avant l'envoi ; au-delà de quatre millions de
   * signes, c'est qu'elle ne l'a pas été, et on s'en passe sans bloquer.
   */
  const photoDeposee = str(p?.photo);
  const photoValide =
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photoDeposee) && photoDeposee.length < 4_000_000
      ? photoDeposee
      : "";
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

  // ── 1 et 2. SA FICHE GOOGLE : son nom d'abord, le métier en secours ─────────
  // Tout est dans `lib/site-internet/fiche-google.ts`, et la page s'en sert
  // aussi pour la relire. CE QUI A ÉCHOUÉ EST GARDÉ (`fiche_erreurs`) : une
  // page vide doit pouvoir dire pourquoi.
  const fiche = await lireFicheGoogle(apifyToken, businessName, city, activite);
  if (fiche.erreurs.length) {
    console.warn("[public-generate] fiche Google", JSON.stringify({ nom: businessName, ville: city, erreurs: fiche.erreurs }));
  }
  const biz = fiche.trouvee ? fiche : null;
  const { photos, reviewsTop, rating, reviews, placeId, address, phone, horaires } = fiche;
  const rawWebsite = fiche.website;

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
    /* LE NOM QUE GOOGLE ÉCRIT, QUAND C'EST BIEN LA SIENNE : « Le Bordeaux »,
       pas « le bordeaux » tapé vite. Sinon le sien, redressé s'il est tout en
       minuscules — voir `nom-propre.ts`. */
    business_name:
      biz && fiche.titre.length >= 2 ? fiche.titre.slice(0, 90) : nomPropre(businessName),
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
      fiche_erreurs: fiche.erreurs,
      directory_url: websiteIsDirectory ? rawWebsite : null,
      profil,
      photos,
      reviews_top: reviewsTop,
      horaires,
      phone,
      ran_at: new Date().toISOString(),
    },
    letter_status: "draft" as const,
    ...(photoValide ? { gallery_photos: [photoValide] } : {}),
    metadata: { self_serve: true, self_serve_ip: ipHash, self_serve_at: new Date().toISOString() },
  };

  const { error } = await supabase.from("human_vitrine_sites").insert(row);
  if (error) {
    return NextResponse.json({ error: "La création a échoué. Réessayez dans un instant." }, { status: 500 });
  }

  /**
   * ═══ LA PHOTO CLIKME SE FABRIQUE PENDANT QU'IL DECOUVRE SA PAGE ══════════
   *
   * « Pour chaque inscription, on aurait pendant la création du site une étape
   * qui consisterait à choisir la photo la plus appropriée. »
   *
   * ELLE NE RETARDE PAS LA PAGE : le rendu prend de vingt secondes à une
   * minute, et il n'a pas à les attendre devant un sablier. La page s'ouvre
   * avec sa photo d'origine ; la couverture ClikMe la remplace dès qu'elle est
   * prête, et sa page le lui dit. Sans aucune photo — ni déposée, ni sur
   * Google —, il n'y a rien à transformer, et rien n'est lancé.
   */
  if (photoValide || photos.length) {
    const origine = new URL(request.url).origin;
    after(async () => {
      try {
        const r = await fabriquerCouverture(slug, origine);
        if (r.raison) console.warn("[public-generate] couverture", JSON.stringify({ slug, raison: r.raison }));
      } catch (e) {
        console.warn("[public-generate] couverture", JSON.stringify({ slug, erreur: e instanceof Error ? e.message : String(e) }));
      }
    });
  }

  return NextResponse.json({ slug, found: Boolean(biz) }, { status: 201 });
}
