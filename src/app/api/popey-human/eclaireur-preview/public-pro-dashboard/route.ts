import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ActivationRow = {
  id: string;
  created_at: string;
  place_id: string | null;
  city: string | null;
  client_name: string | null;
  partner_name: string | null;
  partner_member_id: string | null;
  metadata: Record<string, unknown> | null;
};

function txt(value: unknown) {
  return String(value || "").trim();
}

function toNumber(value: unknown) {
  const parsed = Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value: string) {
  return txt(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripDepartmentSuffix(slug: string) {
  return String(slug || "").replace(/-\d{2,3}$/, "");
}

function cityMatch(input: { requestedCity: string; rowCity: string }) {
  const requestedSlug = slugify(input.requestedCity);
  if (!requestedSlug) return true;
  const requestedBase = stripDepartmentSuffix(requestedSlug);
  const rowSlug = slugify(input.rowCity);
  const rowBase = stripDepartmentSuffix(rowSlug);
  return requestedSlug === rowSlug || requestedBase === rowSlug || requestedSlug === rowBase || requestedBase === rowBase;
}

function normalizePersonName(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readMetaString(metadata: Record<string, unknown> | null, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  return txt((metadata as Record<string, unknown>)[key]);
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

function readCommissionDecisionStatus(metadata: Record<string, unknown> | null): "pending" | "approved" | "rejected" {
  const raw = txt(metadata?.commission_decision_status).toLowerCase();
  if (raw === "approved") return "approved";
  if (raw === "rejected" || raw === "refused") return "rejected";
  return "pending";
}

function euros(value: number) {
  return Math.round((value || 0) * 100) / 100;
}

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEndExclusive(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function elapsedLabel(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const diff = Date.now() - ms;
  const min = Math.max(1, Math.round(diff / 60000));
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.round(h / 24);
  return `il y a ${d}j`;
}

export async function GET(request: NextRequest) {
  const memberId = txt(request.nextUrl.searchParams.get("member_id"));
  const refName = txt(request.nextUrl.searchParams.get("ref_name"));
  const placeId = txt(request.nextUrl.searchParams.get("place_id") || request.nextUrl.searchParams.get("placeId"));
  const city = txt(request.nextUrl.searchParams.get("city") || request.nextUrl.searchParams.get("ville"));
  if (!memberId && !refName && !placeId) {
    return NextResponse.json({ error: "member_id, ref_name ou place_id requis." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: activationsData, error: activationsError } = await supabase
    .from("human_marketplace_landing_activations")
    .select("id,created_at,place_id,city,client_name,partner_name,partner_member_id,metadata")
    .order("created_at", { ascending: false })
    .limit(2500);
  if (activationsError) {
    return NextResponse.json({ error: activationsError.message || "Impossible de charger les activations." }, { status: 500 });
  }

  const activations = (activationsData as ActivationRow[] | null) || [];
  const normalizedRef = normalizePersonName(refName);
  const scoped = activations.filter((row) => {
    if (placeId && txt(row.place_id) === placeId) return true;
    if (memberId && txt(row.partner_member_id) === memberId) return true;
    if (!memberId && normalizedRef && normalizePersonName(row.partner_name || "") === normalizedRef) return true;
    return false;
  });
  const cityScoped = city ? scoped.filter((row) => cityMatch({ requestedCity: city, rowCity: txt(row.city) })) : scoped;
  const rows = cityScoped;

  const thisMonthStart = monthStart();
  const nextMonthStart = monthEndExclusive();
  const isThisMonth = (iso: string) => {
    const ms = Date.parse(iso);
    return Number.isFinite(ms) && ms >= thisMonthStart.getTime() && ms < nextMonthStart.getTime();
  };

  const timeline = rows.map((row) => {
    const metadata = row.metadata || {};
    const workflow = readWorkflowStatus(metadata);
    const decision = readCommissionDecisionStatus(metadata);
    const scoutDue = decision === "approved" ? euros(toNumber(metadata.commission_amount_eur)) : 0;
    const popeyDue = decision === "approved" ? euros(toNumber(metadata.commission_popey_fee_eur)) : 0;
    const totalDueRaw = toNumber(metadata.deal_total_due_pro_eur);
    const totalDue = decision === "approved" ? euros(totalDueRaw > 0 ? totalDueRaw : scoutDue + popeyDue) : 0;
    const status =
      decision === "approved"
        ? "validated"
        : decision === "rejected"
          ? "refused"
          : workflow;
    return {
      id: row.id,
      created_at: row.created_at,
      client_name: txt(row.client_name) || "Client",
      source_name: readMetaString(metadata, "commission_apporteur_name") || txt(row.partner_name) || "Apporteur",
      status,
      status_label:
        status === "validated"
          ? "Validé"
          : status === "refused"
            ? "Refusé"
            : status === "in_progress"
              ? "En cours"
              : status === "contacted"
                ? "Contacté"
                : "En attente",
      due_scout_eur: scoutDue,
      due_popey_eur: popeyDue,
      total_due_pro_eur: totalDue,
      whatsapp_client_phone: readMetaString(metadata, "client_phone"),
      decision_status: decision,
      workflow_status: workflow,
      note: readMetaString(metadata, "workflow_note"),
      updated_at: readMetaString(metadata, "commission_decided_at") || readMetaString(metadata, "workflow_updated_at") || row.created_at,
      deal_amount_eur: euros(toNumber(metadata.deal_amount_eur)),
    };
  });

  const approvedRows = timeline.filter((row) => row.decision_status === "approved");
  const pendingRows = timeline.filter((row) => row.decision_status === "pending");
  const signedRowsMonth = timeline.filter((row) => row.decision_status === "approved" && isThisMonth(row.created_at));

  const contactsThisMonth = timeline.filter((row) => isThisMonth(row.created_at)).length;
  const signedThisMonth = signedRowsMonth.length;
  const conversionRate = contactsThisMonth > 0 ? Math.round((signedThisMonth / contactsThisMonth) * 1000) / 10 : 0;

  const totalDueScout = euros(approvedRows.reduce((sum, row) => sum + row.due_scout_eur, 0));
  const totalDuePopey = euros(approvedRows.reduce((sum, row) => sum + row.due_popey_eur, 0));
  const totalDuePro = euros(approvedRows.reduce((sum, row) => sum + row.total_due_pro_eur, 0));
  const pendingDuePro = euros(
    timeline
      .filter((row) => row.decision_status === "pending")
      .reduce((sum, row) => sum + (row.total_due_pro_eur > 0 ? row.total_due_pro_eur : row.due_scout_eur + row.due_popey_eur), 0),
  );

  const notifications = timeline
    .slice()
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, 8)
    .map((row) => {
      const tone = row.decision_status === "approved" ? "success" : row.decision_status === "rejected" ? "danger" : "info";
      const title =
        row.decision_status === "approved"
          ? "Deal validé"
          : row.decision_status === "rejected"
            ? "Deal refusé"
            : "Nouveau contact à traiter";
      const message =
        row.decision_status === "approved"
          ? `${row.client_name} · Total dû pro ${row.total_due_pro_eur.toLocaleString("fr-FR")}€`
          : row.decision_status === "rejected"
            ? `${row.client_name} · Ticket refusé`
            : `${row.client_name} · En attente de confirmation deal`;
      return {
        id: row.id,
        title,
        message,
        tone,
        created_at: row.updated_at,
        time_label: elapsedLabel(row.updated_at),
      };
    });

  return NextResponse.json({
    success: true,
    controls: {
      source: placeId ? "place_id" : memberId ? "member_id" : "fallback_ref_name",
      member_id_present: Boolean(memberId),
      place_id_present: Boolean(placeId),
      data_rows: rows.length,
      warnings:
        rows.length === 0
          ? [
              placeId
                ? "Aucune donnée liée à ce pro. Vérifie le place_id transmis dans le lien."
                : "Aucune donnée liée à ce pro. Vérifie le member_id transmis dans le lien.",
            ]
          : [],
    },
    kpis: {
      contacts_received_month: contactsThisMonth,
      signed_deals_month: signedThisMonth,
      conversion_rate_pct: conversionRate,
      pending_deals_count: pendingRows.length,
      validated_deals_count: approvedRows.length,
      total_due_pro_eur: totalDuePro,
      total_due_scout_eur: totalDueScout,
      total_due_popey_eur: totalDuePopey,
      pending_due_pro_eur: pendingDuePro,
    },
    pipeline: timeline.slice(0, 12),
    notifications,
  });
}
