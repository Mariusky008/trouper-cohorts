
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  const { data: matches, error } = await supabase
    .from('network_matches')
    .select('status')
    .limit(5);

  if (error) {
    console.error('Error selecting status:', error);
  } else {
    console.log('Matches status samples:', matches);
  }
}

checkSchema();
