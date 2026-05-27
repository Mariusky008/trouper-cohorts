import { NextRequest, NextResponse } from 'next/server'
import { computePortrait } from '@/lib/kudos/portrait/compute'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/kudos/portrait?user_id=...
 * Renvoie le portrait courant + delta de l'utilisateur.
 * Si pas encore calculé → retourne null (le client affiche le state "vide").
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const sb = createAdminClient()
  const [innerRes, perceivedRes, deltaRes] = await Promise.all([
    sb.from('kudos_inner_portrait').select('*').eq('user_id', userId).maybeSingle(),
    sb.from('kudos_perceived_portrait').select('*').eq('user_id', userId).maybeSingle(),
    sb.from('kudos_portrait_delta').select('*').eq('user_id', userId).maybeSingle(),
  ])

  return NextResponse.json({
    inner: innerRes.data ?? null,
    perceived: perceivedRes.data ?? null,
    delta: deltaRes.data ?? null,
  })
}

/**
 * POST /api/kudos/portrait
 * Body: { user_id, trigger? }
 * Recalcule le portrait. À appeler après onboarding terminé ou nouveau kudos reçu.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }
  const trigger = body.trigger === 'first' || body.trigger === 'season_end' ? body.trigger : 'manual'

  try {
    const result = await computePortrait(body.user_id, trigger)
    return NextResponse.json({
      ok: true,
      inner: result.inner,
      perceived: result.perceived,
      delta: result.delta,
      trigger: result.trigger,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'compute failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
