"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureHumanMemberForUserId } from "@/lib/actions/human-permissions";

export type HumanNotificationType = "generale" | "personnelle" | "felicitation";
type HumanNotificationScope = "all" | "deals";

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

type HumanNotificationReaction = {
  id: string;
  notification_id: string;
  member_id: string;
  emoji: "👏" | "🔥" | "💰" | "🚀";
  created_at: string;
  updated_at: string;
};

type HumanNotificationView = HumanNotificationRow & {
  reactionCounts: Record<"👏" | "🔥" | "💰" | "🚀", number>;
  myReaction: "👏" | "🔥" | "💰" | "🚀" | null;
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
  const currentUrl = String(formData.get("current_url") || "/admin/humain/notifications");
  const result = await adminSendHumanNotification(formData);
  if ("error" in result) {
    redirect(withBulkStatus(currentUrl, "error", result.error || "Erreur inconnue."));
  }
  redirect(withBulkStatus(currentUrl, "success", "Notification envoyée."));
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
  return { success: true, updatedCount: ids.length };
}

export async function adminBulkSetHumanNotificationsReadAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/admin/humain/notifications");
  const result = await adminBulkSetHumanNotificationsRead(formData);
  if ("error" in result) {
    redirect(withBulkStatus(currentUrl, "error", result.error || "Erreur inconnue."));
  }
  redirect(withBulkStatus(currentUrl, "success", `${result.updatedCount} notification(s) mise(s) à jour.`));
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

export async function getMyHumanNotifications(scope: HumanNotificationScope = "all") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise.", notifications: [] as HumanNotificationView[], candidates: [] as Array<{ member_id: string; label: string }> };

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured) return { error: "Profil Popey Human introuvable.", notifications: [] as HumanNotificationView[], candidates: [] as Array<{ member_id: string; label: string }> };

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("human_notifications")
    .select("id,member_id,type,title,message,impact,is_read,created_at")
    .eq("member_id", ensured.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const notifications = (data as HumanNotificationRow[] | null) || [];
  const filtered = scope === "deals" ? notifications.filter((n) => (n.impact || "").startsWith("deal:")) : notifications;

  const notificationIds = filtered.map((n) => n.id);
  const { data: reactionsData } =
    notificationIds.length > 0
      ? await supabaseAdmin
          .from("human_notification_reactions")
          .select("id,notification_id,member_id,emoji,created_at,updated_at")
          .in("notification_id", notificationIds)
      : { data: [] as HumanNotificationReaction[] };

  const reactions = (reactionsData as HumanNotificationReaction[] | null) || [];
  const reactionByNotification = new Map<string, Record<"👏" | "🔥" | "💰" | "🚀", number>>();
  const myReactionByNotification = new Map<string, "👏" | "🔥" | "💰" | "🚀" | null>();

  filtered.forEach((n) => {
    reactionByNotification.set(n.id, { "👏": 0, "🔥": 0, "💰": 0, "🚀": 0 });
    myReactionByNotification.set(n.id, null);
  });

  reactions.forEach((reaction) => {
    const bucket = reactionByNotification.get(reaction.notification_id);
    if (!bucket) return;
    bucket[reaction.emoji] += 1;
    if (reaction.member_id === ensured.id) {
      myReactionByNotification.set(reaction.notification_id, reaction.emoji);
    }
  });

  const { data: visibleMembers } = await supabaseAdmin
    .from("human_members")
    .select("id,user_id,first_name,last_name,status")
    .eq("status", "active")
    .limit(300);
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id,display_name,trade").limit(600);

  const profileLabelByUserId = new Map(
    ((profiles as Array<{ id: string; display_name: string | null; trade: string | null }> | null) || []).map((profile) => [
      profile.id,
      (profile.display_name && profile.display_name.trim()) || (profile.trade && profile.trade.trim()) || profile.id,
    ])
  );

  const candidates = ((visibleMembers as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null }> | null) || [])
    .filter((member) => member.id !== ensured.id)
    .map((member) => {
      const full = [member.first_name, member.last_name].filter(Boolean).join(" ").trim();
      const fallback = profileLabelByUserId.get(member.user_id) || member.user_id;
      return { member_id: member.id, label: full || fallback };
    });

  return {
    error: null as string | null,
    notifications: filtered.map((notification) => ({
      ...notification,
      reactionCounts: reactionByNotification.get(notification.id) || { "👏": 0, "🔥": 0, "💰": 0, "🚀": 0 },
      myReaction: myReactionByNotification.get(notification.id) || null,
    })),
    candidates,
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
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/notifications");
  const result = await markMyHumanNotificationRead(formData);
  if ("error" in result) {
    redirect(currentUrl);
  }
  redirect(currentUrl);
}

export async function toggleMyHumanNotificationReaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const notificationId = String(formData.get("notification_id") || "");
  const emoji = String(formData.get("emoji") || "") as "👏" | "🔥" | "💰" | "🚀";
  if (!notificationId) return { error: "Notification invalide." };
  if (!["👏", "🔥", "💰", "🚀"].includes(emoji)) return { error: "Réaction invalide." };

  const ensured = await ensureHumanMemberForUserId(user.id);
  if (!ensured) return { error: "Profil Popey Human introuvable." };

  const supabaseAdmin = createAdminClient();
  const { data: existing } = await supabaseAdmin
    .from("human_notification_reactions")
    .select("id,emoji")
    .eq("notification_id", notificationId)
    .eq("member_id", ensured.id)
    .maybeSingle();

  if (existing && existing.emoji === emoji) {
    const { error } = await supabaseAdmin
      .from("human_notification_reactions")
      .delete()
      .eq("notification_id", notificationId)
      .eq("member_id", ensured.id);
    if (error) return { error: error.message };
  } else if (existing) {
    const { error } = await supabaseAdmin
      .from("human_notification_reactions")
      .update({ emoji, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabaseAdmin.from("human_notification_reactions").insert({
      notification_id: notificationId,
      member_id: ensured.id,
      emoji,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/popey-human/app/notifications");
  return { success: true };
}

export async function toggleMyHumanNotificationReactionAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/notifications");
  await toggleMyHumanNotificationReaction(formData);
  redirect(currentUrl);
}

export async function createMyHumanCongrats(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session requise." };

  const targetMemberId = String(formData.get("target_member_id") || "");
  const message = String(formData.get("message") || "").trim();
  if (!targetMemberId) return { error: "Membre cible manquant." };
  if (!message) return { error: "Message requis." };

  const sender = await ensureHumanMemberForUserId(user.id);
  if (!sender) return { error: "Profil Popey Human introuvable." };

  const supabaseAdmin = createAdminClient();
  const { data: senderRow } = await supabaseAdmin
    .from("human_members")
    .select("first_name,last_name")
    .eq("id", sender.id)
    .maybeSingle();

  const senderLabel = [senderRow?.first_name, senderRow?.last_name].filter(Boolean).join(" ").trim() || "Un membre du Cercle";
  const payload = {
    member_id: targetMemberId,
    type: "felicitation" as const,
    title: "Félicitations d'un membre",
    message: `${senderLabel}: ${message}`,
    impact: "social:felicitation",
    is_read: false,
  };

  const { error } = await supabaseAdmin.from("human_notifications").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/notifications");
  return { success: true };
}

export async function createMyHumanCongratsAction(formData: FormData): Promise<void> {
  const currentUrl = String(formData.get("current_url") || "/popey-human/app/notifications");
  const result = await createMyHumanCongrats(formData);
  if ("error" in result) {
    redirect(`${currentUrl}${currentUrl.includes("?") ? "&" : "?"}notifError=${encodeURIComponent(result.error || "Action impossible.")}`);
  }
  redirect(currentUrl);
}

export async function createDealNotifications(input: {
  memberIds: string[];
  title: string;
  message: string;
  impact: "deal:pris" | "deal:signe" | "deal:perdu";
}) {
  const uniqueMemberIds = Array.from(new Set(input.memberIds.filter(Boolean)));
  if (uniqueMemberIds.length === 0) {
    return { success: true };
  }

  const supabaseAdmin = createAdminClient();
  const payload = uniqueMemberIds.map((memberId) => ({
    member_id: memberId,
    type: "personnelle" as const,
    title: input.title,
    message: input.message,
    impact: input.impact,
    is_read: false,
  }));

  const { error } = await supabaseAdmin.from("human_notifications").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/popey-human/app/notifications");
  revalidatePath("/admin/humain/notifications");
  return { success: true };
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

function withBulkStatus(url: string, status: "success" | "error", message: string) {
  const safePath = url.startsWith("/") ? url : "/admin/humain/notifications";
  const parsed = new URL(safePath, "http://localhost");
  parsed.searchParams.set("bulkStatus", status);
  parsed.searchParams.set("bulkMessage", message);
  return `${parsed.pathname}?${parsed.searchParams.toString()}`;
}
