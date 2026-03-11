
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log("--- Starting Minimal Cron Diagnosis ---");
  
  // 1. Check Time and Date
  const now = new Date();
  const utcDate = now.toISOString().split('T')[0];
  console.log(`Current Time (UTC): ${now.toISOString()}`);
  console.log(`Target Date (UTC): ${utcDate}`);

  // 2. Check Matches for Today
  const { data: matchesToday, error: errorToday } = await supabase
    .from('network_matches')
    .select('id, date, status, user1_id, user2_id')
    .eq('date', utcDate);

  if (errorToday) {
      console.error("Error fetching matches for today:", errorToday);
  } else {
      console.log(`Matches found for today (${utcDate}): ${matchesToday?.length}`);
      if (matchesToday && matchesToday.length > 0) {
          console.log("Sample match:", JSON.stringify(matchesToday[0], null, 2));
      }
  }

  // 3. List Users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
      console.error("Error listing users:", listError);
  } else {
      console.log(`Users found: ${users.length}`);
  }
}

diagnose();
