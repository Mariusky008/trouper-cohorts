import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendNotification } from '@/lib/actions/notifications';

// Note: This route should be protected (e.g., via a secret key header) in production
// to prevent unauthorized triggering.

export const dynamic = 'force-dynamic'; // Ensure this runs dynamically

export async function GET(request: Request) {
  return handleMatching(request);
}

export async function POST(request: Request) {
  return handleMatching(request);
}

async function handleMatching(request: Request) {
  try {
    // 1. Init Admin Client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
       // On Vercel, this key might not be available in client bundles but should be in server functions.
       // However, let's provide a specific error message if it's missing.
       throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Determine target date (Today)
    // Matches are generated at 4 AM for the current day
    const targetDate = new Date();
    // targetDate.setDate(targetDate.getDate() + 1); // REMOVED: We want matches for TODAY, not tomorrow
    const dateStr = targetDate.toISOString().split('T')[0];

    // 3. Fetch all availabilities for that date
    // AND Check if matches already exist for today to prevent duplicates
    
    // Check existing matches first
    const { count: existingCount } = await supabase
        .from('network_matches')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr);

    if (existingCount && existingCount > 0) {
        return NextResponse.json({ 
            success: true, 
            message: `Matches already generated for ${dateStr}. Skipping to prevent duplicates.`,
            count: existingCount 
        });
    }

    let { data: availabilities, error: availError } = await supabase
      .from('network_availabilities')
      .select('user_id, slots')
      .eq('date', dateStr);

    if (availError) {
        console.error("Supabase Error fetching availabilities:", availError);
        throw new Error(`Database error: ${availError.message}`);
    }

    if (!availabilities) {
        availabilities = [];
    }

    // 3b. AUTOMATED FALLBACK: Include users based on their network settings
    // This allows users who forgot to declare availability to be matched if the day is in their preferences.
    
    // Get day name (mon, tue, wed...)
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const targetDay = days[targetDate.getDay()]; // getDay() returns 0 for Sunday

    // Fetch active network settings with frequency
    const { data: allSettings, error: settingsError } = await supabase
        .from('network_settings')
        .select('user_id, preferred_days, preferred_slots, frequency_per_week')
        .eq('status', 'active');
    
    if (!settingsError && allSettings) {
        const declaredUserIds = new Set(availabilities.map((a: any) => a.user_id));
        
        // Slot mapping (Settings ID -> Display Label)
        const slotMapping: Record<string, string> = {
            '09-11': '09h – 11h',
            '12-14': '12h – 14h',
            '14-16': '14h – 16h',
            '17-19': '17h – 19h'
        };

        // NEW: Fetch match counts for this week for all active users to respect frequency limits
        // Calculate start of week (Monday) and end of week (Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diffToMon = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(now.setDate(diffToMon));
        monday.setHours(0, 0, 0, 0);
        const startOfWeekStr = monday.toISOString().split('T')[0];
        
        // Get all matches for this week
        const { data: weeklyMatches } = await supabase
            .from('network_matches')
            .select('user1_id, user2_id')
            .gte('date', startOfWeekStr);
            
        // Count matches per user
        const userMatchCounts: Record<string, number> = {};
        if (weeklyMatches) {
            weeklyMatches.forEach((m: any) => {
                userMatchCounts[m.user1_id] = (userMatchCounts[m.user1_id] || 0) + 1;
                userMatchCounts[m.user2_id] = (userMatchCounts[m.user2_id] || 0) + 1;
            });
        }

        for (const setting of allSettings) {
            // If user already declared availability, skip
            if (declaredUserIds.has(setting.user_id)) continue;

            // NEW: Check frequency limit
            const currentMatches = userMatchCounts[setting.user_id] || 0;
            const maxFrequency = setting.frequency_per_week || 5; // Default to 5 if not set
            
            if (currentMatches >= maxFrequency) {
                // User has reached their weekly limit, skip matching
                continue;
            }

            // Check if user prefers this day
            if (setting.preferred_days && setting.preferred_days.includes(targetDay)) {
                // Map preferred slots to the format used in matching
                const mappedSlots = (setting.preferred_slots || [])
                    .map((s: string) => slotMapping[s])
                    .filter(Boolean); // Remove undefined if mapping fails
                
                if (mappedSlots.length > 0) {
                    availabilities.push({
                        user_id: setting.user_id,
                        slots: mappedSlots
                    });
                }
            }
        }
    }

    if (!availabilities || availabilities.length < 2) {
      return NextResponse.json({ message: 'Not enough participants for ' + dateStr, count: 0 });
    }

    // 4. Enhanced Matching Logic (Prevent Duplicates + Random Pairing)
    
    // 4a. Fetch History: Get all past matches for these users to prevent repeats
    const userIds = availabilities.map((a: any) => a.user_id);
    const { data: pastMatches } = await supabase
        .from('network_matches')
        .select('user1_id, user2_id')
        .or(`user1_id.in.(${userIds.join(',')}),user2_id.in.(${userIds.join(',')})`);
    
    // Build a map of "who has met whom"
    const metHistory: Record<string, Set<string>> = {};
    if (pastMatches) {
        pastMatches.forEach((m: any) => {
            if (!metHistory[m.user1_id]) metHistory[m.user1_id] = new Set();
            if (!metHistory[m.user2_id]) metHistory[m.user2_id] = new Set();
            
            metHistory[m.user1_id].add(m.user2_id);
            metHistory[m.user2_id].add(m.user1_id);
        });
    }

    // 4b. Greedy Matching with History Check
    // Shuffle first to ensure randomness
    const pool = availabilities.sort(() => 0.5 - Math.random());
    const matches = [];
    const matchedUserIds = new Set<string>();

    // Iterate through the pool to find matches
    for (let i = 0; i < pool.length; i++) {
        const user1 = pool[i];
        if (matchedUserIds.has(user1.user_id)) continue;

        let bestPartnerIndex = -1;

        // Look for a partner in the rest of the pool
        for (let j = i + 1; j < pool.length; j++) {
            const candidate = pool[j];
            if (matchedUserIds.has(candidate.user_id)) continue;

            // Check if they have met before
            const hasMet = metHistory[user1.user_id]?.has(candidate.user_id);
            if (!hasMet) {
                // Found a fresh partner!
                bestPartnerIndex = j;
                break; 
            }
        }

        // If no fresh partner found, try to match with anyone available (fallback)
        // Only if we really want to guarantee a match even if repeated. 
        // For now, let's prioritize freshness, but if list is exhausted, maybe skip or pick first available.
        // Let's do a second pass if no fresh partner found? 
        // For MVP: If no fresh partner, pick the next available one (better a repeat match than no match?)
        // The user complained about repeats, so let's try to avoid it strictly first.
        
        if (bestPartnerIndex === -1) {
            // Second pass: Find ANY partner available
             for (let j = i + 1; j < pool.length; j++) {
                if (!matchedUserIds.has(pool[j].user_id)) {
                    bestPartnerIndex = j;
                    break;
                }
             }
        }

        if (bestPartnerIndex !== -1) {
            const user2 = pool[bestPartnerIndex];
            
            // Mark both as matched
            matchedUserIds.add(user1.user_id);
            matchedUserIds.add(user2.user_id);

            // Find common slot
            const u1Slots = Array.isArray(user1.slots) ? user1.slots : [];
            const u2Slots = Array.isArray(user2.slots) ? user2.slots : [];
            const commonSlot = u1Slots.find((s: string) => u2Slots.includes(s)) || u1Slots[0];

            matches.push({
                user1_id: user1.user_id,
                user2_id: user2.user_id,
                date: dateStr,
                time: commonSlot || "09h – 11h", 
                status: 'pending',
                meeting_url: `https://meet.google.com/new`,
                topic: "Échange réseau : Présentez vos activités respectives."
            });
        }
    }

    // 5. Insert Matches
    if (matches.length > 0) {
      const { error: insertError } = await supabase
        .from('network_matches')
        .insert(matches);
      
      if (insertError) {
          console.error("Supabase Error inserting matches:", insertError);
          throw new Error(`Insert error: ${insertError.message}`);
      }

      // --- NOTIFICATIONS LOGIC ---
      try {
        // 5a. Identify users with offers
        const allUserIds = Array.from(matchedUserIds);
        const { data: usersWithOffersData } = await supabase
            .from('network_offers')
            .select('user_id')
            .in('user_id', allUserIds)
            // Assuming offers are always active if present, or check 'status'
            // If there's a status column: .eq('status', 'active')
            ;
        
        const usersWithOffers = new Set(usersWithOffersData?.map((o: any) => o.user_id) || []);

        // 5b. Send Notifications
        const notificationPromises = matches.map(async (match) => {
            // Notify User 1
            const p1 = sendNotification(
                match.user1_id,
                "Nouveau Match du Jour ! ⚡️",
                "Votre binôme vous attend. Découvrez qui c'est !",
                "/mon-reseau-local/dashboard"
            );

            // Notify User 2
            const p2 = sendNotification(
                match.user2_id,
                "Nouveau Match du Jour ! ⚡️",
                "Votre binôme vous attend. Découvrez qui c'est !",
                "/mon-reseau-local/dashboard"
            );

            // Offer Notifications
            let p3 = Promise.resolve();
            if (usersWithOffers.has(match.user2_id)) {
                p3 = sendNotification(
                    match.user1_id,
                    "Nouvelle offre débloquée ! 🔓",
                    "Votre match a une offre exclusive pour vous.",
                    "/mon-reseau-local/dashboard/offers"
                ) as any;
            }

            let p4 = Promise.resolve();
            if (usersWithOffers.has(match.user1_id)) {
                p4 = sendNotification(
                    match.user2_id,
                    "Nouvelle offre débloquée ! 🔓",
                    "Votre match a une offre exclusive pour vous.",
                    "/mon-reseau-local/dashboard/offers"
                ) as any;
            }

            return Promise.all([p1, p2, p3, p4]);
        });

        await Promise.all(notificationPromises);
        console.log(`Sent notifications for ${matches.length} matches.`);

      } catch (notifError) {
          console.error("Error sending match notifications:", notifError);
          // Continue execution, don't fail the cron
      }
    }

    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      matches_created: matches.length,
      unmatched_users: pool.length - matchedUserIds.size
    });

  } catch (error: any) {
    console.error('Matching Error Detailed:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message || "Unknown error",
        stack: error.stack 
    }, { status: 500 });
  }
}
