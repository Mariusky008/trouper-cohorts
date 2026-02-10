import { createClient } from "@/lib/supabase/server";

export async function getMyBuddy(cohortId: string, myUserId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Trouver la paire DU JOUR (Priorité 1)
  let { data: pair } = await supabase
    .from("cohort_pairs")
    .select("user1_id, user2_id, pair_date")
    .eq("cohort_id", cohortId)
    .eq("pair_date", today)
    .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`)
    .maybeSingle();

  // 2. Fallback : Si pas de paire "Aujourd'hui", chercher la plus récente
  // (Utile si décalage horaire ou si l'admin a généré "hier soir" pour "aujourd'hui")
  if (!pair) {
      const { data: recentPair } = await supabase
        .from("cohort_pairs")
        .select("user1_id, user2_id, pair_date")
        .eq("cohort_id", cohortId)
        .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`)
        .order('pair_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      pair = recentPair;
  }

  if (!pair) return null;

  const buddyId = pair.user1_id === myUserId ? pair.user2_id : pair.user1_id;

  // 2. Récupérer les infos du binôme via pre_registrations
  const { data: buddyInfo } = await supabase
    .from("pre_registrations")
    .select("first_name, last_name, trade, department_code, social_network, followers_count")
    .eq("user_id", buddyId)
    .maybeSingle();

  if (!buddyInfo) return null;

  return { ...buddyInfo, id: buddyId };
}
