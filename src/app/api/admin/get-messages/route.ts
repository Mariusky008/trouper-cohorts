import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Initialize Supabase Admin Client (Bypasses RLS)
  // We need to check if env vars are present
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service Role Key missing' }, { status: 500 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Fetch Reports (Fallback messages)
    const { data: reports, error: reportError } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(email),
        target:target_user_id(email)
      `)
      .order('created_at', { ascending: false })

    if (reportError) throw reportError

    // Fetch Admin Messages (Proper table)
    let msgs: any[] = []
    try {
        const { data } = await supabaseAdmin
        .from('admin_messages')
        .select(`*, user:user_id(email)`)
        .order('created_at', { ascending: false })
        
        msgs = data || []
    } catch (e) {
        // Table might not exist
        console.log("Admin messages table issue", e)
    }

    return NextResponse.json({ reports, messages: msgs })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
