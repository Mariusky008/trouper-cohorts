import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('pre_registrations')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data count:', data.length);
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

checkData();
