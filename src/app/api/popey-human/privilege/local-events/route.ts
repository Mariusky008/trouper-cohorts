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

    const { data, error } = await supabase
      .from("human_privilege_local_events")
      .select("id,city,city_slug,title,day_label,place_label,badge,sponsor_names,emoji,details,image_url,sort_order,status,created_at")
      .eq("city_slug", citySlug)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const events = ((data || []) as Array<Record<string, unknown>>).map((row) => ({
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
    }));

    return NextResponse.json({ events, citySlug });
  } catch (error) {
    console.error("[privilege/local-events] unexpected", error);
    return NextResponse.json({ error: "Impossible de charger les événements locaux." }, { status: 500 });
  }
}
