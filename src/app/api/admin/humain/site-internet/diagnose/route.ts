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

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Constat = { statut: "bad" | "mid" | "good"; label: string; titre: string };

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
): Promise<{ info: PlaceInfo | null; concurrents: string[]; status: "OK" | "NOT_FOUND" | "EMPTY" }> {
  const loc = `${city}, france`;
  const self = norm(businessName);
  const items = await apifyGoogleMaps(token, [activite], loc, 12);
  let biz = items.find((it) => matchesBusiness(String(it.title || ""), self)) || null;

  if (!biz) {
    const byName = await apifyGoogleMaps(token, [`${businessName} ${city}`], loc, 5);
    biz = byName.find((it) => matchesBusiness(String(it.title || ""), self)) || byName[0] || null;
  }

  const bizName = biz ? norm(String(biz.title || "")) : "";
  const concurrents = items
    .map((it) => String(it.title || "").trim())
    .filter((t) => t && norm(t) !== self && norm(t) !== bizName)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 2);

  if (!biz) return { info: null, concurrents, status: items.length ? "NOT_FOUND" : "EMPTY" };
  return { info: itemToInfo(biz), concurrents, status: "OK" };
}

// ── Analyse du site existant ─────────────────────────────────────────────────
type SiteAnalysis = {
  reachable: boolean;
  https: boolean;
  viewport: boolean;
  year: number | null;
  responseMs: number | null;
};

async function analyzeSite(rawUrl: string): Promise<SiteAnalysis> {
  const result: SiteAnalysis = { reachable: false, https: false, viewport: false, year: null, responseMs: null };
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
    const years = Array.from(html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,20}(20\d{2})/gi)).map((m) => parseInt(m[1], 10));
    if (years.length) result.year = Math.max(...years);
  } catch {
    // injoignable / timeout : reachable reste false
  } finally {
    clearTimeout(timer);
  }
  return result;
}

// ── Constats rule-based ──────────────────────────────────────────────────────
function reputationConstat(info: PlaceInfo | null): Constat {
  if (info?.rating != null && info.reviews != null && info.reviews > 0) {
    return { statut: "good", label: "Votre réputation", titre: `Déjà ${info.rating.toFixed(1)}/5 sur Google (${info.reviews} avis)` };
  }
  return { statut: "good", label: "Votre réputation", titre: "Des clients prêts à vous recommander" };
}

function buildConstats(variant: "A" | "B", activite: string, ville: string, info: PlaceInfo | null, site: SiteAnalysis | null): Constat[] {
  if (variant === "A") {
    return [
      { statut: "bad", label: "Sur Google", titre: `Introuvable quand on cherche « ${activite} à ${ville} »` },
      { statut: "bad", label: "Sur mobile", titre: "Aucun site à présenter à vos clients" },
      reputationConstat(info),
    ];
  }
  const first: Constat = site?.year
    ? { statut: "mid", label: "Votre site actuel", titre: `Conçu vers ${site.year}, il a pris un coup de vieux` }
    : { statut: "mid", label: "Votre site actuel", titre: "Un design qui a vieilli" };
  let second: Constat;
  if (site && !site.https) second = { statut: "bad", label: "Sécurité", titre: "Pas de cadenas HTTPS — Google le pénalise" };
  else if (site && !site.viewport) second = { statut: "bad", label: "Sur mobile", titre: "Illisible sur un téléphone" };
  else if (site && site.responseMs != null && site.responseMs > 3000) second = { statut: "mid", label: "Vitesse", titre: `Lent à charger (${(site.responseMs / 1000).toFixed(1)}s)` };
  else second = { statut: "mid", label: "Sur mobile", titre: "Pas vraiment pensé pour le téléphone" };
  return [first, second, reputationConstat(info)];
}

function buildSynthese(variant: "A" | "B", nom: string): string {
  return variant === "A"
    ? "Aujourd'hui, un client sur deux qui vous cherche sur son téléphone <em>ne vous trouve pas</em>."
    : `Votre site actuel donne une image datée de <em>${nom}</em>.<br>On peut changer ça en 72 heures.`;
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

  const apifyToken = String(process.env.APIFY_TOKEN || "").trim();
  const anthropicKey = String(process.env.ANTHROPIC_API_KEY || "").trim();

  // Sans source de données on ne peut PAS affirmer "introuvable" : on refuse
  // plutôt que de sortir une variante A potentiellement fausse (crédibilité),
  // sauf si l'admin a explicitement forcé la variante.
  if (!apifyToken && !forceVariant) {
    return NextResponse.json(
      {
        error:
          "APIFY_TOKEN manquant : diagnostic auto impossible. Ajoute la clé Apify (déjà utilisée par les Vitrines) sur Vercel, ou force la variante A/B à la main.",
        placesStatus: "NO_SOURCE",
      },
      { status: 409 }
    );
  }

  // 1. Apify (Google Maps) : fiche du commerce + concurrents
  let info: PlaceInfo | null = null;
  let concurrents: string[] = [];
  let sourceStatus: "OK" | "NOT_FOUND" | "EMPTY" | "NO_SOURCE" = "NO_SOURCE";
  if (apifyToken) {
    const r = await apifyLookup(apifyToken, businessName, city, activite);
    info = r.info;
    concurrents = r.concurrents;
    sourceStatus = r.status;
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

  // 2. Site existant + décision variante
  const website = info?.website || "";
  let site: SiteAnalysis | null = null;
  let variant: "A" | "B";
  let skipped = false;
  if (!website) {
    // Pas de site sur la fiche Google Maps → variante A (à confirmer à l'écran
    // de validation, surtout si le commerce n'a même pas été trouvé).
    variant = "A";
  } else {
    site = await analyzeSite(website);
    const hasDefect =
      !site.reachable ||
      !site.https ||
      !site.viewport ||
      (site.year != null && site.year <= new Date().getFullYear() - 5) ||
      (site.responseMs != null && site.responseMs > 4000);
    if (hasDefect) {
      variant = "B";
    } else {
      // Site correct → rien à vendre : on marque skipped mais on garde la fiche.
      variant = "B";
      skipped = true;
    }
  }

  // Override manuel : si l'admin a explicitement choisi A ou B, il prime sur la
  // décision automatique (et on ne "skip" pas).
  if (forceVariant) {
    variant = forceVariant;
    skipped = false;
  }

  // 3. Constats + synthèse
  let constats = buildConstats(variant, activite, city, info, site);
  let synthese = buildSynthese(variant, businessName);
  if (anthropicKey && !skipped) {
    const polished = await polishWithClaude(anthropicKey, { nom: businessName, activite, ville: city, variant }, constats, synthese);
    if (polished) {
      constats = polished.constats;
      synthese = polished.synthese;
    }
  }

  // 4. Upsert
  const supabase = createAdminClient();
  const row = {
    channel: "letter" as const,
    business_name: businessName,
    city,
    activite,
    address: info?.address || "",
    source_website: website,
    variant,
    google_rating: info?.rating ?? null,
    google_reviews: info?.reviews ?? null,
    google_place_id: info?.place_id || null,
    site_annee: site?.year ?? null,
    diagnostic: {
      source: "apify",
      places_found: Boolean(info),
      source_status: sourceStatus,
      place_not_found: placeNotFound,
      site,
      horaires: info?.horaires ?? [],
      concurrents,
      polished: Boolean(anthropicKey && !skipped),
      ran_at: new Date().toISOString(),
    },
    constats,
    synthese,
    letter_status: skipped ? "skipped" : "draft",
  };

  // Avertissement remonté à l'admin.
  const warning =
    sourceStatus === "EMPTY"
      ? `Apify n'a rien renvoyé : lettre en variante ${variant} (forcée), sans données Google. Vérifie APIFY_TOKEN, et ajuste les constats à l'écran de validation.`
      : placeNotFound
        ? `Commerce non trouvé sur Google Maps — variante A proposée, mais vérifie le nom exact avant d'imprimer.`
        : "";

  if (id) {
    const { error } = await supabase.from("human_vitrine_sites").update(row).eq("id", id).eq("channel", "letter");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data } = await supabase.from("human_vitrine_sites").select("slug").eq("id", id).maybeSingle();
    return NextResponse.json({ slug: data?.slug ?? "", variant, skipped, placesStatus: sourceStatus, placeNotFound, warning }, { status: 200 });
  }

  const baseSlug = slugify(businessName).slice(0, 60) || "prospect";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);
  const { error } = await supabase.from("human_vitrine_sites").insert({ slug, ...row, metadata: { diagnosed: true } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slug, variant, skipped, placesStatus: sourceStatus, placeNotFound, warning }, { status: 201 });
}
