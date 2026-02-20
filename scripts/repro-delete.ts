
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log("Creating user...");
  const email = `test_del_${Date.now()}@example.com`;
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });

  if (createError || !user) {
    console.error("Create error:", createError);
    return;
  }
  console.log("User created:", user.id);

  // Simulate "Missing Profile" state
  console.log("Deleting profile to simulate missing profile state...");
  const { error: delProfileError } = await supabase.from('profiles').delete().eq('id', user.id);
  if (delProfileError) console.error("Profile delete error (might be expected if not created):", delProfileError);

  // Try to delete user
  console.log("Attempting to delete user...");
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("DELETE FAILED:", deleteError);
  } else {
    console.log("DELETE SUCCESS");
  }
}

run();
