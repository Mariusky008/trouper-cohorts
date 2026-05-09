"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";

type HumanCashKind = "encaissement" | "decaissement";
type HumanCashSourceType = "lead" | "signal" | "manual";
type MarketplaceRequestKind = "apporteur_payout" | "pro_settlement";
type MarketplaceRequestStatus = "pending" | "processed" | "rejected";
type MarketplacePaymentStatus = "pending" | "requested" | "paid" | "cancelled";
type LedgerRowKind = "apporteur" | "popey";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type HumanCashEvent = {
  id: string;
  member_id: string;
  source_type: HumanCashSourceType;
  source_id: string | null;
  kind: HumanCashKind;
  amount: number;
  description: string;
  event_date: string;
  created_at: string;
  updated_at: string;
};

type HumanCommission = {
  id: string;
  lead_id: string;
  signed_amount: number;
  commission_amount: number;
  payer_member_id: string;
  receiver_member_id: string;
  payment_status: "pending" | "paid" | "cancelled";
  created_at: string;
  updated_at: string;
};

type MarketplaceLedgerRow = {
  id: string;
  activation_id: string;
  row_kind: LedgerRowKind;
  period_month: string;
  ticket_code: string;
  city: string | null;
  payer_member_id: string | null;
  receiver_member_id: string | null;
  receiver_scout_id: string | null;
  receiver_name: string | null;
  amount_eur: number;
  decision_status: "approved" | "rejected";
  payment_status: MarketplacePaymentStatus;
  payment_requested_at: string | null;
  paid_at: string | null;
  note: string | null;
  created_at: string;
};

type MarketplaceRequestRow = {
  id: string;
  member_id: string;
  period_month: string;
  request_kind: MarketplaceRequestKind;
  requested_amount_eur: number;
  status: MarketplaceRequestStatus;
  note: string | null;
  processed_note: string | null;
  processed_at: string | null;
  created_at: string;
};

type AdminLedgerLine = {
  id: string;
  activationId: string;
  ticketCode: string;
  rowKind: LedgerRowKind;
  city: string;
  amountEur: number;
  decisionStatus: "approved" | "rejected";
  paymentStatus: MarketplacePaymentStatus;
  payerMemberId: string | null;
  payerLabel: string;
  receiverLabel: string;
  paymentRequestedAt: string | null;
  paidAt: string | null;
  note: string | null;
  createdAt: string;
};

type AdminRequestLine = {
  id: string;
  memberId: string;
  memberLabel: string;
  requestKind: MarketplaceRequestKind;
  requestedAmountEur: number;
  status: MarketplaceRequestStatus;
  note: string | null;
  processedNote: string | null;
  createdAt: string;
  processedAt: string | null;
};

type AdminProRule = {
  id: string;
  proMemberId: string;
  proLabel: string;
  popeyFeeEur: number;
  updatedAt: string;
};

type AcceptedMarketplaceOfferLite = {
  id: string;
  full_name: string | null;
  metier: string | null;
  city: string | null;
  assigned_member_id: string | null;
  place:
    | { id?: string | null; owner_member_id: string | null; metier?: string | null; city?: string | null }
    | Array<{ id?: string | null; owner_member_id: string | null; metier?: string | null; city?: string | null }>
    | null;
};

function firstDayOfCurrentMonthIso() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return start.toISOString().slice(0, 10);
}

function sanitizePeriodMonth(periodRaw: string | null | undefined) {
  const value = String(periodRaw || "").trim();
  if (!/^\d{4}-\d{2}$/.test(value)) return firstDayOfCurrentMonthIso();
  return `${value}-01`;
}

function asMoney(value: number | string | null | undefined) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

function sumRows(rows: MarketplaceLedgerRow[]) {
  return asMoney(rows.reduce((sum, row) => sum + asMoney(row.amount_eur), 0));
}

export async function getMyCashSummary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Session requise.",
      events: [] as HumanCashEvent[],
      commissions: [] as HumanCommission[],
      commissionsInbound: [] as HumanCommission[],
      commissionsOutbound: [] as HumanCommission[],
      totals: { in: 0, out: 0, net: 0 },
      commissionsTotals: { pending: 0, paid: 0, total: 0 },
      commissionsOutboundTotals: { pending: 0, paid: 0, cancelled: 0, total: 0 },
      marketplace: {
        enabled: false,
        currentPeriodMonth: firstDayOfCurrentMonthIso(),
        inboundRows: [] as MarketplaceLedgerRow[],
        outboundRows: [] as MarketplaceLedgerRow[],
        requests: [] as MarketplaceRequestRow[],
        totals: {
          inboundPending: 0,
          inboundRequested: 0,
          inboundPaid: 0,
          outboundPending: 0,
          outboundRequested: 0,
          outboundPaid: 0,
        },
      },
    };
  }

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) {
    return {
      error: "Profil Popey Human introuvable.",
      events: [] as HumanCashEvent[],
      commissions: [] as HumanCommission[],
      commissionsInbound: [] as HumanCommission[],
      commissionsOutbound: [] as HumanCommission[],
      totals: { in: 0, out: 0, net: 0 },
      commissionsTotals: { pending: 0, paid: 0, total: 0 },
      commissionsOutboundTotals: { pending: 0, paid: 0, cancelled: 0, total: 0 },
      marketplace: {
        enabled: false,
        currentPeriodMonth: firstDayOfCurrentMonthIso(),
        inboundRows: [] as MarketplaceLedgerRow[],
        outboundRows: [] as MarketplaceLedgerRow[],
        requests: [] as MarketplaceRequestRow[],
        totals: {
          inboundPending: 0,
          inboundRequested: 0,
          inboundPaid: 0,
          outboundPending: 0,
          outboundRequested: 0,
          outboundPaid: 0,
        },
      },
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data }, { data: commissionsInboundData }, { data: commissionsOutboundData }] = await Promise.all([
    supabaseAdmin
      .from("human_cash_events")
      .select("id,member_id,source_type,source_id,kind,amount,description,event_date,created_at,updated_at")
      .eq("member_id", myMember.id)
      .order("event_date", { ascending: false })
      .limit(300),
    supabaseAdmin
      .from("human_commissions")
      .select("id,lead_id,signed_amount,commission_amount,payer_member_id,receiver_member_id,payment_status,created_at,updated_at")
      .eq("receiver_member_id", myMember.id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabaseAdmin
      .from("human_commissions")
      .select("id,lead_id,signed_amount,commission_amount,payer_member_id,receiver_member_id,payment_status,created_at,updated_at")
      .eq("payer_member_id", myMember.id)
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const events = (data as HumanCashEvent[] | null) || [];
  const commissionsInbound = (commissionsInboundData as HumanCommission[] | null) || [];
  const commissionsOutbound = (commissionsOutboundData as HumanCommission[] | null) || [];
  const commissions = commissionsInbound;
  const totalIn = events.filter((event) => event.kind === "encaissement").reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const totalOut = events.filter((event) => event.kind === "decaissement").reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const commissionsPending = commissionsInbound
    .filter((commission) => commission.payment_status === "pending")
    .reduce((sum, commission) => sum + Number(commission.commission_amount || 0), 0);
  const commissionsPaid = commissionsInbound
    .filter((commission) => commission.payment_status === "paid")
    .reduce((sum, commission) => sum + Number(commission.commission_amount || 0), 0);
  const commissionsOutboundPending = commissionsOutbound
    .filter((commission) => commission.payment_status === "pending")
    .reduce((sum, commission) => sum + Number(commission.commission_amount || 0), 0);
  const commissionsOutboundPaid = commissionsOutbound
    .filter((commission) => commission.payment_status === "paid")
    .reduce((sum, commission) => sum + Number(commission.commission_amount || 0), 0);
  const commissionsOutboundCancelled = commissionsOutbound
    .filter((commission) => commission.payment_status === "cancelled")
    .reduce((sum, commission) => sum + Number(commission.commission_amount || 0), 0);

  const currentPeriodMonth = firstDayOfCurrentMonthIso();
  const [inboundLedgerResult, outboundLedgerResult, requestsResult] = await Promise.all([
    supabaseAdmin
      .from("human_marketplace_commission_ledger")
      .select(
        "id,activation_id,row_kind,period_month,ticket_code,city,payer_member_id,receiver_member_id,receiver_scout_id,receiver_name,amount_eur,decision_status,payment_status,payment_requested_at,paid_at,note,created_at",
      )
      .eq("period_month", currentPeriodMonth)
      .eq("row_kind", "apporteur")
      .eq("receiver_member_id", myMember.id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("human_marketplace_commission_ledger")
      .select(
        "id,activation_id,row_kind,period_month,ticket_code,city,payer_member_id,receiver_member_id,receiver_scout_id,receiver_name,amount_eur,decision_status,payment_status,payment_requested_at,paid_at,note,created_at",
      )
      .eq("period_month", currentPeriodMonth)
      .eq("payer_member_id", myMember.id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("human_marketplace_commission_requests")
      .select("id,member_id,period_month,request_kind,requested_amount_eur,status,note,processed_note,processed_at,created_at")
      .eq("member_id", myMember.id)
      .eq("period_month", currentPeriodMonth)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const tableMissing = [inboundLedgerResult.error, outboundLedgerResult.error, requestsResult.error]
    .filter(Boolean)
    .map((error) => String(error?.message || "").toLowerCase())
    .some(
      (message) =>
        message.includes("human_marketplace_commission_ledger") ||
        message.includes("human_marketplace_commission_requests") ||
        message.includes("does not exist"),
    );

  const marketplaceEnabled = !tableMissing && !inboundLedgerResult.error && !outboundLedgerResult.error && !requestsResult.error;
  const inboundRows = marketplaceEnabled ? ((inboundLedgerResult.data as MarketplaceLedgerRow[] | null) || []) : [];
  const outboundRows = marketplaceEnabled
    ? (((outboundLedgerResult.data as MarketplaceLedgerRow[] | null) || []).filter((row) => row.decision_status === "approved") as MarketplaceLedgerRow[])
    : [];
  const requests = marketplaceEnabled ? ((requestsResult.data as MarketplaceRequestRow[] | null) || []) : [];

  const inboundPendingRows = inboundRows.filter((row) => row.payment_status === "pending");
  const inboundRequestedRows = inboundRows.filter((row) => row.payment_status === "requested");
  const inboundPaidRows = inboundRows.filter((row) => row.payment_status === "paid");
  const outboundPendingRows = outboundRows.filter((row) => row.payment_status === "pending");
  const outboundRequestedRows = outboundRows.filter((row) => row.payment_status === "requested");
  const outboundPaidRows = outboundRows.filter((row) => row.payment_status === "paid");

  return {
    error: null as string | null,
    events,
    commissions,
    commissionsInbound,
    commissionsOutbound,
    totals: {
      in: totalIn,
      out: totalOut,
      net: totalIn - totalOut,
    },
    commissionsTotals: {
      pending: commissionsPending,
      paid: commissionsPaid,
      total: commissionsPending + commissionsPaid,
    },
    commissionsOutboundTotals: {
      pending: commissionsOutboundPending,
      paid: commissionsOutboundPaid,
      cancelled: commissionsOutboundCancelled,
      total: commissionsOutboundPending + commissionsOutboundPaid + commissionsOutboundCancelled,
    },
    marketplace: {
      enabled: marketplaceEnabled,
      currentPeriodMonth,
      inboundRows,
      outboundRows,
      requests,
      totals: {
        inboundPending: sumRows(inboundPendingRows),
        inboundRequested: sumRows(inboundRequestedRows),
        inboundPaid: sumRows(inboundPaidRows),
        outboundPending: sumRows(outboundPendingRows),
        outboundRequested: sumRows(outboundRequestedRows),
        outboundPaid: sumRows(outboundPaidRows),
      },
    },
  };
}

export async function addMyCashEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) return { error: "Profil Popey Human introuvable." };

  const kind = String(formData.get("kind") || "") as HumanCashKind;
  const amountRaw = String(formData.get("amount") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const sourceType = String(formData.get("source_type") || "manual") as HumanCashSourceType;
  const sourceIdRaw = String(formData.get("source_id") || "").trim();
  const eventDate = String(formData.get("event_date") || "").trim();

  if (!["encaissement", "decaissement"].includes(kind)) return { error: "Type de mouvement invalide." };
  if (!["lead", "signal", "manual"].includes(sourceType)) return { error: "Source invalide." };
  if (!description) return { error: "Description requise." };

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < 0) return { error: "Montant invalide." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_cash_events").insert({
    member_id: myMember.id,
    source_type: sourceType,
    source_id: sourceIdRaw || null,
    kind,
    amount,
    description,
    event_date: eventDate || new Date().toISOString().slice(0, 10),
  });
  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/cash");
  return { success: true };
}

export async function addMyCashEventAction(formData: FormData): Promise<void> {
  await addMyCashEvent(formData);
}

export async function requestMyCashPayout(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) return { error: "Profil Popey Human introuvable." };

  const requestKindRaw = String(formData.get("request_kind") || "apporteur_payout").trim();
  const requestKind: MarketplaceRequestKind = requestKindRaw === "pro_settlement" ? "pro_settlement" : "apporteur_payout";
  const note = String(formData.get("request_note") || "").trim();
  const requestedAmountRaw = String(formData.get("requested_amount") || "").trim();
  const requestedAmount = Number(requestedAmountRaw || "0");
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return { error: "Montant de demande invalide." };
  }

  const supabaseAdmin = createAdminClient();
  const monthStart = firstDayOfCurrentMonthIso();
  const [meDataResult, dueRowsResult] = await Promise.all([
    supabaseAdmin.from("human_members").select("first_name,last_name").eq("id", myMember.id).maybeSingle(),
    requestKind === "apporteur_payout"
      ? supabaseAdmin
          .from("human_marketplace_commission_ledger")
          .select("id,amount_eur")
          .eq("period_month", monthStart)
          .eq("row_kind", "apporteur")
          .eq("receiver_member_id", myMember.id)
          .eq("decision_status", "approved")
          .in("payment_status", ["pending", "requested"])
      : supabaseAdmin
          .from("human_marketplace_commission_ledger")
          .select("id,amount_eur")
          .eq("period_month", monthStart)
          .eq("payer_member_id", myMember.id)
          .eq("decision_status", "approved")
          .in("payment_status", ["pending", "requested"]),
  ]);

  if (dueRowsResult.error) {
    const message = String(dueRowsResult.error.message || "").toLowerCase();
    if (message.includes("human_marketplace_commission_ledger") || message.includes("does not exist")) {
      return { error: "Tables commissions Sprint 1 non disponibles. Exécute d'abord la migration SQL." };
    }
    return { error: dueRowsResult.error.message || "Impossible de préparer la demande." };
  }

  const dueRows = (((dueRowsResult.data as Array<{ id: string; amount_eur: number }> | null) || []).filter((row) => row.id)) as Array<{
    id: string;
    amount_eur: number;
  }>;
  const dueAmount = asMoney(dueRows.reduce((sum, row) => sum + asMoney(row.amount_eur), 0));
  if (dueAmount <= 0) {
    return {
      error:
        requestKind === "apporteur_payout"
          ? "Aucune commission apporteur à réclamer sur le mois en cours."
          : "Aucune commission due par votre compte pro sur le mois en cours.",
    };
  }
  if (requestedAmount > dueAmount) {
    return { error: `Montant trop élevé. Maximum disponible: ${dueAmount.toLocaleString("fr-FR")}€.` };
  }

  const pendingRequestResult = await supabaseAdmin
    .from("human_marketplace_commission_requests")
    .select("id")
    .eq("member_id", myMember.id)
    .eq("period_month", monthStart)
    .eq("request_kind", requestKind)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingRequestResult.error) {
    const message = String(pendingRequestResult.error.message || "").toLowerCase();
    if (message.includes("human_marketplace_commission_requests") || message.includes("does not exist")) {
      return { error: "Tables commissions Sprint 1 non disponibles. Exécute d'abord la migration SQL." };
    }
    return { error: pendingRequestResult.error.message || "Impossible de préparer la demande." };
  }

  if (pendingRequestResult.data?.id) {
    const { error } = await supabaseAdmin
      .from("human_marketplace_commission_requests")
      .update({
        requested_amount_eur: requestedAmount,
        note: note || null,
      })
      .eq("id", pendingRequestResult.data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabaseAdmin.from("human_marketplace_commission_requests").insert({
      member_id: myMember.id,
      period_month: monthStart,
      request_kind: requestKind,
      requested_amount_eur: requestedAmount,
      status: "pending",
      note: note || null,
    });
    if (error) return { error: error.message };
  }

  const dueRowIds = dueRows.map((row) => row.id);
  if (dueRowIds.length > 0) {
    const { error } = await supabaseAdmin
      .from("human_marketplace_commission_ledger")
      .update({
        payment_status: "requested",
        payment_requested_at: new Date().toISOString(),
      })
      .in("id", dueRowIds)
      .eq("decision_status", "approved")
      .in("payment_status", ["pending", "requested"]);
    if (error) return { error: error.message };
  }

  const [{ data: adminsData }, meData] = await Promise.all([
    supabaseAdmin.from("admins").select("user_id"),
    meDataResult,
  ]);
  const requesterName = [meData.data?.first_name, meData.data?.last_name].filter(Boolean).join(" ").trim() || "Membre Popey Human";
  const adminUserIds = ((adminsData as Array<{ user_id: string }> | null) || []).map((row) => row.user_id);
  const { data: adminMembers } = await supabaseAdmin.from("human_members").select("id,user_id").in("user_id", adminUserIds);
  const adminMemberIds = ((adminMembers as Array<{ id: string; user_id: string }> | null) || []).map((row) => row.id);
  const requestLabel = requestKind === "apporteur_payout" ? "virement apporteur" : "règlement pro";
  const notificationPayload = [
    {
      member_id: myMember.id,
      type: "personnelle",
      title: "Demande envoyée",
      message: `Votre demande ${requestLabel} de ${requestedAmount.toLocaleString("fr-FR")}€ a été transmise à l'admin.`,
      impact: `cash:${requestKind}`,
      is_read: false,
    },
    ...adminMemberIds.map((memberId) => ({
      member_id: memberId,
      type: "personnelle",
      title: "Demande à traiter",
      message: `${requesterName} envoie une demande ${requestLabel} de ${requestedAmount.toLocaleString("fr-FR")}€.`,
      impact: `cash:${requestKind}:admin`,
      is_read: false,
    })),
  ];
  await supabaseAdmin.from("human_notifications").insert(notificationPayload);

  revalidatePath("/popey-human/app/cash");
  revalidatePath("/popey-human/app/notifications");
  revalidatePath("/admin/humain/notifications");
  revalidatePath("/admin/humain/commissions");
  return {
    success: true,
    message: requestKind === "apporteur_payout" ? "Demande de virement apporteur envoyée." : "Demande de règlement pro envoyée.",
  };
}

export async function requestMyCashPayoutAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/cash");
  const result = await requestMyCashPayout(formData);
  if ("error" in result) {
    redirect(withCashStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withCashStatus(currentUrl, "success", result.message || "Demande envoyée."));
}

export async function createCommissionForSignedLead(input: {
  leadId: string;
  ownerMemberId: string | null;
  sourceMemberId: string | null;
  signedAmount: number | null;
}) {
  const ownerId = input.ownerMemberId || "";
  const sourceId = input.sourceMemberId || "";
  const signedAmount = Number(input.signedAmount || 0);

  if (!ownerId || !sourceId || ownerId === sourceId) return { success: true, skipped: true, commissionAmount: 0 };
  if (!Number.isFinite(signedAmount) || signedAmount <= 0) return { success: true, skipped: true, commissionAmount: 0 };

  const commissionAmount = Math.round(signedAmount * 0.1 * 100) / 100;
  if (commissionAmount <= 0) return { success: true, skipped: true, commissionAmount: 0 };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_commissions")
    .upsert(
      {
        lead_id: input.leadId,
        signed_amount: signedAmount,
        commission_amount: commissionAmount,
        payer_member_id: ownerId,
        receiver_member_id: sourceId,
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lead_id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/cash");
  revalidatePath("/admin/humain/cockpit");
  revalidatePath("/admin/humain/commissions");
  return { success: true, commissionAmount };
}

function labelFromMember(
  member: { id: string; first_name: string | null; last_name: string | null; metier?: string | null } | undefined,
  fallback: string,
) {
  if (!member) return fallback;
  const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
  const metier = String(member.metier || "").trim();
  return [full || fallback, metier || null].filter(Boolean).join(" · ");
}

function offerPlaceValue(offer: AcceptedMarketplaceOfferLite) {
  return Array.isArray(offer.place) ? offer.place[0] || null : offer.place;
}

export async function getAdminHumanCommissions(periodMonth?: string) {
  const admin = await requireAdminUser();
  if ("error" in admin) {
    return {
      error: admin.error,
      periodMonth: sanitizePeriodMonth(periodMonth),
      ledger: [] as AdminLedgerLine[],
      requests: [] as AdminRequestLine[],
      proRules: [] as AdminProRule[],
      members: [] as Array<{ id: string; label: string }>,
      kpis: {
        apporteurPending: 0,
        apporteurRequested: 0,
        proOutstanding: 0,
        popeyOutstanding: 0,
        paidThisMonth: 0,
      },
    };
  }

  const monthStart = sanitizePeriodMonth(periodMonth);
  const supabaseAdmin = createAdminClient();
  const [ledgerResult, requestsResult, legacyRulesResult, placeRulesResult, membersResult, acceptedOffersResult, placesResult] = await Promise.all([
    supabaseAdmin
      .from("human_marketplace_commission_ledger")
      .select(
        "id,activation_id,row_kind,period_month,ticket_code,city,payer_member_id,receiver_member_id,receiver_scout_id,receiver_name,amount_eur,decision_status,payment_status,payment_requested_at,paid_at,note,created_at",
      )
      .eq("period_month", monthStart)
      .order("created_at", { ascending: false })
      .limit(1200),
    supabaseAdmin
      .from("human_marketplace_commission_requests")
      .select("id,member_id,period_month,request_kind,requested_amount_eur,status,note,processed_note,processed_at,created_at")
      .eq("period_month", monthStart)
      .order("created_at", { ascending: false })
      .limit(400),
    supabaseAdmin
      .from("human_marketplace_pro_commission_rules")
      .select("id,pro_member_id,popey_fee_eur,updated_at")
      .order("updated_at", { ascending: false })
      .limit(400),
    supabaseAdmin
      .from("human_marketplace_place_commission_rules")
      .select("id,place_id,popey_fee_eur,updated_at")
      .order("updated_at", { ascending: false })
      .limit(400),
    supabaseAdmin.from("human_members").select("id,user_id,first_name,last_name,metier").limit(2500),
    supabaseAdmin
      .from("human_marketplace_offers")
      .select(
        "id,full_name,metier,city,assigned_member_id,place:human_marketplace_places!human_marketplace_offers_place_id_fkey(id,owner_member_id,metier,city)",
      )
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabaseAdmin.from("human_marketplace_places").select("id,city,metier").limit(2000),
  ]);

  const maybeMissingMessage = [ledgerResult.error, requestsResult.error, legacyRulesResult.error, placeRulesResult.error]
    .filter(Boolean)
    .map((error) => String(error?.message || "").toLowerCase())
    .find(
      (message) =>
        message.includes("human_marketplace_commission_ledger") ||
        message.includes("human_marketplace_commission_requests") ||
        message.includes("human_marketplace_pro_commission_rules") ||
        message.includes("human_marketplace_place_commission_rules") ||
        message.includes("does not exist"),
    );
  if (maybeMissingMessage) {
    return {
      error:
        "Tables commissions indisponibles. Exécute les migrations SQL `20260504202000_create_marketplace_commission_ledger_v1.sql` puis `20260505103000_add_marketplace_place_commission_rules.sql`.",
      periodMonth: monthStart,
      ledger: [] as AdminLedgerLine[],
      requests: [] as AdminRequestLine[],
      proRules: [] as AdminProRule[],
      members: [] as Array<{ id: string; label: string }>,
      kpis: {
        apporteurPending: 0,
        apporteurRequested: 0,
        proOutstanding: 0,
        popeyOutstanding: 0,
        paidThisMonth: 0,
      },
    };
  }
  if (
    ledgerResult.error ||
    requestsResult.error ||
    legacyRulesResult.error ||
    placeRulesResult.error ||
    membersResult.error ||
    acceptedOffersResult.error ||
    placesResult.error
  ) {
    return {
      error:
        ledgerResult.error?.message ||
        requestsResult.error?.message ||
        legacyRulesResult.error?.message ||
        placeRulesResult.error?.message ||
        membersResult.error?.message ||
        acceptedOffersResult.error?.message ||
        placesResult.error?.message ||
        "Chargement commissions impossible.",
      periodMonth: monthStart,
      ledger: [] as AdminLedgerLine[],
      requests: [] as AdminRequestLine[],
      proRules: [] as AdminProRule[],
      members: [] as Array<{ id: string; label: string }>,
      kpis: {
        apporteurPending: 0,
        apporteurRequested: 0,
        proOutstanding: 0,
        popeyOutstanding: 0,
        paidThisMonth: 0,
      },
    };
  }

  const members =
    ((membersResult.data as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null; metier: string | null }> | null) ||
      []);
  const memberById = new Map(members.map((member) => [member.id, member]));
  const acceptedOffers = (acceptedOffersResult.data as AcceptedMarketplaceOfferLite[] | null) || [];
  const marketplacePlaces = ((placesResult.data as Array<{ id: string; city: string | null; metier: string | null }> | null) || []);
  const placeById = new Map(marketplacePlaces.map((place) => [place.id, place]));
  const offerOptionsMap = new Map<string, { id: string; label: string }>();
  acceptedOffers.forEach((offer) => {
    const placeValue = offerPlaceValue(offer);
    const placeId = String(placeValue?.id || "").trim();
    const proName = String(offer.full_name || "").trim() || "Pro accepté";
    const metier = String(placeValue?.metier || offer.metier || "").trim();
    const city = String(placeValue?.city || offer.city || "").trim();
    if (placeId) {
      const label = [proName, metier, city].filter(Boolean).join(" · ");
      if (!offerOptionsMap.has(`place:${placeId}`)) {
        offerOptionsMap.set(`place:${placeId}`, { id: `place:${placeId}`, label });
      }
      return;
    }
    const fallbackLabel = [proName, metier, city, "offre sans place"].filter(Boolean).join(" · ");
    offerOptionsMap.set(`offer:${offer.id}`, { id: `offer:${offer.id}`, label: fallbackLabel });
  });
  const memberOptions = Array.from(offerOptionsMap.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));

  const ledgerRows = ((ledgerResult.data as MarketplaceLedgerRow[] | null) || []).map((row) => {
    const payerMember = row.payer_member_id ? memberById.get(row.payer_member_id) : undefined;
    const receiverMember = row.receiver_member_id ? memberById.get(row.receiver_member_id) : undefined;
    return {
      id: row.id,
      activationId: row.activation_id,
      ticketCode: row.ticket_code,
      rowKind: row.row_kind,
      city: String(row.city || "").trim() || "—",
      amountEur: asMoney(row.amount_eur),
      decisionStatus: row.decision_status,
      paymentStatus: row.payment_status,
      payerMemberId: row.payer_member_id,
      payerLabel: labelFromMember(payerMember, row.payer_member_id || "Pro non renseigné"),
      receiverLabel:
        row.row_kind === "popey"
          ? "Popey"
          : labelFromMember(receiverMember, String(row.receiver_name || row.receiver_scout_id || "Apporteur")),
      paymentRequestedAt: row.payment_requested_at,
      paidAt: row.paid_at,
      note: row.note,
      createdAt: row.created_at,
    } as AdminLedgerLine;
  });

  const requests = ((requestsResult.data as MarketplaceRequestRow[] | null) || []).map((request) => ({
    id: request.id,
    memberId: request.member_id,
    memberLabel: labelFromMember(memberById.get(request.member_id), request.member_id),
    requestKind: request.request_kind,
    requestedAmountEur: asMoney(request.requested_amount_eur),
    status: request.status,
    note: request.note,
    processedNote: request.processed_note,
    createdAt: request.created_at,
    processedAt: request.processed_at,
  }));
  const rulesFromPlaces = ((placeRulesResult.data as Array<{ id: string; place_id: string; popey_fee_eur: number; updated_at: string }> | null) || [])
    .map((rule) => {
      const place = placeById.get(rule.place_id);
      const placeLabel = ["Pro marketplace", place?.metier || "", place?.city || ""]
        .filter(Boolean)
        .join(" · ");
      return {
        id: rule.id,
        proMemberId: `place:${rule.place_id}`,
        proLabel: placeLabel || `Place ${rule.place_id}`,
        popeyFeeEur: asMoney(rule.popey_fee_eur),
        updatedAt: rule.updated_at,
      } as AdminProRule;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const rulesLegacy = ((legacyRulesResult.data as Array<{ id: string; pro_member_id: string; popey_fee_eur: number; updated_at: string }> | null) || []).map(
    (rule) => ({
      id: rule.id,
      proMemberId: `member:${rule.pro_member_id}`,
      proLabel: `${labelFromMember(memberById.get(rule.pro_member_id), rule.pro_member_id)} (legacy membre)`,
      popeyFeeEur: asMoney(rule.popey_fee_eur),
      updatedAt: rule.updated_at,
    }),
  );
  const rules = [...rulesFromPlaces, ...rulesLegacy];

  const apporteurPendingRows = ledgerRows.filter((row) => row.rowKind === "apporteur" && row.paymentStatus === "pending");
  const apporteurRequestedRows = ledgerRows.filter((row) => row.rowKind === "apporteur" && row.paymentStatus === "requested");
  const proOutstandingRows = ledgerRows.filter(
    (row) => row.paymentStatus !== "paid" && row.paymentStatus !== "cancelled" && row.decisionStatus === "approved",
  );
  const popeyOutstandingRows = proOutstandingRows.filter((row) => row.rowKind === "popey");
  const paidRows = ledgerRows.filter((row) => row.paymentStatus === "paid");

  return {
    error: null as string | null,
    periodMonth: monthStart,
    ledger: ledgerRows,
    requests,
    proRules: rules,
    members: memberOptions,
    kpis: {
      apporteurPending: asMoney(apporteurPendingRows.reduce((sum, row) => sum + row.amountEur, 0)),
      apporteurRequested: asMoney(apporteurRequestedRows.reduce((sum, row) => sum + row.amountEur, 0)),
      proOutstanding: asMoney(proOutstandingRows.reduce((sum, row) => sum + row.amountEur, 0)),
      popeyOutstanding: asMoney(popeyOutstandingRows.reduce((sum, row) => sum + row.amountEur, 0)),
      paidThisMonth: asMoney(paidRows.reduce((sum, row) => sum + row.amountEur, 0)),
    },
  };
}

export async function adminSetHumanCommissionStatus(formData: FormData) {
  const admin = await requireAdminUser();
  if ("error" in admin) return { error: admin.error };

  const ledgerId = String(formData.get("ledger_id") || formData.get("commission_id") || "").trim();
  const paymentStatus = String(formData.get("payment_status") || "").trim().toLowerCase() as MarketplacePaymentStatus;
  const note = String(formData.get("payment_note") || "").trim();
  if (!ledgerId) return { error: "Ligne commission invalide." };
  if (!["pending", "requested", "paid", "cancelled"].includes(paymentStatus)) return { error: "Statut de paiement invalide." };

  const updatePayload: Record<string, unknown> = {
    payment_status: paymentStatus,
    note: note || null,
  };
  if (paymentStatus === "paid") {
    updatePayload.paid_at = new Date().toISOString();
    updatePayload.paid_by_user_id = admin.user.id;
  } else {
    updatePayload.paid_at = null;
    updatePayload.paid_by_user_id = null;
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_marketplace_commission_ledger").update(updatePayload).eq("id", ledgerId);
  if (error) return { error: error.message };

  revalidatePath("/admin/humain/commissions");
  revalidatePath("/popey-human/app/cash");
  revalidatePath("/admin/humain/affiliation");
  return { success: true };
}

export async function adminSetHumanCommissionStatusAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/commissions");
  const result = await adminSetHumanCommissionStatus(formData);
  if ("error" in result) {
    redirect(withCommissionStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withCommissionStatus(currentUrl, "success", "Statut de paiement mis à jour."));
}

export async function adminSetMarketplaceProCommissionRuleAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/commissions");
  const admin = await requireAdminUser();
  if ("error" in admin) {
    redirect(withCommissionStatus(currentUrl, "error", admin.error || "Action impossible."));
  }

  const proMemberRaw = String(formData.get("pro_member_id") || "").trim();
  const feeRaw = String(formData.get("popey_fee_eur") || "").trim().replace(",", ".");
  const fee = Number(feeRaw);
  if (!proMemberRaw) redirect(withCommissionStatus(currentUrl, "error", "Pro marketplace manquant."));
  if (!Number.isFinite(fee) || fee < 0) redirect(withCommissionStatus(currentUrl, "error", "Montant Popey invalide."));

  const supabaseAdmin = createAdminClient();
  let placeId = "";
  if (proMemberRaw.startsWith("place:")) {
    placeId = proMemberRaw.replace(/^place:/, "").trim();
  }
  if (proMemberRaw.startsWith("offer:")) {
    const offerId = proMemberRaw.replace(/^offer:/, "").trim();
    const { data: offer } = await supabaseAdmin
      .from("human_marketplace_offers")
      .select("id,place_id,status")
      .eq("id", offerId)
      .maybeSingle();
    if (!offer?.id) {
      redirect(withCommissionStatus(currentUrl, "error", "Offre ACCEPTED introuvable."));
    }
    if (String(offer.status || "").toLowerCase() !== "accepted") {
      redirect(withCommissionStatus(currentUrl, "error", "Sélectionne un pro marketplace ACCEPTED."));
    }
    placeId = String(offer.place_id || "").trim();
  }
  if (!placeId && proMemberRaw.startsWith("member:")) {
    const legacyMemberId = proMemberRaw.replace(/^member:/, "").trim();
    const { error: legacyError } = await supabaseAdmin
      .from("human_marketplace_pro_commission_rules")
      .upsert(
        {
          pro_member_id: legacyMemberId,
          popey_fee_eur: asMoney(fee),
          updated_by_user_id: admin.user.id,
        },
        { onConflict: "pro_member_id" },
      );
    if (legacyError) redirect(withCommissionStatus(currentUrl, "error", legacyError.message || "Mise à jour impossible."));
    revalidatePath("/admin/humain/commissions");
    revalidatePath("/admin/humain/affiliation");
    redirect(withCommissionStatus(currentUrl, "success", "Commission Popey fixe enregistrée (legacy membre)."));
  }
  if (!placeId && UUID_RE.test(proMemberRaw)) {
    // Compatibilité ancienne UI (member id brut).
    const { error: legacyError } = await supabaseAdmin
      .from("human_marketplace_pro_commission_rules")
      .upsert(
        {
          pro_member_id: proMemberRaw,
          popey_fee_eur: asMoney(fee),
          updated_by_user_id: admin.user.id,
        },
        { onConflict: "pro_member_id" },
      );
    if (legacyError) redirect(withCommissionStatus(currentUrl, "error", legacyError.message || "Mise à jour impossible."));
    revalidatePath("/admin/humain/commissions");
    revalidatePath("/admin/humain/affiliation");
    redirect(withCommissionStatus(currentUrl, "success", "Commission Popey fixe enregistrée (legacy membre)."));
  }
  if (!placeId) {
    redirect(withCommissionStatus(currentUrl, "error", "Pro marketplace sans place. Configure d'abord l'offre."));
  }

  const { error } = await supabaseAdmin
    .from("human_marketplace_place_commission_rules")
    .upsert(
      {
        place_id: placeId,
        popey_fee_eur: asMoney(fee),
        updated_by_user_id: admin.user.id,
      },
      { onConflict: "place_id" },
    );
  if (error) redirect(withCommissionStatus(currentUrl, "error", error.message || "Mise à jour impossible."));

  revalidatePath("/admin/humain/commissions");
  revalidatePath("/admin/humain/affiliation");
  redirect(withCommissionStatus(currentUrl, "success", "Commission Popey fixe enregistrée."));
}

export async function adminProcessMarketplaceCommissionRequestAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/commissions");
  const admin = await requireAdminUser();
  if ("error" in admin) {
    redirect(withCommissionStatus(currentUrl, "error", admin.error || "Action impossible."));
  }

  const requestId = String(formData.get("request_id") || "").trim();
  const statusRaw = String(formData.get("status") || "").trim().toLowerCase();
  const processedNote = String(formData.get("processed_note") || "").trim();
  const status: MarketplaceRequestStatus = statusRaw === "processed" ? "processed" : "rejected";
  if (!requestId) redirect(withCommissionStatus(currentUrl, "error", "Demande introuvable."));

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_marketplace_commission_requests")
    .update({
      status,
      processed_note: processedNote || null,
      processed_at: new Date().toISOString(),
      processed_by_user_id: admin.user.id,
    })
    .eq("id", requestId)
    .eq("status", "pending");
  if (error) redirect(withCommissionStatus(currentUrl, "error", error.message || "Traitement impossible."));

  revalidatePath("/admin/humain/commissions");
  revalidatePath("/popey-human/app/cash");
  redirect(withCommissionStatus(currentUrl, "success", "Demande de virement traitée."));
}

export async function adminDeleteMarketplaceCommissionRequestAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/commissions");
  const admin = await requireAdminUser();
  if ("error" in admin) {
    redirect(withCommissionStatus(currentUrl, "error", admin.error || "Action impossible."));
  }

  const requestId = String(formData.get("request_id") || "").trim();
  const confirm = String(formData.get("confirm") || "").trim().toLowerCase();
  if (!requestId) redirect(withCommissionStatus(currentUrl, "error", "Demande introuvable."));
  if (confirm !== "delete") redirect(withCommissionStatus(currentUrl, "error", "Confirmation requise."));

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_marketplace_commission_requests").delete().eq("id", requestId);
  if (error) redirect(withCommissionStatus(currentUrl, "error", error.message || "Suppression impossible."));

  revalidatePath("/admin/humain/commissions");
  revalidatePath("/popey-human/app/cash");
  redirect(withCommissionStatus(currentUrl, "success", "Demande supprimée."));
}

export async function adminDeleteHumanCommissionLedgerRowAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/commissions");
  const admin = await requireAdminUser();
  if ("error" in admin) {
    redirect(withCommissionStatus(currentUrl, "error", admin.error || "Action impossible."));
  }

  const ledgerId = String(formData.get("ledger_id") || "").trim();
  const confirm = String(formData.get("confirm") || "").trim().toLowerCase();
  if (!ledgerId) redirect(withCommissionStatus(currentUrl, "error", "Ligne commission introuvable."));
  if (confirm !== "delete") redirect(withCommissionStatus(currentUrl, "error", "Confirmation requise."));

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_marketplace_commission_ledger").delete().eq("id", ledgerId);
  if (error) redirect(withCommissionStatus(currentUrl, "error", error.message || "Suppression impossible."));

  revalidatePath("/admin/humain/commissions");
  revalidatePath("/admin/humain/affiliation");
  revalidatePath("/popey-human/app/cash");
  redirect(withCommissionStatus(currentUrl, "success", "Ligne commission supprimée."));
}

async function requireAdminUser() {
  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!data) return { error: "Accès admin requis." };
  return { user: { id: userId } };
}

function withCommissionStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/admin/humain/commissions") ? url : "/admin/humain/commissions";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("commissionStatus", status);
  parsed.searchParams.set("commissionMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}

function withCashStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/popey-human/app/cash") ? url : "/popey-human/app/cash";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("cashStatus", status);
  parsed.searchParams.set("cashMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}
