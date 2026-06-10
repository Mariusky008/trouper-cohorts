import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  try {
    const cityInput = String(request.nextUrl.searchParams.get("city") || request.nextUrl.searchParams.get("ville") || "").trim();
    const citySlug = slugify(cityInput || "dax");
    const supabase = createAdminClient();

    // Fréquence globale (tous les N swipes). Défaut 3 si table/clé absente.
    let frequency = 3;
    try {
      const { data: settingRow } = await supabase
        .from("human_privilege_catalogue_settings")
        .select("value")
        .eq("key", "tinder_frequency")
        .maybeSingle();
      const parsed = parseInt(String((settingRow as { value?: string } | null)?.value || ""), 10);
      if (Number.isFinite(parsed) && parsed >= 1) frequency = parsed;
    } catch {
      /* table absente → défaut */
    }

    // Seuls les profils ACTIFS et CONSENTIS sont publiés.
    const { data, error } = await supabase
      .from("human_privilege_tinder_profiles")
      .select(
        "id,city,city_slug,pro_name,age,pro_title,bio,tags,compat,match_gift,coupon_code,photo_url,address,phone,website,wa_phone,sort_order",
      )
      .eq("city_slug", citySlug)
      .eq("status", "active")
      .eq("consent", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      // Table pas encore créée → pas de profils, mais on ne casse pas le catalogue.
      return NextResponse.json({ profiles: [], frequency, citySlug });
    }

    const profiles = ((data || []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id || ""),
      proName: String(row.pro_name || ""),
      age: String(row.age || ""),
      proTitle: String(row.pro_title || ""),
      bio: String(row.bio || ""),
      tags: String(row.tags || "")
        .split(/[·\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
      compat: Number(row.compat || 95),
      matchGift: String(row.match_gift || ""),
      couponCode: String(row.coupon_code || ""),
      photo: String(row.photo_url || ""),
      address: String(row.address || ""),
      phone: String(row.phone || ""),
      website: String(row.website || ""),
      waPhone: String(row.wa_phone || "").replace(/[^0-9]/g, ""),
    }));

    return NextResponse.json({ profiles, frequency, citySlug });
  } catch (error) {
    console.error("[privilege/tinder-profiles] unexpected", error);
    return NextResponse.json({ profiles: [], frequency: 3 });
  }
}
