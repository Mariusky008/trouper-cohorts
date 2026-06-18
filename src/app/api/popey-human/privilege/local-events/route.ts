import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const cityInput = String(request.nextUrl.searchParams.get("city") || request.nextUrl.searchParams.get("ville") || "").trim();
    const citySlug = slugify(cityInput || "dax");
    const supabase = createAdminClient();

    const baseCols = "id,city,city_slug,title,day_label,place_label,badge,sponsor_names,emoji,details,image_url,sort_order,status,created_at";
    const runQuery = (cols: string) =>
      supabase
        .from("human_privilege_local_events")
        .select(cols)
        .eq("city_slug", citySlug)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(30);

    // Tente avec event_date/event_type/website_url ; si ces colonnes n'existent pas encore
    // (migration non appliquée), on retombe sur les colonnes de base.
    let { data, error } = await runQuery(baseCols + ",event_date,event_type,website_url");
    if (error && /event_date|event_type|website_url/i.test(String(error.message || ""))) {
      ({ data, error } = await runQuery(baseCols));
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const events = ((data || []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id || ""),
      city: String(row.city || ""),
      citySlug: String(row.city_slug || ""),
      title: String(row.title || ""),
      dayLabel: String(row.day_label || ""),
      placeLabel: String(row.place_label || ""),
      badge: String(row.badge || ""),
      sponsorNames: String(row.sponsor_names || ""),
      emoji: String(row.emoji || ""),
      details: String(row.details || ""),
      imageUrl: String(row.image_url || ""),
      sortOrder: Number(row.sort_order || 100),
      eventDate: row.event_date ? String(row.event_date) : "",
      eventType: String(row.event_type || ""),
      website: String(row.website_url || ""),
    }));

    return NextResponse.json({ events, citySlug });
  } catch (error) {
    console.error("[privilege/local-events] unexpected", error);
    return NextResponse.json({ error: "Impossible de charger les événements locaux." }, { status: 500 });
  }
}
