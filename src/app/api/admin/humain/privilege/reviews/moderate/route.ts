import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function withStatus(base: string, status: "success" | "error", message: string) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}marketStatus=${encodeURIComponent(status)}&marketMessage=${encodeURIComponent(message)}`;
}

function toAbsolute(requestUrl: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, requestUrl);
  } catch {
    return new URL("/admin/humain/catalogue", requestUrl);
  }
}

// Modération d'un avis catalogue : approve (→ visible public), reject ou delete.
export async function POST(request: Request) {
  const formData = await request.formData();
  const commentId = String(formData.get("comment_id") || "").trim();
  const intent = String(formData.get("intent") || "").trim();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/catalogue");

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });
  const ok = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", message)), { status: 303 });

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");
  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Accès admin requis.");

  if (!commentId) return fail("Avis manquant.");

  if (intent === "delete") {
    const { error } = await supabaseAdmin.from("human_marketplace_place_comments").delete().eq("id", commentId);
    if (error) return fail(error.message || "Suppression impossible.");
    return ok("Avis supprimé.");
  }
  if (intent === "approve" || intent === "reject") {
    const patch =
      intent === "approve"
        ? { status: "approved", approved_at: new Date().toISOString() }
        : { status: "rejected" };
    const { error } = await supabaseAdmin.from("human_marketplace_place_comments").update(patch).eq("id", commentId);
    if (error) return fail(error.message || "Mise à jour impossible.");
    return ok(intent === "approve" ? "Avis publié ✅" : "Avis rejeté.");
  }
  return fail("Action inconnue.");
}
