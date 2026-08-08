import { createAdminClient } from "@/lib/supabase/admin";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";

// Source de vérité unique pour la garde admin : même logique que les routes POST
// et les server actions (résolution d'identité via le proxy/session + table `admins`).
// À utiliser au niveau layout pour une défense en profondeur (le middleware
// `proxy.ts` ne vérifie QUE l'authentification sur /admin/humain, pas le rôle).
export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await etatAdmin()) === "admin";
}

/**
 * Trois états, et la différence compte.
 *
 * `isCurrentUserAdmin()` répond par un seul booléen : « pas admin ». L'écran qui
 * s'appuyait dessus disait donc « ce compte n'a pas les droits administrateur »
 * à quelqu'un qui n'avait AUCUN compte — sans jamais proposer de se connecter.
 * On se retrouvait enfermé dehors avec un message qui décrivait le mauvais
 * problème, et un seul bouton : « Se déconnecter ».
 *
 * `/admin` n'est pas gardée par `proxy.ts` (seul `/admin/humain` l'est), donc
 * rien ne redirige vers la page de connexion : c'est cet écran, et lui seul, qui
 * doit savoir dire « connecte-toi » plutôt que « tu n'as pas les droits ».
 */
export type EtatAdmin = "admin" | "connecte-sans-droits" | "anonyme";

export async function etatAdmin(): Promise<EtatAdmin> {
  let userId = "";
  try {
    userId = (await getServerUserIdWithProxyFallback()) || "";
  } catch {
    return "anonyme";
  }
  if (!userId) return "anonyme";

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.user_id ? "admin" : "connecte-sans-droits";
  } catch {
    // Une lecture de `admins` qui échoue n'est pas une absence de droits : on
    // refuse l'accès (c'est une garde), mais on ne prétend pas savoir laquelle
    // des deux situations c'est. « Connecté sans droits » est le message le
    // moins trompeur pour quelqu'un qui a bien une session.
    return "connecte-sans-droits";
  }
}
