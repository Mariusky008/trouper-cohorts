import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";

type SyncOfferInput = {
  city?: string;
  sphereKey?: string;
  sphereLabel?: string;
  metier?: string;
  companyName?: string;
  privilegeBadge?: string;
  logoUrl?: string;
  categoryKey?: string;
  partnerPhone?: string;
  partnerWhatsapp?: string;
  ownerMemberId?: string;
  externalRef?: string;
  isActive?: boolean;
};

const ALLOWED_SPHERES = new Set(["sante", "habitat", "digital", "mariage", "finance"]);

function trim(value: unknown): string {
  return String(value || "").trim();
}

function inferCategoryFromSphere(sphere: string): string {
  const value = trim(sphere).toLowerCase();
  if (value === "habitat") return "maison";
  if (value === "sante") return "sante";
  return "services";
}

function isAuthorized(request: NextRequest): boolean {
  const expected = trim(process.env.MARKETPLACE_SYNC_API_KEY);
  if (!expected) return false;
  const received = trim(request.headers.get("x-marketplace-sync-key"));
  return Boolean(received && received === expected);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized sync request." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { offers?: SyncOfferInput[] } | null;
    const offers = Array.isArray(body?.offers) ? body!.offers : [];
    if (offers.length === 0) {
      return NextResponse.json({ error: "Aucune offre à synchroniser." }, { status: 400 });
    }

    const rows = offers
      .map((item) => {
        const city = trim(item.city);
        const metier = trim(item.metier);
        const sphereKey = trim(item.sphereKey).toLowerCase();
        if (!city || !metier || !ALLOWED_SPHERES.has(sphereKey)) return null;
        const companyName = trim(item.companyName);
        const privilegeBadge = trim(item.privilegeBadge);
        const logoUrl = trim(item.logoUrl);
        const externalRef = trim(item.externalRef);
        const categoryKey = trim(item.categoryKey).toLowerCase() || inferCategoryFromSphere(sphereKey);
        const status = item.isActive === false ? "occupied" : "dispo";
        return {
          city,
          city_slug: slugify(city),
          sphere_key: sphereKey,
          sphere_label: trim(item.sphereLabel) || sphereKey,
          metier,
          metier_slug: slugify(metier),
          company_name: companyName || null,
          privilege_badge: privilegeBadge || null,
          logo_url: logoUrl || null,
          category_key: categoryKey || null,
          partner_phone: trim(item.partnerPhone) || null,
          partner_whatsapp: trim(item.partnerWhatsapp) || null,
          owner_member_id: trim(item.ownerMemberId) || null,
          external_ref: externalRef || null,
          status,
          is_seeded: false,
          updated_at: new Date().toISOString(),
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Aucune offre valide dans le payload." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("human_marketplace_places").upsert(rows, {
      onConflict: "city_slug,metier_slug",
      ignoreDuplicates: false,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, synced: rows.length });
  } catch (error) {
    console.error("[marketplace/places/sync] unexpected", error);
    return NextResponse.json({ error: "Synchronisation impossible." }, { status: 500 });
  }
}
