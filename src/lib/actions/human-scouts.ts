"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";

type ScoutStatus = "invited" | "active" | "paused" | "archived";
type ReferralStatus = "submitted" | "validated" | "offered" | "rejected" | "converted" | "cancelled";

type HumanScout = {
  id: string;
  owner_member_id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  ville: string | null;
  phone: string | null;
  email: string | null;
  status: ScoutStatus;
  commission_rate: number;
  total_paid: number;
  pending_earnings: number;
  created_at: string;
  updated_at: string;
};

type HumanScoutInvite = {
  id: string;
  owner_member_id: string;
  scout_id: string | null;
  invite_token: string;
  short_code: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

type HumanScoutReferral = {
  id: string;
  owner_member_id: string;
  scout_id: string;
  lead_id: string | null;
  contact_name: string;
  contact_phone: string | null;
  contact_phone_normalized: string | null;
  project_type: string | null;
  comment: string | null;
  status: ReferralStatus;
  rejection_reason: string | null;
  estimated_deal_value: number | null;
  estimated_commission: number | null;
  final_signed_amount: number | null;
  final_commission: number | null;
  commission_rate_snapshot: number | null;
  validated_at: string | null;
  offered_at: string | null;
  converted_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getMyScoutWorkspace() {
  const member = await requireMemberUser();
  if ("error" in member) {
    return {
      error: member.error,
      scouts: [] as HumanScout[],
      referrals: [] as HumanScoutReferral[],
      inviteByScoutId: {} as Record<string, HumanScoutInvite | null>,
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data: scoutsData }, { data: referralsData }] = await Promise.all([
    supabaseAdmin
      .from("human_scouts")
      .select("id,owner_member_id,user_id,first_name,last_name,ville,phone,email,status,commission_rate,total_paid,pending_earnings,created_at,updated_at")
      .eq("owner_member_id", member.myMember.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("human_scout_referrals")
      .select(
        "id,owner_member_id,scout_id,lead_id,contact_name,contact_phone,contact_phone_normalized,project_type,comment,status,rejection_reason,estimated_deal_value,estimated_commission,final_signed_amount,final_commission,commission_rate_snapshot,validated_at,offered_at,converted_at,paid_at,created_at,updated_at"
      )
      .eq("owner_member_id", member.myMember.id)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  let invitesData: any[] | null = null;
  const invitesWithShortCode = await supabaseAdmin
    .from("human_scout_invites")
    .select("id,owner_member_id,scout_id,invite_token,short_code,expires_at,accepted_at,created_at")
    .eq("owner_member_id", member.myMember.id)
    .order("created_at", { ascending: false })
    .limit(500);

  if (!invitesWithShortCode.error) {
    invitesData = invitesWithShortCode.data as any[] | null;
  } else {
    const fallbackInvites = await supabaseAdmin
      .from("human_scout_invites")
      .select("id,owner_member_id,scout_id,invite_token,expires_at,accepted_at,created_at")
      .eq("owner_member_id", member.myMember.id)
      .order("created_at", { ascending: false })
      .limit(500);
    invitesData = (fallbackInvites.data as any[] | null) || [];
  }

  const scouts = (scoutsData as HumanScout[] | null) || [];
  const referrals = (referralsData as HumanScoutReferral[] | null) || [];
  const rawInvites = ((invitesData as HumanScoutInvite[] | null) || []).slice();
  const inviteByScoutId: Record<string, HumanScoutInvite | null> = {};
  rawInvites.forEach((invite) => {
    if (!invite.scout_id) return;
    if (!inviteByScoutId[invite.scout_id]) {
      inviteByScoutId[invite.scout_id] = invite;
    }
  });

  // Garantit un lien magique utilisable pour chaque éclaireur (auto-création/renouvellement si manquant ou expiré).
  for (const scout of scouts) {
    const existing = inviteByScoutId[scout.id];
    const isExpired = existing ? new Date(existing.expires_at).getTime() <= Date.now() : true;
    if (existing && !isExpired) continue;

    const createdInvite = await createScoutInviteRecord({
      supabaseAdmin,
      ownerMemberId: member.myMember.id,
      scoutId: scout.id,
    });
    if (createdInvite) {
      inviteByScoutId[scout.id] = createdInvite;
    }
  }

  return {
    error: null as string | null,
    scouts,
    referrals,
    inviteByScoutId,
  };
}

export async function createScoutInvite(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const ville = String(formData.get("ville") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const commissionRateRaw = String(formData.get("commission_rate") || "0.10").trim();
  const commissionRate = Number(commissionRateRaw);

  if (!firstName && !lastName && !phone && !email) {
    return { error: "Renseignez au moins un identifiant éclaireur (nom, téléphone ou email)." };
  }
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
    return { error: "Taux de commission invalide (0 à 1)." };
  }

  const supabaseAdmin = createAdminClient();
  const { data: scoutRow, error: scoutError } = await supabaseAdmin
    .from("human_scouts")
    .insert({
      owner_member_id: member.myMember.id,
      first_name: firstName || null,
      last_name: lastName || null,
      ville: ville || null,
      phone: phone || null,
      email: email || null,
      status: "invited",
      commission_rate: commissionRate,
      total_paid: 0,
      pending_earnings: 0,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (scoutError || !scoutRow) return { error: scoutError?.message || "Impossible de créer l'éclaireur." };

  const invite = await createScoutInviteRecord({
    supabaseAdmin,
    ownerMemberId: member.myMember.id,
    scoutId: scoutRow.id,
  });
  if (!invite) return { error: "Impossible de générer un lien magique éclaireur." };

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function createScoutInviteAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await createScoutInvite(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Éclaireur invité."));
}

export async function createScoutInviteFromSmartScanContact(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const contactId = String(formData.get("smart_scan_contact_id") || "").trim();
  const commissionRateRaw = String(formData.get("commission_rate") || "0.10").trim();
  const commissionRate = Number(commissionRateRaw);
  if (!contactId) return { error: "Contact Smart Scan invalide." };
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
    return { error: "Taux de commission invalide (0 à 1)." };
  }

  const supabaseAdmin = createAdminClient();
  const { data: contact, error: contactError } = await supabaseAdmin
    .from("human_smart_scan_contacts")
    .select("id,owner_member_id,full_name,city,phone_e164")
    .eq("id", contactId)
    .eq("owner_member_id", member.myMember.id)
    .maybeSingle();
  if (contactError) return { error: contactError.message };
  if (!contact) return { error: "Contact Smart Scan introuvable." };

  const fullName = String(contact.full_name || "").trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ");
  const city = String(contact.city || "").trim();
  const phone = String(contact.phone_e164 || "").trim();

  let existingScoutId = "";
  if (phone) {
    const { data: existingByPhone } = await supabaseAdmin
      .from("human_scouts")
      .select("id")
      .eq("owner_member_id", member.myMember.id)
      .eq("phone", phone)
      .order("created_at", { ascending: true })
      .limit(1);
    existingScoutId = String(((existingByPhone as Array<{ id: string }> | null) || [])[0]?.id || "");
  }
  if (!existingScoutId && fullName) {
    const { data: existingByName } = await supabaseAdmin
      .from("human_scouts")
      .select("id")
      .eq("owner_member_id", member.myMember.id)
      .ilike("first_name", firstName || fullName)
      .ilike("last_name", lastName || "%")
      .limit(1);
    existingScoutId = String(((existingByName as Array<{ id: string }> | null) || [])[0]?.id || "");
  }

  let scoutId = existingScoutId;
  if (!scoutId) {
    const { data: createdScout, error: scoutError } = await supabaseAdmin
      .from("human_scouts")
      .insert({
        owner_member_id: member.myMember.id,
        first_name: firstName || fullName || null,
        last_name: lastName || null,
        ville: city || null,
        phone: phone || null,
        status: "invited",
        commission_rate: commissionRate,
        total_paid: 0,
        pending_earnings: 0,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (scoutError || !createdScout) return { error: scoutError?.message || "Impossible de créer l'éclaireur." };
    scoutId = String(createdScout.id);
  } else {
    await supabaseAdmin
      .from("human_scouts")
      .update({
        ville: city || null,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scoutId)
      .eq("owner_member_id", member.myMember.id);
  }

  const invite = await createScoutInviteRecord({
    supabaseAdmin,
    ownerMemberId: member.myMember.id,
    scoutId,
  });
  if (!invite) return { error: "Impossible de générer le lien magique éclaireur." };

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function createScoutInviteFromSmartScanContactAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await createScoutInviteFromSmartScanContact(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Éclaireur ajouté depuis vos contacts importés."));
}

export async function getMySelfScoutPortalLink() {
  const member = await requireMemberUser();
  if ("error" in member) {
    return {
      error: member.error,
      scoutId: null as string | null,
      inviteToken: null as string | null,
      shortCode: null as string | null,
    };
  }

  const supabaseAdmin = createAdminClient();
  const { data: ownerMember } = await supabaseAdmin
    .from("human_members")
    .select("id,first_name,last_name,ville,phone")
    .eq("id", member.myMember.id)
    .maybeSingle();

  let selfScout: HumanScout | null = null;
  const { data: existingScouts } = await supabaseAdmin
    .from("human_scouts")
    .select("id,owner_member_id,user_id,first_name,last_name,ville,phone,email,status,commission_rate,total_paid,pending_earnings,created_at,updated_at")
    .eq("owner_member_id", member.myMember.id)
    .eq("user_id", member.user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  selfScout = ((existingScouts as HumanScout[] | null) || [])[0] || null;

  if (!selfScout) {
    const nowIso = new Date().toISOString();
    const { data: insertedScout, error: insertError } = await supabaseAdmin
      .from("human_scouts")
      .insert({
        owner_member_id: member.myMember.id,
        user_id: member.user.id,
        first_name: ownerMember?.first_name || null,
        last_name: ownerMember?.last_name || null,
        ville: ownerMember?.ville || null,
        phone: ownerMember?.phone || null,
        email: member.user.email || null,
        status: "active",
        commission_rate: 0.1,
        total_paid: 0,
        pending_earnings: 0,
        updated_at: nowIso,
      })
      .select("id,owner_member_id,user_id,first_name,last_name,ville,phone,email,status,commission_rate,total_paid,pending_earnings,created_at,updated_at")
      .single();
    if (insertError || !insertedScout) {
      return {
        error: insertError?.message || "Impossible de créer votre accès Éclaireur personnel.",
        scoutId: null as string | null,
        inviteToken: null as string | null,
        shortCode: null as string | null,
      };
    }
    selfScout = insertedScout as HumanScout;
  }

  const { data: existingInvites } = await supabaseAdmin
    .from("human_scout_invites")
    .select("id,owner_member_id,scout_id,invite_token,short_code,expires_at,accepted_at,created_at")
    .eq("owner_member_id", member.myMember.id)
    .eq("scout_id", selfScout.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestInvite = ((existingInvites as HumanScoutInvite[] | null) || [])[0] || null;
  const isExpired = latestInvite ? new Date(latestInvite.expires_at).getTime() <= Date.now() : true;
  let resolvedInvite: HumanScoutInvite | null = latestInvite;
  if (!resolvedInvite || isExpired) {
    resolvedInvite = await createScoutInviteRecord({
      supabaseAdmin,
      ownerMemberId: member.myMember.id,
      scoutId: selfScout.id,
    });
  }

  if (!resolvedInvite) {
    return {
      error: "Impossible de générer votre lien Éclaireur personnel.",
      scoutId: selfScout.id,
      inviteToken: null as string | null,
      shortCode: null as string | null,
    };
  }

  return {
    error: null as string | null,
    scoutId: selfScout.id,
    inviteToken: resolvedInvite.invite_token,
    shortCode: resolvedInvite.short_code || null,
  };
}

export async function refreshScoutInvite(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const scoutId = String(formData.get("scout_id") || "").trim();
  if (!scoutId) return { error: "Éclaireur invalide." };

  const supabaseAdmin = createAdminClient();
  const { data: scout } = await supabaseAdmin
    .from("human_scouts")
    .select("id,owner_member_id")
    .eq("id", scoutId)
    .eq("owner_member_id", member.myMember.id)
    .maybeSingle();
  if (!scout) return { error: "Éclaireur introuvable." };

  const invite = await createScoutInviteRecord({
    supabaseAdmin,
    ownerMemberId: member.myMember.id,
    scoutId: scout.id,
  });
  if (!invite) return { error: "Impossible de régénérer le lien magique." };

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function refreshScoutInviteAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await refreshScoutInvite(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Lien magique régénéré."));
}

export async function validateScoutReferral(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const referralId = String(formData.get("referral_id") || "").trim();
  const estimatedRaw = String(formData.get("estimated_deal_value") || "").trim();
  if (!referralId) return { error: "Referral invalide." };

  const estimated = estimatedRaw ? Number(estimatedRaw) : null;
  if (estimatedRaw && (!Number.isFinite(estimated) || Number(estimated) <= 0)) {
    return { error: "Montant estimé invalide." };
  }

  const supabaseAdmin = createAdminClient();
  const { data: referral } = await supabaseAdmin
    .from("human_scout_referrals")
    .select(
      "id,owner_member_id,scout_id,lead_id,contact_name,contact_phone,project_type,comment,status,rejection_reason,estimated_deal_value,estimated_commission,commission_rate_snapshot"
    )
    .eq("id", referralId)
    .eq("owner_member_id", member.myMember.id)
    .maybeSingle();
  if (!referral) return { error: "Referral introuvable." };
  if (referral.status !== "submitted") return { error: "Seuls les referrals soumis peuvent être validés." };

  const { data: scout } = await supabaseAdmin
    .from("human_scouts")
    .select("id,commission_rate")
    .eq("id", referral.scout_id)
    .maybeSingle();
  if (!scout) return { error: "Éclaireur introuvable." };

  const rate = Number(scout.commission_rate || 0.1);
  const fallbackEstimated = Number(referral.estimated_deal_value || 0);
  const estimatedDealValue = estimated ?? (fallbackEstimated > 0 ? fallbackEstimated : null);
  const estimatedCommission =
    estimatedDealValue && Number.isFinite(estimatedDealValue) ? Math.round(estimatedDealValue * rate * 100) / 100 : null;

  const nowIso = new Date().toISOString();
  const { data: leadRow, error: leadError } = await supabaseAdmin
    .from("human_leads")
    .insert({
      owner_member_id: member.myMember.id,
      source_member_id: null,
      client_name: referral.contact_name,
      budget: estimatedDealValue,
      besoin: referral.project_type || null,
      phone: referral.contact_phone || null,
      notes: referral.comment || null,
      status: "pris",
      source_type: "scout",
      opened_at: nowIso,
      updated_at: nowIso,
    })
    .select("id")
    .single();
  if (leadError || !leadRow) return { error: leadError?.message || "Impossible de créer le lead." };

  const { error: updateError } = await supabaseAdmin
    .from("human_scout_referrals")
    .update({
      lead_id: leadRow.id,
      status: "validated",
      estimated_deal_value: estimatedDealValue,
      estimated_commission: estimatedCommission,
      commission_rate_snapshot: rate,
      rejection_reason: null,
      validated_at: nowIso,
      offered_at: null,
      updated_at: nowIso,
    })
    .eq("id", referralId);
  if (updateError) return { error: updateError.message };

  await logScoutEvent({
    supabaseAdmin,
    scoutId: referral.scout_id,
    eventType: "referral_validated",
    payload: {
      referral_id: referralId,
      lead_id: leadRow.id,
      estimated_commission: estimatedCommission,
    },
  });

  await notifyMember(member.myMember.id, {
    title: `RDV lancé: ${referral.contact_name}`,
    message: "Le lead éclaireur est pris en charge. Passez-le à l'étape Offre quand la proposition est envoyée.",
    impact: `scout:validated:${referralId}`,
  });

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/popey-human/app/clients");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function validateScoutReferralAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await validateScoutReferral(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Referral validé."));
}

export async function rejectScoutReferral(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const referralId = String(formData.get("referral_id") || "").trim();
  const reason = String(formData.get("rejection_reason") || "").trim();
  if (!referralId) return { error: "Referral invalide." };
  if (!reason) return { error: "Motif obligatoire pour rejeter une alerte." };

  const supabaseAdmin = createAdminClient();
  const { data: referral } = await supabaseAdmin
    .from("human_scout_referrals")
    .select("id,owner_member_id,scout_id,status")
    .eq("id", referralId)
    .eq("owner_member_id", member.myMember.id)
    .maybeSingle();
  if (!referral) return { error: "Referral introuvable." };
  if (referral.status !== "submitted") return { error: "Seuls les referrals soumis peuvent être rejetés." };

  const { error } = await supabaseAdmin
    .from("human_scout_referrals")
    .update({
      status: "rejected",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", referralId);
  if (error) return { error: error.message };

  await logScoutEvent({
    supabaseAdmin,
    scoutId: referral.scout_id,
    eventType: "referral_rejected",
    payload: { referral_id: referralId, reason },
  });

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function rejectScoutReferralAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await rejectScoutReferral(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Referral rejeté."));
}

export async function markScoutReferralOffered(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const referralId = String(formData.get("referral_id") || "").trim();
  if (!referralId) return { error: "Referral invalide." };

  const supabaseAdmin = createAdminClient();
  const { data: referral } = await supabaseAdmin
    .from("human_scout_referrals")
    .select("id,owner_member_id,scout_id,status")
    .eq("id", referralId)
    .eq("owner_member_id", member.myMember.id)
    .maybeSingle();
  if (!referral) return { error: "Referral introuvable." };
  if (referral.status !== "validated") return { error: "Seuls les referrals au statut RDV peuvent passer en offre." };

  const nowIso = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("human_scout_referrals")
    .update({
      status: "offered",
      offered_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", referralId);
  if (error) return { error: error.message };

  await logScoutEvent({
    supabaseAdmin,
    scoutId: referral.scout_id,
    eventType: "referral_offered",
    payload: { referral_id: referralId },
  });

  await notifyMember(member.myMember.id, {
    title: "Offre envoyée",
    message: "Le statut partagé côté Éclaireur est passé à Offre.",
    impact: `scout:offered:${referralId}`,
  });

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function markScoutReferralOfferedAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await markScoutReferralOffered(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Referral passé à l'étape Offre."));
}

export async function convertScoutReferral(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const referralId = String(formData.get("referral_id") || "").trim();
  const signedRaw = String(formData.get("signed_amount") || "").trim();
  if (!referralId) return { error: "Referral invalide." };
  const signedAmount = Number(signedRaw);
  if (!Number.isFinite(signedAmount) || signedAmount <= 0) return { error: "Montant signé invalide." };

  const supabaseAdmin = createAdminClient();
  const { data: referral } = await supabaseAdmin
    .from("human_scout_referrals")
    .select("id,owner_member_id,scout_id,lead_id,status,commission_rate_snapshot")
    .eq("id", referralId)
    .eq("owner_member_id", member.myMember.id)
    .maybeSingle();
  if (!referral) return { error: "Referral introuvable." };
  if (referral.status !== "offered") return { error: "Seuls les referrals au statut Offre peuvent être signés." };

  const rate = Number(referral.commission_rate_snapshot || 0.1);
  const finalCommission = Math.round(signedAmount * rate * 100) / 100;
  const nowIso = new Date().toISOString();

  const { error: referralError } = await supabaseAdmin
    .from("human_scout_referrals")
    .update({
      status: "converted",
      final_signed_amount: signedAmount,
      final_commission: finalCommission,
      converted_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", referralId);
  if (referralError) return { error: referralError.message };

  if (referral.lead_id) {
    const { error: leadError } = await supabaseAdmin
      .from("human_leads")
      .update({
        status: "signe",
        budget: signedAmount,
        updated_at: nowIso,
      })
      .eq("id", referral.lead_id);
    if (leadError) return { error: leadError.message };
  }

  const { data: scout } = await supabaseAdmin
    .from("human_scouts")
    .select("pending_earnings")
    .eq("id", referral.scout_id)
    .maybeSingle();
  const newPending = Math.round((Number(scout?.pending_earnings || 0) + finalCommission) * 100) / 100;
  const { error: scoutError } = await supabaseAdmin
    .from("human_scouts")
    .update({
      pending_earnings: newPending,
      updated_at: nowIso,
    })
    .eq("id", referral.scout_id);
  if (scoutError) return { error: scoutError.message };

  await logScoutEvent({
    supabaseAdmin,
    scoutId: referral.scout_id,
    eventType: "referral_converted",
    payload: {
      referral_id: referralId,
      final_commission: finalCommission,
      signed_amount: signedAmount,
    },
  });

  await notifyMember(member.myMember.id, {
    title: "Deal éclaireur signé",
    message: `Commission due à l'éclaireur: ${finalCommission.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`,
    impact: `scout:converted:${referralId}`,
  });

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/popey-human/app/clients");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function convertScoutReferralAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await convertScoutReferral(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Referral converti en deal signé."));
}

export async function markScoutReferralPaid(formData: FormData) {
  const member = await requireMemberUser();
  if ("error" in member) return { error: member.error };

  const referralId = String(formData.get("referral_id") || "").trim();
  if (!referralId) return { error: "Referral invalide." };

  const supabaseAdmin = createAdminClient();
  const { data: referral } = await supabaseAdmin
    .from("human_scout_referrals")
    .select("id,owner_member_id,scout_id,status,final_commission,paid_at")
    .eq("id", referralId)
    .eq("owner_member_id", member.myMember.id)
    .maybeSingle();
  if (!referral) return { error: "Referral introuvable." };
  if (referral.status !== "converted") return { error: "Seuls les referrals convertis peuvent être payés." };
  if (referral.paid_at) return { success: true };

  const commission = Number(referral.final_commission || 0);
  if (!Number.isFinite(commission) || commission <= 0) return { error: "Commission finale invalide." };

  const nowIso = new Date().toISOString();
  const { error: referralError } = await supabaseAdmin
    .from("human_scout_referrals")
    .update({
      paid_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", referralId);
  if (referralError) return { error: referralError.message };

  const { data: scout } = await supabaseAdmin
    .from("human_scouts")
    .select("pending_earnings,total_paid")
    .eq("id", referral.scout_id)
    .maybeSingle();
  const pendingNow = Number(scout?.pending_earnings || 0);
  const paidNow = Number(scout?.total_paid || 0);
  const { error: scoutError } = await supabaseAdmin
    .from("human_scouts")
    .update({
      pending_earnings: Math.max(0, Math.round((pendingNow - commission) * 100) / 100),
      total_paid: Math.round((paidNow + commission) * 100) / 100,
      updated_at: nowIso,
    })
    .eq("id", referral.scout_id);
  if (scoutError) return { error: scoutError.message };

  await logScoutEvent({
    supabaseAdmin,
    scoutId: referral.scout_id,
    eventType: "commission_paid",
    payload: { referral_id: referralId, amount: commission },
  });

  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function markScoutReferralPaidAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/eclaireurs");
  const result = await markScoutReferralPaid(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Commission marquée payée."));
}

export async function getScoutPortalByToken(token: string) {
  const inviteTokenOrCode = token.trim();
  if (!inviteTokenOrCode) {
    return {
      error: "Lien invalide.",
      scout: null as HumanScout | null,
      invite: null as HumanScoutInvite | null,
      referrals: [] as HumanScoutReferral[],
      sponsorName: null as string | null,
      sponsor: null as { name: string | null; metier: string | null; ville: string | null; phone: string | null } | null,
    };
  }

  const supabaseAdmin = createAdminClient();
  const normalizedToken = inviteTokenOrCode.toLowerCase();
  const normalizedShortCode = normalizeScoutShortCode(inviteTokenOrCode);

  let invite: any = null;
  let shortCodeEnabled = true;
  const inviteByTokenWithCode = await supabaseAdmin
    .from("human_scout_invites")
    .select("id,owner_member_id,scout_id,invite_token,short_code,expires_at,accepted_at,created_at")
    .eq("invite_token", normalizedToken)
    .maybeSingle();

  if (!inviteByTokenWithCode.error) {
    invite = inviteByTokenWithCode.data;
  } else {
    shortCodeEnabled = false;
    const fallbackInviteByToken = await supabaseAdmin
      .from("human_scout_invites")
      .select("id,owner_member_id,scout_id,invite_token,expires_at,accepted_at,created_at")
      .eq("invite_token", normalizedToken)
      .maybeSingle();
    invite = fallbackInviteByToken.data;
  }

  if (!invite && normalizedShortCode && shortCodeEnabled) {
    const inviteByCode = await supabaseAdmin
      .from("human_scout_invites")
      .select("id,owner_member_id,scout_id,invite_token,short_code,expires_at,accepted_at,created_at")
      .eq("short_code", normalizedShortCode)
      .maybeSingle();
    invite = inviteByCode.data;
  }

  if (!invite || !invite.scout_id) {
    return {
      error: "Invitation introuvable.",
      scout: null as HumanScout | null,
      invite: null as HumanScoutInvite | null,
      referrals: [] as HumanScoutReferral[],
      sponsorName: null as string | null,
      sponsor: null as { name: string | null; metier: string | null; ville: string | null; phone: string | null } | null,
    };
  }

  const inviteTyped = invite as HumanScoutInvite;
  if (new Date(inviteTyped.expires_at).getTime() < Date.now()) {
    return {
      error: "Invitation expirée.",
      scout: null as HumanScout | null,
      invite: inviteTyped,
      referrals: [] as HumanScoutReferral[],
      sponsorName: null as string | null,
      sponsor: null as { name: string | null; metier: string | null; ville: string | null; phone: string | null } | null,
    };
  }

  const [{ data: scout }, { data: referrals }] = await Promise.all([
    supabaseAdmin
      .from("human_scouts")
      .select("id,owner_member_id,user_id,first_name,last_name,ville,phone,email,status,commission_rate,total_paid,pending_earnings,created_at,updated_at")
      .eq("id", inviteTyped.scout_id)
      .maybeSingle(),
    supabaseAdmin
      .from("human_scout_referrals")
      .select(
        "id,owner_member_id,scout_id,lead_id,contact_name,contact_phone,contact_phone_normalized,project_type,comment,status,rejection_reason,estimated_deal_value,estimated_commission,final_signed_amount,final_commission,commission_rate_snapshot,validated_at,offered_at,converted_at,paid_at,created_at,updated_at"
      )
      .eq("scout_id", inviteTyped.scout_id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  let sponsorName: string | null = null;
  let sponsor: { name: string | null; metier: string | null; ville: string | null; phone: string | null } | null = null;
  const scoutRow = (scout as HumanScout | null) || null;
  if (scoutRow?.owner_member_id) {
    const { data: ownerMember } = await supabaseAdmin
      .from("human_members")
      .select("id,user_id,first_name,last_name,metier,ville,phone")
      .eq("id", scoutRow.owner_member_id)
      .maybeSingle();
    if (ownerMember) {
      const ownerFullName = [ownerMember.first_name, ownerMember.last_name].filter(Boolean).join(" ").trim();
      if (ownerFullName) {
        sponsorName = ownerFullName;
      } else {
        const { data: ownerProfile } = await supabaseAdmin
          .from("profiles")
          .select("display_name,trade,city,phone")
          .eq("id", ownerMember.user_id)
          .maybeSingle();
        sponsorName = ownerProfile?.display_name || null;
        sponsor = {
          name: sponsorName,
          metier: ownerMember.metier || ownerProfile?.trade || null,
          ville: ownerMember.ville || ownerProfile?.city || null,
          phone: ownerMember.phone || ownerProfile?.phone || null,
        };
      }

      if (!sponsor) {
        sponsor = {
          name: sponsorName,
          metier: ownerMember.metier || null,
          ville: ownerMember.ville || null,
          phone: ownerMember.phone || null,
        };
      }
    }
  }

  return {
    error: null as string | null,
    scout: scoutRow,
    invite: inviteTyped,
    referrals: (referrals as HumanScoutReferral[] | null) || [],
    sponsorName,
    sponsor,
  };
}

export async function activateScoutFromToken(formData: FormData) {
  const token = String(formData.get("invite_token") || "").trim();
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!token) return { error: "Invitation invalide." };

  const supabaseAdmin = createAdminClient();
  const { data: invite } = await supabaseAdmin
    .from("human_scout_invites")
    .select("id,scout_id,invite_token,expires_at,accepted_at")
    .eq("invite_token", token.toLowerCase())
    .maybeSingle();
  if (!invite || !invite.scout_id) return { error: "Invitation introuvable." };
  if (new Date(invite.expires_at).getTime() < Date.now()) return { error: "Invitation expirée." };

  const nowIso = new Date().toISOString();
  const { error: scoutError } = await supabaseAdmin
    .from("human_scouts")
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
      status: "active",
      updated_at: nowIso,
    })
    .eq("id", invite.scout_id);
  if (scoutError) return { error: scoutError.message };

  if (!invite.accepted_at) {
    const { error: inviteError } = await supabaseAdmin
      .from("human_scout_invites")
      .update({ accepted_at: nowIso })
      .eq("id", invite.id);
    if (inviteError) return { error: inviteError.message };
  }

  return { success: true };
}

export async function activateScoutFromTokenAction(formData: FormData): Promise<void> {
  const token = String(formData.get("invite_token") || "").trim();
  const result = await activateScoutFromToken(formData);
  if ("error" in result) redirect(`/popey-human/eclaireur/${token}?status=error&message=${encodeURIComponent(result.error || "Action impossible.")}`);
  redirect(`/popey-human/eclaireur/${token}?status=success&message=${encodeURIComponent("Profil activé.")}`);
}

export async function submitScoutReferralFromToken(formData: FormData) {
  const token = String(formData.get("invite_token") || "").trim();
  const contactName = String(formData.get("contact_name") || "").trim();
  const contactPhone = String(formData.get("contact_phone") || "").trim();
  const projectType = String(formData.get("project_type") || "").trim();
  const comment = String(formData.get("comment") || "").trim();
  const estimatedDealValueRaw = String(formData.get("estimated_deal_value") || "").trim();

  if (!token) return { error: "Invitation invalide." };
  if (!contactName) return { error: "Nom du contact requis." };
  if (!contactPhone) return { error: "Téléphone du contact requis." };

  const estimatedDealValue = estimatedDealValueRaw ? Number(estimatedDealValueRaw) : null;
  if (estimatedDealValueRaw && (!Number.isFinite(estimatedDealValue) || Number(estimatedDealValue) <= 0)) {
    return { error: "Montant estimé invalide." };
  }

  const supabaseAdmin = createAdminClient();
  const { data: invite } = await supabaseAdmin
    .from("human_scout_invites")
    .select("id,owner_member_id,scout_id,invite_token,expires_at")
    .eq("invite_token", token.toLowerCase())
    .maybeSingle();
  if (!invite || !invite.scout_id) return { error: "Invitation introuvable." };
  if (new Date(invite.expires_at).getTime() < Date.now()) return { error: "Invitation expirée." };

  const normalizedPhone = normalizePhone(contactPhone);
  const { data: duplicateLead } = await supabaseAdmin
    .from("human_leads")
    .select("id,status")
    .eq("owner_member_id", invite.owner_member_id)
    .eq("phone", normalizedPhone)
    .in("status", ["nouveau", "pris", "signe"])
    .limit(1)
    .maybeSingle();
  if (duplicateLead) {
    return { error: "Ce contact est déjà suivi par le membre. Merci d'envoyer un autre lead." };
  }

  const { error } = await supabaseAdmin.from("human_scout_referrals").insert({
    owner_member_id: invite.owner_member_id,
    scout_id: invite.scout_id,
    contact_name: contactName,
    contact_phone: contactPhone,
    contact_phone_normalized: normalizedPhone,
    project_type: projectType || null,
    comment: comment || null,
    status: "submitted",
    estimated_deal_value: estimatedDealValue,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  await logScoutEvent({
    supabaseAdmin,
    scoutId: invite.scout_id,
    eventType: "referral_submitted",
    payload: {
      contact_name: contactName,
      contact_phone: contactPhone,
      estimated_deal_value: estimatedDealValue,
    },
  });

  await notifyMember(invite.owner_member_id, {
    title: `Nouveau signal d'éclaireur: ${contactName}`,
    message: "Appelez le contact sous 30 minutes pour maximiser la conversion.",
    impact: "scout:submitted",
  });

  revalidatePath(`/popey-human/eclaireur/${token}`);
  revalidatePath("/popey-human/app/eclaireurs");
  revalidatePath("/admin/humain/eclaireurs");
  return { success: true };
}

export async function submitScoutReferralFromTokenAction(formData: FormData): Promise<void> {
  const token = String(formData.get("invite_token") || "").trim();
  const result = await submitScoutReferralFromToken(formData);
  if ("error" in result) redirect(`/popey-human/eclaireur/${token}?status=error&message=${encodeURIComponent(result.error || "Action impossible.")}`);
  redirect(`/popey-human/eclaireur/${token}?status=success&message=${encodeURIComponent("Alerte envoyée.")}`);
}

export async function getAdminScoutSnapshot() {
  const admin = await requireAdminUser();
  if ("error" in admin) {
    return {
      error: admin.error,
      scouts: [] as Array<HumanScout & { ownerLabel: string; referralsCount: number; convertedCount: number }>,
      referrals: [] as HumanScoutReferral[],
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data: scoutsData }, { data: membersData }, { data: profilesData }, { data: referralsData }] = await Promise.all([
    supabaseAdmin
      .from("human_scouts")
      .select("id,owner_member_id,user_id,first_name,last_name,ville,phone,email,status,commission_rate,total_paid,pending_earnings,created_at,updated_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("human_members").select("id,user_id,first_name,last_name"),
    supabaseAdmin.from("profiles").select("id,display_name,trade"),
    supabaseAdmin
      .from("human_scout_referrals")
      .select(
        "id,owner_member_id,scout_id,lead_id,contact_name,contact_phone,contact_phone_normalized,project_type,comment,status,rejection_reason,estimated_deal_value,estimated_commission,final_signed_amount,final_commission,commission_rate_snapshot,validated_at,offered_at,converted_at,paid_at,created_at,updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(1200),
  ]);

  const scouts = (scoutsData as HumanScout[] | null) || [];
  const referrals = (referralsData as HumanScoutReferral[] | null) || [];
  const members = (membersData as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null }> | null) || [];
  const profiles = (profilesData as Array<{ id: string; display_name: string | null; trade: string | null }> | null) || [];
  const profileByUserId = new Map(
    profiles.map((profile) => [
      profile.id,
      (profile.display_name && profile.display_name.trim()) || (profile.trade && profile.trade.trim()) || profile.id,
    ])
  );
  const memberLabelById = new Map<string, string>();
  members.forEach((member) => {
    const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
    memberLabelById.set(member.id, full || profileByUserId.get(member.user_id) || member.user_id);
  });

  const referralsByScoutId = new Map<string, HumanScoutReferral[]>();
  referrals.forEach((referral) => {
    const arr = referralsByScoutId.get(referral.scout_id) || [];
    arr.push(referral);
    referralsByScoutId.set(referral.scout_id, arr);
  });

  return {
    error: null as string | null,
    scouts: scouts.map((scout) => {
      const scopedReferrals = referralsByScoutId.get(scout.id) || [];
      return {
        ...scout,
        ownerLabel: memberLabelById.get(scout.owner_member_id) || scout.owner_member_id,
        referralsCount: scopedReferrals.length,
        convertedCount: scopedReferrals.filter((referral) => referral.status === "converted").length,
      };
    }),
    referrals,
  };
}

export async function adminSetScoutCommissionRate(formData: FormData) {
  const admin = await requireAdminUser();
  if ("error" in admin) return { error: admin.error };

  const scoutId = String(formData.get("scout_id") || "").trim();
  const rateRaw = String(formData.get("commission_rate") || "").trim();
  if (!scoutId) return { error: "Éclaireur invalide." };
  const rate = Number(rateRaw);
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) return { error: "Taux invalide (0 à 1)." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_scouts")
    .update({
      commission_rate: rate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scoutId);
  if (error) return { error: error.message };

  revalidatePath("/admin/humain/eclaireurs");
  revalidatePath("/popey-human/app/eclaireurs");
  return { success: true };
}

export async function adminSetScoutCommissionRateAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/eclaireurs");
  const result = await adminSetScoutCommissionRate(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", "Taux commission mis à jour."));
}

export async function adminSendScoutNudge(formData: FormData) {
  const admin = await requireAdminUser();
  if ("error" in admin) return { error: admin.error };

  const mode = String(formData.get("mode") || "inactive14d");
  const scoutId = String(formData.get("scout_id") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const nudgeMessage =
    message || "Le marché local bouge: pensez à lancer vos alertes éclaireur cette semaine.";

  const supabaseAdmin = createAdminClient();
  let targetScouts: HumanScout[] = [];
  if (mode === "single") {
    const { data: scout } = await supabaseAdmin
      .from("human_scouts")
      .select("id,owner_member_id,user_id,first_name,last_name,ville,phone,email,status,commission_rate,total_paid,pending_earnings,created_at,updated_at")
      .eq("id", scoutId)
      .maybeSingle();
    if (!scout) return { error: "Éclaireur introuvable." };
    targetScouts = [scout as HumanScout];
  } else {
    const { data: scoutsData } = await supabaseAdmin
      .from("human_scouts")
      .select("id,owner_member_id,user_id,first_name,last_name,ville,phone,email,status,commission_rate,total_paid,pending_earnings,created_at,updated_at")
      .eq("status", "active");
    const allScouts = (scoutsData as HumanScout[] | null) || [];
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;

    const { data: recentReferrals } = await supabaseAdmin
      .from("human_scout_referrals")
      .select("scout_id,created_at")
      .gte("created_at", new Date(cutoff).toISOString());
    const activeScoutIds = new Set(((recentReferrals as Array<{ scout_id: string; created_at: string }> | null) || []).map((r) => r.scout_id));
    targetScouts = allScouts.filter((scout) => !activeScoutIds.has(scout.id));
  }

  if (targetScouts.length === 0) return { error: "Aucun éclaireur cible pour cette relance." };

  for (const scout of targetScouts) {
    await logScoutEvent({
      supabaseAdmin,
      scoutId: scout.id,
      eventType: "nudge",
      payload: { message: nudgeMessage },
    });
    await notifyMember(scout.owner_member_id, {
      title: "Relance éclaireur envoyée",
      message: `${scout.first_name || "Éclaireur"} a été relancé.`,
      impact: `scout:nudge:${scout.id}`,
    });
  }

  revalidatePath("/admin/humain/eclaireurs");
  return { success: true, count: targetScouts.length };
}

export async function adminSendScoutNudgeAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/eclaireurs");
  const result = await adminSendScoutNudge(formData);
  if ("error" in result) redirect(withScoutStatus(currentUrl, "error", result.error || "Action impossible."));
  redirect(withScoutStatus(currentUrl, "success", `${result.count} éclaireur(s) relancé(s).`));
}

export async function runScoutReferralStatusNudgeSweep(input?: { hoursThreshold?: number; limit?: number }) {
  const supabaseAdmin = createAdminClient();
  const rawHours = Number(input?.hoursThreshold ?? process.env.SCOUT_REFERRAL_NUDGE_HOURS ?? 24);
  const hoursThreshold = Number.isFinite(rawHours) ? Math.min(168, Math.max(1, Math.round(rawHours))) : 24;
  const rawLimit = Number(input?.limit ?? 500);
  const limit = Number.isFinite(rawLimit) ? Math.min(2000, Math.max(1, Math.round(rawLimit))) : 500;
  const cutoffIso = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString();
  const staleStatuses: ReferralStatus[] = ["submitted", "validated", "offered"];

  const { data: staleReferralsData, error: staleError } = await supabaseAdmin
    .from("human_scout_referrals")
    .select("id,owner_member_id,scout_id,contact_name,status,updated_at")
    .in("status", staleStatuses)
    .lte("updated_at", cutoffIso)
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (staleError) return { success: false as const, error: staleError.message };

  const staleReferrals =
    ((staleReferralsData as Array<{
      id: string;
      owner_member_id: string;
      scout_id: string;
      contact_name: string;
      status: ReferralStatus;
      updated_at: string;
    }> | null) || []);

  if (staleReferrals.length === 0) {
    return { success: true as const, scanned: 0, nudged: 0, skippedAlreadyNudged: 0, hoursThreshold };
  }

  const scoutIds = Array.from(new Set(staleReferrals.map((item) => item.scout_id)));
  const { data: scoutRows } = await supabaseAdmin
    .from("human_scouts")
    .select("id,first_name,last_name,email,phone")
    .in("id", scoutIds);
  const scoutById = new Map(
    (((scoutRows as Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null }> | null) || []).map((row) => [row.id, row]))
  );

  const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString();
  const { data: nudgeLogs } = await supabaseAdmin
    .from("human_scout_notification_log")
    .select("event_type,payload_json")
    .eq("event_type", "referral_status_nudge")
    .gte("created_at", sinceIso)
    .limit(100000);

  const nudgedKeys = new Set<string>();
  (((nudgeLogs as Array<{ event_type: string; payload_json: Record<string, unknown> | null }> | null) || [])).forEach((row) => {
    const payload = row.payload_json || {};
    const referralId = typeof payload.referral_id === "string" ? payload.referral_id : "";
    const status = typeof payload.status === "string" ? payload.status : "";
    if (referralId && status) nudgedKeys.add(`${referralId}:${status}`);
  });

  let nudged = 0;
  let skippedAlreadyNudged = 0;

  for (const referral of staleReferrals) {
    const dedupeKey = `${referral.id}:${referral.status}`;
    if (nudgedKeys.has(dedupeKey)) {
      skippedAlreadyNudged += 1;
      continue;
    }

    const scout = scoutById.get(referral.scout_id);
    const scoutName = [scout?.first_name, scout?.last_name].filter(Boolean).join(" ").trim() || scout?.email || scout?.phone || "Éclaireur";
    const statusLabel =
      referral.status === "submitted"
        ? "Reçu"
        : referral.status === "validated"
          ? "RDV"
          : referral.status === "offered"
            ? "Offre"
            : referral.status;

    await notifyMember(referral.owner_member_id, {
      title: `Relance opportunité: ${referral.contact_name}`,
      message: `${scoutName} attend une mise à jour sur le statut "${statusLabel}" depuis plus de ${hoursThreshold}h.`,
      impact: `scout:status-nudge:${referral.id}:${referral.status}`,
    });

    await logScoutEvent({
      supabaseAdmin,
      scoutId: referral.scout_id,
      eventType: "referral_status_nudge",
      payload: {
        referral_id: referral.id,
        status: referral.status,
        threshold_hours: hoursThreshold,
        owner_member_id: referral.owner_member_id,
      },
    });

    nudgedKeys.add(dedupeKey);
    nudged += 1;
  }

  return {
    success: true as const,
    scanned: staleReferrals.length,
    nudged,
    skippedAlreadyNudged,
    hoursThreshold,
  };
}

async function notifyMember(
  memberId: string,
  input: { title: string; message: string; impact: string }
) {
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from("human_notifications").insert({
    member_id: memberId,
    type: "personnelle",
    title: input.title,
    message: input.message,
    impact: input.impact,
    is_read: false,
  });
}

async function logScoutEvent(input: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  scoutId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  await input.supabaseAdmin.from("human_scout_notification_log").insert({
    scout_id: input.scoutId,
    event_type: input.eventType,
    payload_json: input.payload,
    status: "sent",
  });
}

function normalizePhone(input: string) {
  return input.replaceAll(/\s+/g, "").replaceAll("-", "").replaceAll(".", "");
}

function generateScoutShortCode() {
  const raw = randomUUID().replaceAll("-", "").toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

async function createScoutInviteRecord(input: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  ownerMemberId: string;
  scoutId: string;
}): Promise<HumanScoutInvite | null> {
  const token = randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  let inviteInserted = false;
  let shortCodeEnabled = true;

  for (let attempt = 0; attempt < 10; attempt++) {
    const shortCode = generateScoutShortCode();
    const payload: Record<string, unknown> = {
      owner_member_id: input.ownerMemberId,
      scout_id: input.scoutId,
      invite_token: token,
      expires_at: expiresAt,
    };
    if (shortCodeEnabled) payload.short_code = shortCode;

    const { error: inviteError } = await input.supabaseAdmin.from("human_scout_invites").insert(payload);
    if (!inviteError) {
      inviteInserted = true;
      break;
    }

    const message = inviteError.message.toLowerCase();
    if (message.includes("column") && message.includes("short_code")) {
      shortCodeEnabled = false;
      continue;
    }
    if (!message.includes("short_code")) {
      return null;
    }
  }

  if (!inviteInserted) return null;

  const { data: createdInviteWithCode } = await input.supabaseAdmin
    .from("human_scout_invites")
    .select("id,owner_member_id,scout_id,invite_token,short_code,expires_at,accepted_at,created_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (createdInviteWithCode) {
    return createdInviteWithCode as HumanScoutInvite;
  }

  const { data: createdInviteFallback } = await input.supabaseAdmin
    .from("human_scout_invites")
    .select("id,owner_member_id,scout_id,invite_token,expires_at,accepted_at,created_at")
    .eq("invite_token", token)
    .maybeSingle();

  if (!createdInviteFallback) return null;
  return {
    ...(createdInviteFallback as Omit<HumanScoutInvite, "short_code">),
    short_code: null,
  };
}

function normalizeScoutShortCode(value: string) {
  const raw = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 8) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

async function requireMemberUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) return { error: "Profil Popey Human introuvable." };
  return { user, myMember };
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) return { error: "Accès admin requis." };
  return { user };
}

function withScoutStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/") ? url : "/popey-human/app/eclaireurs";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("scoutStatus", status);
  parsed.searchParams.set("scoutMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}
