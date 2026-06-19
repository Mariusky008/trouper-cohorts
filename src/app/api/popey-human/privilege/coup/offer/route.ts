import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164, statusForLevel } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// GET ?id=<campaignId>[&phone=Y] — données PUBLIQUES de la fiche deep-link /o/<id> (cible du message
// WhatsApp du Coup de feu) : commerçant, offre, places restantes, expiration, et — si le numéro est
// connu — le niveau de relation du visiteur (badge « accès prioritaire »). Résilient.
export async function GET(request: NextRequest) {
  try {
    const id = String(request.nextUrl.searchParams.get("id") || "").trim();
    if (!isUuid(id)) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    const phone = toE164(String(request.nextUrl.searchParams.get("phone") || ""));

    const supabase = createAdminClient();
    const { data: campaign } = await supabase
      .from("human_privilege_coup_campaigns")
      .select("id,place_id,offer_text,total_places,places_taken,status,expires_at")
      .eq("id", id)
      .maybeSingle();
    if (!campaign) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
    const c = campaign as {
      place_id: string;
      offer_text: string;
      total_places: number;
      places_taken: number;
      status: string;
      expires_at: string | null;
    };

    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("id,company_name,owner_display_name,metier,city,city_slug,logo_url,offer_photo_url")
      .eq("id", c.place_id)
      .maybeSingle();
    const p = (place as Record<string, unknown>) || {};

    const expired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
    const placesLeft = c.total_places > 0 ? Math.max(0, c.total_places - (Number(c.places_taken) || 0)) : null;
    const open = c.status === "live" && !expired && (placesLeft === null || placesLeft > 0);

    let level = 0;
    if (phone) {
      try {
        const { data: rel } = await supabase
          .from("human_privilege_relationships")
          .select("level")
          .eq("place_id", c.place_id)
          .eq("member_phone", phone)
          .maybeSingle();
        if (rel && typeof (rel as { level?: number }).level === "number") level = Number((rel as { level: number }).level) || 0;
      } catch {
        /* résilient */
      }
    }

    return NextResponse.json({
      id,
      placeId: c.place_id,
      merchant: String(p.company_name || p.owner_display_name || p.metier || "Commerçant"),
      metier: String(p.metier || ""),
      city: String(p.city || ""),
      citySlug: String(p.city_slug || ""),
      logo: String(p.logo_url || ""),
      photo: String(p.offer_photo_url || ""),
      offerText: c.offer_text,
      totalPlaces: c.total_places,
      placesTaken: Number(c.places_taken) || 0,
      placesLeft,
      expiresAt: c.expires_at,
      status: c.status,
      open,
      level,
      priority: level >= 3,
      relStatus: statusForLevel(level),
    });
  } catch {
    return NextResponse.json({ error: "Offre indisponible." }, { status: 500 });
  }
}
