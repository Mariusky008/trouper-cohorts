/**
 * Orchestrateur principal du moteur de portrait.
 * Voir Partie 3.2 du doc de vision : compute-portrait.
 *
 * Déclenché :
 *   - 'first'      : au 3e kudos reçu (premier portrait complet)
 *   - 'season_end' : fin d'une saison (recalcul + génération livrables)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { aggregateInner, aggregatePerceived } from './aggregate'
import { computeDelta } from './delta'
import type { InnerPortrait, PerceivedPortrait, PortraitDelta } from './types'

export type ComputeTrigger = 'first' | 'season_end' | 'manual'

export type ComputePortraitResult = {
  inner: InnerPortrait
  perceived: PerceivedPortrait
  delta: PortraitDelta
  trigger: ComputeTrigger
}

export async function computePortrait(
  userId: string,
  trigger: ComputeTrigger = 'manual',
): Promise<ComputePortraitResult> {
  const [inner, perceived] = await Promise.all([
    aggregateInner(userId),
    aggregatePerceived(userId),
  ])
  const delta = computeDelta(inner, perceived)

  await Promise.all([
    saveInner(inner),
    savePerceived(perceived),
    saveDelta(delta),
  ])

  // En Phase 3 : si season_end → générer les livrables IA
  // if (trigger === 'season_end') await generateSeasonDeliverables(userId, delta)

  return { inner, perceived, delta, trigger }
}

// ─────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────
async function saveInner(p: InnerPortrait) {
  const sb = createAdminClient()
  await sb.from('kudos_inner_portrait').upsert({
    user_id: p.userId,
    dimensions: p.dimensions,
    top_traits: p.topTraits,
    last_computed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

async function savePerceived(p: PerceivedPortrait) {
  const sb = createAdminClient()
  await sb.from('kudos_perceived_portrait').upsert({
    user_id: p.userId,
    dimensions: p.dimensions,
    confidence: p.confidence,
    attribution_counts: p.attributionCounts,
    top_badges: p.topBadges,
    by_circle: p.byCircle,
    contributor_count: p.contributorCount,
    last_computed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

async function saveDelta(d: PortraitDelta) {
  const sb = createAdminClient()
  await sb.from('kudos_portrait_delta').upsert({
    user_id: d.userId,
    tension: d.tension,
    gap_score: d.gapScore,
    blindspots: d.blindspots,
    hidden_garden: d.hiddenGarden,
    strongest_blindspot: d.strongestBlindspot,
    computed_for_kudos_count: d.computedForKudosCount,
    last_computed_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

/**
 * À appeler dans le webhook/trigger après chaque INSERT kudos.
 * Si le 3e kudos vient d'arriver → trigger = 'first'.
 */
export async function maybeRecomputePortraitAfterKudos(receiverId: string): Promise<ComputePortraitResult | null> {
  const sb = createAdminClient()
  const { count } = await sb
    .from('kudos_kudos')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', receiverId)

  const total = count ?? 0
  if (total < 3) return null
  return computePortrait(receiverId, total === 3 ? 'first' : 'manual')
}
