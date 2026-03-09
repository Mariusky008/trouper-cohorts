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
  return handleSendEmails(request);
}

export async function POST(request: Request) {
  return handleSendEmails(request);
}

async function handleSendEmails(request: Request) {
  try {
    // 1. Init Admin Client & Resend
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    
    // CRITICAL: Use Service Role Key for Admin Access (fetching emails)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Email fetching might fail if emails are not in public profile.");
    }

    if (!process.env.RESEND_API_KEY) {
        throw new Error('Missing RESEND_API_KEY');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey!
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
    const errors: any[] = [];

    // Use verified domain sender
    const fromEmail = process.env.EMAIL_FROM || 'Popey Academy <contact@popey.academy>';

    for (const match of matches) {
        let user1 = profileMap.get(match.user1_id);
        let user2 = profileMap.get(match.user2_id);

        if (!user1 || !user2) {
            console.warn(`Skipping match ${match.id}: missing profiles`);
            continue;
        }

        // Fetch emails from Auth if not in profile
        if (!user1.email) {
            const { data: u1Auth } = await supabase.auth.admin.getUserById(match.user1_id);
            if (u1Auth?.user?.email) user1 = { ...user1, email: u1Auth.user.email };
        }
        if (!user2.email) {
            const { data: u2Auth } = await supabase.auth.admin.getUserById(match.user2_id);
            if (u2Auth?.user?.email) user2 = { ...user2, email: u2Auth.user.email };
        }

        if (!user1.email || !user2.email) {
             console.error(`Skipping match ${match.id}: missing emails (U1: ${!!user1.email}, U2: ${!!user2.email})`);
             errors.push(`Match ${match.id}: Missing emails`);
             continue;
        }

        // Prepare email for User 1 (About User 2)
        const sendToUser1 = async () => {
            try {
                const goalLabel = user2.current_goals?.[0] ? GOAL_LABELS[user2.current_goals[0]] : "Développer son activité";
                
                await resend.emails.send({
                    from: fromEmail,
                    to: user1.email,
                    subject: `⚓️ Votre match du jour : ${user2.display_name} !`,
                    react: DailyMatchEmail({
                        userName: user1.display_name,
                        matchName: user2.display_name,
                        matchJob: user2.trade || "Entrepreneur",
                        matchCity: user2.city || "En ligne",
                        matchAvatar: user2.avatar_url,
                        matchGoal: goalLabel,
                        matchSuperpower: user2.superpower,
                        matchNeed: user2.current_need,
                        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://popey.academy'}/mon-reseau-local/dashboard`
                    })
                });
                return { success: true, userId: user1.id };
            } catch (err: any) {
                console.error(`Failed to send to user1 (${user1.email}):`, err);
                throw { userId: user1.id, error: err.message };
            }
        };

        // Prepare email for User 2 (About User 1)
        const sendToUser2 = async () => {
            try {
                const goalLabel = user1.current_goals?.[0] ? GOAL_LABELS[user1.current_goals[0]] : "Développer son activité";

                await resend.emails.send({
                    from: fromEmail,
                    to: user2.email,
                    subject: `⚓️ Votre match du jour : ${user1.display_name} !`,
                    react: DailyMatchEmail({
                        userName: user2.display_name,
                        matchName: user1.display_name,
                        matchJob: user1.trade || "Entrepreneur",
                        matchCity: user1.city || "En ligne",
                        matchAvatar: user1.avatar_url,
                        matchGoal: goalLabel,
                        matchSuperpower: user1.superpower,
                        matchNeed: user1.current_need,
                        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://popey.academy'}/mon-reseau-local/dashboard`
                    })
                });
                return { success: true, userId: user2.id };
            } catch (err: any) {
                console.error(`Failed to send to user2 (${user2.email}):`, err);
                throw { userId: user2.id, error: err.message };
            }
        };

        emailPromises.push(sendToUser1());
        emailPromises.push(sendToUser2());
    }

    const results = await Promise.allSettled(emailPromises);
    
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            emailsSent++;
        } else {
            errors.push(result.reason);
        }
    });

    return NextResponse.json({ 
        success: true, 
        matches_processed: matches.length,
        emails_sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Email Sending Error:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message 
    }, { status: 500 });
  }
}
