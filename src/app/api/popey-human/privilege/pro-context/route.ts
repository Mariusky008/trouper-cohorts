import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

// GET ?p=<cred> → contexte de l'espace pro : commerçant, stats (funnel + ROI), offre catalogue,
// paliers de fidélité, aperçu des vagues (fans par niveau), activité récente. Tout résilient.
export async function GET(request: NextRequest) {
  try {
    const cred = String(request.nextUrl.searchParams.get("p") || request.nextUrl.searchParams.get("token") || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });

    const supabase = createAdminClient();

    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("id,company_name,owner_display_name,metier,city,privilege_badge,partner_offer_value_eur,logo_url")
      .eq("id", placeId)
      .maybeSingle();
    const p = (place as Record<string, unknown>) || {};
    const merchant = {
      name: String(p.company_name || p.owner_display_name || p.metier || "Ton commerce"),
      metier: String(p.metier || ""),
      city: String(p.city || ""),
      emoji: "🏪",
    };

    // Compteurs réels.
    let reservations = 0;
    let visits = 0;
    let fans = 0;
    try {
      const { count } = await supabase.from("human_privilege_reservations").select("id", { count: "exact", head: true }).eq("place_id", placeId);
      reservations = Number(count || 0);
    } catch {
      /* résilient */
    }
    try {
      const { count } = await supabase
        .from("human_privilege_visits")
        .select("id", { count: "exact", head: true })
        .eq("place_id", placeId)
        .eq("status", "validated");
      visits = Number(count || 0);
    } catch {
      /* résilient */
    }
    try {
      const { count } = await supabase
        .from("human_privilege_alert_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("place_id", placeId)
        .eq("status", "confirmed");
      fans = Number(count || 0);
    } catch {
      /* résilient */
    }

    // Habitués = relations niveau >= 3 ; revenu après promo = somme des montants saisis.
    let habitues = 0;
    let afterEur = 0;
    try {
      const { data: rels } = await supabase
        .from("human_privilege_relationships")
        .select("level")
        .eq("place_id", placeId)
        .gte("level", 3);
      habitues = Array.isArray(rels) ? rels.length : 0;
    } catch {
      /* résilient */
    }
    try {
      const { data: amts } = await supabase
        .from("human_privilege_visits")
        .select("amount_eur")
        .eq("place_id", placeId)
        .eq("status", "validated");
      afterEur = Math.round(
        ((amts as Array<{ amount_eur: number | null }> | null) || []).reduce((a, r) => a + (Number(r.amount_eur) || 0), 0),
      );
    } catch {
      /* résilient */
    }

    // Aperçu des vagues = fans confirmés du commerçant, regroupés par niveau de relation.
    const waves = [
      { lbl: "🥇 Niveau 5", fans: 0, res: 0, prio: true },
      { lbl: "Niveau 4", fans: 0, res: 0, prio: true },
      { lbl: "Niveau 3", fans: 0, res: 0, prio: true },
      { lbl: "Niveau 1-2 · tous", fans: 0, res: 0, prio: false },
    ];
    try {
      const { data: subs } = await supabase
        .from("human_privilege_alert_subscribers")
        .select("phone")
        .eq("place_id", placeId)
        .eq("status", "confirmed")
        .limit(5000);
      const phones = ((subs as Array<{ phone: string }> | null) || []).map((s) => s.phone);
      if (phones.length) {
        const { data: rels } = await supabase
          .from("human_privilege_relationships")
          .select("member_phone,level")
          .eq("place_id", placeId)
          .in("member_phone", phones);
        const levelByPhone = new Map<string, number>();
        ((rels as Array<{ member_phone: string; level: number }> | null) || []).forEach((r) => levelByPhone.set(r.member_phone, Number(r.level) || 0));
        for (const ph of phones) {
          const lvl = levelByPhone.get(ph) || 0;
          if (lvl >= 5) waves[0].fans += 1;
          else if (lvl === 4) waves[1].fans += 1;
          else if (lvl === 3) waves[2].fans += 1;
          else waves[3].fans += 1;
        }
      }
    } catch {
      /* résilient */
    }

    // Paliers (ou défauts).
    let tiers: LoyaltyTier[] = DEFAULT_TIERS;
    try {
      const { data: tierRows } = await supabase
        .from("human_privilege_loyalty_tiers")
        .select("idx,threshold_visits,reward_text")
        .eq("place_id", placeId)
        .order("idx", { ascending: true });
      if (Array.isArray(tierRows) && tierRows.length) tiers = tierRows as LoyaltyTier[];
    } catch {
      /* résilient */
    }

    const offer = {
      product: String(p.privilege_badge || "Ton offre du mois"),
      price: p.partner_offer_value_eur ? `${p.partner_offer_value_eur} €` : "",
      status: String(p.privilege_badge || "").trim() ? "EN LIGNE" : "BROUILLON",
      emoji: "🏷️",
    };

    return NextResponse.json({
      placeId,
      merchant,
      stats: {
        habitues,
        promosEur: 0, // TODO formule à confirmer
        afterEur,
        roi: 0,
        views: 0, // TODO tracking
        want: 0, // TODO (Mes offres = localStorage côté client)
        reservations,
        visits,
        fans,
      },
      offer,
      tiers: tiers.map((t) => ({ idx: t.idx, threshold: t.threshold_visits, reward: t.reward_text })),
      waves,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
