import { ProgrammeChomageViewer } from "@/components/admin/programme-chomage-viewer";
import { createClient } from "@/lib/supabase/server";

export default async function ProgrammeChomagePage() {
    const supabase = await createClient();
    
    // Fetch missions with their steps from DB to ensure it matches the Admin Editor
    const { data: missions } = await supabase
        .from('mission_templates')
        .select(`
            *,
            mission_step_templates (*)
        `)
        .eq('program_type', 'job_seeker')
        .order('day_index');

    // Sort steps by position for each mission
    const formattedMissions = missions?.map(mission => ({
        ...mission,
        mission_step_templates: mission.mission_step_templates.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    })) || [];

    return <ProgrammeChomageViewer data={formattedMissions} />;
}
