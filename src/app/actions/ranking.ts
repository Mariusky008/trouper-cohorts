'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitBuddyReport(data: {
    target_user_id: string;
    messages_sent: number;
    interactions_received: number;
    appointments_booked: number;
    comment?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Non authentifié" };
    }

    // Calcul du score
    // 1 pt par message, 2 pts par interaction, 10 pts par RDV
    const score = (data.messages_sent * 1) + 
                  (data.interactions_received * 2) + 
                  (data.appointments_booked * 10);

    const { error } = await supabase
        .from('buddy_reports')
        .upsert({
            reporter_id: user.id,
            target_user_id: data.target_user_id,
            date: new Date().toISOString().split('T')[0], // Date du jour YYYY-MM-DD
            messages_sent: data.messages_sent,
            interactions_received: data.interactions_received,
            appointments_booked: data.appointments_booked,
            score: score,
            comment: data.comment
        }, {
            onConflict: 'date, reporter_id, target_user_id'
        });

    if (error) {
        console.error("Error submitting report:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/ranking');
    return { success: true };
}

export async function getRanking() {
    const supabase = await createClient();

    // Récupérer tous les rapports
    // Dans un vrai cas, on filtrerait par cohorte et par semaine/mois
    const { data: reports, error } = await supabase
        .from('buddy_reports')
        .select(`
            score,
            target_user_id,
            auth:target_user_id (
                email,
                raw_user_meta_data
            )
        `);

    if (error) return [];

    // Agréger les scores par utilisateur (ou binôme si on avait la liaison binôme)
    // Pour l'instant on fait un classement individuel qu'on présentera comme "Binôme de X"
    const leaderboard: Record<string, any> = {};

    reports.forEach((r: any) => {
        const uid = r.target_user_id;
        if (!leaderboard[uid]) {
            leaderboard[uid] = {
                user_id: uid,
                name: r.auth?.raw_user_meta_data?.full_name || r.auth?.email?.split('@')[0] || "Inconnu",
                total_score: 0,
                reports_count: 0
            };
        }
        leaderboard[uid].total_score += r.score;
        leaderboard[uid].reports_count += 1;
    });

    return Object.values(leaderboard).sort((a, b) => b.total_score - a.total_score);
}
