import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveLivrables } from '@/lib/kudos/livrables/generate'

export const runtime = 'nodejs'
export const maxDuration = 60  // 3 appels OpenAI parallèles + persistence

/**
 * GET /api/kudos/generate-livrables?season_id=...
 * Lit les livrables déjà générés pour une saison.
 */
export async function GET(req: NextRequest) {
  const seasonId = req.nextUrl.searchParams.get('season_id')
  if (!seasonId) {
    return NextResponse.json({ error: 'season_id required' }, { status: 400 })
  }

  const sb = createAdminClient()
  const { data } = await sb
    .from('kudos_season_deliverables')
    .select('*')
    .eq('season_id', seasonId)
    .maybeSingle()

  return NextResponse.json({ livrables: data ?? null })
}

/**
 * POST /api/kudos/generate-livrables
 * Body: { user_id, season_id }
 * Génère (ou régénère) les 3 livrables de fin de saison via OpenAI.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const userId: string | undefined = body?.user_id
  const seasonId: string | undefined = body?.season_id

  if (!userId || !seasonId) {
    return NextResponse.json({ error: 'user_id and season_id required' }, { status: 400 })
  }

  try {
    const livrables = await generateAndSaveLivrables({ userId, seasonId })
    return NextResponse.json({ ok: true, livrables })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'generation failed'
    console.error('[generate-livrables] error', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
