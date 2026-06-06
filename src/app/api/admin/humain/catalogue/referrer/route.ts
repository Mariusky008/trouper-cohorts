import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Jours de "propulsion" étalés sur le mois (vagues). Ajustable.
const WAVE_DAYS = [1, 3, 5, 8, 10, 12, 15, 17, 20, 22, 24, 27];

function withStatus(base: string, status: "success" | "error", message: string) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}marketStatus=${encodeURIComponent(status)}&marketMessage=${encodeURIComponent(message)}`;
}

function toAbsolute(requestUrl: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, requestUrl);
  } catch {
    return new URL("/admin/humain/catalogue/scores", requestUrl);
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/catalogue/scores");
  const intent = String(formData.get("intent") || "save").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });
  const ok = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", message)), { status: 303 });

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");
  const supabase = createAdminClient();
  const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Accès admin requis.");

  try {
    if (intent === "auto_assign") {
      // Réunit tous les référents connus (table + events du mois) puis répartit en vagues.
      const refs = new Map<string, string | null>(); // ref -> ref_name
      const { data: refRows } = await supabase.from("human_catalogue_referrers").select("ref,ref_name");
      (((refRows as Array<{ ref: string; ref_name: string | null }> | null) || [])).forEach((r) => {
        if (r.ref) refs.set(r.ref, r.ref_name || null);
      });
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const { data: evRows } = await supabase
        .from("human_marketplace_events")
        .select("payload,created_at")
        .like("event_type", "priv_%")
        .gte("created_at", monthStart)
        .limit(50000);
      (((evRows as Array<{ payload: Record<string, unknown> | null }> | null) || [])).forEach((e) => {
        const ref = e.payload && typeof e.payload === "object" ? String((e.payload as { ref?: unknown }).ref || "") : "";
        const refName = e.payload && typeof e.payload === "object" ? String((e.payload as { ref_name?: unknown }).ref_name || "") : "";
        if (ref && !refs.has(ref)) refs.set(ref, refName || null);
      });
      const list = Array.from(refs.keys()).sort();
      let i = 0;
      for (const ref of list) {
        const day = WAVE_DAYS[i % WAVE_DAYS.length];
        await supabase
          .from("human_catalogue_referrers")
          .upsert({ ref, ref_name: refs.get(ref), propulsion_day: day, updated_at: new Date().toISOString() }, { onConflict: "ref" });
        i += 1;
      }
      revalidatePath("/admin/humain/catalogue/scores");
      return ok(`Planning réparti sur ${list.length} membre(s).`);
    }

    // Enregistrement d'une ligne
    const ref = String(formData.get("ref") || "").trim();
    if (!ref) return fail("Référent manquant.");
    const refName = String(formData.get("ref_name") || "").trim() || null;
    const contactsRaw = String(formData.get("declared_contacts") || "").trim();
    const dayRaw = String(formData.get("propulsion_day") || "").trim();
    const declared = contactsRaw ? Math.max(0, parseInt(contactsRaw, 10) || 0) : null;
    const day = dayRaw ? Math.min(28, Math.max(1, parseInt(dayRaw, 10) || 0)) : null;

    const { error } = await supabase
      .from("human_catalogue_referrers")
      .upsert(
        { ref, ref_name: refName, declared_contacts: declared, propulsion_day: day, updated_at: new Date().toISOString() },
        { onConflict: "ref" },
      );
    if (error) return fail(error.message || "Enregistrement impossible.");
    revalidatePath("/admin/humain/catalogue/scores");
    return ok("Membre mis à jour.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erreur inattendue.");
  }
}
