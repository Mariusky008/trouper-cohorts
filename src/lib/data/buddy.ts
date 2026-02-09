import { createClient } from "@/lib/supabase/server";

export async function getMyBuddy(cohortId: string, myUserId: string) {
  const supabase = await createClient();

  // 1. Trouver la paire
  const { data: pair } = await supabase
    .from("cohort_pairs")
    .select("user1_id, user2_id")
    .eq("cohort_id", cohortId)
    .or(`user1_id.eq.${myUserId},user2_id.eq.${myUserId}`)
    .maybeSingle();

  if (!pair) return null;

  const buddyId = pair.user1_id === myUserId ? pair.user2_id : pair.user1_id;

  // 2. Récupérer les infos du binôme via pre_registrations (qui sert de profil)
  const { data: buddyInfo } = await supabase
    .from("pre_registrations")
    .select("first_name, last_name, trade, department_code, social_network, followers_count")
    .eq("user_id", buddyId)
    .maybeSingle();

  if (!buddyInfo) return null;

  return { ...buddyInfo, id: buddyId };
}
