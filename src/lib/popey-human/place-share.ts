import { createAdminClient } from "@/lib/supabase/admin";

// Résolution d'un commerçant à partir du « handle » d'un lien court /c/<handle> (pro_slug ou id).
// Partagée par la page /c/[handle] (redirection) et sa route opengraph-image (aperçu par ville).

export function isUuidHandle(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function slugifyCity(v: string): string {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type SharePlace = { citySlug: string; cityLabel: string; name: string; ref: string };

export async function lookupSharePlace(handle: string): Promise<SharePlace | null> {
  const h = String(handle || "").trim();
  if (!h) return null;
  const admin = createAdminClient();
  type Row = {
    id: string;
    city: string | null;
    company_name: string | null;
    owner_display_name: string | null;
    metier: string | null;
    owner_member_id: string | null;
  };
  const cols = "id,city,company_name,owner_display_name,metier,owner_member_id";
  let place: Row | null = null;
  try {
    const bySlug = await admin.from("human_marketplace_places").select(cols).eq("pro_slug", h).maybeSingle();
    place = (bySlug.data as Row | null) || null;
  } catch {
    place = null;
  }
  if (!place && isUuidHandle(h)) {
    const byId = await admin.from("human_marketplace_places").select(cols).eq("id", h).maybeSingle();
    place = (byId.data as Row | null) || null;
  }
  if (!place) return null;
  return {
    citySlug: slugifyCity(place.city || "") || "dax",
    cityLabel: String(place.city || "").trim() || "ta ville",
    name: String(place.company_name || place.owner_display_name || place.metier || "Popey"),
    ref: String(place.owner_member_id || place.id),
  };
}
