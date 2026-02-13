"use server";

import { createClient } from "@/lib/supabase/server";
import { programmeChomageData } from "@/data/programme-chomage-data";

export async function seedJobSeekerProgram() {
  const supabase = await createClient();

  try {
    // 1. Delete existing job_seeker templates
    const { error: deleteError } = await supabase
      .from("mission_templates")
      .delete()
      .eq("program_type", "job_seeker");

    if (deleteError) throw deleteError;

    // 2. Prepare the new data
    // Maps Content Index 0-14 to Calendar Days (Skipping weekends)
    // Week 1: 1, 2, 3, 4, 5
    // Week 2: 8, 9, 10, 11, 12
    // Week 3: 15, 16, 17, 18, 19
    const dayMapping = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19];

    for (let i = 0; i < programmeChomageData.length; i++) {
      const original = programmeChomageData[i];
      // Safety check for day mapping
      const calendarDay = i < dayMapping.length ? dayMapping[i] : dayMapping[dayMapping.length - 1] + (i - dayMapping.length + 1);
      
      let missionData = {
        day_index: calendarDay,
        title: original.title,
        description: original.description,
        program_type: "job_seeker",
        steps: original.mission_step_templates
      };

      // 3. Insert new mission
      // We check if it exists just in case, but we deleted everything above so it should be clean inserts.
      // However, for robustness in case of partial failures or other program types, we can use upsert or just insert.
      // Since we did a delete for program_type="job_seeker", we can just insert.
      
      const { data: insertedMission, error: missionError } = await supabase
        .from("mission_templates")
        .insert({
            day_index: missionData.day_index,
            title: missionData.title,
            description: missionData.description,
            program_type: missionData.program_type
        })
        .select()
        .single();
    
      if (missionError) {
          console.error(`Error inserting mission for day ${missionData.day_index}:`, missionError);
          continue;
      }
      
      const missionId = insertedMission.id;

      if (missionId && missionData.steps) {
          const stepsToInsert = missionData.steps.map((step: any, index: number) => ({
              mission_template_id: missionId,
              category: step.category,
              title: step.title,
              content: step.content,
              position: step.position || index + 1
          }));

          const { error: stepsError } = await supabase
              .from("mission_step_templates")
              .insert(stepsToInsert);
          
          if (stepsError) console.error(`Error inserting steps for mission ${missionId}:`, stepsError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Seed error:", error);
    return { success: false, error: JSON.stringify(error) };
  }
}
