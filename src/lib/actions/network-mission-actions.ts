"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function logWhatsAppMissionAction(matchId: string, partnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };
  if (!matchId || !partnerId) return { success: false, error: "Missing payload" };

  const { data: match } = await supabase
    .from("network_matches")
    .select("id,user1_id,user2_id")
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!match) return { success: false, error: "Match introuvable" };
  if (![match.user1_id, match.user2_id].includes(partnerId)) {
    return { success: false, error: "Partenaire invalide" };
  }

  const admin = createAdminClient();
  const payload = [
    {
      user_id: user.id,
      event_type: "daily_mission_whatsapp_opened",
      metadata: {
        matchId,
        partnerId,
        initiatedBy: user.id,
      },
    },
    {
      user_id: partnerId,
      event_type: "daily_mission_whatsapp_opened",
      metadata: {
        matchId,
        partnerId: user.id,
        initiatedBy: user.id,
      },
    },
  ];

  const { error } = await admin
    .from("analytics_events")
    .insert(payload);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
