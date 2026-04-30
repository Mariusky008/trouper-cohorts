import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMarketplacePlaces } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";

type PlaceRow = {
  id: string;
  city: string;
  city_slug: string;
  sphere_key: string;
  sphere_label: string;
  metier: string;
  metier_slug: string;
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
    const spheresCsv = String(request.nextUrl.searchParams.get("spheres") || "").trim();
    const sort = String(request.nextUrl.searchParams.get("sort") || "value_desc").trim();

    let query = supabase.from("human_marketplace_places").select(
      "id,city,city_slug,sphere_key,sphere_label,metier,metier_slug,status,list_price_eur,monthly_ca_eur,recos_per_year,conversion_rate,months_active,reciprocity_score,partners_count,value_growth_pct",
    );

    if (city && city !== "Toutes les villes") query = query.eq("city", city);
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
    const places = rows.map(toClientPlace);
    const cities = Array.from(new Set(rows.map((row) => row.city))).sort((a, b) => a.localeCompare(b, "fr"));
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
