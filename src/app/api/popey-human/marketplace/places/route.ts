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

type CobrandOfferRow = {
  id: string;
  city: string;
  city_slug: string;
  primary_member_id: string | null;
  secondary_member_id: string | null;
  primary_member_name: string | null;
  primary_member_metier: string | null;
  secondary_member_name: string | null;
  secondary_member_metier: string | null;
  primary_place_id: string | null;
  secondary_place_id: string | null;
  pack_title: string;
  pack_subtitle: string | null;
  primary_offer_label: string;
  primary_offer_value_eur: number | null;
  secondary_offer_label: string;
  secondary_offer_value_eur: number | null;
  commission_note: string | null;
  status: "active" | "inactive";
  updated_at: string;
};

function trim(value: unknown): string {
  return String(value || "").trim();
}

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
    const refId = String(request.nextUrl.searchParams.get("ref_id") || "").trim();
    const refCode = String(request.nextUrl.searchParams.get("ref") || "").trim();
    const hasReferralContext = Boolean(refId || refCode);
    const spheresCsv = String(request.nextUrl.searchParams.get("spheres") || "").trim();
    const category = String(request.nextUrl.searchParams.get("category") || "").trim().toLowerCase();
    const queryText = String(request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    const sort = String(request.nextUrl.searchParams.get("sort") || "value_desc").trim();
    const refMemberIds = new Set<string>();
    const acceptedLinkedPlaceIds = new Set<string>();

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

    if (isPrivilegeCatalog && !refId && refCode) {
      const { data: linkedOffers } = await supabase
        .from("human_marketplace_offers")
        .select("place_id,status,assigned_member_id,metadata")
        .eq("status", "accepted")
        .limit(200);
      const linkedPlaceIds = Array.from(
        new Set(
          ((linkedOffers as Array<{ place_id: string | null; metadata?: unknown }> | null) || [])
            .filter((offer) => {
              const metadata =
                offer.metadata && typeof offer.metadata === "object" && !Array.isArray(offer.metadata)
                  ? (offer.metadata as Record<string, unknown>)
                  : {};
              const isMatch = String(metadata.referral_code || "").trim() === refCode;
              if (isMatch) {
                const assigned = String((offer as { assigned_member_id?: string | null }).assigned_member_id || "").trim();
                if (assigned) refMemberIds.add(assigned);
                const placeId = String(offer.place_id || "").trim();
                if (placeId) acceptedLinkedPlaceIds.add(placeId);
              }
              return isMatch;
            })
            .map((offer) => String(offer.place_id || "").trim())
            .filter(Boolean),
        ),
      );
      if (linkedPlaceIds.length === 0) {
        // Keep city-wide catalogue visible even when referral code has no linked accepted places yet.
      }
    }

    if (isPrivilegeCatalog && !hasReferralContext) {
      const { data: acceptedOffers } = await supabase
        .from("human_marketplace_offers")
        .select("place_id,status")
        .eq("status", "accepted")
        .limit(500);
      (((acceptedOffers as Array<{ place_id: string | null }> | null) || []).forEach((offer) => {
        const placeId = String(offer.place_id || "").trim();
        if (placeId) acceptedLinkedPlaceIds.add(placeId);
      }));
    }

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
    if (isPrivilegeCatalog && !hasReferralContext) {
      filteredRows = filteredRows.filter((row) => {
        const hasConfiguredIdentity = Boolean(String(row.company_name || "").trim());
        const hasConfiguredOffer = Boolean(String(row.privilege_badge || "").trim());
        const isAcceptedLinkedPlace = acceptedLinkedPlaceIds.has(String(row.id || ""));
        return hasConfiguredIdentity || hasConfiguredOffer || isAcceptedLinkedPlace;
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

    let cobrandOffers: Array<{
      id: string;
      city: string;
      packTitle: string;
      packSubtitle: string | null;
      primaryMember: { id: string; name: string; metier: string };
      secondaryMember: { id: string; name: string; metier: string };
      primaryOffer: { label: string; valueEur: number; placeLabel: string };
      secondaryOffer: { label: string; valueEur: number; placeLabel: string };
      totalSavingsEur: number;
      commissionNote: string | null;
    }> = [];

    try {
      const { data: cobrandData, error: cobrandError } = await supabase
        .from("human_marketplace_cobrand_offers")
        .select(
          "id,city,city_slug,primary_member_id,secondary_member_id,primary_member_name,primary_member_metier,secondary_member_name,secondary_member_metier,primary_place_id,secondary_place_id,pack_title,pack_subtitle,primary_offer_label,primary_offer_value_eur,secondary_offer_label,secondary_offer_value_eur,commission_note,status,updated_at",
        )
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(150);

      if (cobrandError) {
        throw cobrandError;
      }

      const cobrandRows = (cobrandData as CobrandOfferRow[] | null) || [];
      const filteredCobrandRows = cobrandRows
        .filter((row) => matchCity(city, row.city, row.city_slug))
        .filter((row) => {
          if (!isPrivilegeCatalog) return true;
          if (refId) return true;
          if (refCode && refMemberIds.size > 0) {
            return refMemberIds.has(String(row.primary_member_id || "")) || refMemberIds.has(String(row.secondary_member_id || ""));
          }
          if (isPrivilegeCatalog && (refCode || refId)) return true;
          return true;
        });

      const memberIds = Array.from(
        new Set(
          filteredCobrandRows
            .flatMap((row) => [row.primary_member_id, row.secondary_member_id])
            .map((id) => String(id || "").trim())
            .filter(Boolean),
        ),
      );
      const placeIds = Array.from(
        new Set(
          filteredCobrandRows
            .flatMap((row) => [row.primary_place_id, row.secondary_place_id])
            .map((id) => String(id || "").trim())
            .filter(Boolean),
        ),
      );

      const [{ data: membersData }, { data: packPlacesData }] = await Promise.all([
        memberIds.length > 0
          ? supabase.from("human_members").select("id,first_name,last_name,metier").in("id", memberIds)
          : Promise.resolve({ data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; metier: string | null }> }),
        placeIds.length > 0
          ? supabase.from("human_marketplace_places").select("id,metier,company_name,privilege_badge").in("id", placeIds)
          : Promise.resolve({ data: [] as Array<{ id: string; metier: string; company_name: string | null; privilege_badge: string | null }> }),
      ]);

      const membersRows = (membersData || []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        metier: string | null;
      }>;
      const packPlaceRows = (packPlacesData || []) as Array<{
        id: string;
        metier: string;
        company_name: string | null;
        privilege_badge: string | null;
      }>;

      const memberMap = new Map(
        membersRows.map((row) => {
          const fullName = [trim(row.first_name), trim(row.last_name)].filter(Boolean).join(" ").trim() || "Membre Popey";
          return [
            row.id,
            {
              id: row.id,
              name: fullName,
              metier: trim(row.metier) || "Professionnel",
            },
          ] as const;
        }),
      );

      const placeMap = new Map(
        packPlaceRows.map((row) => [
          row.id,
          {
            label: trim(row.privilege_badge) || trim(row.company_name) || trim(row.metier) || "Offre privilège",
          },
        ]),
      );

      cobrandOffers = filteredCobrandRows.map((row) => {
        const primaryMember = (row.primary_member_id ? memberMap.get(row.primary_member_id) : null) || {
          id: row.primary_member_id || `anonymous-${row.id}-1`,
          name: trim(row.primary_member_name) || "Membre Popey",
          metier: trim(row.primary_member_metier) || "Professionnel",
        };
        const secondaryMember = (row.secondary_member_id ? memberMap.get(row.secondary_member_id) : null) || {
          id: row.secondary_member_id || `anonymous-${row.id}-2`,
          name: trim(row.secondary_member_name) || "Membre Popey",
          metier: trim(row.secondary_member_metier) || "Professionnel",
        };
        const primaryValue = Number(row.primary_offer_value_eur || 0);
        const secondaryValue = Number(row.secondary_offer_value_eur || 0);
        return {
          id: row.id,
          city: row.city,
          packTitle: trim(row.pack_title) || "Pack co-brandé",
          packSubtitle: trim(row.pack_subtitle) || null,
          primaryMember,
          secondaryMember,
          primaryOffer: {
            label: trim(row.primary_offer_label) || "Offre membre 1",
            valueEur: primaryValue,
            placeLabel: (row.primary_place_id && placeMap.get(row.primary_place_id)?.label) || "Offre privilège",
          },
          secondaryOffer: {
            label: trim(row.secondary_offer_label) || "Offre membre 2",
            valueEur: secondaryValue,
            placeLabel: (row.secondary_place_id && placeMap.get(row.secondary_place_id)?.label) || "Offre privilège",
          },
          totalSavingsEur: Math.max(0, Math.round(primaryValue + secondaryValue)),
          commissionNote: trim(row.commission_note) || null,
        };
      });
    } catch (cobrandError) {
      console.warn("[marketplace/places] cobrand unavailable", cobrandError);
    }

    return NextResponse.json({ places, cities, summary, cobrandOffers });
  } catch (error) {
    console.error("[marketplace/places] unexpected", error);
    return NextResponse.json({ error: "Impossible de charger les places marketplace." }, { status: 500 });
  }
}
