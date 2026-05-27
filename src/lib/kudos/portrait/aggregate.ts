/**
 * Agrégation des signaux depuis Supabase vers les portraits intérieur/extérieur.
 * Utilise le client admin (RLS-bypass) car déclenché côté serveur après kudos reçu.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getBadgeSignals } from './dimension-mapping'
import type {
  DimensionSlug,
  InnerPortrait,
  PerceivedPortrait,
} from './types'

type Acc = Partial<Record<DimensionSlug, { sumWeighted: number; sumWeights: number; count: number }>>

function addSignal(acc: Acc, dim: DimensionSlug, score: number, weight: number) {
  const cur = acc[dim] ?? { sumWeighted: 0, sumWeights: 0, count: 0 }
  cur.sumWeighted += score * weight
  cur.sumWeights += weight
  cur.count += 1
  acc[dim] = cur
}

function finalize(acc: Acc): Partial<Record<DimensionSlug, number>> {
  const out: Partial<Record<DimensionSlug, number>> = {}
  for (const [dim, v] of Object.entries(acc)) {
    if (!v || v.sumWeights === 0) continue
    out[dim as DimensionSlug] = v.sumWeighted / v.sumWeights
  }
  return out
}

// ─────────────────────────────────────────────────────────────
// Miroir intérieur — onboarding (et plus tard votes Arène)
// ─────────────────────────────────────────────────────────────
export async function aggregateInner(userId: string): Promise<InnerPortrait> {
  const sb = createAdminClient()

  const { data: answers } = await sb
    .from('kudos_onboarding_answers')
    .select('dimension_slug, score, option_label')
    .eq('user_id', userId)

  const acc: Acc = {}
  const topTraits: { emoji: string; label: string }[] = []

  for (const a of answers ?? []) {
    if (!a.dimension_slug || a.score === null) continue
    addSignal(acc, a.dimension_slug as DimensionSlug, Number(a.score), 1)
    if (a.option_label && topTraits.length < 5) {
      topTraits.push({ emoji: '✨', label: a.option_label })
    }
  }

  // TODO Phase 2.5 — intégrer les votes Arène ici (mikky_arena_votes équivalent)
  // for (const vote of arenaVotes) { addSignal(acc, vote.dimension, vote.score, 0.5) }

  return {
    userId,
    dimensions: finalize(acc),
    topTraits,
    sourceCount: answers?.length ?? 0,
  }
}

// ─────────────────────────────────────────────────────────────
// Miroir extérieur — kudos reçus (+ futurs signals)
// ─────────────────────────────────────────────────────────────
export async function aggregatePerceived(userId: string): Promise<PerceivedPortrait> {
  const sb = createAdminClient()

  const { data: kudosRows } = await sb
    .from('kudos_kudos')
    .select(`
      sender_id, badge_id, relation, created_at,
      badge:kudos_badges_catalog(name, emoji),
      custom_badge_name, custom_badge_emoji
    `)
    .eq('receiver_id', userId)

  type KudosRow = {
    sender_id: string | null
    relation: 'coloc' | 'collegue' | 'ami' | 'voisin' | 'autre' | null
    badge: { name?: string; emoji?: string } | { name?: string; emoji?: string }[] | null
    custom_badge_name: string | null
    custom_badge_emoji: string | null
  }

  const rows = (kudosRows ?? []) as KudosRow[]

  const acc: Acc = {}
  const accByCircle: Record<string, Acc> = {}
  const senders = new Set<string>()
  const badgeCounts = new Map<string, { emoji: string; name: string; count: number }>()

  for (const r of rows) {
    if (r.sender_id) senders.add(r.sender_id)
    const badge = Array.isArray(r.badge) ? r.badge[0] : r.badge
    const badgeName = badge?.name ?? r.custom_badge_name ?? ''
    const badgeEmoji = badge?.emoji ?? r.custom_badge_emoji ?? '✨'
    if (!badgeName) continue

    // Compteur top badges
    const key = badgeName.toLowerCase()
    const cur = badgeCounts.get(key) ?? { emoji: badgeEmoji, name: badgeName, count: 0 }
    cur.count += 1
    badgeCounts.set(key, cur)

    // Mapping badge → signaux dimensions
    const signals = getBadgeSignals(badgeName)
    for (const sig of signals) {
      addSignal(acc, sig.dimension, sig.targetScore, sig.weight)
      const circle = r.relation ?? 'autre'
      const circleAcc = (accByCircle[circle] ??= {})
      addSignal(circleAcc, sig.dimension, sig.targetScore, sig.weight)
    }
  }

  const dimensions = finalize(acc)
  const byCircle = Object.fromEntries(
    Object.entries(accByCircle).map(([k, v]) => [k, finalize(v)]),
  ) as PerceivedPortrait['byCircle']

  // Confidence = combien de personnes différentes ont signalé cette dimension
  // (normalisé sur le nb total de contributeurs)
  const contributorCount = senders.size
  const confidence: Partial<Record<DimensionSlug, number>> = {}
  const attributionCounts: Partial<Record<DimensionSlug, number>> = {}
  for (const [dim, v] of Object.entries(acc)) {
    if (!v) continue
    attributionCounts[dim as DimensionSlug] = v.count
    confidence[dim as DimensionSlug] = contributorCount > 0
      ? Math.min(1, v.count / contributorCount)
      : 0
  }

  const topBadges = [...badgeCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return {
    userId,
    dimensions,
    confidence,
    attributionCounts,
    topBadges,
    byCircle,
    contributorCount,
  }
}
