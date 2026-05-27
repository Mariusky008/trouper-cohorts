import { NextRequest, NextResponse } from 'next/server'
import {
  loadCandidatePool,
  composeTribesFromPool,
  persistComposedTribes,
} from '@/lib/kudos/tribu/compose'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/kudos/tribu/compose
 * Body: { city, mode?, days_ahead? }
 *
 * Endpoint admin/cron : compose autant de tribus que possible dans la ville.
 * Choisit automatiquement le café partenaire actif si dispo.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const city: string | undefined = body?.city
  const mode: 'friends_clan' | 'new_encounters' = body?.mode === 'new_encounters' ? 'new_encounters' : 'friends_clan'
  const daysAhead: number = typeof body?.days_ahead === 'number' ? body.days_ahead : 7

  if (!city) {
    return NextResponse.json({ error: 'city required' }, { status: 400 })
  }

  try {
    const pool = await loadCandidatePool(city)
    const tribes = composeTribesFromPool(pool)

    // Choix d'un café partenaire actif dans la ville
    const sb = createAdminClient()
    const { data: cafe } = await sb
      .from('kudos_partner_cafes')
      .select('name, address')
      .eq('city', city)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    const proposedDate = new Date()
    proposedDate.setDate(proposedDate.getDate() + daysAhead)
    proposedDate.setHours(14, 0, 0, 0)
    const proposedPlace = cafe ? `${cafe.name}${cafe.address ? ' · ' + cafe.address : ''}` : undefined

    const tribeIds = await persistComposedTribes(tribes, {
      mode,
      proposedPlace,
      proposedDate: proposedDate.toISOString(),
    })

    return NextResponse.json({
      ok: true,
      city,
      candidateCount: pool.totalCandidates,
      tribesCreated: tribeIds.length,
      tribeIds,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'compose failed'
    console.error('[tribu/compose] error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
