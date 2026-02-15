import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const userId = '94e3b401-6320-45cc-aba5-db7bc1d38908'; // ID from user screenshot

  // 1. Check if already admin
  const { data: existing, error: checkError } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ message: 'User is already admin' });
  }

  // 2. Insert
  const { error: insertError } = await supabase
    .from('admins')
    .insert({ user_id: userId });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Admin added successfully' });
}
