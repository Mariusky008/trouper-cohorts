"use server";

import { revalidatePath } from "next/cache";
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

export async function getHumanPermissionsAdminSnapshot() {
  const adminCheck = await requireHumanAdmin();
  if ("error" in adminCheck) {
    return {
      error: adminCheck.error,
      members: [],
      candidates: [],
      permissionsByMemberId: {} as Record<string, HumanPermission>,
      allowedByMemberId: {} as Record<string, string[]>,
      buddiesByMemberId: {} as Record<string, string[]>,
    };
  }

  const supabaseAdmin = createAdminClient();

  const [{ data: members }, { data: permissions }, { data: allowed }, { data: buddies }, { data: profiles }] =
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
  await updateMyHumanProfile(formData);
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
