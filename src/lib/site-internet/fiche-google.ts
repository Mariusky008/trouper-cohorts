/**
 * 🔎 LIRE LA FICHE GOOGLE D'UN COMMERCE — une seule façon, pour l'inscription
 * comme pour la relecture depuis sa page.
 *
 * ═══ POURQUOI ELLE A QUITTÉ L'INSCRIPTION ══════════════════════════════════
 *
 * « Je n'ai pas les avis, ni les photos de l'établissement. J'ai l'impression
 * que la fiche Google n'a pas du tout été consultée. La seule info que j'ai,
 * c'est l'itinéraire. »
 *
 * L'ITINÉRAIRE NE VIENT PAS DE GOOGLE : c'est une recherche « nom + ville »
 * construite par la page. Tout le reste — note, avis, photos, horaires,
 * téléphone — vient de la fiche. Il n'avait donc rien reçu de la fiche, et
 * rien ne le disait. TROIS RAISONS À ÇA, TOUTES TROIS DANS L'ANCIEN CODE :
 *
 *   · `apifyGoogleMaps` ne lève jamais d'erreur : il rend `ok: false` et un
 *     message. L'inscription ne lisait ni l'un ni l'autre. Un jeton épuisé, un
 *     quota mensuel atteint, un acteur en panne donnaient une page vide, sans
 *     une ligne nulle part.
 *   · ON CHERCHAIT D'ABORD « restaurant » DANS TOUTE LA VILLE, douze lieux, et
 *     on espérait qu'il soit dedans. À Dax, il y a plus de douze restaurants :
 *     il n'y était pas. La recherche par son nom ne venait qu'ensuite — la
 *     plus précise en dernier, et la plus lente en premier.
 *   · ET LES DEUX ÉTAIENT DANS LE MÊME `try` : si la première tombait, la
 *     seconde n'était jamais tentée.
 *
 * DONC : SON NOM D'ABORD, LE MÉTIER EN SECOURS, ET CHAQUE ÉCHEC EST GARDÉ.
 * Les erreurs remontent avec la fiche ; l'inscription les range dans le
 * diagnostic, et sa page peut lui dire pourquoi elle est vide — et lui
 * proposer de relire la fiche.
 *
 * FICHIER SERVEUR (jeton Apify).
 */
import { apifyGoogleMaps, normName } from "@/lib/site-internet/apify";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDirectoryUrl } from "@/lib/site-internet/directories";

const str = (v: unknown) => String(v ?? "").trim();

export type ReviewSnippet = { name: string; text: string; stars: number | null };

export type FicheLue = {
  /** Vrai quand une fiche à son nom a été trouvée. */
  trouvee: boolean;
  /** Le nom tel que Google l'écrit. */
  titre: string;
  photos: string[];
  reviewsTop: ReviewSnippet[];
  rating: number | null;
  reviews: number | null;
  placeId: string;
  address: string;
  phone: string;
  website: string;
  horaires: Array<{ jours: string; horaires: string }>;
  /** Ce qui a échoué en route, en clair. Vide quand tout a répondu. */
  erreurs: string[];
  /** Les champs qu'Apify a refusés et qu'on a retirés pour qu'il réponde. */
  corrections: string[];
  /**
   * CE QUE SA FICHE DIT DE SA CARTE. « Quand je regarde la fiche Google, je
   * vois bien les menus, les prix. » Son lien de menu, son prix par personne
   * (« 20–30 € ») et ses services (« Terrasse », « Excellents cocktails »).
   */
  menu: string;
  prix: string;
  services: string[];
};

/** « Services disponibles : [{ Terrasse: true }, …] » → ["Terrasse", …], sans les « non ». */
function servicesDe(item: Record<string, unknown>): string[] {
  const info = item.additionalInfo && typeof item.additionalInfo === "object" ? (item.additionalInfo as Record<string, unknown>) : {};
  const out: string[] = [];
  for (const [rubrique, liste] of Object.entries(info)) {
    if (!/service|point fort|offre|highlight|offering|option/i.test(rubrique) || !Array.isArray(liste)) continue;
    for (const e of liste) {
      if (e && typeof e === "object") for (const [k, v] of Object.entries(e as Record<string, unknown>)) if (v === true) out.push(k);
    }
  }
  return [...new Set(out)].slice(0, 8);
}

/** Le titre de Google désigne-t-il bien ce commerce-là ? */
export function memeCommerce(titre: string, nom: string): boolean {
  const sansAccent = (s: string) => normName(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’`-]/g, " ").replace(/\s+/g, " ").trim();
  const t = sansAccent(titre);
  const n = sansAccent(nom);
  return Boolean(t) && Boolean(n) && (t.includes(n) || n.includes(t));
}

function extraireMedias(item: Record<string, unknown>): { photos: string[]; reviews: ReviewSnippet[] } {
  /* `imageUrls` n'arrive qu'avec un appel qui DEMANDE des images ; `imageUrl`,
     la photo principale, arrive toujours. Une seule photo fait une couverture. */
  const brutes = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  const imgs = brutes.length ? brutes : [item.imageUrl].filter(Boolean);
  const photos = imgs.map((u) => String(u)).filter((u) => /^https?:\/\//i.test(u)).slice(0, 12);
  const rv = Array.isArray(item.reviews) ? (item.reviews as Array<Record<string, unknown>>) : [];
  const reviews = rv
    .map((r) => ({
      name: str(r?.name),
      text: String(r?.text || r?.textTranslated || "").replace(/\s+/g, " ").trim(),
      stars: typeof r?.stars === "number" ? (r.stars as number) : typeof r?.rating === "number" ? (r.rating as number) : null,
    }))
    .filter((r) => r.text.length >= 12);
  return { photos, reviews };
}

export async function lireFicheGoogle(
  token: string,
  nom: string,
  ville: string,
  activite: string,
  placeIdConnu = "",
  /** L'heure avant laquelle tout doit être fini (voir `ApifyOptions.finAvant`). */
  finAvant = Date.now() + 200_000,
): Promise<FicheLue> {
  const lue: FicheLue = {
    trouvee: false,
    titre: "",
    photos: [],
    reviewsTop: [],
    rating: null,
    reviews: null,
    placeId: "",
    address: "",
    phone: "",
    website: "",
    horaires: [],
    erreurs: [],
    corrections: [],
    menu: "",
    prix: "",
    services: [],
  };
  if (!token) {
    lue.erreurs.push("jeton Apify absent sur ce serveur");
    return lue;
  }
  const loc = `${ville}, france`;
  const reste = () => finAvant - Date.now();
  const noter = (etape: string, r: { ok: boolean; error: string; corrige?: string[] }) => {
    if (!r.ok) lue.erreurs.push(`${etape} : ${r.error || "échec"}`.slice(0, 400));
    if (r.corrige?.length) lue.corrections.push(`${etape} : ${r.corrige.join(", ")}`);
  };
  const COMPLET = { maxImages: 12, maxReviews: 10, reviewsSort: "newest", finAvant };

  /**
   * ═══ UN SEUL APPEL QUAND C'EST POSSIBLE ══════════════════════════════════
   *
   * Chaque appel à Apify relance un navigateur chez eux : trente secondes à
   * deux minutes. On demandait la fiche, PUIS ses photos et ses avis — deux
   * fois ce temps. On demande maintenant tout d'un coup, sur les trois
   * premiers résultats de son nom ; le métier ne sert qu'en secours, et
   * seulement s'il reste le temps.
   */
  let biz: Record<string, unknown> | null = null;
  let complet = false;
  if (placeIdConnu) {
    const r = await apifyGoogleMaps(token, [], loc, 1, { ...COMPLET, placeIds: [placeIdConnu] });
    noter("fiche (repère connu)", r);
    biz = r.items[0] ?? null;
    complet = Boolean(biz);
  }
  if (!biz) {
    const r = await apifyGoogleMaps(token, [`${nom} ${ville}`.trim()], loc, 3, COMPLET);
    noter("recherche par le nom", r);
    biz = r.items.find((it) => memeCommerce(str(it.title), nom)) ?? null;
    complet = Boolean(biz);
  }
  if (!biz && activite && reste() > 90_000) {
    const r = await apifyGoogleMaps(token, [activite], loc, 20, { finAvant });
    noter("recherche par le métier", r);
    biz = r.items.find((it) => memeCommerce(str(it.title), nom)) ?? null;
  }
  if (!biz) {
    if (!lue.erreurs.length) lue.erreurs.push(`aucune fiche Google au nom de « ${nom} » à ${ville}`);
    return lue;
  }

  // SES PHOTOS ET SES AVIS, s'ils ne sont pas venus avec la fiche et qu'il reste le temps.
  if (!complet && str(biz.placeId) && reste() > 60_000) {
    const media = await apifyGoogleMaps(token, [], loc, 1, { ...COMPLET, placeIds: [str(biz.placeId)] });
    noter("photos et avis", media);
    if (media.items[0]) biz = { ...biz, ...media.items[0] };
  }

  lue.trouvee = true;
  lue.titre = str(biz.title);
  lue.rating = typeof biz.totalScore === "number" ? biz.totalScore : null;
  lue.reviews = typeof biz.reviewsCount === "number" ? biz.reviewsCount : null;
  lue.placeId = str(biz.placeId);
  lue.address = str(biz.address);
  lue.website = str(biz.website);
  lue.phone = str(biz.phone || biz.phoneUnformatted);
  const oh = Array.isArray(biz.openingHours) ? (biz.openingHours as Array<Record<string, unknown>>) : [];
  lue.horaires = oh.slice(0, 7).map((h) => ({ jours: str(h.day), horaires: str(h.hours) }));
  const m = extraireMedias(biz);
  lue.photos = m.photos;
  lue.reviewsTop = m.reviews.filter((r) => r.stars == null || r.stars >= 4).slice(0, 3);
  lue.menu = /^https?:\/\//i.test(str(biz.menu)) ? str(biz.menu) : "";
  lue.prix = str(biz.price).slice(0, 30);
  lue.services = servicesDe(biz);
  return lue;
}

/**
 * ═══ LIRE LA FICHE ET LA RANGER DANS LE SITE — en arrière-plan ═════════════
 *
 * « /api/site-internet/public-generate : 504. » L'inscription attendait la
 * fiche avant de répondre ; quand Apify prenait son temps, la passerelle
 * coupait, et il ne restait qu'un écran d'erreur. La page se crée donc
 * TOUT DE SUITE, et la fiche se lit ensuite (`after`), ici. Sa page affiche
 * « Lecture de votre fiche Google… » et se recharge quand c'est fini.
 *
 * ON NE FAIT QU'AJOUTER : un champ que Google ne rend pas laisse en place ce
 * qui y était. Et le diagnostic est RELU juste avant d'écrire — la photo
 * ClikMe a pu y ranger son état pendant ce temps.
 */
export async function lireEtRangerLaFiche(
  slug: string,
  o: { finAvant?: number; renommer?: boolean } = {},
): Promise<FicheLue | null> {
  const supabase = createAdminClient();
  const lire = async () => {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("id, business_name, city, activite, address, google_place_id, diagnostic")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  };
  const row = await lire();
  if (!row) return null;
  const fiche = await lireFicheGoogle(
    str(process.env.APIFY_TOKEN),
    str(row.business_name),
    str(row.city),
    str(row.activite),
    str(row.google_place_id),
    o.finAvant,
  );
  if (fiche.erreurs.length || fiche.corrections.length) {
    console.warn("[fiche-google]", JSON.stringify({ slug, erreurs: fiche.erreurs, corrections: fiche.corrections }));
  }
  const frais = (await lire()) ?? row;
  const diag = (frais.diagnostic && typeof frais.diagnostic === "object" ? frais.diagnostic : {}) as Record<string, unknown>;
  const prendre = (nouveau: unknown[], ancien: unknown) => (nouveau.length ? nouveau : ancien);
  const maj: Record<string, unknown> = {
    diagnostic: {
      ...diag,
      fiche_en_cours: null,
      fiche_lue_at: new Date().toISOString(),
      fiche_erreurs: fiche.erreurs,
      fiche_corrections: fiche.corrections,
      places_found: fiche.trouvee || diag.places_found === true,
      photos: prendre(fiche.photos, diag.photos),
      reviews_top: prendre(fiche.reviewsTop, diag.reviews_top),
      horaires: prendre(fiche.horaires, diag.horaires),
      phone: fiche.phone || diag.phone || "",
      menu_url: fiche.menu || diag.menu_url || null,
      prix_moyen: fiche.prix || diag.prix_moyen || null,
      services_google: prendre(fiche.services, diag.services_google ?? []),
    },
  };
  if (fiche.trouvee) {
    if (fiche.rating != null) maj.google_rating = fiche.rating;
    if (fiche.reviews != null) maj.google_reviews = fiche.reviews;
    if (fiche.placeId) maj.google_place_id = fiche.placeId;
    if (fiche.address && !str(frais.address)) maj.address = fiche.address;
    // LE NOM QUE GOOGLE ÉCRIT, à l'inscription seulement : « Le Bordeaux »
    // plutôt que « le bordeaux » tapé vite. Une relecture ne renomme jamais.
    if (o.renommer && fiche.titre.length >= 2) maj.business_name = fiche.titre.slice(0, 90);
    if (fiche.website && !isDirectoryUrl(fiche.website)) {
      maj.source_website = fiche.website;
    }
  }
  await supabase.from("human_vitrine_sites").update(maj).eq("id", str(frais.id));
  return fiche;
}

/** Une lecture « en cours » depuis plus longtemps que ça est morte en route. */
export const LECTURE_PERIMEE_MS = 6 * 60_000;

/**
 * LA RAISON, DITE AU COMMERÇANT. « 402 not-enough-usage-to-run-paid-actor »
 * ne lui dit rien, et lui laisse croire que c'est sa fiche qui pose problème.
 * On dit ce qui s'est passé, et de quel côté — le code reste entre
 * parenthèses, pour nous.
 */
export function raisonLisible(erreur: string): string {
  const code = (/\b(4\d\d|5\d\d)\b/.exec(erreur) ?? [])[1];
  const entre = code ? ` (code ${code})` : "";
  if (/aucune fiche Google/i.test(erreur)) return `${erreur.replace(/^.*?: /, "")} — vérifiez l'orthographe du nom et la ville`;
  if (/jeton Apify absent/i.test(erreur)) return "la lecture des fiches Google n'est pas configurée sur ClikMe (de notre côté, pas du vôtre)";
  if (/402|usage|limit|credit|quota/i.test(erreur)) return `le service qui lit les fiches Google a atteint sa limite (de notre côté, pas du vôtre)${entre}`;
  if (/401|403|token|unauthori[sz]ed|forbidden/i.test(erreur)) return `l'accès au service qui lit les fiches Google a été refusé (de notre côté)${entre}`;
  if (/réseau|timeout|timed out|408|504|abort/i.test(erreur)) return `le service qui lit les fiches Google n'a pas répondu à temps${entre}`;
  return `le service qui lit les fiches Google n'a pas répondu correctement${entre}`;
}
