import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMerchantStatsToken } from "@/lib/popey-human/marketplace-landing-token";

// Résout l'identifiant d'accès pro (le « credential » = ?p= ou ?token= de l'espace pro) en place_id.
// Ordre : token signé (rétro-compat) → uuid direct → slug court (pro_slug). Renvoie "" si non résolu.
// Le lien magique EST la clé d'accès (onboarding pro = admin-only en v1).
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function resolveProPlaceId(cred: string): Promise<string> {
  const c = String(cred || "").trim();
  if (!c) return "";
  try {
    const tok = verifyMerchantStatsToken(c);
    if (tok && tok.valid && tok.placeId) return String(tok.placeId);
  } catch {
    /* pas un token → on tente slug/uuid */
  }
  if (isUuid(c)) return c;
  try {
    const admin = createAdminClient();
    const r = await admin.from("human_marketplace_places").select("id").eq("pro_slug", c).maybeSingle();
    return String((r.data as { id?: string } | null)?.id || "");
  } catch {
    return "";
  }
}
