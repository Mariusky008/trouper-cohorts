// Diagnostic full-auto d'un prospect "Site internet" (cf. cahier des charges §7).
// Chaîne : Apify (acteur Google Maps -> fiche, note, avis, site, horaires,
// concurrents) -> analyse du site existant (HTTPS, viewport mobile, année
// copyright) -> décision variante A (pas de site) / B (refonte) / SKIP (site
// correct) -> constats rule-based -> (optionnel) reformulation Claude Haiku
// -> upsert human_vitrine_sites.
//
// Source de données : Apify (APIFY_TOKEN, déjà utilisé par les Vitrines) — pas
// de compte Google Cloud / facturation nécessaire. Sans ANTHROPIC_API_KEY on
// garde les constats rule-based. La machine propose, l'admin valide.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { slugify } from "@/lib/popey-marketplace";
import { apifyGoogleMaps, normName } from "@/lib/site-internet/apify";
import { isDirectoryUrl } from "@/lib/site-internet/directories";

// Normalisation souple pour matcher métier/ville (minuscules, sans accents, espaces).
const normLoose = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Constat = { statut: "bad" | "mid" | "good"; label: string; titre: string; preuve: string };
type Concurrent = { name: string; note: string };

const fmtNote = (n: number) => `${n.toFixed(1).replace(".", ",")}★`;

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." as const };
  const supabaseAdmin = createAdminClient();
  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminError || !adminRow?.user_id) return { error: "Accès admin requis." as const };
  return { ok: true as const };
}

// ── Source de données : Apify (Google Maps, sans facturation Google) ─────────
type PlaceInfo = {
  place_id: string;
  rating: number | null;
  reviews: number | null;
  website: string;
  address: string;
  horaires: Array<{ jours: string; horaires: string }>;
};

const norm = normName;
const matchesBusiness = (title: string, self: string) => {
  const t = norm(title);
  return Boolean(t) && (t.includes(self) || self.includes(t));
};

function itemToInfo(item: Record<string, unknown>): PlaceInfo {
  const oh = Array.isArray(item.openingHours) ? (item.openingHours as Array<Record<string, unknown>>) : [];
  const horaires = oh.slice(0, 2).map((h) => ({
    jours: String(h.day || "").trim(),
    horaires: String(h.hours || "").trim(),
  }));
  return {
    place_id: String(item.placeId || ""),
    rating: typeof item.totalScore === "number" ? item.totalScore : null,
    reviews: typeof item.reviewsCount === "number" ? item.reviewsCount : null,
    website: String(item.website || "").trim(),
    address: String(item.address || "").trim(),
    horaires,
  };
}

// Cherche l'activité dans la ville (récupère le commerce + ses concurrents),
// avec un repli ciblé sur le nom si le commerce n'apparaît pas.
async function apifyLookup(
  token: string,
  businessName: string,
  city: string,
  activite: string
): Promise<{ info: PlaceInfo | null; concurrents: Concurrent[]; status: "OK" | "NOT_FOUND" | "EMPTY" }> {
  const loc = `${city}, france`;
  const self = norm(businessName);
  const items = (await apifyGoogleMaps(token, [activite], loc, 12)).items;
  let biz = items.find((it) => matchesBusiness(String(it.title || ""), self)) || null;

  if (!biz) {
    const byName = (await apifyGoogleMaps(token, [`${businessName} ${city}`], loc, 5)).items;
    biz = byName.find((it) => matchesBusiness(String(it.title || ""), self)) || byName[0] || null;
  }

  const bizName = biz ? norm(String(biz.title || "")) : "";
  const cand = items
    .filter((it) => {
      const t = norm(String(it.title || ""));
      return t && t !== self && t !== bizName;
    })
    .map((it) => ({
      name: String(it.title || "").trim(),
      note: typeof it.totalScore === "number" ? fmtNote(it.totalScore as number) : "",
      hasSite: Boolean(String(it.website || "").trim()),
    }))
    .filter((c, i, arr) => arr.findIndex((x) => norm(x.name) === norm(c.name)) === i);
  // On privilégie les concurrents qui ONT un site (c'est l'argument de la variante A).
  const withSite = cand.filter((c) => c.hasSite);
  const concurrents: Concurrent[] = (withSite.length >= 2 ? withSite : cand)
    .slice(0, 2)
    .map(({ name, note }) => ({ name, note }));

  if (!biz) return { info: null, concurrents, status: items.length ? "NOT_FOUND" : "EMPTY" };
  return { info: itemToInfo(biz), concurrents, status: "OK" };
}

// Photos + avis RÉELS du commerce (contenus publics de sa fiche Google), pour
// nourrir la maquette. Appel Apify ciblé (avec maxImages/maxReviews) — 1 appel
// de plus par diagnostic, uniquement sur le commerce concerné.
export type ReviewSnippet = { name: string; text: string; stars: number | null };
function extractMedia(item: Record<string, unknown>): { photos: string[]; reviews: ReviewSnippet[] } {
  const imgs = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  const photos = imgs
    .map((u) => String(u))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 8);
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

async function fetchPlaceMedia(token: string, businessName: string, city: string): Promise<{ photos: string[]; reviews: ReviewSnippet[] }> {
  try {
    const items = (
      await apifyGoogleMaps(token, [`${businessName} ${city}`], `${city}, france`, 2, {
        maxImages: 8,
        maxReviews: 8,
        reviewsSort: "newest",
      })
    ).items;
    const self = norm(businessName);
    const it = items.find((x) => matchesBusiness(String(x.title || ""), self)) || items[0];
    if (!it) return { photos: [], reviews: [] };
    return extractMedia(it);
  } catch {
    return { photos: [], reviews: [] };
  }
}

// ── Analyse du site existant ─────────────────────────────────────────────────
type SiteAnalysis = {
  reachable: boolean;
  https: boolean;
  viewport: boolean;
  year: number | null;
  responseMs: number | null;
  hasCallButton: boolean;
};

async function analyzeSite(rawUrl: string): Promise<SiteAnalysis> {
  const result: SiteAnalysis = { reachable: false, https: false, viewport: false, year: null, responseMs: null, hasCallButton: false };
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  result.https = url.toLowerCase().startsWith("https://");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PopeyDiag/1.0)" },
      cache: "no-store",
    });
    result.responseMs = Date.now() - started;
    result.reachable = res.ok;
    result.https = res.url.toLowerCase().startsWith("https://");
    const html = (await res.text()).slice(0, 200000);
    result.viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    result.hasCallButton = /href=["']tel:/i.test(html);
    const years = Array.from(html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,20}(20\d{2})/gi)).map((m) => parseInt(m[1], 10));
    if (years.length) result.year = Math.max(...years);
  } catch {
    // injoignable / timeout : reachable reste false
  } finally {
    clearTimeout(timer);
  }
  return result;
}

// ── Constats rule-based — on vend le RÉSULTAT (clients), avec une PREUVE ─────
// 3e constat = positif. On n'affirme une réputation chiffrée QUE si on a une
// vraie note Google ; sinon on reste sur une projection honnête (pas d'invention).
function reputationConstat(info: PlaceInfo | null, variant: "A" | "B"): Constat {
  if (info?.rating != null && info.reviews != null && info.reviews > 0) {
    const note = info.rating.toFixed(1).replace(".", ",");
    return {
      statut: "good",
      label: "Réputation",
      titre: `${note}/5 sur ${info.reviews} avis : vos clients vous adorent`,
      preuve:
        variant === "A"
          ? "Il ne manque qu'un site pour transformer cette réputation en appels."
          : "Votre site mérite d'être à la hauteur de cette réputation.",
    };
  }
  return {
    statut: "good",
    label: "Opportunité",
    titre: "Vos futurs clients sont déjà sur Google",
    preuve: "Il suffit d'un bon site pour transformer les curieux en appels et en rendez-vous.",
  };
}

function buildConstats(
  variant: "A" | "B",
  activite: string,
  ville: string,
  info: PlaceInfo | null,
  site: SiteAnalysis | null,
  concurrents: Concurrent[]
): Constat[] {
  if (variant === "A") {
    const noms = concurrents.map((c) => c.name).filter(Boolean).slice(0, 2);
    const preuveConc = noms.length
      ? `Sur « ${activite} ${ville} », ${noms.join(" et ")} apparaissent avec leur site. Pas vous.`
      : `Chaque jour, des clients tapent « ${activite} ${ville} » — et tombent sur ceux qui ont un site.`;
    return [
      {
        statut: "bad",
        label: "Visibilité",
        titre: "Vos clients ne voient pas votre travail",
        preuve: "Votre fiche Google n'affiche aucun site : juste une adresse et un numéro.",
      },
      { statut: "bad", label: "Concurrence", titre: "Ils tombent sur vos concurrents", preuve: preuveConc },
      reputationConstat(info, variant),
    ];
  }
  const c1: Constat = site?.year
    ? { statut: "mid", label: "Image", titre: "Votre vitrine ne reflète plus la qualité de votre commerce", preuve: `Site conçu vers ${site.year} — figé depuis, alors que votre métier a évolué.` }
    : { statut: "mid", label: "Image", titre: "Votre vitrine ne reflète plus la qualité de votre commerce", preuve: "Un site figé depuis des années, en décalage avec votre commerce d'aujourd'hui." };
  let c2: Constat;
  if (site && !site.viewport) {
    c2 = { statut: "bad", label: "Mobile", titre: "Sur téléphone, vous perdez des appels", preuve: "Votre site n'a pas de version mobile — or la plupart de vos clients vous cherchent sur smartphone." };
  } else if (site && !site.https) {
    c2 = { statut: "bad", label: "Confiance", titre: "Vos visiteurs sont mis en garde", preuve: "Sans cadenas HTTPS, Chrome affiche « site non sécurisé » — beaucoup ferment aussitôt." };
  } else if (site && site.responseMs != null && site.responseMs > 3000) {
    c2 = { statut: "mid", label: "Attente", titre: "Vos visiteurs partent avant même de vous voir", preuve: `${(site.responseMs / 1000).toFixed(1).replace(".", ",")} s de chargement — 1 visiteur sur 2 abandonne avant 3 s.` };
  } else {
    c2 = { statut: "mid", label: "Mobile", titre: "Il ne donne pas envie de vous appeler", preuve: "L'expérience, surtout sur téléphone, n'incite pas à passer le pas." };
  }
  return [c1, c2, reputationConstat(info, variant)];
}

// Routing V2 : le premier défaut réellement mesuré, dans l'ordre de douleur.
// DECLASSE_GOOGLE et SANS_RESA sont volontairement écartés ici (mesure peu
// fiable → risque de verdict faux) ; l'admin peut les choisir à la main.
type TypeDiag =
  | "SANS_SITE" | "MOBILE_CASSE" | "FUITE_APPEL" | "NON_SECURISE" | "VETUSTE" | "EXCLU";

function routeDiagnostic(hasSite: boolean, site: SiteAnalysis | null): TypeDiag {
  if (!hasSite) return "SANS_SITE";
  // Site injoignable : peut être un blocage anti-bot de NOTRE côté, pas un vrai
  // défaut → on n'affirme rien (EXCLU). L'admin tranche à la main si besoin.
  if (!site || site.reachable === false) return "EXCLU";
  if (!site.viewport) return "MOBILE_CASSE"; // pas de balise responsive = vrai défaut mobile
  if (!site.https) return "NON_SECURISE"; // pas de HTTPS = fiable
  if (site.year != null && site.year <= new Date().getFullYear() - 8) return "VETUSTE"; // copyright très ancien
  // FUITE_APPEL (pas de tel:) est trop souvent un FAUX positif (bouton RDV,
  // formulaire, WhatsApp…) → laissé au choix manuel, jamais auto.
  // Site responsive, sécurisé, récent → rien à vendre honnêtement.
  return "EXCLU";
}

function buildSynthese(variant: "A" | "B"): string {
  return variant === "A"
    ? `Chaque semaine, des clients cherchent vos services sur Google.<br>Ils trouvent vos concurrents. <em>Pas vous.</em>`
    : `Des clients vous découvrent sur leur téléphone chaque jour.<br>Aujourd'hui, votre site <em>ne leur donne pas envie de vous choisir.</em>`;
}

// ── Reformulation Claude Haiku (optionnelle) ─────────────────────────────────
async function polishWithClaude(
  apiKey: string,
  ctx: { nom: string; activite: string; ville: string; variant: "A" | "B" },
  constats: Constat[],
  synthese: string
): Promise<{ constats: Constat[]; synthese: string } | null> {
  const prompt =
    `Tu aides à rédiger une lettre de prospection pour proposer la refonte/création du site d'un commerce local.\n` +
    `Commerce : ${ctx.nom} — ${ctx.activite} à ${ctx.ville}. Variante ${ctx.variant} (A = pas de site, B = refonte).\n\n` +
    `Voici 3 constats (le 3e est positif) et une phrase de synthèse. Reformule les "titre" et la "synthese" pour être ` +
    `précis, concrets et percutants (français, ton respectueux, pas d'exagération). Garde exactement statut et label. ` +
    `La synthese peut contenir <em> et <br>.\n\n` +
    `Réponds UNIQUEMENT en JSON strict : {"constats":[{"statut","label","titre"},...3],"synthese":"..."}.\n\n` +
    `Données : ${JSON.stringify({ constats, synthese })}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.constats) || parsed.constats.length < 3) return null;
    const cleaned: Constat[] = parsed.constats.slice(0, 3).map((c: Record<string, unknown>, i: number) => ({
      statut: (["bad", "mid", "good"].includes(String(c.statut)) ? c.statut : constats[i].statut) as Constat["statut"],
      label: String(c.label || constats[i].label),
      titre: String(c.titre || constats[i].titre),
      preuve: constats[i].preuve, // la preuve reste factuelle : Claude ne la reformule pas
    }));
    return { constats: cleaned, synthese: String(parsed.synthese || synthese) };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const id = String(payload?.id || "").trim();
  const businessName = String(payload?.businessName || "").trim();
  const city = String(payload?.city || "").trim();
  const activite = String(payload?.activite || "").trim();
  const forceVariantRaw = String(payload?.variant || "").trim().toUpperCase();
  const forceVariant: "A" | "B" | null = forceVariantRaw === "A" || forceVariantRaw === "B" ? forceVariantRaw : null;
  if (!businessName || !city || !activite) {
    return NextResponse.json({ error: "Nom, ville et activité sont requis." }, { status: 400 });
  }

  // Données pré-récupérées (mode Découverte : on a déjà scanné le secteur, on
  // évite un 2e appel Apify). { website, rating, reviews, address, concurrents }
  const pf = payload?.prefetched && typeof payload.prefetched === "object" ? (payload.prefetched as Record<string, unknown>) : null;
  const numOrNull = (x: unknown) => {
    const n = Number(x);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const apifyToken = String(process.env.APIFY_TOKEN || "").trim();
  const anthropicKey = String(process.env.ANTHROPIC_API_KEY || "").trim();

  // Sans source de données on ne peut PAS affirmer "introuvable" : on refuse
  // plutôt que de sortir une variante A potentiellement fausse (crédibilité),
  // sauf si l'admin a explicitement forcé la variante ou fourni des données.
  if (!pf && !apifyToken && !forceVariant) {
    return NextResponse.json(
      {
        error:
          "APIFY_TOKEN manquant : diagnostic auto impossible. Ajoute la clé Apify (déjà utilisée par les Vitrines) sur Vercel, ou force la variante A/B à la main.",
        placesStatus: "NO_SOURCE",
      },
      { status: 409 }
    );
  }

  // 1. Fiche du commerce + concurrents : depuis les données pré-récupérées si
  // fournies (Découverte), sinon via Apify (bouton Diagnostiquer d'un commerce).
  let info: PlaceInfo | null = null;
  let concurrents: Concurrent[] = [];
  let sourceStatus: "OK" | "NOT_FOUND" | "EMPTY" | "NO_SOURCE" = "NO_SOURCE";
  if (pf) {
    info = {
      place_id: String(pf.placeId || ""),
      rating: numOrNull(pf.rating),
      reviews: numOrNull(pf.reviews),
      website: String(pf.website || "").trim(),
      address: String(pf.address || "").trim(),
      horaires: [],
    };
    const pfc = Array.isArray(pf.concurrents) ? (pf.concurrents as Array<Record<string, unknown>>) : [];
    concurrents = pfc
      .map((c) => ({ name: String(c?.name || "").trim(), note: String(c?.note || "").trim() }))
      .filter((c) => c.name)
      .slice(0, 2);
    sourceStatus = "OK";
  } else if (apifyToken) {
    const r = await apifyLookup(apifyToken, businessName, city, activite);
    info = r.info;
    concurrents = r.concurrents;
    sourceStatus = r.status;
  }
  // Photos + avis réels du commerce (pour la maquette). Contenus publics de sa
  // fiche Google → honnête. On ne fetch que si un commerce a bien été identifié.
  let photos: string[] = [];
  let reviewsTop: ReviewSnippet[] = [];
  if (info && apifyToken && sourceStatus === "OK") {
    const media = await fetchPlaceMedia(apifyToken, businessName, city);
    photos = media.photos;
    // Avis positifs, avec texte, les 3 plus récents (ordre déjà "newest").
    reviewsTop = media.reviews.filter((r) => r.stars == null || r.stars >= 4).slice(0, 3);
  }

  // "EMPTY" = Apify n'a rien renvoyé (souci token/quota). Sans variante forcée
  // et sans résultat exploitable, on bloque proprement.
  if (sourceStatus === "EMPTY" && !forceVariant) {
    return NextResponse.json(
      {
        error:
          "Apify n'a renvoyé aucun résultat (token invalide, quota épuisé, ou aucune fiche). Vérifie APIFY_TOKEN, ou force la variante A/B pour générer quand même la lettre.",
        placesStatus: "EMPTY",
      },
      { status: 409 }
    );
  }
  const placeNotFound = sourceStatus === "NOT_FOUND" || sourceStatus === "EMPTY";

  // 2. Analyse du site + routing V2 : un seul type_diagnostic (le défaut réel
  // le plus fort), sinon EXCLU. On ne déclenche un module que sur une mesure sûre.
  // Une fiche Doctolib / page Facebook / PagesJaunes n'est PAS le site du
  // commerçant : on ne peut pas la critiquer comme « votre site actuel ». Ces
  // cas basculent en SANS_SITE (il n'a pas de site à lui). On garde la trace de
  // l'annuaire détecté à titre informatif.
  const rawWebsite = info?.website || "";
  const websiteIsDirectory = isDirectoryUrl(rawWebsite);
  const website = websiteIsDirectory ? "" : rawWebsite;
  let site: SiteAnalysis | null = null;
  if (website) {
    site = await analyzeSite(website);
    // (Capture auto mShots retirée : trompeuse. Le recto montre un schéma neutre
    // honnête, l'admin peut coller sa propre capture fidèle depuis la lettre.)
  }

  let typeDiag = routeDiagnostic(Boolean(website), site);
  // La Découverte force A (sans site) / B (avec site) ; A ⇒ SANS_SITE, B ⇒ on
  // garde le module choisi par l'analyse du site.
  if (forceVariant === "A") typeDiag = "SANS_SITE";

  const variant: "A" | "B" = typeDiag === "SANS_SITE" ? "A" : "B";
  const skipped = typeDiag === "EXCLU";

  // 3. Constats + synthèse
  let constats = buildConstats(variant, activite, city, info, site, concurrents);
  let synthese = buildSynthese(variant);
  if (anthropicKey && !skipped) {
    const polished = await polishWithClaude(anthropicKey, { nom: businessName, activite, ville: city, variant }, constats, synthese);
    if (polished) {
      constats = polished.constats;
      synthese = polished.synthese;
    }
  }

  // 4. Upsert
  const supabase = createAdminClient();

  // Remplissage auto du volume de recherches depuis la table de référence
  // (métier + ville). Aucune valeur inventée : rien trouvé = on ne renseigne pas.
  let marketVolume: number | null = null;
  try {
    const { data: md } = await supabase
      .from("human_site_market_data")
      .select("metier, city, monthly_searches");
    if (Array.isArray(md)) {
      const na = normLoose(activite);
      const nc = normLoose(city);
      const hit = md.find(
        (r) => normLoose(String((r as Record<string, unknown>).metier)) === na && normLoose(String((r as Record<string, unknown>).city)) === nc
      ) as Record<string, unknown> | undefined;
      if (hit && typeof hit.monthly_searches === "number" && hit.monthly_searches > 0) marketVolume = hit.monthly_searches;
    }
  } catch {
    /* table pas encore migrée → on ignore */
  }
  const marketExtra = marketVolume != null ? { search_volume: marketVolume } : {};

  const row = {
    ...marketExtra,
    channel: "letter" as const,
    business_name: businessName,
    city,
    activite,
    address: info?.address || "",
    source_website: website,
    variant,
    type_diagnostic: typeDiag,
    google_rating: info?.rating ?? null,
    google_reviews: info?.reviews ?? null,
    google_place_id: info?.place_id || null,
    site_annee: site?.year ?? null,
    diagnostic: {
      source: "apify",
      places_found: Boolean(info),
      source_status: sourceStatus,
      place_not_found: placeNotFound,
      directory_url: websiteIsDirectory ? rawWebsite : null,
      site,
      photos,
      reviews_top: reviewsTop,
      horaires: info?.horaires ?? [],
      concurrents,
      polished: Boolean(anthropicKey && !skipped),
      ran_at: new Date().toISOString(),
    },
    constats,
    synthese,
    letter_status: skipped ? "excluded" : "draft",
  };

  // Avertissement remonté à l'admin.
  const warning =
    sourceStatus === "EMPTY"
      ? `Apify n'a rien renvoyé : sans données Google. Vérifie APIFY_TOKEN, et ajuste à l'écran de validation.`
      : websiteIsDirectory
        ? `Le « site » détecté est un annuaire/une fiche (${rawWebsite.replace(/^https?:\/\//i, "").split(/[/?#]/)[0]}), pas un vrai site à lui → traité comme SANS_SITE. Vérifie qu'il n'a pas de site propre avant d'imprimer.`
        : skipped
          ? `Site correct (responsive, sécurisé, cliquable, récent) → EXCLU : rien à vendre honnêtement. Choisis un autre angle ou ne l'envoie pas.`
          : placeNotFound
            ? `Commerce non trouvé sur Google Maps — vérifie le nom exact avant d'imprimer.`
            : "";

  if (id) {
    const { error } = await supabase.from("human_vitrine_sites").update(row).eq("id", id).eq("channel", "letter");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data } = await supabase.from("human_vitrine_sites").select("slug").eq("id", id).maybeSingle();
    return NextResponse.json({ slug: data?.slug ?? "", variant, typeDiag, skipped, placesStatus: sourceStatus, placeNotFound, warning }, { status: 200 });
  }

  const baseSlug = slugify(businessName).slice(0, 60) || "prospect";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);
  const { error } = await supabase.from("human_vitrine_sites").insert({ slug, ...row, metadata: { diagnosed: true } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slug, variant, typeDiag, skipped, placesStatus: sourceStatus, placeNotFound, warning }, { status: 201 });
}
