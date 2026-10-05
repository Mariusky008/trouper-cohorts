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
import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/popey-marketplace";
import { conduireLaFiche, lancerLaFiche } from "@/lib/site-internet/fiche-google";
import { lireLaCarte } from "@/lib/site-internet/carte-lue";
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

  /**
   * ═══ LA PAGE D'ABORD, LA FICHE ENSUITE ══════════════════════════════════
   *
   * « /api/site-internet/public-generate : 504. » On lisait sa fiche Google
   * AVANT de créer sa page, et Apify prend de trente secondes à plusieurs
   * minutes : la passerelle coupait, il ne restait qu'un écran d'erreur, et
   * aucune page. La page se crée maintenant tout de suite ; sa fiche se lit
   * juste après, en arrière-plan (`after`), et la page affiche « Lecture de
   * votre fiche Google… » puis se recharge avec ses avis et ses photos. Voir
   * `lancerLaFiche` et `avancerLaFiche`.
   */
  const debut = Date.now();
  const profil = resolveMetier(activite).profil;
  const baseSlug = slugify(businessName).slice(0, 50) || "site";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);
  const maintenant = new Date().toISOString();
  const jetonPhotos = randomBytes(18).toString("hex");

  const row = {
    slug,
    channel: "letter" as const,
    // SON NOM, REDRESSÉ S'IL EST TOUT EN MINUSCULES ; celui que Google écrit
    // le remplacera dès que la fiche sera lue.
    business_name: nomPropre(businessName),
    city,
    activite,
    address: "",
    source_website: "",
    variant: "A" as const,
    google_rating: null,
    google_reviews: null,
    google_place_id: null,
    diagnostic: {
      source: "apify",
      places_found: null,
      fiche_en_cours: maintenant,
      profil,
      photos: [],
      reviews_top: [],
      horaires: [],
      phone: "",
      ran_at: maintenant,
    },
    letter_status: "draft" as const,
    ...(photoValide ? { gallery_photos: [photoValide] } : {}),
    // LE JETON DE SES PHOTOS : il a rempli le formulaire, il peut y joindre
    // ses autres photos tout de suite — pendant trois heures, et pour cette
    // page seulement (`/api/site-internet/photos-lieu`).
    metadata: { self_serve: true, self_serve_ip: ipHash, self_serve_at: maintenant, jeton_photos: jetonPhotos, jeton_photos_at: maintenant },
  };

  const { error } = await supabase.from("human_vitrine_sites").insert(row);
  if (error) {
    return NextResponse.json({ error: "La création a échoué. Réessayez dans un instant." }, { status: 500 });
  }

  /**
   * ═══ EN ARRIÈRE-PLAN : SA FICHE, PUIS SA PHOTO CLIKME ════════════════════
   *
   * La fiche a jusqu'à quatre minutes après le début de la requête — la
   * fonction en a cinq. La photo ClikMe part ensuite s'il reste de quoi la
   * faire ; sinon sa page la lancera à sa prochaine visite. Sans aucune photo
   * — ni déposée, ni sur Google —, il n'y a rien à transformer.
   */
  const origine = new URL(request.url).origin;
  after(async () => {
    try {
      // LA LECTURE EST LANCÉE CHEZ APIFY, PUIS SUIVIE ; elle continue même si
      // ce suivi s'arrête — sa page prend le relais. Voir `avancerLaFiche`.
      const lancee = await lancerLaFiche(slug, { renommer: true });
      const etat = lancee ? await conduireLaFiche(slug, debut + 250_000) : null;
      // SA CARTE, LUE SUR LES PHOTOS DE SA FICHE — voir `carte-lue.ts`.
      if (etat?.lue && etat.photos && Date.now() - debut < 230_000) await lireLaCarte(slug, origine);
      const aDesPhotos = Boolean(photoValide) || Boolean(etat?.photos);
      // LA PHOTO CLIKME S'IL RESTE LE TEMPS ; sinon sa page la lancera.
      if (aDesPhotos && Date.now() - debut < 200_000) {
        const r = await fabriquerCouverture(slug, origine);
        if (r.raison) console.warn("[public-generate] couverture", JSON.stringify({ slug, raison: r.raison }));
      }
    } catch (e) {
      console.warn("[public-generate] arrière-plan", JSON.stringify({ slug, erreur: e instanceof Error ? e.message : String(e) }));
    }
  });

  return NextResponse.json({ slug, jetonPhotos }, { status: 201 });
}
