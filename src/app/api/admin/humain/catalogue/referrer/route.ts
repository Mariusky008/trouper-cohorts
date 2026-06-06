import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCatalogueLeaderboard } from "@/lib/popey-human/catalogue-leaderboard";

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
      // Répartit les commerçants (d'une ville, ou toutes) sur les vagues du mois.
      const city = String(formData.get("city") || "").trim();
      const lb = await getCatalogueLeaderboard(city || undefined);
      let i = 0;
      for (const row of lb.rows) {
        const day = WAVE_DAYS[i % WAVE_DAYS.length];
        await supabase
          .from("human_catalogue_referrers")
          .upsert({ ref: row.ref, ref_name: row.name, propulsion_day: day, updated_at: new Date().toISOString() }, { onConflict: "ref" });
        i += 1;
      }
      revalidatePath("/admin/humain/catalogue/scores");
      return ok(`Planning réparti sur ${lb.rows.length} membre(s)${city ? ` (${city})` : ""}.`);
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
