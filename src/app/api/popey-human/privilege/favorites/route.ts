import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function trim(value: unknown): string {
  return String(value || "").trim();
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toWhatsAppDigits(raw: string): string {
  let digits = trim(raw).replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("0")) digits = `33${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return "";
  return digits;
}

function toE164(raw: string): string {
  const digits = toWhatsAppDigits(raw);
  if (!digits) return "";
  return `+${digits}`;
}

function normalizePlaceIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const unique = new Set<string>();
  input.forEach((value) => {
    const id = trim(value).slice(0, 64);
    if (!id) return;
    unique.add(id);
  });
  return Array.from(unique).slice(0, 200);
}

export async function GET(request: NextRequest) {
  try {
    const cityInput = trim(request.nextUrl.searchParams.get("city") || request.nextUrl.searchParams.get("ville") || "dax");
    const clientPhoneInput = trim(request.nextUrl.searchParams.get("clientPhone") || request.nextUrl.searchParams.get("client_phone"));
    const citySlug = slugify(cityInput || "dax");
    const clientPhoneE164 = toE164(clientPhoneInput);

    if (!clientPhoneE164) {
      return NextResponse.json({ error: "clientPhone requis." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("human_privilege_swipe_favorites")
      .select("favorite_place_ids,updated_at")
      .eq("city_slug", citySlug)
      .eq("client_phone_e164", clientPhoneE164)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      citySlug,
      clientPhoneE164,
      favorites: ((data?.favorite_place_ids || []) as unknown[]).map((v) => trim(v)).filter(Boolean),
      updatedAt: data?.updated_at || null,
    });
  } catch (error) {
    console.error("[privilege/favorites] unexpected", error);
    return NextResponse.json({ error: "Impossible de charger les favoris." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          city?: string;
          ville?: string;
          clientPhone?: string;
          client_phone?: string;
          placeIds?: unknown;
          updatedAt?: number;
        }
      | null;

    const cityInput = trim(body?.city || body?.ville || "dax");
    const clientPhoneInput = trim(body?.clientPhone || body?.client_phone);
    const placeIds = normalizePlaceIds((body as Record<string, unknown> | null)?.placeIds);

    const citySlug = slugify(cityInput || "dax");
    const clientPhoneE164 = toE164(clientPhoneInput);

    if (!clientPhoneE164) {
      return NextResponse.json({ error: "clientPhone requis." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("human_privilege_swipe_favorites")
      .upsert(
        {
          city_slug: citySlug,
          client_phone_e164: clientPhoneE164,
          favorite_place_ids: placeIds,
          updated_at: nowIso,
        },
        { onConflict: "city_slug,client_phone_e164" },
      )
      .select("favorite_place_ids,updated_at")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      citySlug,
      clientPhoneE164,
      favorites: ((data?.favorite_place_ids || []) as unknown[]).map((v) => trim(v)).filter(Boolean),
      updatedAt: data?.updated_at || nowIso,
    });
  } catch (error) {
    console.error("[privilege/favorites] unexpected", error);
    return NextResponse.json({ error: "Impossible de sauvegarder les favoris." }, { status: 500 });
  }
}

