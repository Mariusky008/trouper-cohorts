"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type HumanAccessMode = "BINOME_ONLY" | "SELECTED_MEMBERS" | "SPHERE_FULL";
export type HumanMemberStatus = "active" | "paused" | "archived";

type HumanMember = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  metier: string | null;
  ville: string | null;
  phone: string | null;
  status: "active" | "paused" | "archived";
};

type HumanPermission = {
  member_id: string;
  access_mode: HumanAccessMode;
  note: string | null;
};

type HumanAllowed = {
  member_id: string;
  allowed_member_id: string;
};

type HumanBuddy = {
  member_a_id: string;
  member_b_id: string;
};

type HumanPermissionAuditEvent = {
  id: string;
  member_id: string | null;
  actor_user_id: string | null;
  action:
    | "permission_created"
    | "permission_updated"
    | "permission_deleted"
    | "allowed_member_granted"
    | "allowed_member_revoked"
    | "buddy_assigned"
    | "buddy_removed";
  previous_mode: string | null;
  next_mode: string | null;
  note: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
};

const HUMAN_AUDIT_ACTIONS = [
  "permission_created",
  "permission_updated",
  "permission_deleted",
  "allowed_member_granted",
  "allowed_member_revoked",
  "buddy_assigned",
  "buddy_removed",
] as const;

type HumanAuditAction = (typeof HUMAN_AUDIT_ACTIONS)[number];

type HumanAuditFilters = {
  action?: HumanAuditAction;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  sort?: "date_desc" | "date_asc";
  page?: number;
};

export type HumanDirectoryMember = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  metier: string | null;
  ville: string | null;
  phone: string | null;
  status: "active" | "paused" | "archived";
};

export async function getHumanPermissionsAdminSnapshot(filters: HumanAuditFilters = {}) {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) {
    return {
      error: adminCheck.error,
      members: [],
      candidates: [],
      permissionsByMemberId: {} as Record<string, HumanPermission>,
      allowedByMemberId: {} as Record<string, string[]>,
      buddiesByMemberId: {} as Record<string, string[]>,
      auditEvents: [] as Array<
        HumanPermissionAuditEvent & {
          memberLabel: string;
          actorLabel: string;
        }
      >,
    };
  }

  const supabaseAdmin = createAdminClient();

  const pageSize = 20;
  const page = Math.max(1, Number(filters.page || 1));
  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;
  const ascending = filters.sort === "date_asc";

  let auditsQuery = supabaseAdmin
    .from("human_permissions_audit_log")
    .select("id,member_id,actor_user_id,action,previous_mode,next_mode,note,meta,created_at", { count: "exact" })
    .order("created_at", { ascending })
    .range(rangeStart, rangeEnd);

  if (filters.action && HUMAN_AUDIT_ACTIONS.includes(filters.action)) {
    auditsQuery = auditsQuery.eq("action", filters.action);
  }
  if (filters.memberId) {
    auditsQuery = auditsQuery.eq("member_id", filters.memberId);
  }
  if (filters.startDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
    auditsQuery = auditsQuery.gte("created_at", `${filters.startDate}T00:00:00.000Z`);
  }
  if (filters.endDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
    auditsQuery = auditsQuery.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
  }

  const [
    { data: members },
    { data: permissions },
    { data: allowed },
    { data: buddies },
    { data: profiles },
    { data: audits, count: auditsCount },
  ] =
    await Promise.all([
      supabaseAdmin
        .from("human_members")
        .select("id,user_id,first_name,last_name,metier,ville,phone,status")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("human_permissions")
        .select("member_id,access_mode,note"),
      supabaseAdmin
        .from("human_allowed_members")
        .select("member_id,allowed_member_id"),
      supabaseAdmin
        .from("human_buddy_links")
        .select("member_a_id,member_b_id"),
      supabaseAdmin
        .from("profiles")
        .select("id,display_name,trade,city,phone"),
      auditsQuery,
    ]);

  const profileByUserId = new Map(
    (profiles || []).map((p) => [
      p.id as string,
      {
        display_name: typeof p.display_name === "string" ? p.display_name : "",
        trade: typeof p.trade === "string" ? p.trade : null,
        city: typeof p.city === "string" ? p.city : null,
        phone: typeof p.phone === "string" ? p.phone : null,
      },
    ])
  );
  const profileLabelByUserId = new Map(
    (profiles || []).map((p) => [
      String(p.id),
      (typeof p.display_name === "string" && p.display_name.trim()) ||
        (typeof p.trade === "string" && p.trade.trim()) ||
        String(p.id),
    ])
  );

  const normalizedMembers: HumanMember[] = ((members as HumanMember[] | null) || []).map((member) => {
    const profile = profileByUserId.get(member.user_id);
    const displayName = profile?.display_name || "";
    const [firstName = "", ...lastNameParts] = displayName.trim().split(/\s+/);

    return {
      ...member,
      first_name: member.first_name || firstName || null,
      last_name: member.last_name || (lastNameParts.join(" ") || null),
      metier: member.metier || profile?.trade || null,
      ville: member.ville || profile?.city || null,
      phone: member.phone || profile?.phone || null,
    };
  });

  const permissionsByMemberId = Object.fromEntries(
    ((permissions as HumanPermission[] | null) || []).map((entry) => [entry.member_id, entry])
  );

  const allowedByMemberId: Record<string, string[]> = {};
  ((allowed as HumanAllowed[] | null) || []).forEach((entry) => {
    if (!allowedByMemberId[entry.member_id]) {
      allowedByMemberId[entry.member_id] = [];
    }
    allowedByMemberId[entry.member_id].push(entry.allowed_member_id);
  });

  const buddiesByMemberId: Record<string, string[]> = {};
  ((buddies as HumanBuddy[] | null) || []).forEach((entry) => {
    if (!buddiesByMemberId[entry.member_a_id]) {
      buddiesByMemberId[entry.member_a_id] = [];
    }
    if (!buddiesByMemberId[entry.member_b_id]) {
      buddiesByMemberId[entry.member_b_id] = [];
    }
    buddiesByMemberId[entry.member_a_id].push(entry.member_b_id);
    buddiesByMemberId[entry.member_b_id].push(entry.member_a_id);
  });

  const memberLabelById = new Map(
    normalizedMembers.map((member) => {
      const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
      const identity = fullName || "Membre sans nom";
      const subtitle = [member.metier, member.ville].filter(Boolean).join(" • ");
      return [member.id, subtitle ? `${identity} (${subtitle})` : identity];
    })
  );

  const auditEvents = ((audits as HumanPermissionAuditEvent[] | null) || []).map((event) => ({
    ...event,
    memberLabel: event.member_id ? memberLabelById.get(event.member_id) || event.member_id : "N/A",
    actorLabel: event.actor_user_id
      ? profileLabelByUserId.get(event.actor_user_id) || event.actor_user_id
      : "Système",
  }));

  return {
    members: normalizedMembers,
    candidates: (profiles || []).map((p) => ({
      user_id: String(p.id),
      label:
        (typeof p.display_name === "string" && p.display_name.trim()) ||
        (typeof p.trade === "string" && p.trade.trim()) ||
        "Membre",
    })),
    permissionsByMemberId,
    allowedByMemberId,
    buddiesByMemberId,
    auditEvents,
    auditPagination: {
      page,
      pageSize,
      total: auditsCount || 0,
      totalPages: Math.max(1, Math.ceil((auditsCount || 0) / pageSize)),
      sort: ascending ? "date_asc" : "date_desc",
    },
    error: null as string | null,
  };
}

export async function adminSetMode(formData: FormData) {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) return { error: adminCheck.error };

  const userId = String(formData.get("user_id") || "");
  const mode = String(formData.get("access_mode") || "") as HumanAccessMode;
  const note = String(formData.get("note") || "").trim();

  if (!userId) return { error: "Utilisateur manquant." };
  if (!["BINOME_ONLY", "SELECTED_MEMBERS", "SPHERE_FULL"].includes(mode)) {
    return { error: "Mode d'accès invalide." };
  }

  const supabaseAdmin = createAdminClient();
  const ensured = await ensureHumanMember(supabaseAdmin, userId);
  if (!ensured) {
    return { error: "Impossible de créer ou récupérer le membre humain." };
  }

  const { error } = await supabaseAdmin
    .from("human_permissions")
    .upsert(
      {
        member_id: ensured.id,
        access_mode: mode,
        decided_by_admin_id: adminCheck.user.id,
        decided_at: new Date().toISOString(),
        note: note || null,
      },
      { onConflict: "member_id" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/humain");
  revalidatePath("/admin/humain/permissions");
  return { success: true };
}

export async function adminSetModeAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/permissions");
  const result = await adminSetMode(formData);
  if ("error" in result) {
    redirect(withPermissionsStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withPermissionsStatus(currentUrl, "success", "Mode d'accès mis à jour."));
}

export async function adminGrantMember(formData: FormData) {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) return { error: adminCheck.error };

  const userId = String(formData.get("user_id") || "");
  const allowedUserId = String(formData.get("allowed_user_id") || "");
  if (!userId || !allowedUserId) return { error: "Membres manquants." };
  if (userId === allowedUserId) return { error: "Un membre ne peut pas s'autoriser lui-même." };

  const supabaseAdmin = createAdminClient();
  const member = await ensureHumanMember(supabaseAdmin, userId);
  const allowedMember = await ensureHumanMember(supabaseAdmin, allowedUserId);
  if (!member || !allowedMember) return { error: "Impossible d'initialiser les membres." };

  const { error } = await supabaseAdmin.from("human_allowed_members").upsert(
    {
      member_id: member.id,
      allowed_member_id: allowedMember.id,
      granted_by_admin_id: adminCheck.user.id,
      granted_at: new Date().toISOString(),
    },
    { onConflict: "member_id,allowed_member_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/humain/permissions");
  return { success: true };
}

export async function adminGrantMemberAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/permissions");
  const result = await adminGrantMember(formData);
  if ("error" in result) {
    redirect(withPermissionsStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withPermissionsStatus(currentUrl, "success", "Membre autorisé ajouté."));
}

export async function adminRevokeMember(formData: FormData) {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) return { error: adminCheck.error };

  const memberId = String(formData.get("member_id") || "");
  const allowedMemberId = String(formData.get("allowed_member_id") || "");
  if (!memberId || !allowedMemberId) return { error: "Relation à supprimer invalide." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_allowed_members")
    .delete()
    .eq("member_id", memberId)
    .eq("allowed_member_id", allowedMemberId);

  if (error) return { error: error.message };
  revalidatePath("/admin/humain/permissions");
  return { success: true };
}

export async function adminRevokeMemberAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/permissions");
  const result = await adminRevokeMember(formData);
  if ("error" in result) {
    redirect(withPermissionsStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withPermissionsStatus(currentUrl, "success", "Membre autorisé retiré."));
}

export async function adminAssignBuddy(formData: FormData) {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) return { error: adminCheck.error };

  const userAId = String(formData.get("user_a_id") || "");
  const userBId = String(formData.get("user_b_id") || "");
  if (!userAId || !userBId) return { error: "Les deux membres sont obligatoires." };
  if (userAId === userBId) return { error: "Un binôme nécessite deux membres différents." };

  const supabaseAdmin = createAdminClient();
  const memberA = await ensureHumanMember(supabaseAdmin, userAId);
  const memberB = await ensureHumanMember(supabaseAdmin, userBId);
  if (!memberA || !memberB) return { error: "Impossible d'initialiser le binôme." };

  const ordered = [memberA.id, memberB.id].sort();
  const { error } = await supabaseAdmin.from("human_buddy_links").upsert(
    {
      member_a_id: ordered[0],
      member_b_id: ordered[1],
      assigned_by_admin_id: adminCheck.user.id,
      assigned_at: new Date().toISOString(),
    },
    { onConflict: "member_a_id,member_b_id", ignoreDuplicates: true }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/humain/permissions");
  return { success: true };
}

export async function adminAssignBuddyAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/permissions");
  const result = await adminAssignBuddy(formData);
  if ("error" in result) {
    redirect(withPermissionsStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withPermissionsStatus(currentUrl, "success", "Binôme créé."));
}

export async function adminInitMember(formData: FormData) {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) return { error: adminCheck.error };

  const userId = String(formData.get("user_id") || "");
  if (!userId) return { error: "Utilisateur manquant." };

  const supabaseAdmin = createAdminClient();
  const member = await ensureHumanMember(supabaseAdmin, userId);
  if (!member) return { error: "Impossible d'initialiser ce membre." };

  revalidatePath("/admin/humain/membres");
  revalidatePath("/admin/humain/permissions");
  return { success: true };
}

export async function adminInitMemberAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/membres");
  const result = await adminInitMember(formData);
  if ("error" in result) {
    redirect(withMembersStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withMembersStatus(currentUrl, "success", "Membre initialisé."));
}

export async function adminSetMemberStatus(formData: FormData) {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) return { error: adminCheck.error };

  const memberId = String(formData.get("member_id") || "");
  const status = String(formData.get("status") || "") as HumanMemberStatus;
  if (!memberId) return { error: "Membre manquant." };
  if (!["active", "paused", "archived"].includes(status)) {
    return { error: "Statut invalide." };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_members")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/admin/humain/membres");
  revalidatePath("/admin/humain/permissions");
  return { success: true };
}

export async function adminSetMemberStatusAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/membres");
  const result = await adminSetMemberStatus(formData);
  if ("error" in result) {
    redirect(withMembersStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withMembersStatus(currentUrl, "success", "Statut membre mis à jour."));
}

export async function getMyHumanScope() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Utilisateur non connecté." };
  }

  const supabaseAdmin = createAdminClient();
  const { data: myMember } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMember) {
    return {
      mode: "BINOME_ONLY" as HumanAccessMode,
      allowedMemberIds: [] as string[],
      buddyMemberIds: [] as string[],
    };
  }

  const { data: permission } = await supabaseAdmin
    .from("human_permissions")
    .select("access_mode")
    .eq("member_id", myMember.id)
    .maybeSingle();
  const mode = (permission?.access_mode as HumanAccessMode | undefined) || "BINOME_ONLY";

  const { data: allowedRows } = await supabaseAdmin
    .from("human_allowed_members")
    .select("allowed_member_id")
    .eq("member_id", myMember.id);

  const { data: buddyRows } = await supabaseAdmin
    .from("human_buddy_links")
    .select("member_a_id,member_b_id")
    .or(`member_a_id.eq.${myMember.id},member_b_id.eq.${myMember.id}`);

  const allowedMemberIds = ((allowedRows as { allowed_member_id: string }[] | null) || []).map(
    (row) => row.allowed_member_id
  );

  const buddyMemberIds = ((buddyRows as HumanBuddy[] | null) || []).map((row) =>
    row.member_a_id === myMember.id ? row.member_b_id : row.member_a_id
  );

  return { mode, allowedMemberIds, buddyMemberIds };
}

export async function getVisibleHumanDirectory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Utilisateur non connecté.", mode: null as HumanAccessMode | null, members: [] as HumanDirectoryMember[] };
  }

  const supabaseAdmin = createAdminClient();
  const myMember = await ensureHumanMember(supabaseAdmin, user.id);
  if (!myMember) {
    return { error: "Impossible de charger votre profil Popey Human.", mode: null as HumanAccessMode | null, members: [] as HumanDirectoryMember[] };
  }

  const scope = await getMyHumanScope();
  if ("error" in scope) {
    return { error: scope.error, mode: null as HumanAccessMode | null, members: [] as HumanDirectoryMember[] };
  }

  if (scope.mode === "SPHERE_FULL") {
    const { data } = await supabaseAdmin
      .from("human_members")
      .select("id,user_id,first_name,last_name,metier,ville,phone,status")
      .eq("status", "active")
      .order("created_at", { ascending: true });
    return {
      error: null as string | null,
      mode: scope.mode,
      members: (data as HumanDirectoryMember[] | null) || [],
    };
  }

  const visibleMemberIds =
    scope.mode === "BINOME_ONLY"
      ? scope.buddyMemberIds
      : Array.from(new Set([...scope.buddyMemberIds, ...scope.allowedMemberIds]));

  if (visibleMemberIds.length === 0) {
    return {
      error: null as string | null,
      mode: scope.mode,
      members: [] as HumanDirectoryMember[],
    };
  }

  const { data } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id,first_name,last_name,metier,ville,phone,status")
    .in("id", visibleMemberIds)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  return {
    error: null as string | null,
    mode: scope.mode,
    members: (data as HumanDirectoryMember[] | null) || [],
  };
}

export async function getMyHumanProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Utilisateur non connecté.",
      profile: null as HumanDirectoryMember | null,
    };
  }

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured) {
    return {
      error: "Impossible de charger votre profil Popey Human.",
      profile: null as HumanDirectoryMember | null,
    };
  }

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id,first_name,last_name,metier,ville,phone,status")
    .eq("id", ensured.id)
    .maybeSingle();

  return {
    error: null as string | null,
    profile: (data as HumanDirectoryMember | null) || null,
  };
}

export async function updateMyHumanProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured) return { error: "Profil Popey Human introuvable." };

  const payload = {
    first_name: String(formData.get("first_name") || "").trim() || null,
    last_name: String(formData.get("last_name") || "").trim() || null,
    metier: String(formData.get("metier") || "").trim() || null,
    ville: String(formData.get("ville") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.from("human_members").update(payload).eq("id", ensured.id);
  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/profile");
  revalidatePath("/popey-human/app/annuaire");
  revalidatePath("/admin/humain/membres");
  return { success: true };
}

export async function updateMyHumanProfileAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/profile");
  const result = await updateMyHumanProfile(formData);
  if ("error" in result) {
    redirect(withHumanProfileStatus(currentUrl, "error", result.error || "Action impossible."));
  }
  redirect(withHumanProfileStatus(currentUrl, "success", "Profil mis à jour."));
}

async function requireHumanAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data: adminData } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminData) return { error: "Accès admin requis." };
  return { user };
}

async function ensureHumanMember(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<{ id: string; user_id: string } | null> {
  const { data: existing } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    return existing as { id: string; user_id: string };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name,trade,city,phone")
    .eq("id", userId)
    .maybeSingle();

  const displayName = typeof profile?.display_name === "string" ? profile.display_name.trim() : "";
  const [firstName = "", ...lastNameParts] = displayName.split(/\s+/);

  const { data: inserted, error } = await supabaseAdmin
    .from("human_members")
    .insert({
      user_id: userId,
      first_name: firstName || null,
      last_name: lastNameParts.join(" ") || null,
      metier: typeof profile?.trade === "string" ? profile.trade : null,
      ville: typeof profile?.city === "string" ? profile.city : null,
      phone: typeof profile?.phone === "string" ? profile.phone : null,
      status: "active",
    })
    .select("id,user_id")
    .single();

  if (error) {
    return null;
  }

  return inserted as { id: string; user_id: string };
}

export async function ensureHumanMemberForUserId(userId: string) {
  const supabaseAdmin = createAdminClient();
  return ensureHumanMember(supabaseAdmin, userId);
}

function withPermissionsStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/admin/humain/permissions") ? url : "/admin/humain/permissions";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("permStatus", status);
  parsed.searchParams.set("permMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}

function withMembersStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/admin/humain/membres") ? url : "/admin/humain/membres";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("memberStatus", status);
  parsed.searchParams.set("memberMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}

function withHumanProfileStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/popey-human/app/profile") ? url : "/popey-human/app/profile";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("profileStatus", status);
  parsed.searchParams.set("profileMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}
