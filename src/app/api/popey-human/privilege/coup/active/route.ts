import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164 } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

// GET ?city=<slug>[&phone=Y] → Coups de feu EN COURS d'une ville, pour le bandeau in-app du catalogue
// (canal gratuit, complément du push WhatsApp). Priorisés : d'abord les commerçants avec qui le membre
// a une relation (niveau décroissant), puis par récence. Résilient (tables absentes → liste vide).
export async function GET(request: NextRequest) {
  try {
    const citySlug = String(request.nextUrl.searchParams.get("city") || "").trim().toLowerCase();
    const phone = toE164(String(request.nextUrl.searchParams.get("phone") || ""));
    if (!citySlug) return NextResponse.json({ coups: [] });

    const supabase = createAdminClient();

    // Commerçants de la ville.
    const { data: places } = await supabase
      .from("human_marketplace_places")
      .select("id,company_name,owner_display_name,metier")
      .eq("city_slug", citySlug)
      .limit(500);
    const placeRows = (places as Array<{ id: string; company_name: string | null; owner_display_name: string | null; metier: string | null }> | null) || [];
    if (!placeRows.length) return NextResponse.json({ coups: [] });
    const nameById = new Map<string, string>();
    placeRows.forEach((p) => nameById.set(p.id, String(p.company_name || p.owner_display_name || p.metier || "Commerçant")));
    const placeIds = placeRows.map((p) => p.id);

    // Campagnes live de ces commerçants.
    let camps: Array<{ id: string; place_id: string; offer_text: string; total_places: number; places_taken: number; expires_at: string | null; created_at: string }> = [];
    try {
      const { data } = await supabase
        .from("human_privilege_coup_campaigns")
        .select("id,place_id,offer_text,total_places,places_taken,expires_at,created_at")
        .in("place_id", placeIds)
        .eq("status", "live")
        .order("created_at", { ascending: false })
        .limit(50);
      camps = (data as typeof camps) || [];
    } catch {
      return NextResponse.json({ coups: [] });
    }

    const now = Date.now();
    const open = camps.filter((c) => {
      const notExpired = !c.expires_at || new Date(c.expires_at).getTime() > now;
      const placesLeft = c.total_places > 0 ? c.total_places - (Number(c.places_taken) || 0) : 1;
      return notExpired && placesLeft > 0;
    });

    // Niveau de relation du membre (priorité).
    const levelByPlace = new Map<string, number>();
    if (phone && open.length) {
      try {
        const { data: rels } = await supabase
          .from("human_privilege_relationships")
          .select("place_id,level")
          .eq("member_phone", phone)
          .in(
            "place_id",
            open.map((c) => c.place_id),
          );
        ((rels as Array<{ place_id: string; level: number }> | null) || []).forEach((r) => levelByPlace.set(r.place_id, Number(r.level) || 0));
      } catch {
        /* résilient */
      }
    }

    const coups = open
      .map((c) => {
        const level = levelByPlace.get(c.place_id) || 0;
        return {
          id: c.id,
          placeId: c.place_id,
          merchant: nameById.get(c.place_id) || "Commerçant",
          offerText: c.offer_text,
          placesLeft: c.total_places > 0 ? Math.max(0, c.total_places - (Number(c.places_taken) || 0)) : null,
          expiresAt: c.expires_at,
          level,
          priority: level >= 3,
          _created: c.created_at,
        };
      })
      .sort((a, b) => b.level - a.level || (a._created < b._created ? 1 : -1))
      .slice(0, 6)
      .map(({ _created, ...rest }) => rest);

    return NextResponse.json({ coups });
  } catch {
    return NextResponse.json({ coups: [] });
  }
}
