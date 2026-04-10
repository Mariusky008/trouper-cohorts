"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";

type HumanCashKind = "encaissement" | "decaissement";
type HumanCashSourceType = "lead" | "signal" | "manual";

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
      totals: { in: 0, out: 0, net: 0 },
      commissionsTotals: { pending: 0, paid: 0, total: 0 },
    };
  }

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) {
    return {
      error: "Profil Popey Human introuvable.",
      events: [] as HumanCashEvent[],
      commissions: [] as HumanCommission[],
      totals: { in: 0, out: 0, net: 0 },
      commissionsTotals: { pending: 0, paid: 0, total: 0 },
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data }, { data: commissionsData }] = await Promise.all([
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
      .limit(200),
  ]);

  const events = (data as HumanCashEvent[] | null) || [];
  const commissions = (commissionsData as HumanCommission[] | null) || [];
  const totalIn = events
    .filter((event) => event.kind === "encaissement")
    .reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const totalOut = events
    .filter((event) => event.kind === "decaissement")
    .reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const commissionsPending = commissions
    .filter((commission) => commission.payment_status === "pending")
    .reduce((sum, commission) => sum + Number(commission.commission_amount || 0), 0);
  const commissionsPaid = commissions
    .filter((commission) => commission.payment_status === "paid")
    .reduce((sum, commission) => sum + Number(commission.commission_amount || 0), 0);

  return {
    error: null as string | null,
    events,
    commissions,
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

export async function createCommissionForSignedLead(input: {
  leadId: string;
  ownerMemberId: string | null;
  sourceMemberId: string | null;
  signedAmount: number | null;
}) {
  const ownerId = input.ownerMemberId || "";
  const sourceId = input.sourceMemberId || "";
  const signedAmount = Number(input.signedAmount || 0);

  if (!ownerId || !sourceId || ownerId === sourceId) return { success: true, skipped: true };
  if (!Number.isFinite(signedAmount) || signedAmount <= 0) return { success: true, skipped: true };

  const commissionAmount = Math.round(signedAmount * 0.1 * 100) / 100;
  if (commissionAmount <= 0) return { success: true, skipped: true };

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
  return { success: true };
}
