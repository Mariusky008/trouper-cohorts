"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId, getMyHumanScope } from "@/lib/actions/human-permissions";

type HumanLeadStatus = "nouveau" | "pris" | "signe" | "perdu";

type HumanLead = {
  id: string;
  owner_member_id: string | null;
  source_member_id: string | null;
  client_name: string;
  budget: number | null;
  besoin: string | null;
  phone: string | null;
  adresse: string | null;
  notes: string | null;
  status: HumanLeadStatus;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listVisibleHumanLeads() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Session requise.", leads: [] as Array<HumanLead & { ownerLabel: string; sourceLabel: string }> };
  }

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) {
    return { error: "Profil Popey Human introuvable.", leads: [] as Array<HumanLead & { ownerLabel: string; sourceLabel: string }> };
  }

  const scope = await getMyHumanScope();
  if ("error" in scope) {
    return { error: scope.error, leads: [] as Array<HumanLead & { ownerLabel: string; sourceLabel: string }> };
  }

  const supabaseAdmin = createAdminClient();
  const { data: leadsData } = await supabaseAdmin
    .from("human_leads")
    .select("id,owner_member_id,source_member_id,client_name,budget,besoin,phone,adresse,notes,status,opened_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(300);

  const leads = (leadsData as HumanLead[] | null) || [];

  const visibleMemberIds = new Set<string>([myMember.id]);
  if (scope.mode === "SPHERE_FULL") {
    // no filter by member ids
  } else if (scope.mode === "SELECTED_MEMBERS") {
    scope.allowedMemberIds.forEach((id) => visibleMemberIds.add(id));
    scope.buddyMemberIds.forEach((id) => visibleMemberIds.add(id));
  } else {
    scope.buddyMemberIds.forEach((id) => visibleMemberIds.add(id));
  }

  const filtered = scope.mode === "SPHERE_FULL"
    ? leads
    : leads.filter((lead) => {
        const ownerVisible = lead.owner_member_id ? visibleMemberIds.has(lead.owner_member_id) : false;
        const sourceVisible = lead.source_member_id ? visibleMemberIds.has(lead.source_member_id) : false;
        const mine = lead.owner_member_id === myMember.id || lead.source_member_id === myMember.id;
        return mine || ownerVisible || sourceVisible;
      });

  const memberIds = new Set<string>();
  filtered.forEach((lead) => {
    if (lead.owner_member_id) memberIds.add(lead.owner_member_id);
    if (lead.source_member_id) memberIds.add(lead.source_member_id);
  });

  const { data: members } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id,first_name,last_name")
    .in("id", Array.from(memberIds));
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,display_name");

  const profileNameByUserId = new Map(
    ((profiles as Array<{ id: string; display_name: string | null }> | null) || []).map((p) => [p.id, p.display_name || ""])
  );

  const memberLabelById = new Map<string, string>();
  ((members as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null }> | null) || []).forEach(
    (member) => {
      const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
      const fallback = profileNameByUserId.get(member.user_id) || member.user_id;
      memberLabelById.set(member.id, full || fallback || "Membre");
    }
  );

  return {
    error: null as string | null,
    leads: filtered.map((lead) => ({
      ...lead,
      ownerLabel: lead.owner_member_id ? memberLabelById.get(lead.owner_member_id) || "Non assigné" : "Non assigné",
      sourceLabel: lead.source_member_id ? memberLabelById.get(lead.source_member_id) || "Non renseigné" : "Non renseigné",
    })),
  };
}

export async function takeHumanLead(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const leadId = String(formData.get("lead_id") || "");
  if (!leadId) return { error: "Lead invalide." };

  const myMember = await ensureHumanMemberForUserId(user.id);
  if (!myMember) return { error: "Profil Popey Human introuvable." };

  const visible = await listVisibleHumanLeads();
  if (visible.error) return { error: visible.error };
  const lead = visible.leads.find((l) => l.id === leadId);
  if (!lead) return { error: "Lead non visible avec votre scope d'accès." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_leads")
    .update({
      owner_member_id: myMember.id,
      status: "pris",
      opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/clients");
  return { success: true };
}

export async function takeHumanLeadAction(formData: FormData): Promise<void> {
  await takeHumanLead(formData);
}

export async function adminCreateHumanLead(formData: FormData) {
  const admin = await requireAdminUser();
  if ("error" in admin) return { error: admin.error };

  const sourceUserId = String(formData.get("source_user_id") || "");
  const clientName = String(formData.get("client_name") || "").trim();
  const budgetRaw = String(formData.get("budget") || "").trim();
  const besoin = String(formData.get("besoin") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const adresse = String(formData.get("adresse") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!sourceUserId) return { error: "Source manquante." };
  if (!clientName) return { error: "Nom client requis." };

  const sourceMember = await ensureHumanMemberForUserId(sourceUserId);
  if (!sourceMember) return { error: "Source Popey Human introuvable." };

  const budget = budgetRaw ? Number(budgetRaw) : null;
  if (budgetRaw && Number.isNaN(budget)) return { error: "Budget invalide." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_leads").insert({
    owner_member_id: null,
    source_member_id: sourceMember.id,
    client_name: clientName,
    budget,
    besoin: besoin || null,
    phone: phone || null,
    adresse: adresse || null,
    notes: notes || null,
    status: "nouveau",
  });
  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/clients");
  revalidatePath("/admin/humain/permissions");
  return { success: true };
}

export async function adminCreateHumanLeadAction(formData: FormData): Promise<void> {
  await adminCreateHumanLead(formData);
}

export async function getAdminHumanLeads() {
  const admin = await requireAdminUser();
  if ("error" in admin) {
    return {
      error: admin.error,
      leads: [] as Array<HumanLead & { ownerLabel: string; sourceLabel: string }>,
    };
  }

  const supabaseAdmin = createAdminClient();
  const { data: leadsData } = await supabaseAdmin
    .from("human_leads")
    .select("id,owner_member_id,source_member_id,client_name,budget,besoin,phone,adresse,notes,status,opened_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const leads = (leadsData as HumanLead[] | null) || [];
  const memberIds = new Set<string>();
  leads.forEach((lead) => {
    if (lead.owner_member_id) memberIds.add(lead.owner_member_id);
    if (lead.source_member_id) memberIds.add(lead.source_member_id);
  });

  const { data: members } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id,first_name,last_name")
    .in("id", Array.from(memberIds));
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,display_name");

  const profileNameByUserId = new Map(
    ((profiles as Array<{ id: string; display_name: string | null }> | null) || []).map((p) => [p.id, p.display_name || ""])
  );

  const memberLabelById = new Map<string, string>();
  ((members as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null }> | null) || []).forEach(
    (member) => {
      const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
      const fallback = profileNameByUserId.get(member.user_id) || member.user_id;
      memberLabelById.set(member.id, full || fallback || "Membre");
    }
  );

  return {
    error: null as string | null,
    leads: leads.map((lead) => ({
      ...lead,
      ownerLabel: lead.owner_member_id ? memberLabelById.get(lead.owner_member_id) || "Non assigné" : "Non assigné",
      sourceLabel: lead.source_member_id ? memberLabelById.get(lead.source_member_id) || "Non renseigné" : "Non renseigné",
    })),
  };
}

export async function getHumanLeadSourceCandidates() {
  const admin = await requireAdminUser();
  if ("error" in admin) {
    return { error: admin.error, candidates: [] as Array<{ user_id: string; label: string }> };
  }

  const supabaseAdmin = createAdminClient();
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,display_name,trade")
    .order("display_name", { ascending: true })
    .limit(500);

  return {
    error: null as string | null,
    candidates: ((profiles as Array<{ id: string; display_name: string | null; trade: string | null }> | null) || []).map((profile) => ({
      user_id: profile.id,
      label: (profile.display_name && profile.display_name.trim()) || (profile.trade && profile.trade.trim()) || profile.id,
    })),
  };
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
