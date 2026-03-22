"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type DuoDecision = "validate" | "later" | "reject";

const getDuoKey = (a: string, b: string) => [a, b].sort().join("__");

async function getMatchedPartnerIds(userId: string) {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("network_matches")
    .select("user1_id,user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  const ids = new Set<string>();
  (matches || []).forEach((m: any) => ids.add(m.user1_id === userId ? m.user2_id : m.user1_id));
  return ids;
}

export async function getMyDuoStates(partnerIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const matched = await getMatchedPartnerIds(user.id);
  const safePartnerIds = Array.from(new Set(partnerIds.filter((id) => matched.has(id) && id !== user.id)));
  if (!safePartnerIds.length) return {};

  const duoKeys = safePartnerIds.map((partnerId) => getDuoKey(user.id, partnerId));
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("network_duo_votes")
    .select("duo_key,member_id,decision")
    .in("duo_key", duoKeys)
    .in("member_id", [user.id, ...safePartnerIds]);

  if (error) return {};

  const states: Record<string, { myDecision?: DuoDecision; partnerDecision?: DuoDecision }> = {};
  (data || []).forEach((row: any) => {
    if (!states[row.duo_key]) states[row.duo_key] = {};
    if (row.member_id === user.id) states[row.duo_key].myDecision = row.decision as DuoDecision;
    else states[row.duo_key].partnerDecision = row.decision as DuoDecision;
  });
  return states;
}

export async function saveDuoDecision(partnerId: string, decision: DuoDecision) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const matched = await getMatchedPartnerIds(user.id);
  if (!matched.has(partnerId)) return { success: false, error: "Partenaire non éligible" };

  const [userA, userB] = [user.id, partnerId].sort();
  const duoKey = getDuoKey(user.id, partnerId);
  const admin = createAdminClient();
  const { error } = await admin
    .from("network_duo_votes")
    .upsert(
      {
        duo_key: duoKey,
        user_a: userA,
        user_b: userB,
        member_id: user.id,
        other_member_id: partnerId,
        decision,
      },
      { onConflict: "duo_key,member_id" }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/mon-reseau-local/dashboard/offers");
  return { success: true, duoKey };
}
