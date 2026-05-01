import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMarketplacePlaces, slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";

type PlaceRow = {
  id: string;
  city: string;
  city_slug: string;
  sphere_key: string;
  sphere_label: string;
  metier: string;
  metier_slug: string;
  company_name: string | null;
  privilege_badge: string | null;
  logo_url: string | null;
  category_key: string | null;
  status: "dispo" | "sale" | "occupied" | "reserved";
  list_price_eur: number | null;
  monthly_ca_eur: number;
  recos_per_year: number;
  conversion_rate: number;
  months_active: number;
  reciprocity_score: number;
  partners_count: number;
  value_growth_pct: number;
};

const BLOCKED_METIER_KEYWORDS = [
  "notaire",
  "avocat",
  "huissier",
  "expert-comptable",
  "commissaire aux comptes",
  "medecin",
  "dentiste",
  "kine",
  "pharmacien",
  "sage-femme",
  "pediatre",
  "gynecologue",
  "psychiatre",
  "cardiologue",
  "dermatologue",
  "rhumatologue",
  "orthophoniste",
  "infirmier",
  "osteopathe",
  "orthoptiste",
  "orthodontiste",
  "podologue",
  "audioprothesiste",
  "ergotherapeute",
  "psychomotricien",
  "chiropracteur",
  "acupuncteur",
];

const SPHERE_UI: Record<
  string,
  { tag: string; color: string; icon: string }
> = {
  sante: { tag: "🌿 Sante · Bien-etre", color: "#00A070", icon: "🦴" },
  habitat: { tag: "🏠 Habitat · Patrimoine", color: "#C07800", icon: "🏠" },
  digital: { tag: "💻 Digital · Business", color: "#1D6FA4", icon: "💻" },
  mariage: { tag: "💒 Mariage · Evenementiel", color: "#B5376A", icon: "📸" },
  finance: { tag: "⚖️ Finance · Juridique", color: "#6D3FCB", icon: "⚖️" },
};

async function seedMarketplaceIfEmpty() {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("human_marketplace_places")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  if ((count || 0) > 0) return;

  const seeds = generateMarketplacePlaces().map((place) => ({
    city: place.city,
    city_slug: place.citySlug,
    sphere_key: place.sphereKey,
    sphere_label: place.sphereLabel,
    metier: place.metier,
    metier_slug: place.metierSlug,
    status: place.status,
    list_price_eur: place.listPriceEur,
    monthly_ca_eur: place.monthlyCaEur,
    recos_per_year: place.recosPerYear,
    conversion_rate: place.conversionRate,
    months_active: place.monthsActive,
    reciprocity_score: place.reciprocityScore,
    partners_count: place.partnersCount,
    value_growth_pct: place.valueGrowthPct,
    is_seeded: true,
  }));

  const batchSize = 300;
  for (let i = 0; i < seeds.length; i += batchSize) {
    const chunk = seeds.slice(i, i + batchSize);
    const { error: insertError } = await supabase.from("human_marketplace_places").insert(chunk);
    if (insertError) throw insertError;
  }
}

function toClientPlace(row: PlaceRow) {
  const ui = SPHERE_UI[row.sphere_key] || SPHERE_UI.digital;
  return {
    id: row.id,
    city: row.city,
    sphere: row.sphere_key,
    sphereTag: ui.tag,
    sphereColor: ui.color,
    icon: ui.icon,
    metier: row.metier,
    companyName: row.company_name || null,
    badge: row.privilege_badge || null,
    logoUrl: row.logo_url || null,
    category: row.category_key || null,
    status: row.status === "sale" ? "sale" : "dispo",
    months: Number(row.months_active || 0),
    partners: Number(row.partners_count || 0),
    reco: Number(row.recos_per_year || 0),
    conversion: Number(row.conversion_rate || 0),
    ca: Number(row.monthly_ca_eur || 0),
    value: Number(row.list_price_eur || 0),
    growth: Number(row.value_growth_pct || 0),
    score: Number(row.reciprocity_score || 0),
  };
}

function inferCategoryFromSphere(sphereKey: string): string {
  const value = String(sphereKey || "").toLowerCase().trim();
  if (value === "habitat") return "maison";
  if (value === "sante") return "sante";
  if (value === "digital") return "services";
  if (value === "mariage") return "services";
  if (value === "finance") return "services";
  return "services";
}

function normalizeMetier(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isBlockedMetier(value: string): boolean {
  const normalized = normalizeMetier(value);
  return BLOCKED_METIER_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function makePlaceKey(city: string, sphere: string, metier: string): string {
  return `${slugify(city)}|${sphere.toLowerCase()}|${normalizeMetier(metier)}`;
}

function stripDepartmentSuffix(slug: string): string {
  return String(slug || "").replace(/-\d{2,3}$/, "");
}

function matchCity(cityFilter: string, rowCity: string, rowCitySlug?: string | null): boolean {
  const raw = String(cityFilter || "").trim();
  if (!raw || raw === "Toutes les villes") return true;
  const filterSlug = slugify(raw);
  if (!filterSlug) return true;
  const filterBase = stripDepartmentSuffix(filterSlug);
  const rowCityNorm = slugify(rowCity || "");
  const rowCitySlugNorm = slugify(rowCitySlug || "");
  const rowCityBase = stripDepartmentSuffix(rowCityNorm);
  const rowCitySlugBase = stripDepartmentSuffix(rowCitySlugNorm);

  return (
    filterSlug === rowCityNorm ||
    filterSlug === rowCitySlugNorm ||
    filterBase === rowCityNorm ||
    filterBase === rowCitySlugNorm ||
    filterSlug === rowCityBase ||
    filterSlug === rowCitySlugBase ||
    filterBase === rowCityBase ||
    filterBase === rowCitySlugBase
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    try {
      await seedMarketplaceIfEmpty();
    } catch (seedError) {
      console.error("[marketplace/places] seed failed", seedError);
    }

    const city = String(request.nextUrl.searchParams.get("city") || "").trim();
    const status = String(request.nextUrl.searchParams.get("status") || "all").trim();
    const catalog = String(request.nextUrl.searchParams.get("catalog") || "").trim().toLowerCase();
    const isPrivilegeCatalog = catalog === "privilege";
    const spheresCsv = String(request.nextUrl.searchParams.get("spheres") || "").trim();
    const category = String(request.nextUrl.searchParams.get("category") || "").trim().toLowerCase();
    const queryText = String(request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const sort = String(request.nextUrl.searchParams.get("sort") || "value_desc").trim();

    let query = supabase.from("human_marketplace_places").select(
      "id,city,city_slug,sphere_key,sphere_label,metier,metier_slug,company_name,privilege_badge,logo_url,category_key,status,list_price_eur,monthly_ca_eur,recos_per_year,conversion_rate,months_active,reciprocity_score,partners_count,value_growth_pct",
    );

    if (status === "sale") query = query.eq("status", "sale");
    if (status === "dispo") query = query.eq("status", "dispo");

    const spheres = spheresCsv
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (spheres.length > 0) query = query.in("sphere_key", spheres);

    if (sort === "value_asc") query = query.order("list_price_eur", { ascending: true, nullsFirst: true });
    else if (sort === "reco_desc") query = query.order("recos_per_year", { ascending: false });
    else if (sort === "anciennete_desc") query = query.order("months_active", { ascending: false });
    else if (sort === "ca_desc") query = query.order("monthly_ca_eur", { ascending: false });
    else query = query.order("list_price_eur", { ascending: false, nullsFirst: false });

    const { data, error } = await query.limit(3000);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []) as PlaceRow[];
    let filteredRows = rows
      .filter((row) => !isBlockedMetier(row.metier || ""))
      .filter((row) => matchCity(city, row.city, row.city_slug));
    if (isPrivilegeCatalog) {
      filteredRows = filteredRows.filter((row) => {
        const hasConfiguredIdentity = Boolean(String(row.company_name || "").trim());
        const hasConfiguredOffer = Boolean(String(row.privilege_badge || "").trim());
        return hasConfiguredIdentity || hasConfiguredOffer;
      });
    }
    let places = filteredRows
      .map(toClientPlace)
      .map((item) => ({
        ...item,
        category: item.category || inferCategoryFromSphere(item.sphere),
      }));

    // Complete with safe catalog so each city/sphere keeps full coverage even if legacy DB rows are filtered out.
    const generated = generateMarketplacePlaces()
      .filter((item) => matchCity(city, item.city, item.citySlug))
      .filter((item) => (status === "sale" ? item.status === "sale" : status === "dispo" ? item.status === "dispo" : true))
      .filter((item) => (spheres.length > 0 ? spheres.includes(item.sphereKey) : true))
      .filter((item) => !isBlockedMetier(item.metier));

    const existingKeys = new Set(places.map((item) => makePlaceKey(item.city, item.sphere, item.metier)));
    const generatedSupplements = generated
      .filter((item) => !existingKeys.has(makePlaceKey(item.city, item.sphereKey, item.metier)))
      .map((item) => {
        const ui = SPHERE_UI[item.sphereKey] || SPHERE_UI.digital;
        return {
          id: `generated-${slugify(item.city)}-${item.sphereKey}-${slugify(item.metier)}`,
          city: item.city,
          sphere: item.sphereKey,
          sphereTag: ui.tag,
          sphereColor: ui.color,
          icon: ui.icon,
          metier: item.metier,
          companyName: null,
          badge: null,
          logoUrl: null,
          category: inferCategoryFromSphere(item.sphereKey),
          status: item.status,
          months: item.monthsActive,
          partners: item.partnersCount,
          reco: item.recosPerYear,
          conversion: item.conversionRate,
          ca: item.monthlyCaEur,
          value: item.listPriceEur || 0,
          growth: item.valueGrowthPct,
          score: item.reciprocityScore,
        };
      });

    if (!isPrivilegeCatalog) {
      places = [...places, ...generatedSupplements];
    }

    if (category && category !== "all") {
      places = places.filter((item) => String(item.category || "").toLowerCase() === category);
    }
    if (queryText) {
      places = places.filter((item) => {
        const metier = String(item.metier || "").toLowerCase();
        const company = String(item.companyName || "").toLowerCase();
        return metier.includes(queryText) || company.includes(queryText);
      });
    }

    if (sort === "value_asc") places.sort((a, b) => (a.value || 0) - (b.value || 0));
    else if (sort === "reco_desc") places.sort((a, b) => (b.reco || 0) - (a.reco || 0));
    else if (sort === "anciennete_desc") places.sort((a, b) => (b.months || 0) - (a.months || 0));
    else if (sort === "ca_desc") places.sort((a, b) => (b.ca || 0) - (a.ca || 0));
    else places.sort((a, b) => (b.value || 0) - (a.value || 0));

    const cities = Array.from(new Set(places.map((row) => row.city))).sort((a, b) => a.localeCompare(b, "fr"));
    const summary = {
      total: places.length,
      sale: places.filter((item) => item.status === "sale").length,
      dispo: places.filter((item) => item.status === "dispo").length,
    };

    return NextResponse.json({ places, cities, summary });
  } catch (error) {
    console.error("[marketplace/places] unexpected", error);
    return NextResponse.json({ error: "Impossible de charger les places marketplace." }, { status: 500 });
  }
}
