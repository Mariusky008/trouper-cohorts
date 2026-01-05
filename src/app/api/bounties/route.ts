import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // 1. Check authentication (we still want to ensure only logged users can see this)
  const supabaseUser = await createServerClient()
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Use Admin Client to bypass RLS (Temporary Fix)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: bounties, error } = await supabaseAdmin
    .from('bounties')
    .select(`
        id,
        squad_id,
        defector_user_id,
        target_user_id,
        status,
        type,
        video_url,
        reward_credits,
        created_at
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bounties })
}