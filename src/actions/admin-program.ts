"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMissionTemplate(templateId: string, data: {
    title: string;
    description: string;
    video_url: string;
    validation_type?: string;
    steps: any[];
}) {
    const supabase = await createClient();

    // 1. Update Template
    const { error: tError } = await supabase
        .from("mission_templates")
        .update({
            title: data.title,
            description: data.description,
            video_url: data.video_url,
            validation_type: data.validation_type || 'self'
        })
        .eq("id", templateId);

    if (tError) return { success: false, error: tError.message };

    // 2. Update Steps (Delete all & Re-insert is easier/safer for order)
    // D'abord on supprime les anciennes étapes du template
    const { error: delError } = await supabase
        .from("mission_step_templates")
        .delete()
        .eq("mission_template_id", templateId);
        
    if (delError) return { success: false, error: delError.message };

    // Puis on insère les nouvelles
    if (data.steps && data.steps.length > 0) {
        const stepsToInsert = data.steps.map((s, i) => ({
            mission_template_id: templateId,
            content: s.content,
            category: s.category || 'intellectual',
            position: i + 1 // On force la position séquentielle
        }));

        const { error: sError } = await supabase.from("mission_step_templates").insert(stepsToInsert);
        if (sError) return { success: false, error: sError.message };
    }

    revalidatePath("/admin/program");
    revalidatePath(`/admin/program/${templateId}`);
    
    return { success: true };
}
