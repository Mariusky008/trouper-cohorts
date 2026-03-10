
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function triggerCron() {
  const url = 'https://www.popey.academy/api/cron/send-daily-match-emails';
  console.log(`Triggering cron manually at: ${url}...`);
  
  try {
      const response = await fetch(url, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      });
      
      const text = await response.text();
      console.log('Raw Response:', text);
      
      try {
        const result = JSON.parse(text);
        console.log('Cron Result:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.error("Could not parse JSON");
      }
  } catch (error) {
      console.error('Fetch error:', error);
  }
}

triggerCron();
