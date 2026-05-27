/**
 * Calcul du delta entre miroir intérieur et miroir extérieur.
 * Fonctions pures (pas de DB) — testables et déterministes.
 */

import {
  ALL_DIMENSIONS,
  type Blindspot,
  type DimensionSlug,
  type InnerPortrait,
  type PerceivedPortrait,
  type PortraitDelta,
} from './types'

// Seuils — ajustables après observation des premiers utilisateurs réels.
const BLINDSPOT_DIVERGENCE_THRESHOLD = 0.4  // au-delà, c'est un angle mort
const BLINDSPOT_CONFIDENCE_THRESHOLD = 0.6  // si les autres sont peu confiants, on ignore
const CONVERGENCE_GAP_THRESHOLD = 35         // gapScore < 35 → "converge"

/**
 * Compare les deux miroirs et identifie les angles morts.
 * Un angle mort = les autres sont SÛRS d'un trait que tu ne te reconnais pas.
 */
export function computeDelta(
  inner: InnerPortrait,
  perceived: PerceivedPortrait,
): PortraitDelta {
  const blindspots: Blindspot[] = []
  const hiddenGarden: Blindspot[] = []

  for (const dim of ALL_DIMENSIONS) {
    const ext = perceived.dimensions[dim]
    const int = inner.dimensions[dim]
    if (ext === undefined || int === undefined) continue

    const divergence = Math.abs(ext - int)
    if (divergence < BLINDSPOT_DIVERGENCE_THRESHOLD) continue

    const confidence = perceived.confidence[dim] ?? 0
    const attributionCount = perceived.attributionCounts[dim] ?? 0
    const direction: 'over' | 'under' = ext > int ? 'over' : 'under'

    const entry: Blindspot = {
      dimension: dim,
      externalScore: ext,
      internalScore: int,
      divergence,
      attributionCount,
      direction,
    }

    if (direction === 'over' && confidence >= BLINDSPOT_CONFIDENCE_THRESHOLD) {
      // Les autres sont confiants sur un trait que tu sous-estimes → angle mort
      blindspots.push(entry)
    } else if (direction === 'under') {
      // Toi tu te valorises sur un trait que les autres n'ont pas (encore) capté
      hiddenGarden.push(entry)
    }
  }

  blindspots.sort((a, b) => b.divergence - a.divergence)
  hiddenGarden.sort((a, b) => b.divergence - a.divergence)

  const gapScore = computeGapScore(inner, perceived)
  const tension: PortraitDelta['tension'] = inner.sourceCount === 0 || perceived.contributorCount < 3
    ? 'unknown'
    : gapScore < CONVERGENCE_GAP_THRESHOLD
      ? 'converge'
      : 'diverge'

  return {
    userId: inner.userId,
    tension,
    gapScore,
    blindspots,
    hiddenGarden,
    strongestBlindspot: blindspots[0] ?? null,
    computedForKudosCount: perceived.contributorCount,
  }
}

/**
 * Score de divergence globale, 0..100.
 * Moyenne quadratique des divergences sur les dimensions communes.
 */
export function computeGapScore(inner: InnerPortrait, perceived: PerceivedPortrait): number {
  const divergences: number[] = []
  for (const dim of ALL_DIMENSIONS) {
    const ext = perceived.dimensions[dim]
    const int = inner.dimensions[dim]
    if (ext === undefined || int === undefined) continue
    divergences.push((ext - int) ** 2)
  }
  if (divergences.length === 0) return 0
  const rms = Math.sqrt(divergences.reduce((s, x) => s + x, 0) / divergences.length)
  return Math.round(rms * 100 * 10) / 10  // 0..100 avec 1 décimale
}

/**
 * Renvoie les dimensions communes entre les deux portraits.
 * Utile pour debug ou UI.
 */
export function commonDimensions(inner: InnerPortrait, perceived: PerceivedPortrait): DimensionSlug[] {
  return ALL_DIMENSIONS.filter(
    (d) => inner.dimensions[d] !== undefined && perceived.dimensions[d] !== undefined,
  )
}
