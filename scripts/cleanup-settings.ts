import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log("Cleaning up ghost network_settings...");
  
  // Get all settings
  const { data: settings } = await supabaseAdmin.from('network_settings').select('id, user_id');
  
  // Get all profiles
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id');
  const profileIds = new Set(profiles?.map(p => p.id));

  let deletedCount = 0;
  for (const s of settings || []) {
    if (!profileIds.has(s.user_id)) {
      console.log(`Deleting ghost setting for user: ${s.user_id}`);
      await supabaseAdmin.from('network_settings').delete().eq('id', s.id);
      deletedCount++;
    }
  }

  // Also clean up network_availabilities
  const { data: availabilities } = await supabaseAdmin.from('network_availabilities').select('id, user_id');
  for (const a of availabilities || []) {
    if (!profileIds.has(a.user_id)) {
      console.log(`Deleting ghost availability for user: ${a.user_id}`);
      await supabaseAdmin.from('network_availabilities').delete().eq('id', a.id);
      deletedCount++;
    }
  }

  console.log(`Deleted ${deletedCount} ghost records.`);
}

cleanup().catch(console.error);
