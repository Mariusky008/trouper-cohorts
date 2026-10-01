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
  const noter = (etape: string, r: { ok: boolean; error: string; corrige?: string[] }) => {
    if (!r.ok) lue.erreurs.push(`${etape} : ${r.error || "échec"}`.slice(0, 400));
    if (r.corrige?.length) lue.corrections.push(`${etape} : ${r.corrige.join(", ")}`);
  };

  // ── 1. LA FICHE : par son repère s'il est connu, sinon par son nom, puis par son métier ──
  let biz: Record<string, unknown> | null = null;
  if (placeIdConnu) {
    const r = await apifyGoogleMaps(token, [], loc, 1, { placeIds: [placeIdConnu] });
    noter("fiche (repère connu)", r);
    biz = r.items[0] ?? null;
  }
  if (!biz) {
    const r = await apifyGoogleMaps(token, [`${nom} ${ville}`.trim()], loc, 5);
    noter("recherche par le nom", r);
    biz = r.items.find((it) => memeCommerce(str(it.title), nom)) ?? null;
  }
  if (!biz && activite) {
    const r = await apifyGoogleMaps(token, [activite], loc, 20);
    noter("recherche par le métier", r);
    biz = r.items.find((it) => memeCommerce(str(it.title), nom)) ?? null;
  }
  if (!biz) {
    if (!lue.erreurs.length) lue.erreurs.push(`aucune fiche Google au nom de « ${nom} » à ${ville}`);
    return lue;
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
  // LA PHOTO PRINCIPALE D'ABORD : le second appel ne peut qu'ajouter.
  lue.photos = extraireMedias(biz).photos;
  lue.menu = /^https?:\/\//i.test(str(biz.menu)) ? str(biz.menu) : "";
  lue.prix = str(biz.price).slice(0, 30);
  lue.services = servicesDe(biz);

  // ── 2. SES PHOTOS ET SES AVIS, en ciblant SA fiche ──
  const media = lue.placeId
    ? await apifyGoogleMaps(token, [], loc, 1, { maxImages: 12, maxReviews: 10, reviewsSort: "newest", placeIds: [lue.placeId] })
    : await apifyGoogleMaps(token, [`${nom} ${ville}`], loc, 2, { maxImages: 12, maxReviews: 10, reviewsSort: "newest" });
  noter("photos et avis", media);
  const it = lue.placeId ? media.items[0] : media.items.find((x) => memeCommerce(str(x.title), nom));
  if (it) {
    const m = extraireMedias(it);
    if (m.photos.length) lue.photos = m.photos;
    if (!lue.menu && /^https?:\/\//i.test(str(it.menu))) lue.menu = str(it.menu);
    if (!lue.prix) lue.prix = str(it.price).slice(0, 30);
    if (!lue.services.length) lue.services = servicesDe(it);
    lue.reviewsTop = m.reviews.filter((r) => r.stars == null || r.stars >= 4).slice(0, 3);
  }
  return lue;
}

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
