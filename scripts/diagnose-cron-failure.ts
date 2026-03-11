
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

async function diagnose() {
  console.log("--- Starting Cron Diagnosis ---");
  
  // 1. Check Time and Date
  const now = new Date();
  const utcDate = now.toISOString().split('T')[0];
  console.log(`Current Time (Local): ${now.toString()}`);
  console.log(`Current Time (UTC): ${now.toISOString()}`);
  console.log(`Target Date (UTC): ${utcDate}`);

  // 2. Check Matches for Today
  const { data: matchesToday, error: errorToday } = await supabase
    .from('network_matches')
    .select('*')
    .eq('date', utcDate);

  if (errorToday) {
      console.error("Error fetching matches for today:", errorToday);
  } else {
      console.log(`Matches found for today (${utcDate}): ${matchesToday?.length}`);
      if (matchesToday && matchesToday.length > 0) {
          console.log("Sample match:", matchesToday[0]);
      }
  }

  // 3. Check Matches for Yesterday and Tomorrow (to detect timezone shifts)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split('T')[0];
  
  const { data: matchesYesterday } = await supabase
    .from('network_matches')
    .select('id')
    .eq('date', yesterdayDate);
  console.log(`Matches found for yesterday (${yesterdayDate}): ${matchesYesterday?.length}`);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  const { data: matchesTomorrow } = await supabase
    .from('network_matches')
    .select('id')
    .eq('date', tomorrowDate);
  console.log(`Matches found for tomorrow (${tomorrowDate}): ${matchesTomorrow?.length}`);

  // 4. Test User Email Retrieval (using a known user ID from a match if available, or just listing one)
  console.log("\n--- Testing Email Retrieval ---");
  if (matchesToday && matchesToday.length > 0) {
      const testUserId = matchesToday[0].user1_id;
      console.log(`Testing with User ID: ${testUserId}`);
      
      // Try fetching profile
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', testUserId).single();
      console.log(`Profile Email: ${profile?.email || 'Not found in profile'}`);

      // Try fetching Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(testUserId);
      if (authError) {
          console.error("Auth Error:", authError);
      } else {
          console.log(`Auth Email: ${authUser?.user?.email || 'Not found in Auth'}`);
      }
  } else {
      console.log("No matches today to test user retrieval. Fetching a random user...");
      const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1 });
      if (users && users.users.length > 0) {
          console.log(`Random User Email: ${users.users[0].email}`);
      }
  }

  // 5. Test Resend Configuration
  console.log("\n--- Testing Resend Config ---");
  if (!resendApiKey) {
      console.error("MISSING RESEND_API_KEY");
  } else {
      console.log("RESEND_API_KEY is present.");
      // Optional: Send a test email to the developer/admin
      // await resend.emails.send({ ... }) 
  }
}

diagnose();
