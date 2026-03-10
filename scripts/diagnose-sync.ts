
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  const email = 'contact@popey.academy';
  console.log(`Diagnosing for ${email}...`);

  // 1. List all users to check identities
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  
  if (users) {
      console.log("All Users:");
      users.forEach(u => console.log(`- ${u.email} (${u.id})`));
  } else {
      console.log("No users found or error:", userError);
  }
  
  return; // Stop here for now
}

diagnose();
