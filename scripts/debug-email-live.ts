
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

async function debugEmail() {
  console.log("--- Starting Email Debug ---");
  
  // 1. Check Env Vars
  console.log("URL:", !!supabaseUrl);
  console.log("Service Key:", !!supabaseServiceKey);
  console.log("Resend Key:", !!resendApiKey);
  console.log("Email From:", process.env.EMAIL_FROM || 'Default');

  // 2. Fetch User
  const email = 'contact@popey.academy'; // Or your test email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === email);
  
  if (!user) {
      console.error("User not found:", email);
      return;
  }
  console.log("User found:", user.id);

  // 3. Try to send a simple email
  try {
      console.log("Attempting to send email via Resend...");
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Popey Academy <contact@popey.academy>',
        to: email,
        subject: 'Test Debug Email 9h',
        html: '<p>Ceci est un test de debug pour vérifier la config.</p>'
      });

      if (error) {
          console.error("Resend Error:", error);
      } else {
          console.log("Resend Success:", data);
      }
  } catch (e) {
      console.error("Resend Exception:", e);
  }
}

debugEmail();
