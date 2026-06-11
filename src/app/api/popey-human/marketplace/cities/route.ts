import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";

type CityRow = {
  city: string;
  city_slug: string | null;
  company_name: string | null;
  privilege_badge: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const catalog = String(request.nextUrl.searchParams.get("catalog") || "")
      .trim()
      .toLowerCase();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("human_marketplace_places")
      .select("city,city_slug,company_name,privilege_badge")
      .limit(catalog === "privilege" ? 2000 : 2000);

    if (error) {
      throw error;
    }

    // count = nb d'offres CONFIGURÉES (company_name OU privilege_badge) → permet
    // de proposer au client les villes qui ont vraiment des offres.
    const bySlug = new Map<string, { label: string; slug: string; count: number }>();
    for (const raw of (data as CityRow[] | null) || []) {
      const label = String(raw.city || "").trim();
      if (!label) continue;
      const slug = String(raw.city_slug || slugify(raw.city)).trim().toLowerCase() || slugify(label);
      if (!slug) continue;
      const configured = Boolean(String(raw.company_name || "").trim() || String(raw.privilege_badge || "").trim());
      const existing = bySlug.get(slug);
      if (existing) {
        if (configured) existing.count += 1;
      } else {
        bySlug.set(slug, { label, slug, count: configured ? 1 : 0 });
      }
    }

    const cities = Array.from(bySlug.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
    return NextResponse.json({ cities });
  } catch (error) {
    console.error("[marketplace/cities] unexpected", error);
    return NextResponse.json({ error: "Impossible de charger les villes." }, { status: 500 });
  }
}

