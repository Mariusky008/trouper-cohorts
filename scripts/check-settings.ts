import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, display_name');
  const profileIds = new Set(profiles?.map(p => p.id));
  console.log(`Valid profiles: ${profiles?.length}`);

  const { data: settings } = await supabaseAdmin.from('network_settings').select('*');
  console.log(`Total settings: ${settings?.length}`);

  for (const s of settings || []) {
    if (!profileIds.has(s.user_id)) {
      console.log(`GHOST SETTING FOUND: ${s.user_id}`);
      await supabaseAdmin.from('network_settings').delete().eq('user_id', s.user_id);
      console.log('Deleted.');
    }
  }
}

run();
