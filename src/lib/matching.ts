import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '@/lib/actions/notifications';

export async function generateMatches(targetDate: Date) {
  try {
    // 1. Init Admin Client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const dateStr = targetDate.toISOString().split('T')[0];

    // 2. Check existing matches first
    const { count: existingCount } = await supabase
        .from('network_matches')
        .select('*', { count: 'exact', head: true })
        .eq('date', dateStr);

    if (existingCount && existingCount > 0) {
        return { 
            success: true, 
            message: `Matches already generated for ${dateStr}. Skipping to prevent duplicates.`,
            count: existingCount,
            skipped: true
        };
    }

    // 3. Fetch availabilities
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
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const targetDay = days[targetDate.getDay()]; // getDay() returns 0 for Sunday

    // If target day is Saturday or Sunday, we stop immediately.
    if (targetDay === 'sat' || targetDay === 'sun') {
        return { 
            success: true, 
            message: `Weekends are off. No matches generated for ${targetDay}.`,
            count: 0,
            skipped: true
        };
    }

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
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diffToMon = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
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
            const maxFrequency = setting.frequency_per_week || 5; 
            
            // Allow matching if limit not reached
            if (currentMatches >= maxFrequency) {
                continue;
            }

            // Check if user prefers this day
            // If preferred_days is empty or not set, we assume they are available everyday (auto fallback)
            const preferredDays = Array.isArray(setting.preferred_days) && setting.preferred_days.length > 0 
                ? setting.preferred_days 
                : ['mon', 'tue', 'wed', 'thu', 'fri'];
            
            if (preferredDays.includes(targetDay)) {
                // Map preferred slots to the format used in matching
                // If preferred_slots is empty, fallback to 09h-11h
                const mappedSlots = (setting.preferred_slots && setting.preferred_slots.length > 0)
                    ? setting.preferred_slots.map((s: string) => slotMapping[s] || s).filter(Boolean)
                    : ['09h – 11h']; 
                
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
      return { 
          success: true,
          message: 'Not enough participants for ' + dateStr, 
          count: 0 
      };
    }

    // 4. Enhanced Matching Logic
    
    // 4a. Fetch History and Profile Data
    const userIds = availabilities.map((a: any) => a.user_id);
    const { data: pastMatches } = await supabase
        .from('network_matches')
        .select('user1_id, user2_id')
        .or(`user1_id.in.(${userIds.join(',')}),user2_id.in.(${userIds.join(',')})`);
    
    // Fetch profiles for sphere and trade info
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, trade, city, receive_profile, avatar_url, bio')
        .in('id', userIds);

    const profileMap: Record<string, any> = {};
    const incompleteProfileIds = new Set<string>();

    if (profiles) {
        profiles.forEach(p => {
            // Check for profile completeness (Avatar or Bio required)
            // We are lenient: if they have EITHER avatar OR bio, we consider them "active enough"
            // Or maybe stricter: MUST have bio.
            // Let's stick to: Must have a Bio AND Avatar to be matchable. 
            // Avatar is less critical for the algo, but Bio is key for the match quality.
            if ((!p.bio || p.bio.trim().length < 5) || !p.avatar_url) {
                incompleteProfileIds.add(p.id);
            }

            profileMap[p.id] = {
                trade: p.trade?.toLowerCase() || '',
                sphere: p.receive_profile?.sphere_interest || '',
                city: p.city || ''
            };
        });
    }

    // Filter out incomplete profiles from the pool
    // We modify the 'availabilities' array to remove them
    // But we need to keep 'availabilities' intact for logging or just filter 'pool' later?
    // Let's filter 'availabilities' right here before creating 'pool'
    const validAvailabilities = availabilities.filter((a: any) => !incompleteProfileIds.has(a.user_id));

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
    
    // 4b. Greedy Matching
    const pool = validAvailabilities.sort(() => 0.5 - Math.random());
    const matches = [];
    const matchedUserIds = new Set<string>();

    for (let i = 0; i < pool.length; i++) {
        const user1 = pool[i];
        if (matchedUserIds.has(user1.user_id)) continue;

        const p1 = profileMap[user1.user_id] || { trade: '', sphere: '', city: '' };
        let bestPartnerIndex = -1;
        let bestScore = -1;

        for (let j = i + 1; j < pool.length; j++) {
            const candidate = pool[j];
            if (matchedUserIds.has(candidate.user_id)) continue;

            const p2 = profileMap[candidate.user_id] || { trade: '', sphere: '', city: '' };

            // RULE 1: STRICT TRADE EXCLUSION
            if (p1.trade && p2.trade && p1.trade === p2.trade) continue; 

            // RULE 2: STRICT CITY EXCLUSION
            if (p1.city && p2.city && p1.city !== p2.city) continue;

            // RULE 3: PREVENT REPEATS
            const hasMet = metHistory[user1.user_id]?.has(candidate.user_id);
            if (hasMet) continue;

            let currentScore = 0;
            
            // PRIORITY 1: SAME SPHERE
            if (p1.sphere && p2.sphere && p1.sphere === p2.sphere) currentScore += 100;

            // City match
            if (p1.city && p2.city && p1.city === p2.city) currentScore += 50;

            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestPartnerIndex = j;
            }
        }

        // Fallback matching
        if (bestPartnerIndex === -1) {
            for (let j = i + 1; j < pool.length; j++) {
                const candidate = pool[j];
                if (matchedUserIds.has(candidate.user_id)) continue;
                
                const p2 = profileMap[candidate.user_id] || { trade: '', sphere: '', city: '' };
                
                if (p1.trade && p2.trade && p1.trade === p2.trade) continue;
                if (p1.city && p2.city && p1.city !== p2.city) continue;
                
                bestPartnerIndex = j;
                break;
            }
        }

        if (bestPartnerIndex !== -1) {
            const user2 = pool[bestPartnerIndex];
            matchedUserIds.add(user1.user_id);
            matchedUserIds.add(user2.user_id);

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
        const allUserIds = Array.from(matchedUserIds);
        const { data: usersWithOffersData } = await supabase
            .from('network_offers')
            .select('user_id')
            .in('user_id', allUserIds);
        
        const usersWithOffers = new Set(usersWithOffersData?.map((o: any) => o.user_id) || []);

        const notificationPromises = matches.map(async (match) => {
            const p1 = sendNotification(
                match.user1_id,
                "Nouveau Match du Jour ! ⚡️",
                "Votre binôme vous attend. Découvrez qui c'est !",
                "/mon-reseau-local/dashboard"
            );

            const p2 = sendNotification(
                match.user2_id,
                "Nouveau Match du Jour ! ⚡️",
                "Votre binôme vous attend. Découvrez qui c'est !",
                "/mon-reseau-local/dashboard"
            );

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
      } catch (notifError) {
          console.error("Error sending match notifications:", notifError);
      }
    }

    return { 
      success: true, 
      date: dateStr,
      matches_created: matches.length,
      unmatched_users: pool.length - matchedUserIds.size
    };

  } catch (error: any) {
    console.error('Matching Error Detailed:', error);
    return { 
        success: false, 
        error: error.message || "Unknown error",
        stack: error.stack 
    };
  }
}