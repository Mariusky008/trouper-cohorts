// Diagnostic full-auto d'un prospect "Site internet" (cf. cahier des charges §7).
// Chaîne : Google Places (fiche, note, avis, site, horaires) -> analyse du site
// existant (HTTPS, viewport mobile, année copyright) -> décision variante
// A (pas de site) / B (refonte) / SKIP (site correct) -> constats rule-based
// -> (optionnel) reformulation Claude Haiku -> upsert human_vitrine_sites.
//
// Dégradation propre : sans GOOGLE_PLACES_API_KEY on saute Places, sans
// ANTHROPIC_API_KEY on garde les constats rule-based. La machine propose,
// l'admin valide (écran de validation) avant impression.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

// ── Google Places ────────────────────────────────────────────────────────────
type PlaceInfo = {
  place_id: string;
  rating: number | null;
  reviews: number | null;
  website: string;
  address: string;
  horaires: Array<{ jours: string; horaires: string }>;
};

async function findPlace(query: string, apiKey: string): Promise<string | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("language", "fr");
  url.searchParams.set("key", apiKey);
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.place_id ?? null;
  } catch {
    return null;
  }
}

// Concurrents visibles sur la requête "activite ville" (variante A) : on prend
// les 2 premiers résultats en excluant le commerce lui-même.
async function findCompetitors(query: string, apiKey: string, excludeName: string): Promise<string[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("language", "fr");
  url.searchParams.set("region", "fr");
  url.searchParams.set("key", apiKey);
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const results: Array<{ name?: string }> = Array.isArray(data?.results) ? data.results : [];
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const self = norm(excludeName);
    const names: string[] = [];
    for (const r of results) {
      const name = String(r.name || "").trim();
      if (!name || norm(name) === self) continue;
      if (names.some((n) => norm(n) === norm(name))) continue;
      names.push(name);
      if (names.length >= 2) break;
    }
    return names;
  } catch {
    return [];
  }
}

async function placeDetails(placeId: string, apiKey: string): Promise<PlaceInfo | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,website,formatted_address,opening_hours");
  url.searchParams.set("language", "fr");
  url.searchParams.set("key", apiKey);
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.result) return null;
    const r = data.result;
    const weekday: string[] = r.opening_hours?.weekday_text ?? [];
    const horaires = weekday.slice(0, 2).map((line: string) => {
      const idx = line.indexOf(":");
      return idx > 0
        ? { jours: line.slice(0, idx).trim(), horaires: line.slice(idx + 1).trim() }
        : { jours: line.trim(), horaires: "" };
    });
    return {
      place_id: placeId,
      rating: typeof r.rating === "number" ? r.rating : null,
      reviews: typeof r.user_ratings_total === "number" ? r.user_ratings_total : null,
      website: String(r.website || "").trim(),
      address: String(r.formatted_address || "").trim(),
      horaires,
    };
  } catch {
    return null;
  }
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
  if (!businessName || !city || !activite) {
    return NextResponse.json({ error: "Nom, ville et activité sont requis." }, { status: 400 });
  }

  const placesKey = String(process.env.GOOGLE_PLACES_API_KEY || "").trim();
  const anthropicKey = String(process.env.ANTHROPIC_API_KEY || "").trim();

  // 1. Google Places (fiche du commerce + concurrents sur la requête activité+ville)
  let info: PlaceInfo | null = null;
  let concurrents: string[] = [];
  if (placesKey) {
    const placeId = await findPlace(`${businessName} ${activite} ${city}`, placesKey);
    if (placeId) info = await placeDetails(placeId, placesKey);
    concurrents = await findCompetitors(`${activite} ${city}`, placesKey, businessName);
  }

  // 2. Site existant + décision variante
  const website = info?.website || "";
  let site: SiteAnalysis | null = null;
  let variant: "A" | "B";
  let skipped = false;
  if (!website) {
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
      places_found: Boolean(info),
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

  if (id) {
    const { error } = await supabase.from("human_vitrine_sites").update(row).eq("id", id).eq("channel", "letter");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data } = await supabase.from("human_vitrine_sites").select("slug").eq("id", id).maybeSingle();
    return NextResponse.json({ slug: data?.slug ?? "", variant, skipped }, { status: 200 });
  }

  const baseSlug = slugify(businessName).slice(0, 60) || "prospect";
  const suffix = slugify(crypto.randomUUID()).slice(0, 6) || String(Date.now()).slice(-6);
  const slug = `${baseSlug}-${suffix}`.slice(0, 80);
  const { error } = await supabase.from("human_vitrine_sites").insert({ slug, ...row, metadata: { diagnosed: true } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slug, variant, skipped }, { status: 201 });
}
