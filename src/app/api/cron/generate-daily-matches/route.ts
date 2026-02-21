import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Note: This route should be protected (e.g., via a secret key header) in production
// to prevent unauthorized triggering.

export async function GET(request: Request) {
  return handleMatching(request);
}

export async function POST(request: Request) {
  return handleMatching(request);
}

async function handleMatching(request: Request) {
  try {
    // 1. Init Admin Client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Determine target date (Tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // 3. Fetch all availabilities for that date
    const { data: availabilities, error: availError } = await supabase
      .from('network_availabilities')
      .select('user_id, slots')
      .eq('date', dateStr);

    if (availError) {
        console.error("Supabase Error fetching availabilities:", availError);
        throw new Error(`Database error: ${availError.message}`);
    }

    if (!availabilities || availabilities.length < 2) {
      return NextResponse.json({ message: 'Not enough participants for ' + dateStr, count: 0 });
    }

    // 4. Simple Matching Logic (Random Pairing for MVP)
    const shuffled = availabilities.sort(() => 0.5 - Math.random());
    const matches = [];
    
    while (shuffled.length >= 2) {
      const user1 = shuffled.pop()!;
      const user2 = shuffled.pop()!;

      // Find common slot (MVP: just take the first common one, or default to first slot of user1)
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

    // 5. Insert Matches
    if (matches.length > 0) {
      const { error: insertError } = await supabase
        .from('network_matches')
        .insert(matches);
      
      if (insertError) {
          console.error("Supabase Error inserting matches:", insertError);
          throw new Error(`Insert error: ${insertError.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      matches_created: matches.length,
      unmatched_users: shuffled.length 
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
