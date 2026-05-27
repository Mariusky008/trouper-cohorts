import { NextRequest, NextResponse } from 'next/server'
import { getTribeForUser } from '@/lib/kudos/tribu/lifecycle'
import { createAdminClient } from '@/lib/supabase/admin'
import { aggregateInner, aggregatePerceived } from '@/lib/kudos/portrait/aggregate'
import { computeArchetype } from '@/lib/kudos/tribu/archetype'

/**
 * GET /api/kudos/tribu?user_id=...
 * Retourne :
 *  - state: 'locked' | 'forming' | 'proposed' | 'sealed'
 *  - archetype: l'archétype calculé de l'user (ou null si pas encore)
 *  - tribe: détails si l'user est dans une tribu, sinon null
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const sb = createAdminClient()
  const { data: user } = await sb
    .from('kudos_users')
    .select('archetype_id, tribe_opt_in, onboarding_completed')
    .eq('id', userId)
    .maybeSingle()

  // L'user doit avoir un archétype pour avoir une tribu — sinon état locked
  if (!user?.archetype_id) {
    return NextResponse.json({
      state: 'locked',
      reason: !user?.onboarding_completed ? 'no_onboarding' : 'no_archetype',
      archetype: null,
      tribe: null,
    })
  }

  const tribe = await getTribeForUser(userId)
  return NextResponse.json({
    state: tribe?.status ?? 'forming',
    archetype: user.archetype_id,
    optIn: user.tribe_opt_in,
    tribe,
  })
}

/**
 * POST /api/kudos/tribu
 * Body: { user_id, action: 'opt_in' | 'opt_out' | 'compute_archetype' }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const userId: string | undefined = body?.user_id
  const action: string | undefined = body?.action

  if (!userId || !action) {
    return NextResponse.json({ error: 'user_id and action required' }, { status: 400 })
  }

  const sb = createAdminClient()

  if (action === 'opt_in' || action === 'opt_out') {
    const { error } = await sb
      .from('kudos_users')
      .update({ tribe_opt_in: action === 'opt_in' })
      .eq('id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, tribe_opt_in: action === 'opt_in' })
  }

  if (action === 'compute_archetype') {
    const [inner, perceived] = await Promise.all([
      aggregateInner(userId),
      aggregatePerceived(userId),
    ])
    const assignment = computeArchetype(inner, perceived)

    await sb
      .from('kudos_users')
      .update({ archetype_id: assignment.primary })
      .eq('id', userId)

    return NextResponse.json({
      ok: true,
      archetype: assignment.primary,
      confidence: assignment.confidence,
      ranking: assignment.ranking,
    })
  }

  return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 })
}
