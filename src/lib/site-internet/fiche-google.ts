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
import { etatRunApify, lancerRunApify, normName, resultatsRunApify, type RunApify } from "@/lib/site-internet/apify";
import { avancerLesPhotosMenu, lancerLesPhotosMenu, photosMenuEnCours } from "@/lib/site-internet/photos-menu";
import { carteALire } from "@/lib/site-internet/carte-lue";
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

function extraireMedias(item: Record<string, unknown>): { photos: string[]; toutes: string[]; reviews: ReviewSnippet[] } {
  /* `imageUrls` n'arrive qu'avec un appel qui DEMANDE des images ; `imageUrl`,
     la photo principale, arrive toujours. Une seule photo fait une couverture. */
  const brutes = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  const imgs = brutes.length ? brutes : [item.imageUrl].filter(Boolean);
  const valides = imgs.map((u) => String(u)).filter((u) => /^https?:\/\//i.test(u));
  // DOUZE POUR LA PAGE, TOUTES POUR LIRE LA CARTE : la page de son menu est
  // rarement parmi les douze premières — voir `carte-lue.ts`.
  const photos = valides.slice(0, 12);
  const toutes = valides.slice(0, 50);
  const rv = Array.isArray(item.reviews) ? (item.reviews as Array<Record<string, unknown>>) : [];
  const reviews = rv
    .map((r) => ({
      name: str(r?.name),
      text: String(r?.text || r?.textTranslated || "").replace(/\s+/g, " ").trim(),
      stars: typeof r?.stars === "number" ? (r.stars as number) : typeof r?.rating === "number" ? (r.rating as number) : null,
    }))
    .filter((r) => r.text.length >= 12);
  return { photos, toutes, reviews };
}

/**
 * ═══ LA LECTURE EN TROIS TEMPS, SANS JAMAIS L'ATTENDRE ═════════════════════
 *
 * « recherche par le nom : 400 run-failed — Actor run did not succeed
 * (status: TIMED-OUT) ». Le robot d'Apify n'avait pas fini : nous l'attendions
 * dans la requête, avec le peu de temps qui lui restait — et la version
 * précédente lui demandait tout d'un coup, fiche, photos et avis.
 *
 * ON LANCE, PUIS ON VIENT CHERCHER. Chaque temps est une lecture Apify lancée
 * en arrière-plan (dix minutes au plus de son côté), dont on garde le numéro
 * dans le diagnostic (`fiche_run`) :
 *   1. « recherche » : son nom et sa ville, trois résultats, SANS photos ni
 *      avis — c'est ce qui rend la recherche rapide, et c'est exactement
 *      l'appel qui marchait avant ;
 *   2. « metier » : en secours seulement, si son nom n'a rien donné ;
 *   3. « medias » : SA fiche, par son repère, avec ses photos et ses avis.
 * `avancerLaFiche` regarde où en est la lecture et passe au temps suivant.
 * Ce qui la fait avancer : la boucle lancée à l'inscription (`after`), et la
 * page du commerçant, qui demande où on en est toutes les cinq secondes.
 */
type RunFiche = RunApify & { etape: "recherche" | "metier" | "medias"; lance: string; renommer?: boolean };

const ENTREE_COMMUNE = { language: "fr", countryCode: "fr" };
const entreeRecherche = (q: string, ville: string, n: number) => ({
  ...ENTREE_COMMUNE,
  searchStringsArray: [q],
  locationQuery: `${ville}, france`,
  maxCrawledPlacesPerSearch: n,
  maxImages: 0,
  maxReviews: 0,
});
const entreeMedias = (placeId: string) => ({
  ...ENTREE_COMMUNE,
  placeIds: [placeId],
  maxCrawledPlacesPerSearch: 1,
  // CINQUANTE PHOTOS : la page de sa carte se cache souvent loin dans la
  // liste, et c'est de là qu'on lit ses plats et ses prix quand l'onglet
  // « Menu » n'a rien rendu — voir `carte-lue.ts` et `photos-menu.ts`.
  maxImages: 50,
  maxReviews: 8,
  reviewsSort: "newest",
});

/** Une lecture plus vieille que ça est abandonnée : le robot a sa limite à dix minutes. */
export const LECTURE_PERIMEE_MS = 14 * 60_000;

type Site = { id: string; nom: string; ville: string; activite: string; placeId: string; adresse: string; diag: Record<string, unknown> };

async function lireLeSite(slug: string): Promise<Site | null> {
  const { data } = await createAdminClient()
    .from("human_vitrine_sites")
    .select("id, business_name, city, activite, address, google_place_id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const r = (data as Record<string, unknown> | null) ?? null;
  if (!r) return null;
  return {
    id: str(r.id),
    nom: str(r.business_name),
    ville: str(r.city),
    activite: str(r.activite),
    placeId: str(r.google_place_id),
    adresse: str(r.address),
    diag: (r.diagnostic && typeof r.diagnostic === "object" ? r.diagnostic : {}) as Record<string, unknown>,
  };
}

const runDe = (diag: Record<string, unknown>): RunFiche | null => {
  const r = diag.fiche_run && typeof diag.fiche_run === "object" ? (diag.fiche_run as Record<string, unknown>) : null;
  return r && str(r.runId) ? (r as unknown as RunFiche) : null;
};

/**
 * ÉCRIT SANS ÉCRASER : on part du diagnostic RELU, on n'ajoute que ce que
 * Google a rendu, et — quand `exigeRun` est donné — on n'écrit que si la
 * lecture en cours est toujours celle-là. Deux pages ouvertes qui demandent
 * en même temps n'en lancent ainsi pas deux.
 */
async function ecrire(site: Site, diag: Record<string, unknown>, colonnes: Record<string, unknown> = {}, exigeRun?: string): Promise<boolean> {
  let q = createAdminClient().from("human_vitrine_sites").update({ ...colonnes, diagnostic: diag }).eq("id", site.id);
  if (exigeRun) q = q.eq("diagnostic->fiche_run->>runId", exigeRun);
  const { data, error } = await q.select("id");
  return !error && Array.isArray(data) && data.length > 0;
}

/** Ce qu'une fiche Google donne, rangé dans le site (sans rien effacer). */
function rangerUneFiche(site: Site, biz: Record<string, unknown>, renommer: boolean) {
  const d = site.diag;
  const m = extraireMedias(biz);
  const prendre = (nouveau: unknown[], ancien: unknown) => (nouveau.length ? nouveau : ancien);
  const oh = Array.isArray(biz.openingHours) ? (biz.openingHours as Array<Record<string, unknown>>) : [];
  const diag: Record<string, unknown> = {
    ...d,
    places_found: true,
    photos: prendre(m.photos, d.photos),
    photos_toutes: prendre(m.toutes, d.photos_toutes ?? []),
    reviews_top: prendre(m.reviews.filter((r) => r.stars == null || r.stars >= 4).slice(0, 3), d.reviews_top),
    horaires: prendre(
      oh.slice(0, 7).map((h) => ({ jours: str(h.day), horaires: str(h.hours) })),
      d.horaires,
    ),
    phone: str(biz.phone || biz.phoneUnformatted) || d.phone || "",
    menu_url: (/^https?:\/\//i.test(str(biz.menu)) ? str(biz.menu) : "") || d.menu_url || null,
    prix_moyen: str(biz.price).slice(0, 30) || d.prix_moyen || null,
    services_google: prendre(servicesDe(biz), d.services_google ?? []),
  };
  const colonnes: Record<string, unknown> = {};
  if (typeof biz.totalScore === "number") colonnes.google_rating = biz.totalScore;
  if (typeof biz.reviewsCount === "number") colonnes.google_reviews = biz.reviewsCount;
  if (str(biz.placeId)) colonnes.google_place_id = str(biz.placeId);
  if (str(biz.address) && !site.adresse) colonnes.address = str(biz.address);
  // LE NOM QUE GOOGLE ÉCRIT, à l'inscription seulement : « Le Bordeaux »
  // plutôt que « le bordeaux » tapé vite. Une relecture ne renomme jamais.
  if (renommer && str(biz.title).length >= 2) colonnes.business_name = str(biz.title).slice(0, 90);
  const site_web = str(biz.website);
  if (site_web && !isDirectoryUrl(site_web)) colonnes.source_website = site_web;
  return { diag, colonnes };
}

/** Termine la lecture : plus de lecture en cours, et ce qui a échoué est gardé. */
const fini = (diag: Record<string, unknown>, erreur?: string, trouvee?: boolean) => ({
  ...diag,
  fiche_run: null,
  fiche_en_cours: null,
  fiche_lue_at: new Date().toISOString(),
  places_found: trouvee ?? diag.places_found === true,
  fiche_erreurs: erreur ? [...(Array.isArray(diag.fiche_erreurs) ? diag.fiche_erreurs : []), erreur].slice(-4) : diag.fiche_erreurs ?? [],
});

/**
 * LANCE LA LECTURE DE SA FICHE. Par son repère s'il est connu (une seule
 * lecture, avec ses photos et ses avis), par son nom sinon.
 */
export async function lancerLaFiche(slug: string, o: { renommer?: boolean } = {}): Promise<boolean> {
  const site = await lireLeSite(slug);
  if (!site) return false;
  const token = str(process.env.APIFY_TOKEN);
  const maintenant = new Date().toISOString();
  if (!token) {
    await ecrire(site, fini({ ...site.diag, fiche_erreurs: [] }, "jeton Apify absent sur ce serveur", false));
    return false;
  }
  const etape: RunFiche["etape"] = site.placeId ? "medias" : "recherche";
  const r = await lancerRunApify(token, etape === "medias" ? entreeMedias(site.placeId) : entreeRecherche(`${site.nom} ${site.ville}`.trim(), site.ville, 3));
  if ("erreur" in r) {
    await ecrire(site, fini({ ...site.diag, fiche_erreurs: [] }, `lancement de la lecture : ${r.erreur}`, false));
    return false;
  }
  const run: RunFiche = { runId: r.runId, datasetId: r.datasetId, etape, lance: maintenant, renommer: o.renommer };
  // SA FICHE EST CONNUE : les photos de son onglet « Menu » partent en même temps.
  const menu = site.placeId ? await lancerLesPhotosMenu(site.placeId, site.nom) : {};
  await ecrire(site, {
    ...site.diag,
    ...menu,
    fiche_run: run,
    fiche_en_cours: maintenant,
    fiche_erreurs: [],
    fiche_corrections: r.corrige.length ? [`${etape} : ${r.corrige.join(", ")}`] : [],
  });
  return true;
}

export type EtatFiche = {
  enCours: boolean;
  lue: boolean;
  photos: number;
  avis: number;
  erreurs: string[];
  corrections: string[];
  /** Sa carte se lit encore : photos de l'onglet « Menu » en route, ou lecture en cours. */
  carteEnCours: boolean;
};

export function etatDeLaFiche(diag: Record<string, unknown>): EtatFiche {
  const run = runDe(diag);
  const lance = Date.parse(str(run?.lance ?? diag.fiche_en_cours));
  return {
    enCours: Boolean(run || diag.fiche_en_cours) && Number.isFinite(lance) && Date.now() - lance < LECTURE_PERIMEE_MS,
    lue: diag.places_found === true,
    photos: Array.isArray(diag.photos) ? diag.photos.length : 0,
    avis: Array.isArray(diag.reviews_top) ? diag.reviews_top.length : 0,
    erreurs: (Array.isArray(diag.fiche_erreurs) ? diag.fiche_erreurs : []).map((e) => str(e)).filter(Boolean),
    corrections: (Array.isArray(diag.fiche_corrections) ? diag.fiche_corrections : []).map((e) => str(e)).filter(Boolean),
    carteEnCours: diag.places_found === true && (photosMenuEnCours(diag) || carteSeLit(diag) || carteALire(diag)),
  };
}

/** Une lecture de la carte partie il y a moins de trois minutes, et pas encore finie. */
function carteSeLit(diag: Record<string, unknown>): boolean {
  const essai = Date.parse(str(diag.carte_essai_at));
  if (!Number.isFinite(essai) || Date.now() - essai > 3 * 60_000) return false;
  const fin = Date.parse(str(diag.carte_fin_at));
  return !(Number.isFinite(fin) && fin >= essai);
}

/**
 * FAIT AVANCER LA LECTURE D'UN TEMPS, SI ELLE A FINI LE PRÉCÉDENT. Rapide :
 * deux ou trois questions à Apify, jamais d'attente. Rend l'état.
 */
export async function avancerLaFiche(slug: string): Promise<EtatFiche | null> {
  // LES PHOTOS DU MENU D'ABORD : elles avancent même quand la fiche a fini.
  try {
    await avancerLesPhotosMenu(slug);
  } catch {
    /* au tour suivant */
  }
  const site = await lireLeSite(slug);
  if (!site) return null;
  const run = runDe(site.diag);
  const token = str(process.env.APIFY_TOKEN);
  if (!run || !token) return etatDeLaFiche(site.diag);

  // TROP VIEILLE : le robot s'arrête de lui-même à dix minutes.
  if (Date.now() - Date.parse(run.lance) > LECTURE_PERIMEE_MS) {
    await ecrire(site, fini(site.diag, `${run.etape} : la lecture n'a pas fini à temps`), {}, run.runId);
    return etatDeLaFiche((await lireLeSite(slug))?.diag ?? site.diag);
  }
  const e = await etatRunApify(token, run.runId);
  if ("erreur" in e) return etatDeLaFiche(site.diag);
  if (["READY", "RUNNING", "TIMING-OUT", "ABORTING"].includes(e.statut)) return etatDeLaFiche(site.diag);

  if (e.statut !== "SUCCEEDED") {
    // LA FICHE EST PEUT-ÊTRE DÉJÀ LÀ : un échec des photos n'efface pas la note.
    await ecrire(site, fini(site.diag, `${run.etape} : la lecture s'est arrêtée (${e.statut})`), {}, run.runId);
    return etatDeLaFiche((await lireLeSite(slug))?.diag ?? site.diag);
  }
  const items = await resultatsRunApify(token, run.datasetId || e.datasetId);
  if (!Array.isArray(items)) return etatDeLaFiche(site.diag);

  if (run.etape === "medias") {
    const biz = items[0];
    if (!biz) {
      await ecrire(site, fini(site.diag, "medias : aucune donnée rendue"), {}, run.runId);
    } else {
      const { diag, colonnes } = rangerUneFiche(site, biz, Boolean(run.renommer));
      await ecrire(site, fini(diag, undefined, true), colonnes, run.runId);
    }
    return etatDeLaFiche((await lireLeSite(slug))?.diag ?? site.diag);
  }

  // « recherche » ou « metier » : est-ce bien lui ?
  const biz = items.find((it) => memeCommerce(str(it.title), site.nom)) ?? null;
  if (!biz) {
    if (run.etape === "recherche" && site.activite) {
      const r = await lancerRunApify(token, entreeRecherche(site.activite, site.ville, 20));
      if (!("erreur" in r)) {
        const suite: RunFiche = { runId: r.runId, datasetId: r.datasetId, etape: "metier", lance: new Date().toISOString(), renommer: run.renommer };
        await ecrire(site, { ...site.diag, fiche_run: suite }, {}, run.runId);
        return etatDeLaFiche({ ...site.diag, fiche_run: suite });
      }
    }
    await ecrire(site, fini(site.diag, `aucune fiche Google au nom de « ${site.nom} » à ${site.ville}`, false), {}, run.runId);
    return etatDeLaFiche((await lireLeSite(slug))?.diag ?? site.diag);
  }

  // TROUVÉ : on range tout de suite ce que la recherche donne (note, adresse,
  // horaires, photo principale), puis on lance la lecture de ses photos et avis.
  const { diag, colonnes } = rangerUneFiche(site, biz, Boolean(run.renommer));
  const placeId = str(biz.placeId);
  const r = placeId ? await lancerRunApify(token, entreeMedias(placeId)) : null;
  // ET LES PHOTOS DE SON ONGLET « MENU », EN MÊME TEMPS — voir `photos-menu.ts`.
  const menu = placeId ? await lancerLesPhotosMenu(placeId, str(biz.title) || site.nom, str(biz.url)) : {};
  if (r && !("erreur" in r)) {
    const suite: RunFiche = { runId: r.runId, datasetId: r.datasetId, etape: "medias", lance: new Date().toISOString(), renommer: run.renommer };
    await ecrire(site, { ...diag, ...menu, fiche_run: suite }, colonnes, run.runId);
  } else {
    await ecrire(site, fini({ ...diag, ...menu }, r && "erreur" in r ? `medias : ${r.erreur}` : undefined, true), colonnes, run.runId);
  }
  return etatDeLaFiche((await lireLeSite(slug))?.diag ?? site.diag);
}

/**
 * CONDUIT LA LECTURE JUSQU'AU BOUT, PENDANT LE TEMPS QU'ON A. Pour la boucle
 * lancée à l'inscription : on redemande toutes les huit secondes. Si le
 * temps manque, la page du commerçant prend le relais.
 */
export async function conduireLaFiche(slug: string, finAvant: number): Promise<EtatFiche | null> {
  let etat: EtatFiche | null = null;
  while (Date.now() < finAvant - 10_000) {
    await new Promise((ok) => setTimeout(ok, 8_000));
    etat = await avancerLaFiche(slug);
    if (!etat || !etat.enCours) return etat;
  }
  return etat;
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
  if (/n'a pas fini à temps|timed[- ]out|timeout|réseau|408|504|abort/i.test(erreur))
    return `la lecture de votre fiche a pris trop de temps chez notre prestataire — relancez-la${entre}`;
  if (/s'est arrêtée|failed|aborted/i.test(erreur)) return `la lecture de votre fiche s'est arrêtée chez notre prestataire — relancez-la${entre}`;
  return `le service qui lit les fiches Google n'a pas répondu correctement${entre}`;
}
