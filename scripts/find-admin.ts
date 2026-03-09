
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findAdmin() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .or('display_name.ilike.%Marius%,email.ilike.%marius%')
    .limit(1);

  if (users && users.length > 0) {
    console.log('FOUND_ADMIN_ID:', users[0].id);
  } else {
    // Fallback: try to find ANY user to attach tasks to
    const { data: anyUser } = await supabase.from('profiles').select('id').limit(1);
    if (anyUser && anyUser.length > 0) {
        console.log('FOUND_ADMIN_ID:', anyUser[0].id);
    } else {
        console.log('NO_USER_FOUND');
    }
  }
}

findAdmin();

