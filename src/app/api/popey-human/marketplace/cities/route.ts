import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";

type CityRow = {
  city: string;
  city_slug: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const catalog = String(request.nextUrl.searchParams.get("catalog") || "")
      .trim()
      .toLowerCase();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("human_marketplace_places")
      .select("city,city_slug")
      .limit(catalog === "privilege" ? 2000 : 2000);

    if (error) {
      throw error;
    }

    const rows = ((data as CityRow[] | null) || []).map((row) => ({
      label: String(row.city || "").trim(),
      slug: String(row.city_slug || slugify(row.city)).trim().toLowerCase(),
    }));

    const bySlug = new Map<string, { label: string; slug: string }>();
    for (const row of rows) {
      if (!row.label) continue;
      const slug = row.slug || slugify(row.label);
      if (!slug) continue;
      if (!bySlug.has(slug)) {
        bySlug.set(slug, { label: row.label, slug });
      }
    }

    const cities = Array.from(bySlug.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
    return NextResponse.json({ cities });
  } catch (error) {
    console.error("[marketplace/cities] unexpected", error);
    return NextResponse.json({ error: "Impossible de charger les villes." }, { status: 500 });
  }
}

