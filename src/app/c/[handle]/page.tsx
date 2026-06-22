import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ShortLinkProps = { params: Promise<{ handle: string }> };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function slugifyCity(v: string): string {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Lien court partageable : /c/<pro_slug|id> → redirige vers le catalogue de la
// ville du commerçant, avec son référent (pour le classement).
export default async function ShortShareRedirect({ params }: ShortLinkProps) {
  const { handle: rawHandle } = await params;
  const handle = String(rawHandle || "").trim();
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
    const bySlug = await admin.from("human_marketplace_places").select(cols).eq("pro_slug", handle).maybeSingle();
    place = (bySlug.data as Row | null) || null;
  } catch {
    place = null;
  }
  if (!place && isUuid(handle)) {
    const byId = await admin.from("human_marketplace_places").select(cols).eq("id", handle).maybeSingle();
    place = (byId.data as Row | null) || null;
  }

  if (!place) redirect("/m/dax");
  const citySlug = slugifyCity(place.city || "") || "dax";
  const name = String(place.company_name || place.owner_display_name || place.metier || "Popey");
  const ref = String(place.owner_member_id || place.id);
  // → nouvelle app v3 (catalogue /m/<ville>), avec le référent du commerçant pour le classement.
  redirect(`/m/${citySlug}?ref_id=${encodeURIComponent(ref)}&ref_name=${encodeURIComponent(name)}`);
}
