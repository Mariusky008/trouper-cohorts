import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
  const today = new Date('2026-03-17'); // Assuming today is 2026-03-17 based on env
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const targetDay = days[today.getDay()];
  console.log(`Target day: ${targetDay}`);

  // 1. Check all active users
  const { data: settings } = await supabaseAdmin.from('network_settings').select('*').eq('status', 'active');
  console.log(`Active settings: ${settings?.length}`);
  
  if (settings) {
    for (const s of settings) {
      const { data: profile } = await supabaseAdmin.from('profiles').select('display_name, city, trade').eq('id', s.user_id).single();
      console.log(`User: ${profile?.display_name} | City: ${profile?.city} | Trade: ${profile?.trade} | Pref Days: ${s.preferred_days}`);
    }
  }

  // 2. Check matches for today
  const dateStr = today.toISOString().split('T')[0];
  const { data: matches } = await supabaseAdmin.from('network_matches').select('*').eq('date', dateStr);
  console.log(`Matches today (${dateStr}): ${matches?.length}`);
}

debug();
