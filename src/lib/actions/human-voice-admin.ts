"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getAdminHumanVoiceCalls(limit?: number) {
  const supabaseAdmin = createAdminClient();
  const take = Number.isFinite(limit as number) && (limit as number) > 0 ? Math.min(200, Math.max(1, Math.floor(limit as number))) : 50;
  const { data, error } = await supabaseAdmin
    .from("human_voice_outbound_queue")
    .select(
      "id,owner_member_id,phone_e164,status,source,not_before_at,provider_call_sid,last_error,created_at,updated_at,human_voice_call_artifacts(recording_url,summary,outcome,updated_at)",
    )
    .order("created_at", { ascending: false })
    .limit(take);
  if (error) return { success: false as const, error: "Lecture voix impossible.", calls: [] as Array<Record<string, unknown>> };
  return { success: true as const, calls: (data as Array<Record<string, unknown>>) || [] };
}

