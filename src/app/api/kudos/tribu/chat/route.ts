import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/kudos/tribu/chat?tribe_id=...&user_id=...
 * Retourne les messages d'une tribu, après vérif que l'user en est membre accepté.
 */
export async function GET(req: NextRequest) {
  const tribeId = req.nextUrl.searchParams.get('tribe_id')
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!tribeId || !userId) {
    return NextResponse.json({ error: 'tribe_id and user_id required' }, { status: 400 })
  }

  const sb = createAdminClient()
  // Vérif appartenance
  const { data: membership } = await sb
    .from('kudos_tribe_members')
    .select('id')
    .eq('tribe_id', tribeId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .maybeSingle()
  if (!membership) {
    return NextResponse.json({ error: 'not a member' }, { status: 403 })
  }

  const { data: messages } = await sb
    .from('kudos_tribe_messages')
    .select(`
      id, text, created_at, sender_id,
      sender:kudos_users!sender_id(name, avatar_url)
    `)
    .eq('tribe_id', tribeId)
    .order('created_at', { ascending: true })
    .limit(200)

  return NextResponse.json({ messages: messages ?? [] })
}

/**
 * POST /api/kudos/tribu/chat
 * Body: { user_id, tribe_id, text }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const userId: string | undefined = body?.user_id
  const tribeId: string | undefined = body?.tribe_id
  const text: string | undefined = body?.text

  if (!userId || !tribeId || !text) {
    return NextResponse.json({ error: 'user_id, tribe_id, text required' }, { status: 400 })
  }
  const trimmed = text.trim()
  if (trimmed.length === 0 || trimmed.length > 2000) {
    return NextResponse.json({ error: 'text must be 1..2000 chars' }, { status: 400 })
  }

  const sb = createAdminClient()
  // Vérif que l'user est membre accepté ET que la tribu est scellée
  const { data: membership } = await sb
    .from('kudos_tribe_members')
    .select('status, tribe:kudos_tribes!inner(status)')
    .eq('tribe_id', tribeId)
    .eq('user_id', userId)
    .maybeSingle()

  type MemRow = { status: string; tribe: { status?: string } | { status?: string }[] | null } | null
  const m = membership as MemRow
  const tribeStatus = m ? (Array.isArray(m.tribe) ? m.tribe[0]?.status : m.tribe?.status) : null

  if (!m || m.status !== 'accepted' || tribeStatus !== 'sealed') {
    return NextResponse.json({ error: 'chat only open for sealed tribe members' }, { status: 403 })
  }

  const { data: msg, error } = await sb
    .from('kudos_tribe_messages')
    .insert({ tribe_id: tribeId, sender_id: userId, text: trimmed })
    .select('id, text, created_at, sender_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: msg })
}
