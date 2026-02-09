"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMissionStep(missionId: string, content: string, position: number) {
    const supabase = await createClient();
    await supabase.from("mission_steps").insert({
        mission_id: missionId,
        content,
        position
    });
    revalidatePath(`/admin/cohorts/[id]/missions/${missionId}`);
}

export async function updateMissionStep(stepId: string, content: string, missionId: string) {
    const supabase = await createClient();
    await supabase.from("mission_steps").update({ content }).eq("id", stepId);
    revalidatePath(`/admin/cohorts/[id]/missions/${missionId}`);
}

export async function deleteMissionStep(stepId: string, missionId: string) {
    const supabase = await createClient();
    await supabase.from("mission_steps").delete().eq("id", stepId);
    revalidatePath(`/admin/cohorts/[id]/missions/${missionId}`);
}
