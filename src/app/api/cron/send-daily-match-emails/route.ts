
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { DailyMatchEmail } from '@/emails/daily-match-email';
import { generateMatches } from '@/lib/matching';

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
  const logs: string[] = [];
  const log = (msg: string) => {
      console.log(msg);
      logs.push(msg);
  };

  try {
    log("[CRON] Starting Daily Match Email Process...");

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

    // 2. Get Target Date
    // Check for ?date=YYYY-MM-DD param to force a specific date
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    let todayStr = new Date().toISOString().split('T')[0];
    if (dateParam) {
        todayStr = dateParam;
        log(`[CRON] Using forced date from param: ${todayStr}`);
    } else {
        log(`[CRON] Target Date (UTC): ${todayStr}`);
    }

    // 3. Fetch Matches for Target Date
    // IMPORTANT: Fix date query to use the exact date string format from DB
    // In DB it is 'YYYY-MM-DD', matches are created with this exact string.
    
    // Debug: Log the query we are about to make
    log(`[CRON] Querying matches for date: '${todayStr}'`);

    let { data: matches, error: matchError } = await supabase
        .from('network_matches')
        .select('*')
        .eq('date', todayStr);

    if (matchError) throw matchError;
    
    // --- SELF-HEALING: If no matches found, attempt to generate them now ---
    if (!matches || matches.length === 0) {
        log(`[CRON] No matches found for ${todayStr}. Attempting RESCUE GENERATION...`);
        
        const generationResult = await generateMatches(new Date(todayStr));
        
        if (generationResult.success && ((generationResult.matches_created && generationResult.matches_created > 0) || (generationResult.count && generationResult.count > 0))) {
             log(`[CRON] Rescue Generation Successful! Created/Found ${generationResult.matches_created || generationResult.count} matches.`);
             
             // Re-fetch matches
             const { data: newMatches, error: newMatchError } = await supabase
                .from('network_matches')
                .select('*')
                .eq('date', todayStr);
                
             if (newMatchError) throw newMatchError;
             matches = newMatches;
        } else {
             log(`[CRON] Rescue Generation result: ${generationResult.message || 'No matches created'}.`);
        }
    }

    if (!matches || matches.length === 0) {
        log("[CRON] Still no matches found. Stopping.");
        return NextResponse.json({ message: 'No matches found/generated for today', logs }, { status: 200 });
    }

    log(`[CRON] Processing ${matches.length} matches.`);

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

    // 6. Fetch Emails from Auth (Batched)
    if (usersNeedingEmail.size > 0) {
        log(`[CRON] Fetching emails for ${usersNeedingEmail.size} users from Auth...`);
        const userIdsToFetch = Array.from(usersNeedingEmail);
        const AUTH_BATCH_SIZE = 5;
        
        for (let i = 0; i < userIdsToFetch.length; i += AUTH_BATCH_SIZE) {
             const batch = userIdsToFetch.slice(i, i + AUTH_BATCH_SIZE);
             const batchPromises = batch.map(async (id) => {
                const { data, error } = await supabase.auth.admin.getUserById(id);
                if (error) {
                    console.error(`[CRON] Failed to fetch auth user ${id}:`, error);
                    return { id, email: null };
                }
                return { id, email: data.user.email };
             });
             
             const results = await Promise.all(batchPromises);
             results.forEach(({ id, email }) => {
                if (email) {
                    const profile = profileMap.get(id) || { id };
                    profileMap.set(id, { ...profile, email });
                }
             });
        }
    }

    // 7. Prepare Emails for Batch Sending (Resend Batch API)
    let emailsSent = 0;
    const errors: any[] = [];
    const fromEmail = process.env.EMAIL_FROM || 'Popey Academy <contact@popey.academy>';
    
    // Construct Array of Email Options
    const emailsToSend: any[] = [];

    for (const match of matches) {
        let user1 = profileMap.get(match.user1_id);
        let user2 = profileMap.get(match.user2_id);

        if (!user1 || !user2 || !user1.email || !user2.email) {
            continue;
        }

        // Email for User 1
        const goalLabel1 = user2.current_goals?.[0] ? GOAL_LABELS[user2.current_goals[0]] : "Développer son activité";
        emailsToSend.push({
            from: fromEmail,
            to: user1.email,
            subject: `⚓️ Votre match du jour : ${user2.display_name} !`,
            react: DailyMatchEmail({
                userName: user1.display_name,
                matchName: user2.display_name,
                matchJob: user2.trade || "Entrepreneur",
                matchCity: user2.city || "En ligne",
                matchAvatar: user2.avatar_url,
                matchGoal: goalLabel1,
                matchSuperpower: user2.superpower,
                matchNeed: user2.current_need,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://popey.academy'}/mon-reseau-local/dashboard`
            })
        });

        // Email for User 2
        const goalLabel2 = user1.current_goals?.[0] ? GOAL_LABELS[user1.current_goals[0]] : "Développer son activité";
        emailsToSend.push({
            from: fromEmail,
            to: user2.email,
            subject: `⚓️ Votre match du jour : ${user1.display_name} !`,
            react: DailyMatchEmail({
                userName: user2.display_name,
                matchName: user1.display_name,
                matchJob: user1.trade || "Entrepreneur",
                matchCity: user1.city || "En ligne",
                matchAvatar: user1.avatar_url,
                matchGoal: goalLabel2,
                matchSuperpower: user1.superpower,
                matchNeed: user1.current_need,
                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://popey.academy'}/mon-reseau-local/dashboard`
            })
        });
    }

    // Execute Batch Send (Resend limit is 100 emails per batch call)
    const BATCH_SIZE = 100;
    
    if (emailsToSend.length > 0) {
        log(`[CRON] Prepared ${emailsToSend.length} emails. Sending via Batch API...`);
        
        for (let i = 0; i < emailsToSend.length; i += BATCH_SIZE) {
            const batch = emailsToSend.slice(i, i + BATCH_SIZE);
            log(`[CRON] Sending batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} emails)...`);
            
            try {
                const { data, error } = await resend.batch.send(batch);
                
                if (error) {
                    console.error('[CRON] Batch send error:', error);
                    errors.push(error);
                } else {
                    // data is an array of results for each email
                    if (data) {
                         // Check for individual errors in the batch response if needed
                         // Usually data.data is an array of objects { id: '...' } or errors
                         emailsSent += batch.length; // Assume success if no top-level error, or refine logic
                    }
                }
            } catch (e: any) {
                 console.error('[CRON] Batch execution exception:', e);
                 errors.push(e.message);
            }
        }
    } else {
        log("[CRON] No valid emails to send (missing emails or profiles).");
    }

    log(`[CRON] Processed ${matches.length} matches. Sent ${emailsSent} emails. Errors: ${errors.length}`);

    return NextResponse.json({ 
        success: true, 
        matches_processed: matches.length,
        emails_sent: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
        logs
    });

  } catch (error: any) {
    console.error('[CRON] Fatal Error:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message,
        logs 
    }, { status: 500 });
  }
}
