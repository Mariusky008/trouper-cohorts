import { createClient } from "@/lib/supabase/server";
import RankingPage from "@/components/ranking/ranking-client";
import { getRanking } from "@/app/actions/ranking";
import { getMyBuddies } from "@/lib/data/buddy";

export const dynamic = 'force-dynamic';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-8 text-center text-white">Veuillez vous connecter.</div>;
    }

    // 1. Récupérer le classement
    const ranking = await getRanking();

    // 2. Récupérer mon binôme ACTUEL (du jour ou le plus récent)
    // On suppose qu'on est dans la cohorte active. Pour l'instant on hardcode l'ID de cohorte ou on le récupère.
    // MVP: On prend la première cohorte active de l'user.
    const { data: membership } = await supabase
        .from("cohort_members")
        .select("cohort_id")
        .eq("user_id", user.id)
        .maybeSingle();

    let myBuddy = null;
    if (membership) {
        const buddyIds = await getMyBuddies(membership.cohort_id, user.id);
        if (buddyIds && buddyIds.length > 0) {
            const { data: buddyProfile } = await supabase
                .from("profiles") // ou pre_registrations
                .select("id, display_name")
                .eq("id", buddyIds[0])
                .single();
            
            if (buddyProfile) {
                myBuddy = {
                    id: buddyProfile.id,
                    name: buddyProfile.display_name || "Binôme"
                };
            }
        }
    }

    return <RankingPage ranking={ranking} myBuddy={myBuddy} />;
}
