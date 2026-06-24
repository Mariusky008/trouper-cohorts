import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { DEFAULT_TIERS, type LoyaltyTier } from "@/lib/popey-human/loyalty";
import { getCatalogueLeaderboard } from "@/lib/popey-human/catalogue-leaderboard";
import { cityChannelUrl, channelSubmitWhatsApp } from "@/lib/popey-human/channels";

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
      .select("id,company_name,owner_display_name,metier,city,city_slug,privilege_badge,partner_offer_value_eur,logo_url,pro_slug,owner_member_id")
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
    let views = 0;
    let want = 0;
    let campaignsCount = 0;
    try {
      const { count } = await supabase
        .from("human_privilege_coup_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("place_id", placeId);
      campaignsCount = Number(count || 0);
    } catch {
      /* table absente → 0 */
    }
    try {
      const { count } = await supabase.from("human_privilege_reservations").select("id", { count: "exact", head: true }).eq("place_id", placeId);
      reservations = Number(count || 0);
    } catch {
      /* résilient */
    }
    // Haut du funnel : vues + « Je veux » du mois (events priv_* émis par le catalogue v3).
    try {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const { data: evs } = await supabase
        .from("human_marketplace_events")
        .select("event_type")
        .eq("place_id", placeId)
        .gte("created_at", monthStart)
        .limit(50000);
      for (const e of (evs as Array<{ event_type: string }> | null) || []) {
        if (e.event_type === "priv_view") views += 1;
        else if (e.event_type === "priv_favorite") want += 1;
      }
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

    // ROI : promo offerte = nb visites validées × valeur de l'offre ; ROI = encaissé / promo offerte.
    const offerValueEur = Number((p as { partner_offer_value_eur?: number }).partner_offer_value_eur) || 0;
    const promosEur = Math.round(visits * offerValueEur);
    const roi = promosEur > 0 ? Math.round((afterEur / promosEur) * 10) / 10 : 0;

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

    // Activité récente RÉELLE : visites validées + réservations + avis, fusionnées (date décroissante).
    const relTime = (ts: number): string => {
      if (!Number.isFinite(ts) || ts <= 0) return "";
      const min = Math.floor((Date.now() - ts) / 60000);
      if (min < 1) return "à l'instant";
      if (min < 60) return `il y a ${min} min`;
      const h = Math.floor(min / 60);
      if (h < 24) return `il y a ${h} h`;
      const d = Math.floor(h / 24);
      if (d === 1) return "hier";
      if (d < 30) return `il y a ${d} j`;
      return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    };
    type Act = { icon: string; title: string; sub: string; ts: number };
    const acts: Act[] = [];
    try {
      const { data: vs } = await supabase
        .from("human_privilege_visits")
        .select("member_phone,validated_at,amount_eur")
        .eq("place_id", placeId)
        .eq("status", "validated")
        .order("validated_at", { ascending: false })
        .limit(10);
      const rows = (vs as Array<{ member_phone: string; validated_at: string; amount_eur: number | null }> | null) || [];
      const phones = Array.from(new Set(rows.map((r) => r.member_phone).filter(Boolean)));
      const nameByPhone = new Map<string, string>();
      if (phones.length) {
        try {
          const { data: mem } = await supabase.from("human_privilege_members").select("phone_e164,first_name").in("phone_e164", phones);
          ((mem as Array<{ phone_e164: string; first_name: string | null }> | null) || []).forEach((m) => nameByPhone.set(m.phone_e164, String(m.first_name || "")));
        } catch {
          /* résilient */
        }
      }
      for (const r of rows) {
        const nm = nameByPhone.get(r.member_phone) || "Un client";
        acts.push({ icon: "💚", title: `${nm} · visite validée`, sub: r.amount_eur ? `${r.amount_eur} € encaissés` : "+1 cœur", ts: Date.parse(r.validated_at) || 0 });
      }
    } catch {
      /* résilient */
    }
    // Réservations récentes — liste dédiée pour l'espace pro (nom du client + quand + origine), pour
    // les rendre VISIBLES (notif/section) et pas seulement noyées dans l'activité (#4).
    const maskPhone = (raw: string): string => {
      const d = String(raw || "").replace(/\D/g, "");
      return d ? `•••• ${d.slice(-2)}` : "";
    };
    const reservationsList: Array<{ name: string; phoneMasked: string; when: string; source: string; ts: number }> = [];
    try {
      const { data: rs } = await supabase
        .from("human_privilege_reservations")
        .select("member_phone,campaign_id,created_at")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false })
        .limit(20);
      const rows = (rs as Array<{ member_phone: string; campaign_id: string | null; created_at: string }> | null) || [];
      const phones = Array.from(new Set(rows.map((r) => r.member_phone).filter(Boolean)));
      const nameByPhone = new Map<string, string>();
      if (phones.length) {
        try {
          const { data: mem } = await supabase.from("human_privilege_members").select("phone_e164,first_name").in("phone_e164", phones);
          ((mem as Array<{ phone_e164: string; first_name: string | null }> | null) || []).forEach((m) => nameByPhone.set(m.phone_e164, String(m.first_name || "")));
        } catch {
          /* résilient */
        }
      }
      for (const r of rows) {
        const nm = nameByPhone.get(r.member_phone) || "Un client";
        const src = r.campaign_id ? "via un coup de feu ⚡" : "via le catalogue";
        const ts = Date.parse(r.created_at) || 0;
        reservationsList.push({ name: nm, phoneMasked: maskPhone(r.member_phone), when: relTime(ts), source: src, ts });
        acts.push({ icon: "📲", title: `${nm} · réservation`, sub: src, ts });
      }
    } catch {
      /* résilient */
    }
    try {
      const { data: cs } = await supabase
        .from("human_marketplace_place_comments")
        .select("author_name,rating,created_at")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false })
        .limit(10);
      for (const r of (cs as Array<{ author_name: string | null; rating: number | null; created_at: string }> | null) || []) {
        const stars = Math.max(0, Math.min(5, Number(r.rating) || 0));
        acts.push({ icon: "⭐", title: `Nouvel avis ${stars}/5`, sub: r.author_name ? `de ${r.author_name}` : "", ts: Date.parse(r.created_at) || 0 });
      }
    } catch {
      /* résilient */
    }
    const activity = acts
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 8)
      .map((a) => ({ icon: a.icon, title: a.title, sub: a.sub, when: relTime(a.ts) }));

    return NextResponse.json({
      placeId,
      merchant,
      stats: {
        habitues,
        promosEur,
        afterEur,
        roi,
        views,
        want,
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
      activity,
      reservationsList: reservationsList.slice(0, 12),
      reservationsCount: reservations,
      campaignsCount,
      channelUrl: cityChannelUrl(String(p.city_slug || "")),
      channelSubmitWhatsapp: channelSubmitWhatsApp(),
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
