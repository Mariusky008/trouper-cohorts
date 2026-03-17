import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log("Cleaning up ALL ghost records...");
  
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id');
  const profileIds = new Set(profiles?.map(p => p.id));
  console.log(`Found ${profileIds.size} valid profiles.`);

  const tables = ['network_settings', 'network_availabilities', 'network_matches', 'network_opportunities', 'network_requests'];

  for (const table of tables) {
    let deletedCount = 0;
    
    // For matches, check both user1_id and user2_id
    if (table === 'network_matches') {
       const { data: records } = await supabaseAdmin.from(table).select('id, user1_id, user2_id');
       for (const r of records || []) {
         if (!profileIds.has(r.user1_id) || !profileIds.has(r.user2_id)) {
            await supabaseAdmin.from(table).delete().eq('id', r.id);
            deletedCount++;
         }
       }
    } else {
       const { data: records } = await supabaseAdmin.from(table).select('id, user_id');
       for (const r of records || []) {
         if (!profileIds.has(r.user_id)) {
            await supabaseAdmin.from(table).delete().eq('id', r.id);
            deletedCount++;
         }
       }
    }
    console.log(`Deleted ${deletedCount} ghost records from ${table}.`);
  }
}

cleanup().catch(console.error);
