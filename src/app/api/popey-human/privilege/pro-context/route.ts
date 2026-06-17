import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";
import { getCatalogueLeaderboard } from "@/lib/popey-human/catalogue-leaderboard";

export const dynamic = "force-dynamic";

// Badge de statut « mission » (repris de l'ancien espace pro) : dépend du jour de propulsion,
// des clics et des contacts déclarés. kind = code couleur côté front.
function statutBadge(clics: number, day: number | null, declared: number | null, today: number): { label: string; kind: string } {
  if (day && today < day) return { label: "⏳ Bientôt", kind: "soon" };
  if (clics === 0) return { label: "⚠️ À relancer", kind: "warn" };
  if (declared && clics >= Math.max(5, declared * 0.15)) return { label: "🚀 Au top", kind: "top" };
  return { label: "✅ Actif", kind: "ok" };
}

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
      .select("id,company_name,owner_display_name,metier,city,privilege_badge,partner_offer_value_eur,logo_url,pro_slug,owner_member_id")
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

    // Lien à partager (canal GRATUIT, le nerf de la croissance) + classement/mission de la ville.
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return "https://www.popey.academy";
      }
    })();
    const proSlug = String(p.pro_slug || "").trim();
    const shareLink = `${origin}/c/${encodeURIComponent(proSlug || placeId)}`;

    let leaderboard: unknown = null;
    try {
      const lb = await getCatalogueLeaderboard(String(p.city || "") || undefined);
      const ownerId = String(p.owner_member_id || "").trim();
      const myKey = ownerId || `place:${placeId}`;
      const myName = String(p.company_name || p.owner_display_name || "").trim().toLowerCase();
      let myIndex = -1;
      for (let i = 0; i < lb.rows.length; i += 1) {
        const r = lb.rows[i];
        if (r.ref === myKey || (ownerId && r.ref === ownerId) || (myName && r.name.trim().toLowerCase() === myName)) {
          myIndex = i;
          break;
        }
      }
      const myRow = myIndex >= 0 ? lb.rows[myIndex] : null;
      const today = new Date().getDate();
      const top = lb.rows.slice(0, 5).map((r, i) => ({
        rank: i + 1,
        name: r.name,
        clics: r.clics,
        coupons: r.coupons,
        isMe: i === myIndex,
        statut: statutBadge(r.clics, r.day, r.declared, today),
      }));
      if (myIndex >= 5 && myRow) {
        top.push({
          rank: myIndex + 1,
          name: myRow.name,
          clics: myRow.clics,
          coupons: myRow.coupons,
          isMe: true,
          statut: statutBadge(myRow.clics, myRow.day, myRow.declared, today),
        });
      }
      leaderboard = {
        monthLabel: lb.monthLabel,
        cityLabel: String(p.city || ""),
        rank: myIndex >= 0 ? myIndex + 1 : null,
        total: lb.rows.length,
        me: {
          clics: myRow?.clics ?? 0,
          coupons: myRow?.coupons ?? 0,
          declared: myRow?.declared ?? null,
          day: myRow?.day ?? null,
          statut: statutBadge(myRow?.clics ?? 0, myRow?.day ?? null, myRow?.declared ?? null, today),
        },
        rows: top,
      };
    } catch {
      leaderboard = null;
    }

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
      shareLink,
      proSlug,
      leaderboard,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
