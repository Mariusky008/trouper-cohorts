"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";

export type HumanNotificationType = "generale" | "personnelle" | "felicitation";

type HumanNotificationRow = {
  id: string;
  member_id: string;
  type: HumanNotificationType;
  title: string;
  message: string;
  impact: string | null;
  is_read: boolean;
  created_at: string;
};

type AdminHumanNotification = HumanNotificationRow & {
  recipient: string;
};

export async function adminSendHumanNotification(formData: FormData) {
  const adminUser = await requireAdminUser();
  if ("error" in adminUser) return { error: adminUser.error };

  const target = String(formData.get("target") || "all");
  const userId = String(formData.get("user_id") || "");
  const type = String(formData.get("type") || "generale") as HumanNotificationType;
  const title = String(formData.get("title") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const impact = String(formData.get("impact") || "").trim();

  if (!["all", "single"].includes(target)) return { error: "Cible invalide." };
  if (!["generale", "personnelle", "felicitation"].includes(type)) return { error: "Type invalide." };
  if (!title) return { error: "Titre requis." };
  if (!message) return { error: "Message requis." };

  const supabaseAdmin = createAdminClient();

  let targetMemberIds: string[] = [];
  if (target === "single") {
    if (!userId) return { error: "Membre cible manquant." };
    const ensured = await ensureHumanMemberForUserId(userId);
    if (!ensured) return { error: "Impossible de cibler ce membre." };
    targetMemberIds = [ensured.id];
  } else {
    const { data: members } = await supabaseAdmin
      .from("human_members")
      .select("id")
      .eq("status", "active");
    targetMemberIds = ((members as { id: string }[] | null) || []).map((m) => m.id);
  }

  if (targetMemberIds.length === 0) {
    return { error: "Aucun membre cible disponible." };
  }

  const payload = targetMemberIds.map((memberId) => ({
    member_id: memberId,
    type,
    title,
    message,
    impact: impact || null,
    is_read: false,
  }));

  const { error } = await supabaseAdmin.from("human_notifications").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/admin/humain/notifications");
  revalidatePath("/popey-human/app/notifications");
  return { success: true };
}

export async function adminSendHumanNotificationAction(formData: FormData): Promise<void> {
  await adminSendHumanNotification(formData);
}

export async function adminBulkSetHumanNotificationsRead(formData: FormData) {
  const adminUser = await requireAdminUser();
  if ("error" in adminUser) return { error: adminUser.error };

  const mode = String(formData.get("mode") || "read");
  const ids = formData
    .getAll("notification_ids")
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!["read", "unread"].includes(mode)) return { error: "Mode invalide." };
  if (ids.length === 0) return { error: "Aucune notification sélectionnée." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_notifications")
    .update({ is_read: mode === "read" })
    .in("id", ids);
  if (error) return { error: error.message };

  revalidatePath("/admin/humain/notifications");
  revalidatePath("/popey-human/app/notifications");
  return { success: true };
}

export async function adminBulkSetHumanNotificationsReadAction(formData: FormData): Promise<void> {
  await adminBulkSetHumanNotificationsRead(formData);
}

export async function getAdminHumanNotificationsFeed() {
  const adminUser = await requireAdminUser();
  if ("error" in adminUser) {
    return {
      error: adminUser.error,
      notifications: [] as AdminHumanNotification[],
      candidates: [] as Array<{ user_id: string; label: string }>,
    };
  }

  const supabaseAdmin = createAdminClient();
  const [{ data: notifications }, { data: members }, { data: profiles }] = await Promise.all([
    supabaseAdmin
      .from("human_notifications")
      .select("id,member_id,type,title,message,impact,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin.from("human_members").select("id,user_id"),
    supabaseAdmin.from("profiles").select("id,display_name,trade"),
  ]);

  const memberToUserId = new Map(((members as Array<{ id: string; user_id: string }> | null) || []).map((m) => [m.id, m.user_id]));
  const profileByUserId = new Map(
    ((profiles as Array<{ id: string; display_name: string | null; trade: string | null }> | null) || []).map((p) => [
      p.id,
      {
        display_name: p.display_name || "",
        trade: p.trade || "",
      },
    ])
  );

  const withRecipient: AdminHumanNotification[] = ((notifications as HumanNotificationRow[] | null) || []).map((row) => {
    const userId = memberToUserId.get(row.member_id) || "";
    const profile = profileByUserId.get(userId);
    const recipient =
      (profile?.display_name && profile.display_name.trim()) ||
      (profile?.trade && profile.trade.trim()) ||
      userId ||
      row.member_id;

    return {
      ...row,
      recipient,
    };
  });

  const candidates = Array.from(profileByUserId.entries()).map(([user_id, profile]) => ({
    user_id,
    label: (profile.display_name && profile.display_name.trim()) || (profile.trade && profile.trade.trim()) || user_id,
  }));

  return {
    error: null as string | null,
    notifications: withRecipient as AdminHumanNotification[],
    candidates,
  };
}

export async function getMyHumanNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise.", notifications: [] as HumanNotificationRow[] };

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured) return { error: "Profil Popey Human introuvable.", notifications: [] as HumanNotificationRow[] };

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("human_notifications")
    .select("id,member_id,type,title,message,impact,is_read,created_at")
    .eq("member_id", ensured.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return {
    error: null as string | null,
    notifications: (data as HumanNotificationRow[] | null) || [],
  };
}

export async function markMyHumanNotificationRead(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const notificationId = String(formData.get("notification_id") || "");
  if (!notificationId) return { error: "Notification invalide." };

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured) return { error: "Profil Popey Human introuvable." };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("human_notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("member_id", ensured.id);

  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/notifications");
  return { success: true };
}

export async function markMyHumanNotificationReadAction(formData: FormData): Promise<void> {
  await markMyHumanNotificationRead(formData);
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return { error: "Accès admin requis." };

  return { user };
}
