import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatches() {
  const today = new Date().toISOString().split('T')[0];
  console.log('Checking matches for date >=', today);

  const { data, error } = await supabase
    .from('network_matches')
    .select('id, date, time')
    .gte('date', today)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Matches found:', data?.length);
  if (data && data.length > 0) {
      // Group by date
      const byDate = data.reduce((acc: any, curr: any) => {
          acc[curr.date] = (acc[curr.date] || 0) + 1;
          return acc;
      }, {});
      console.log('Matches by date:', byDate);
  }
}

checkMatches();
