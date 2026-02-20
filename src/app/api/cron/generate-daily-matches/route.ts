import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Note: This route should be protected (e.g., via a secret key header) in production
// to prevent unauthorized triggering.

export async function GET(request: Request) {
  // 1. Init Admin Client (bypasses RLS to read all availabilities and insert matches)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 2. Determine target date (Tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // 3. Fetch all availabilities for that date
    const { data: availabilities, error: availError } = await supabase
      .from('network_availabilities')
      .select('user_id, slots')
      .eq('date', dateStr);

    if (availError) throw availError;

    if (!availabilities || availabilities.length < 2) {
      return NextResponse.json({ message: 'Not enough participants for ' + dateStr, count: 0 });
    }

    // 4. Simple Matching Logic (Random Pairing for MVP)
    // In a real version, we would match based on overlapping slots and trust scores.
    const shuffled = availabilities.sort(() => 0.5 - Math.random());
    const matches = [];
    
    while (shuffled.length >= 2) {
      const user1 = shuffled.pop()!;
      const user2 = shuffled.pop()!;

      // Find common slot (MVP: just take the first common one, or default to first slot of user1)
      // Real logic: intersect user1.slots and user2.slots
      const commonSlot = user1.slots.find((s: string) => user2.slots.includes(s)) || user1.slots[0];

      matches.push({
        user1_id: user1.user_id,
        user2_id: user2.user_id,
        date: dateStr,
        time: commonSlot || "09h – 11h", // Default if no overlap found (should handle this better)
        status: 'pending',
        meeting_url: `https://meet.google.com/new`, // Or generate a real Jitsi/Zoom link
        topic: "Échange réseau : Présentez vos activités respectives."
      });
    }

    // 5. Insert Matches
    if (matches.length > 0) {
      const { error: insertError } = await supabase
        .from('network_matches')
        .insert(matches);
      
      if (insertError) throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      date: dateStr,
      matches_created: matches.length,
      unmatched_users: shuffled.length 
    });

  } catch (error: any) {
    console.error('Matching Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
