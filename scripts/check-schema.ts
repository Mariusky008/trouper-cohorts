
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  // Try to select match_id from match_feedback
  const { data, error } = await supabase
    .from('match_feedback')
    .select('match_id')
    .limit(1);

  if (error) {
    console.error('Error selecting match_id:', error);
  } else {
    console.log('Successfully selected match_id. Column exists.');
  }
}

checkSchema();
