
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log("🔍 Diagnosing Julie's profile...");

  // 1. Find Julie
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('display_name', '%Julie%')
    .ilike('city', '%Mont de marsan%');

  if (profileError) {
    console.error("Error finding profile:", profileError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("❌ No profile found for 'Julie' in 'Mont de marsan'. Trying just 'Julie'...");
    const { data: profilesByName } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', '%Julie%');
    console.log("Profiles found by name only:", profilesByName?.map(p => `${p.display_name} (${p.city})`));
    return;
  }

  const julie = profiles[0];
  console.log(`✅ Found Julie: ${julie.display_name} (${julie.id})`);
  console.log(`   - Created At: ${julie.created_at}`);
  console.log(`   - Onboarding Completed: ${julie.onboarding_completed}`);
  console.log(`   - Availability Status: ${julie.availability_status}`);
  console.log(`   - Trade: ${julie.trade}`);

  // 2. Check Availabilities for Next Monday (Assuming today is Sunday 8th, Monday is 9th)
  // Let's check generally for future availabilities
  const { data: availabilities } = await supabase
    .from('network_availabilities')
    .select('*')
    .eq('user_id', julie.id)
    .gte('date', new Date().toISOString().split('T')[0]);

  console.log("\n📅 Availabilities found:", availabilities?.length);
  availabilities?.forEach(a => console.log(`   - ${a.date}: ${a.slots.length} slots`));

  if (!availabilities || availabilities.length === 0) {
      console.log("⚠️ Julie has NO availabilities set for the future. This is likely why she has no matches.");
  }

  // 3. Check Matches
  const { data: matches } = await supabase
    .from('network_matches')
    .select('*')
    .or(`user1_id.eq.${julie.id},user2_id.eq.${julie.id}`)
    .order('date', { ascending: false });

  console.log("\n🤝 Matches found:", matches?.length);
  matches?.forEach(m => console.log(`   - ${m.date} (${m.time}): Status ${m.status}`));

}

diagnose();
