"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMissionStep(missionId: string, content: string, position: number, category: string = 'intellectual') {
    const supabase = await createClient();
    await supabase.from("mission_steps").insert({
        mission_id: missionId,
        content,
        position,
        category
    });
    revalidatePath(`/admin/cohorts/[id]/missions/${missionId}`); // Note: path pattern matching is tricky, better revalidate specific path in component or generic
}

export async function updateMissionStep(stepId: string, content: string, missionId: string, category?: string) {
    const supabase = await createClient();
    const payload: any = { content };
    if (category) payload.category = category;
    
    await supabase.from("mission_steps").update(payload).eq("id", stepId);
    revalidatePath(`/admin/cohorts/[id]/missions/${missionId}`);
}

export async function deleteMissionStep(stepId: string, missionId: string) {
    const supabase = await createClient();
    await supabase.from("mission_steps").delete().eq("id", stepId);
    revalidatePath(`/admin/cohorts/[id]/missions/${missionId}`);
}
