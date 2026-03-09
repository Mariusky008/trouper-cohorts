
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Load env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !supabaseKey || !resendApiKey) {
    console.error('Missing env vars:', { supabaseUrl, supabaseKey: !!supabaseKey, resendApiKey: !!resendApiKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendApiKey);

async function testEmail() {
    console.log('--- Starting Email Test ---');
    const today = new Date().toISOString().split('T')[0];
    console.log('Date:', today);

    // 1. Get Matches
    const { data: matches, error: matchError } = await supabase
        .from('network_matches')
        .select('*')
        .eq('date', today);

    if (matchError) {
        console.error('Match Error:', matchError);
        return;
    }
    
    console.log('Matches found:', matches?.length);

    if (!matches || matches.length === 0) return;

    // 2. Process First Match only for test
    const match = matches[0];
    console.log('Processing Match:', match.id);

    // 3. Get User 1 Profile & Email
    const { data: user1Profile } = await supabase.from('profiles').select('*').eq('id', match.user1_id).single();
    let email1 = user1Profile?.email;
    
    if (!email1) {
        console.log('User 1 email missing in profile, checking Auth...');
        const { data: u1Auth, error: authError } = await supabase.auth.admin.getUserById(match.user1_id);
        if (authError) console.error('Auth Error U1:', authError);
        email1 = u1Auth?.user?.email;
    }
    
    console.log('User 1:', user1Profile?.display_name, 'Email:', email1);

    // 4. Send Test Email via Resend
    if (email1) {
        try {
            console.log('Sending test email to:', email1);
            const { data, error } = await resend.emails.send({
                from: 'Popey Academy <contact@popey.academy>',
                to: email1,
                subject: 'Test Email Debug',
                html: '<p>Ceci est un test de debug pour vérifier la configuration Resend.</p>'
            });
            if (error) console.error('Resend Error:', error);
            else console.log('Resend Success:', data);
        } catch (e) {
            console.error('Resend Exception:', e);
        }
    } else {
        console.error('CRITICAL: No email found for User 1');
    }
}

testEmail();

