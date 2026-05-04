import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function withStatus(base: string, status: "success" | "error", message: string) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}affStatus=${encodeURIComponent(status)}&affMessage=${encodeURIComponent(message)}`;
}

function toAbsolute(requestUrl: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, requestUrl);
  } catch {
    return new URL("/admin/humain/affiliation", requestUrl);
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/affiliation");
  const scoutId = String(formData.get("scout_id") || "").trim();
  const logId = String(formData.get("log_id") || "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  if (!scoutId && !logId) return fail("Compte affiliation introuvable.");

  if (scoutId) {
    const { count: referralCount, error: referralError } = await supabaseAdmin
      .from("human_scout_referrals")
      .select("id", { count: "exact", head: true })
      .eq("scout_id", scoutId);
    if (referralError) return fail(referralError.message || "Impossible de verifier les referrals.");
    if ((referralCount || 0) > 0) {
      return fail("Suppression bloquee: ce compte a deja des referrals lies.");
    }

    const { error: invitesDeleteError } = await supabaseAdmin.from("human_scout_invites").delete().eq("scout_id", scoutId);
    if (invitesDeleteError) return fail(invitesDeleteError.message || "Suppression des invitations impossible.");

    const { error: logsDeleteError } = await supabaseAdmin.from("human_scout_notification_log").delete().eq("scout_id", scoutId);
    if (logsDeleteError) return fail(logsDeleteError.message || "Suppression des logs impossible.");

    const { error: scoutDeleteError } = await supabaseAdmin.from("human_scouts").delete().eq("id", scoutId);
    if (scoutDeleteError) return fail(scoutDeleteError.message || "Suppression du compte impossible.");
  } else if (logId) {
    const { error: logDeleteError } = await supabaseAdmin.from("human_scout_notification_log").delete().eq("id", logId);
    if (logDeleteError) return fail(logDeleteError.message || "Suppression du log impossible.");
  }

  revalidatePath("/admin/humain/affiliation");
  return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", "Compte fictif supprime.")), {
    status: 303,
  });
}
