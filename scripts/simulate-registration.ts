
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function simulateRegistration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
    console.error('Missing env vars');
    return;
  }

  // Use service role key to bypass RLS and delete user if exists
  const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  const email = 'neo@matrix.com';
  const password = 'password123';
  const fullName = 'Thomas Anderson';
  const city = 'Zion';
  const trade = 'Développeur Matrix';
  const phone = '06 00 00 13 37';

  console.log(`🚀 Simulating registration for ${email}...`);

  // 1. Check if user exists and clean up
  const { data: { users } } = await adminSupabase.auth.admin.listUsers();
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    console.log('🗑️ User exists, deleting...');
    await adminSupabase.auth.admin.deleteUser(existingUser.id);
  }

  // 2. Sign Up (AuthDialog logic)
  console.log('📝 Signing up...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (authError) {
    console.error('❌ Signup failed:', authError.message);
    return;
  }

  if (!authData.user) {
    console.error('❌ No user returned');
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ Auth user created: ${userId}`);

  // 3. Create Profile (AuthDialog logic)
  console.log('👤 Creating profile...');
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
       id: userId,
       display_name: fullName,
       email: email,
       city: city,
       trade: trade,
       phone: phone, // Simulating the phone capture
       role: 'member'
    });

  if (profileError) {
    // Note: If trigger exists, this might be duplicate key error, which is fine
    console.log('⚠️ Profile insert note:', profileError.message);
  } else {
    console.log('✅ Profile created');
  }

  // 4. Verify Trust Score (Trigger logic)
  console.log('🔍 Verifying Trust Score initialization...');
  const { data: score } = await supabase
    .from('trust_scores')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (score) {
    console.log(`✅ Trust Score initialized: ${score.score}/5.0`);
  } else {
    console.error('❌ Trust Score missing! Trigger failed?');
  }

  // 5. Verify Network Settings (Trigger logic)
  console.log('⚙️ Verifying Network Settings...');
  const { data: settings } = await supabase
    .from('network_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (settings) {
    console.log(`✅ Network Settings initialized: Status=${settings.status}`);
  } else {
    console.error('❌ Network Settings missing! Trigger failed?');
  }

  console.log('🎉 Registration simulation complete!');
}

simulateRegistration();
