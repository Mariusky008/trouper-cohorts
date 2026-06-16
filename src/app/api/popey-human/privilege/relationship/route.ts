import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164, statusForLevel, nextReward, DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// GET ?placeId=X&phone=Y → relation du membre avec ce commerçant (niveau, statut, paliers,
// prochaine récompense). Membre inconnu / pas de relation → niveau 0 (« Nouvelle rencontre »).
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const placeId = String(params.get("placeId") || "").trim();
    const phone = toE164(String(params.get("phone") || ""));
    if (!isUuid(placeId)) return NextResponse.json({ error: "Commerçant invalide." }, { status: 400 });

    const supabase = createAdminClient();

    // Paliers du commerçant (sinon défauts).
    let tiers: LoyaltyTier[] = DEFAULT_TIERS;
    const { data: tierRows } = await supabase
      .from("human_privilege_loyalty_tiers")
      .select("idx,threshold_visits,reward_text")
      .eq("place_id", placeId)
      .order("idx", { ascending: true });
    if (Array.isArray(tierRows) && tierRows.length) tiers = tierRows as LoyaltyTier[];

    let level = 0;
    if (phone) {
      const { data: rel } = await supabase
        .from("human_privilege_relationships")
        .select("level")
        .eq("place_id", placeId)
        .eq("member_phone", phone)
        .maybeSingle();
      if (rel && typeof (rel as { level?: number }).level === "number") level = Number((rel as { level: number }).level) || 0;
    }

    return NextResponse.json({
      level,
      status: statusForLevel(level),
      tiers,
      next: nextReward(level, tiers),
    });
  } catch {
    // Résilient : si les tables n'existent pas encore, on renvoie une relation « niveau 0 ».
    return NextResponse.json({ level: 0, status: statusForLevel(0), tiers: DEFAULT_TIERS, next: nextReward(0, DEFAULT_TIERS) });
  }
}
