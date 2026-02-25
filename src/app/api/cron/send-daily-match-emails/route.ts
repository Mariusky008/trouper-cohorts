import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { DailyMatchEmail } from '@/emails/daily-match-email';

export const dynamic = 'force-dynamic';

const GOAL_LABELS: Record<string, string> = {
    clients: "Trouver des clients",
    partners: "Partenariats",
    social_media: "Réseaux sociaux",
    local_network: "Réseau local",
    mentorship: "Mentorat",
    recruitment: "Recrutement",
    investors: "Investisseurs",
    suppliers: "Fournisseurs",
    visibility: "Visibilité",
    training: "Formation"
};

export async function GET(request: Request) {
  try {
    // 1. Init Admin Client & Resend
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase credentials');
    }
    
    if (!process.env.RESEND_API_KEY) {
        throw new Error('Missing RESEND_API_KEY');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 2. Get Today's Date
    const today = new Date().toISOString().split('T')[0];

    // 3. Fetch Matches for Today
    const { data: matches, error: matchError } = await supabase
        .from('network_matches')
        .select('*')
        .eq('date', today);

    if (matchError) throw matchError;
    if (!matches || matches.length === 0) {
        return NextResponse.json({ message: 'No matches found for today', count: 0 });
    }

    // 4. Fetch Profiles
    const userIds = new Set<string>();
    matches.forEach((m: any) => {
        userIds.add(m.user1_id);
        userIds.add(m.user2_id);
    });

    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(userIds));

    if (profileError) throw profileError;

    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

    // 5. Send Emails
    let emailsSent = 0;
    const emailPromises = [];

    for (const match of matches) {
        const user1 = profileMap.get(match.user1_id);
        const user2 = profileMap.get(match.user2_id);

        if (!user1 || !user2) continue;

        // Prepare email for User 1 (About User 2)
        const sendToUser1 = async () => {
            const goalLabel = user2.current_goals?.[0] ? GOAL_LABELS[user2.current_goals[0]] : "Développer son activité";
            
            await resend.emails.send({
                from: 'Popey Academy <onboarding@resend.dev>', // Update with verified domain in production
                to: user1.email,
                subject: `⚓️ Votre match du jour : ${user2.display_name} !`,
                react: DailyMatchEmail({
                    userName: user1.display_name,
                    matchName: user2.display_name,
                    matchJob: user2.trade,
                    matchCity: user2.city,
                    matchAvatar: user2.avatar_url,
                    matchGoal: goalLabel,
                    matchSuperpower: user2.superpower,
                    matchNeed: user2.current_need,
                    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://popey.academy'}/mon-reseau-local/dashboard`
                })
            });
        };

        // Prepare email for User 2 (About User 1)
        const sendToUser2 = async () => {
            const goalLabel = user1.current_goals?.[0] ? GOAL_LABELS[user1.current_goals[0]] : "Développer son activité";

            await resend.emails.send({
                from: 'Popey Academy <onboarding@resend.dev>',
                to: user2.email,
                subject: `⚓️ Votre match du jour : ${user1.display_name} !`,
                react: DailyMatchEmail({
                    userName: user2.display_name,
                    matchName: user1.display_name,
                    matchJob: user1.trade,
                    matchCity: user1.city,
                    matchAvatar: user1.avatar_url,
                    matchGoal: goalLabel,
                    matchSuperpower: user1.superpower,
                    matchNeed: user1.current_need,
                    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://popey.academy'}/mon-reseau-local/dashboard`
                })
            });
        };

        emailPromises.push(sendToUser1());
        emailPromises.push(sendToUser2());
        emailsSent += 2;
    }

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ 
        success: true, 
        matches_processed: matches.length,
        emails_sent: emailsSent 
    });

  } catch (error: any) {
    console.error('Email Sending Error:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message 
    }, { status: 500 });
  }
}
