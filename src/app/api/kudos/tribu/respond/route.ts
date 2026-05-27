import { NextRequest, NextResponse } from 'next/server'
import { respondToTribeInvitation } from '@/lib/kudos/tribu/lifecycle'

/**
 * POST /api/kudos/tribu/respond
 * Body: { user_id, tribe_id, action: 'accept' | 'decline' }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const userId: string | undefined = body?.user_id
  const tribeId: string | undefined = body?.tribe_id
  const action: string | undefined = body?.action

  if (!userId || !tribeId || (action !== 'accept' && action !== 'decline')) {
    return NextResponse.json({ error: 'user_id, tribe_id, action (accept|decline) required' }, { status: 400 })
  }

  try {
    const result = await respondToTribeInvitation({ userId, tribeId, action })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'respond failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
