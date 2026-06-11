import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

// Source de vérité unique pour la garde admin : même logique que les routes POST
// et les server actions (résolution d'identité via le proxy/session + table `admins`).
// À utiliser au niveau layout pour une défense en profondeur (le middleware
// `proxy.ts` ne vérifie QUE l'authentification sur /admin/humain, pas le rôle).
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const userId = await getServerUserIdWithProxyFallback();
    if (!userId) return false;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(!error && data?.user_id);
  } catch {
    return false;
  }
}
