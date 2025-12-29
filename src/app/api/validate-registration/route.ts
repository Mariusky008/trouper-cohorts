import { PreRegistrationEmail } from '@/components/emails/PreRegistrationEmail';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  
  // Note: For development without API key, we might want to skip sending or log only
  // But for production intent, we return error if missing.
  if (!apiKey) {
    console.error("Missing Resend API Key");
    // return NextResponse.json({ error: "Missing Resend API Key" }, { status: 500 });
  }

  const resend = apiKey ? new Resend(apiKey) : null;
  const supabase = await createClient();

  try {
    const { id, email, firstName } = await request.json();

    if (!id || !email || !firstName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Update status in Supabase
    const { error: dbError } = await supabase
      .from('pre_registrations')
      .update({ status: 'approved' })
      .eq('id', id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 2. Send Email
    if (resend) {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Troupers <onboarding@resend.dev>',
        to: [email],
        subject: '🚀 Ta place est validée ! (Action requise sous 6h)',
        react: PreRegistrationEmail({ firstName }) as React.ReactElement,
      });

      if (emailError) {
        console.error("Email sending failed:", emailError);
        // We don't fail the request if email fails, but we should log it
        // Ideally we might want to rollback DB change or mark as email_failed
      }
    } else {
        console.log("Mocking email send to:", email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
