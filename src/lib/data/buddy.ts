import { createClient } from "@/lib/supabase/server";

export async function getMyBuddies(cohortId: string, myUserId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Trouver LES paires DU JOUR (Priorité 1)
  let { data: pairs } = await supabase
    .from("cohort_pairs")
    .select("user1_id, user2_id, pair_date")
    .eq("cohort_id", cohortId)
    .eq("pair_date", today)
    .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`);

  // 2. Fallback : Si pas de paire "Aujourd'hui", chercher les plus récentes (de la dernière date dispo)
  if (!pairs || pairs.length === 0) {
      // On cherche d'abord la date la plus récente pour cet user
      const { data: lastPair } = await supabase
        .from("cohort_pairs")
        .select("pair_date")
        .eq("cohort_id", cohortId)
        .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`)
        .order('pair_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPair) {
          const { data: recentPairs } = await supabase
            .from("cohort_pairs")
            .select("user1_id, user2_id, pair_date")
            .eq("cohort_id", cohortId)
            .eq("pair_date", lastPair.pair_date)
            .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`);
            
          pairs = recentPairs;
      }
  }

  if (!pairs || pairs.length === 0) return [];

  const buddyIds = pairs.map(p => p.user1_id === myUserId ? p.user2_id : p.user1_id);
  // Dédoublonnage au cas où
  const uniqueBuddyIds = Array.from(new Set(buddyIds));

  // 3. Récupérer les infos des binômes via pre_registrations
  const { data: buddiesInfo } = await supabase
    .from("pre_registrations")
    .select("user_id, first_name, last_name, trade, department_code, social_network, followers_count")
    .in("user_id", uniqueBuddyIds);

  if (!buddiesInfo) return [];

  return buddiesInfo.map(b => ({ ...b, id: b.user_id }));
}

// Deprecated: Kept for backward compatibility if needed, returns the first buddy
export async function getMyBuddy(cohortId: string, myUserId: string) {
    const buddies = await getMyBuddies(cohortId, myUserId);
    return buddies.length > 0 ? buddies[0] : null;
}
