
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkAndRepair() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🔍 Checking for users missing network settings...');

  // 1. Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error listing users:', usersError);
    return;
  }

  console.log(`Found ${users.length} users in auth.`);

  let repairedCount = 0;

  for (const user of users) {
    // Check if network_settings exists
    const { data: settings } = await supabase
      .from('network_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!settings) {
      console.log(`⚠️ User ${user.email} (${user.id}) missing settings. Repairing...`);
      
      // Repair Settings
      const { error: settingsError } = await supabase
        .from('network_settings')
        .insert({ user_id: user.id, status: 'active' });
        
      if (settingsError) console.error('  ❌ Failed to create settings:', settingsError.message);
      else console.log('  ✅ Settings created.');

      // Repair Trust Score
      const { error: scoreError } = await supabase
        .from('trust_scores')
        .insert({ user_id: user.id, score: 5.0 });

      if (scoreError) {
         // Ignore duplicate key error if score exists but settings didn't
         if (!scoreError.message.includes('duplicate')) {
            console.error('  ❌ Failed to create trust score:', scoreError.message);
         }
      } else {
        console.log('  ✅ Trust score created.');
      }

      repairedCount++;
    }
  }

  console.log(`\n🏁 Done. Repaired ${repairedCount} users.`);
}

checkAndRepair();
