"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type DuoDecision = "validate" | "later" | "reject";
type DuoMissionOutcome = "continue_together" | "tested_not_ready" | "not_a_fit" | "offer_created" | "need_help";

const getDuoKey = (a: string, b: string) => [a, b].sort().join("__");

async function getMatchedPartnerIds(userId: string) {
  const supabase = await createClient();
  const todayParis = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { data: matches } = await supabase
    .from("network_matches")
    .select("user1_id,user2_id,date")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .lte("date", todayParis);

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

export async function saveDuoMissionOutcome(partnerId: string, outcome: DuoMissionOutcome) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const matched = await getMatchedPartnerIds(user.id);
  if (!matched.has(partnerId)) return { success: false, error: "Partenaire non éligible" };

  const [userA, userB] = [user.id, partnerId].sort();
  const duoKey = getDuoKey(user.id, partnerId);
  const admin = createAdminClient();
  const { error } = await admin
    .from("network_duo_missions")
    .upsert(
      {
        duo_key: duoKey,
        user_a: userA,
        user_b: userB,
        member_id: user.id,
        other_member_id: partnerId,
        outcome,
      },
      { onConflict: "duo_key,member_id" }
    );

  if (error) return { success: false, error: error.message };

  revalidatePath("/mon-reseau-local/dashboard/offers");
  revalidatePath("/admin/network");
  return { success: true, duoKey };
}

export async function getDuoCandidates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const matched = await getMatchedPartnerIds(user.id);
  const partnerIds = Array.from(matched).filter((id) => id !== user.id);
  if (!partnerIds.length) return [];

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id,display_name,avatar_url,phone,trade,city")
    .in("id", partnerIds);

  return (profiles || []).map((profile: any) => ({
    user_id: profile.id,
    display_name: profile.display_name || "Membre",
    avatar_url: profile.avatar_url || "",
    phone: profile.phone || "",
    trade: profile.trade || "Expert",
    city: profile.city || "Réseau",
    offer_title: "",
    offer_description: "",
    offer_price: 0,
    offer_original_price: 0,
    match_date: new Date().toISOString(),
    __fromFallback: true,
  }));
}
