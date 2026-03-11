
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { DailyMatchEmail } from '@/emails/daily-match-email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds execution time

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
    console.log("[CRON] Starting Daily Match Email Process...");

    // 1. Init Admin Client & Resend
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    
    // CRITICAL: Use Service Role Key for Admin Access (fetching emails)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Required for sending emails.");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    if (!process.env.RESEND_API_KEY) {
        throw new Error('Missing RESEND_API_KEY');
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 2. Get Today's Date
    const today = new Date().toISOString().split('T')[0];
    console.log(`[CRON] Target Date: ${today}`);

    // 3. Fetch Matches for Today
    const { data: matches, error: matchError } = await supabase
        .from('network_matches')
        .select('*')
        .eq('date', today);

    if (matchError) throw matchError;
    
    if (!matches || matches.length === 0) {
        console.log("[CRON] No matches found for today.");
        return NextResponse.json({ message: 'No matches found for today', count: 0 });
    }

    console.log(`[CRON] Found ${matches.length} matches.`);

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

    // 5. Identify Users needing Email Fetch from Auth
    const usersNeedingEmail = new Set<string>();
    userIds.forEach(id => {
        const profile = profileMap.get(id);
        if (!profile || !profile.email) {
            usersNeedingEmail.add(id);
        }
    });

    // 6. Fetch Emails from Auth (Parallel)
    if (usersNeedingEmail.size > 0) {
        console.log(`[CRON] Fetching emails for ${usersNeedingEmail.size} users from Auth...`);
        const emailPromises = Array.from(usersNeedingEmail).map(async (id) => {
            const { data, error } = await supabase.auth.admin.getUserById(id);
            if (error) {
                console.error(`[CRON] Failed to fetch auth user ${id}:`, error);
                return { id, email: null };
            }
            return { id, email: data.user.email };
        });

        const emailResults = await Promise.all(emailPromises);
        emailResults.forEach(({ id, email }) => {
            if (email) {
                const profile = profileMap.get(id) || { id };
                profileMap.set(id, { ...profile, email });
            }
        });
    }

    // 7. Prepare Emails
    let emailsSent = 0;
    const emailPromises: Promise<any>[] = [];
    const errors: any[] = [];

    // Use verified domain sender
    const fromEmail = process.env.EMAIL_FROM || 'Popey Academy <contact@popey.academy>';

    for (const match of matches) {
        let user1 = profileMap.get(match.user1_id);
        let user2 = profileMap.get(match.user2_id);

        if (!user1 || !user2) {
            console.warn(`[CRON] Skipping match ${match.id}: missing profiles`);
            continue;
        }

        if (!user1.email || !user2.email) {
             console.error(`[CRON] Skipping match ${match.id}: missing emails (U1: ${!!user1.email}, U2: ${!!user2.email})`);
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
                console.error(`[CRON] Failed to send to user1 (${user1.email}):`, err);
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
                console.error(`[CRON] Failed to send to user2 (${user2.email}):`, err);
                throw { userId: user2.id, error: err.message };
            }
        };

        emailPromises.push(sendToUser1());
        emailPromises.push(sendToUser2());
    }

    // 8. Wait for all emails
    const results = await Promise.allSettled(emailPromises);
    
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            emailsSent++;
        } else {
            errors.push(result.reason);
        }
    });

    console.log(`[CRON] Processed ${matches.length} matches. Sent ${emailsSent} emails. Errors: ${errors.length}`);

    return NextResponse.json({ 
        success: true, 
        matches_processed: matches.length,
        emails_sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('[CRON] Fatal Error:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message 
    }, { status: 500 });
  }
}
