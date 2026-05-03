import { NextRequest, NextResponse } from "next/server";
import { getScoutPortalByToken } from "@/lib/actions/human-scouts";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ActivationRow = {
  id: string;
  city: string;
  client_name: string;
  partner_name: string | null;
  place_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type PlaceRow = {
  id: string;
  city: string;
  sphere_key: string;
  metier: string;
  company_name: string | null;
  privilege_badge: string | null;
  offer_description: string | null;
  partner_offer_value_eur: number | null;
  status: string;
};

type EventLogRow = {
  id: string;
  event_type: string;
  created_at: string;
};

function txt(value: unknown) {
  return String(value || "").trim();
}

function normalizeRefCode(value: unknown) {
  return txt(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readWorkflowStatus(metadata: Record<string, unknown> | null): "pending" | "contacted" | "in_progress" | "validated" | "refused" {
  const raw = txt(metadata?.workflow_status || metadata?.ticket_status || "pending").toLowerCase();
  if (raw === "signed") return "validated";
  if (raw === "contacted") return "contacted";
  if (raw === "in_progress") return "in_progress";
  if (raw === "validated") return "validated";
  if (raw === "refused") return "refused";
  return "pending";
}

function euros(value: number) {
  return Math.round((value || 0) * 100) / 100;
}

function monthBucketKey(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function monthBucketLabel(key: string) {
  const [year, month] = key.split("-");
  const y = Number(year);
  const m = Number(month);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return "Mois";
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function previousMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function monthEndExclusive(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function firstPayoutLabel() {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const month = target.toLocaleDateString("fr-FR", { month: "long" });
  const safeMonth = month ? month.charAt(0).toUpperCase() + month.slice(1) : "Mois prochain";
  return `1er ${safeMonth}`;
}

function sphereMeta(sphereKey: string) {
  const key = txt(sphereKey).toLowerCase();
  if (key === "sante") return { icon: "🌿", color: "#00A070", sphere: "sante" };
  if (key === "habitat") return { icon: "🏠", color: "#C07800", sphere: "habitat" };
  if (key === "digital") return { icon: "💻", color: "#1D6FA4", sphere: "digital" };
  if (key === "finance") return { icon: "⚖️", color: "#6D3FCB", sphere: "finance" };
  if (key === "mariage") return { icon: "📸", color: "#B5376A", sphere: "mariage" };
  return { icon: "🎁", color: "#00A070", sphere: "all" };
}

export async function GET(request: NextRequest) {
  const tokenOrCode = txt(request.nextUrl.searchParams.get("token") || request.nextUrl.searchParams.get("code"));
  if (!tokenOrCode) {
    return NextResponse.json({ error: "Token ou code requis." }, { status: 400 });
  }

  const portal = await getScoutPortalByToken(tokenOrCode);
  if (portal.error || !portal.scout?.id || !portal.invite?.invite_token) {
    return NextResponse.json({ error: portal.error || "Scout introuvable." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const scout = portal.scout;
  const invite = portal.invite;
  const cityLabel = txt(portal.sponsor?.ville || scout.ville || "Dax");

  const refCodeCandidates = new Set<string>();
  const shortCode = normalizeRefCode(invite.short_code || "");
  if (shortCode) refCodeCandidates.add(shortCode);
  const tokenPrefix = normalizeRefCode(invite.invite_token.slice(0, 10));
  if (tokenPrefix) refCodeCandidates.add(tokenPrefix);

  const [{ data: activationsData }, { data: logsData }, { data: cityOffersData }] = await Promise.all([
    supabase
      .from("human_marketplace_landing_activations")
      .select("id,city,client_name,partner_name,place_id,created_at,metadata")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("human_scout_notification_log")
      .select("id,event_type,created_at")
      .eq("scout_id", scout.id)
      .in("event_type", ["public_apporteur_mass_share_clicked", "public_apporteur_contacts_imported"])
      .order("created_at", { ascending: false })
      .limit(1500),
    supabase
      .from("human_marketplace_places")
      .select("id,city,sphere_key,metier,company_name,privilege_badge,offer_description,partner_offer_value_eur,status")
      .eq("city", cityLabel)
      .order("updated_at", { ascending: false })
      .limit(120),
  ]);

  const activations = (activationsData as ActivationRow[] | null) || [];
  const logs = (logsData as EventLogRow[] | null) || [];
  const cityOffers = ((cityOffersData as PlaceRow[] | null) || []).filter((row) => {
    const hasContent = txt(row.company_name) || txt(row.privilege_badge) || txt(row.offer_description);
    return Boolean(hasContent);
  });
  const placeById = new Map(cityOffers.map((row) => [row.id, row]));

  const ownActivations = activations.filter((row) => {
    const metadata = row.metadata || {};
    const code = normalizeRefCode(metadata.referral_code);
    const scoutToken = txt(metadata.scout_token).toLowerCase();
    const scoutId = txt(metadata.scout_id);
    if (scoutId && scoutId === scout.id) return true;
    if (scoutToken && scoutToken === invite.invite_token.toLowerCase()) return true;
    if (code && refCodeCandidates.has(code)) return true;
    return false;
  });

  const now = new Date();
  const thisMonthStart = monthStart(now);
  const nextMonthStart = monthEndExclusive(now);
  const previousStart = previousMonthStart(now);

  const isThisMonth = (iso: string) => {
    const ms = Date.parse(iso);
    return Number.isFinite(ms) && ms >= thisMonthStart.getTime() && ms < nextMonthStart.getTime();
  };
  const isPreviousMonth = (iso: string) => {
    const ms = Date.parse(iso);
    return Number.isFinite(ms) && ms >= previousStart.getTime() && ms < thisMonthStart.getTime();
  };

  const platformDealsSignedThisMonth = activations.filter(
    (row) => isThisMonth(row.created_at) && readWorkflowStatus(row.metadata) === "validated",
  ).length;
  const myDealsSigned = ownActivations.filter((row) => readWorkflowStatus(row.metadata) === "validated").length;
  const myDealsSignedThisMonth = ownActivations.filter(
    (row) => isThisMonth(row.created_at) && readWorkflowStatus(row.metadata) === "validated",
  ).length;
  const myDealsSignedPreviousMonth = ownActivations.filter(
    (row) => isPreviousMonth(row.created_at) && readWorkflowStatus(row.metadata) === "validated",
  ).length;

  const massShareEventsThisMonth = logs.filter((row) => row.event_type === "public_apporteur_mass_share_clicked" && isThisMonth(row.created_at));
  const cataloguesSent = massShareEventsThisMonth.length;
  const conversionRatePct = cataloguesSent > 0 ? Math.round((myDealsSignedThisMonth / cataloguesSent) * 1000) / 10 : 0;

  const timelineRows = ownActivations.map((row) => {
    const place = row.place_id ? placeById.get(row.place_id) : null;
    const workflow = readWorkflowStatus(row.metadata);
    const commissionBase = Number(place?.partner_offer_value_eur || 0);
    const commissionEur = euros(commissionBase);
    return {
      id: row.id,
      created_at: row.created_at,
      client_name: txt(row.client_name) || "Client",
      partner_name: txt(row.partner_name) || txt(place?.company_name) || txt(place?.metier) || "Partenaire",
      metier: txt(place?.metier) || "Offre",
      status: workflow,
      commission_eur: commissionEur,
    };
  });

  const pipelineStatuses = new Set(["pending", "contacted", "in_progress"]);
  const pipelineEur = euros(timelineRows.filter((row) => pipelineStatuses.has(row.status)).reduce((sum, row) => sum + row.commission_eur, 0));
  const validatedEur = euros(timelineRows.filter((row) => row.status === "validated").reduce((sum, row) => sum + row.commission_eur, 0));
  const scoutPending = euros(Number(scout.pending_earnings || 0));
  const scoutPaid = euros(Number(scout.total_paid || 0));
  const walletPendingEur = Math.max(validatedEur, scoutPending);
  const totalWonEur = euros(walletPendingEur + scoutPaid);
  const thisMonthEur = euros(
    timelineRows.filter((row) => isThisMonth(row.created_at) && row.status === "validated").reduce((sum, row) => sum + row.commission_eur, 0),
  );
  const previousMonthEur = euros(
    timelineRows.filter((row) => isPreviousMonth(row.created_at) && row.status === "validated").reduce((sum, row) => sum + row.commission_eur, 0),
  );

  const offers = cityOffers.slice(0, 24).map((row) => {
    const sphere = sphereMeta(row.sphere_key);
    const privilege = txt(row.privilege_badge) || txt(row.offer_description) || "Offre privilège";
    return {
      id: row.id,
      sphere: sphere.sphere,
      icon: sphere.icon,
      color: sphere.color,
      metier: txt(row.metier) || "Offre",
      pro_name: txt(row.company_name) || txt(row.metier) || "Partenaire Popey",
      city: txt(row.city) || cityLabel,
      privilege,
      commission_hint_eur: euros(Number(row.partner_offer_value_eur || 0)),
    };
  });

  const featuredOffer = offers[0] || null;

  const monthLabelRaw = now.toLocaleDateString("fr-FR", { month: "long" });
  const monthLabel = monthLabelRaw ? monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1) : "Ce mois";

  const commissionTimeline = timelineRows.slice(0, 8).map((row) => ({
    ...row,
    status_label:
      row.status === "validated"
        ? "Valide"
        : row.status === "in_progress"
          ? "En cours"
          : row.status === "contacted"
            ? "Contacte"
            : row.status === "refused"
              ? "Refuse"
              : "En attente",
  }));

  const currentMonthKey = monthBucketKey(now.toISOString());
  const groupedByMonth = new Map<string, number>();
  timelineRows.forEach((row) => {
    if (row.status !== "validated") return;
    const key = monthBucketKey(row.created_at);
    if (!key || key === currentMonthKey) return;
    groupedByMonth.set(key, euros((groupedByMonth.get(key) || 0) + row.commission_eur));
  });
  const historyRows = Array.from(groupedByMonth.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([key, amount]) => ({
      period_label: monthBucketLabel(key),
      title: "Commissions validees",
      subtitle: "Versement mensuel",
      amount_eur: euros(amount),
    }));

  if (historyRows.length === 0 && scoutPaid > 0) {
    historyRows.push({
      period_label: "Historique",
      title: "Commissions deja versees",
      subtitle: "Total encaisse a date",
      amount_eur: scoutPaid,
    });
  }

  return NextResponse.json({
    success: true,
    scout: {
      id: scout.id,
      first_name: txt(scout.first_name),
      city: cityLabel,
      commission_rate: Number(scout.commission_rate || 0.1),
      total_paid: Number(scout.total_paid || 0),
      pending_earnings: Number(scout.pending_earnings || 0),
    },
    period: {
      month_label: monthLabel,
      payout_label: firstPayoutLabel(),
    },
    kpis: {
      platform_deals_signed_month: platformDealsSignedThisMonth,
      my_deals_signed: myDealsSigned,
      my_deals_signed_month: myDealsSignedThisMonth,
      my_deals_signed_previous_month: myDealsSignedPreviousMonth,
      catalogues_sent_month: cataloguesSent,
      conversion_rate_pct: conversionRatePct,
      wallet_pending_eur: walletPendingEur,
      wallet_pipeline_eur: pipelineEur,
      wallet_paid_total_eur: scoutPaid,
      validated_total_eur: totalWonEur,
      this_month_eur: thisMonthEur,
      previous_month_eur: previousMonthEur,
    },
    featured_offer: featuredOffer,
    offers,
    commissions: {
      timeline: commissionTimeline,
      history: historyRows,
    },
  });
}
