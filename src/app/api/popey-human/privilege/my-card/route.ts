import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164, statusForLevel, nextReward, DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

// GET ?phone=Y → « Ma carte Popey » : toutes les relations actives (niveau ≥ 1) du membre, avec le nom
// du commerçant, le statut, et la prochaine récompense à débloquer. Sert le wallet de fidélité côté client.
// Résilient : membre inconnu / tables absentes → { cards: [] }.
export async function GET(request: NextRequest) {
  try {
    const phone = toE164(String(request.nextUrl.searchParams.get("phone") || ""));
    if (!phone) return NextResponse.json({ cards: [] });

    const supabase = createAdminClient();
    const { data: rels } = await supabase
      .from("human_privilege_relationships")
      .select("place_id,level")
      .eq("member_phone", phone)
      .gt("level", 0)
      .limit(200);
    const relRows = (rels as Array<{ place_id: string; level: number }> | null) || [];
    if (!relRows.length) return NextResponse.json({ cards: [] });
    const placeIds = Array.from(new Set(relRows.map((r) => r.place_id).filter(Boolean)));

    // Noms des commerçants.
    const info = new Map<string, { name: string; metier: string; city: string; citySlug: string }>();
    try {
      const { data: places } = await supabase
        .from("human_marketplace_places")
        .select("id,company_name,owner_display_name,metier,city,city_slug")
        .in("id", placeIds);
      ((places as Array<Record<string, unknown>> | null) || []).forEach((p) =>
        info.set(String(p.id), {
          name: String(p.company_name || p.owner_display_name || p.metier || "Commerçant"),
          metier: String(p.metier || ""),
          city: String(p.city || ""),
          citySlug: String(p.city_slug || ""),
        }),
      );
    } catch {
      /* résilient */
    }

    // Paliers par commerçant (sinon défauts) → prochaine récompense.
    const tiersByPlace = new Map<string, LoyaltyTier[]>();
    try {
      const { data: tierRows } = await supabase
        .from("human_privilege_loyalty_tiers")
        .select("place_id,idx,threshold_visits,reward_text")
        .in("place_id", placeIds);
      ((tierRows as Array<{ place_id: string; idx: number; threshold_visits: number; reward_text: string }> | null) || []).forEach((t) => {
        const arr = tiersByPlace.get(t.place_id) || [];
        arr.push({ idx: t.idx, threshold_visits: t.threshold_visits, reward_text: t.reward_text });
        tiersByPlace.set(t.place_id, arr);
      });
    } catch {
      /* résilient */
    }

    const cards = relRows
      .map((r) => {
        const meta = info.get(r.place_id) || { name: "Commerçant", metier: "", city: "", citySlug: "" };
        const tiers = tiersByPlace.get(r.place_id) || DEFAULT_TIERS;
        const level = Number(r.level) || 0;
        return {
          placeId: r.place_id,
          merchant: meta.name,
          metier: meta.metier,
          city: meta.city,
          citySlug: meta.citySlug,
          level,
          status: statusForLevel(level),
          next: nextReward(level, tiers),
        };
      })
      .sort((a, b) => b.level - a.level);

    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ cards: [] });
  }
}
