import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computePortrait } from '@/lib/kudos/portrait/compute'

/**
 * POST /api/kudos/onboarding
 * Body: { user_id, answers: [{ dimensionSlug, optionIndex, optionLabel, score }] }
 *
 * Persiste les réponses d'onboarding réflexif, marque l'user comme onboardé,
 * puis amorce le portrait intérieur.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const userId: string | undefined = body?.user_id
  const answers: Array<{ dimensionSlug: string; optionIndex: number; optionLabel: string; score: number }> = body?.answers ?? []

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'answers required (non-empty array)' }, { status: 400 })
  }

  const sb = createAdminClient()

  // Insertion idempotente — l'unicité (user_id, dimension_slug) gère le re-onboarding
  const rows = answers.map((a) => ({
    user_id: userId,
    dimension_slug: a.dimensionSlug,
    option_index: a.optionIndex,
    option_label: a.optionLabel,
    score: a.score,
  }))

  const { error } = await sb
    .from('kudos_onboarding_answers')
    .upsert(rows, { onConflict: 'user_id,dimension_slug' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await sb
    .from('kudos_users')
    .update({
      onboarding_completed: true,
      onboarding_answers_count: answers.length,
    })
    .eq('id', userId)

  // Amorce le portrait intérieur (le perceived sera vide tant que personne n'a envoyé de kudos)
  const result = await computePortrait(userId, 'first')

  return NextResponse.json({
    ok: true,
    answers_count: answers.length,
    inner: result.inner,
    delta: result.delta,
  })
}
