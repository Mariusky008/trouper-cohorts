/**
 * Types du moteur de portrait évolutif.
 * Voir Partie 3 du doc de vision : T0 (onboarding) → T1 (3 amis) → T2+ (fin de saison).
 */

export type DimensionSlug =
  | 'chaleur_vs_distance'
  | 'discretion_vs_visibilite'
  | 'profondeur_vs_brillance'
  | 'regularite_vs_intensite'
  | 'leadership'
  | 'self_image'

export const ALL_DIMENSIONS: DimensionSlug[] = [
  'chaleur_vs_distance',
  'discretion_vs_visibilite',
  'profondeur_vs_brillance',
  'regularite_vs_intensite',
  'leadership',
  'self_image',
]

/** Comment l'utilisateur se voit lui-même (onboarding + votes Arène). */
export type InnerPortrait = {
  userId: string
  dimensions: Partial<Record<DimensionSlug, number>>  // 0..1 — pole_low → pole_high
  topTraits: { emoji: string; label: string }[]
  sourceCount: number  // nb d'inputs : réponses d'onboarding + votes
}

/** Comment les autres perçoivent l'utilisateur (kudos reçus + réponses Feed). */
export type PerceivedPortrait = {
  userId: string
  dimensions: Partial<Record<DimensionSlug, number>>
  confidence: Partial<Record<DimensionSlug, number>>      // 0..1
  attributionCounts: Partial<Record<DimensionSlug, number>>
  topBadges: { emoji: string; name: string; count: number }[]
  byCircle: Partial<Record<'coloc' | 'collegue' | 'ami' | 'voisin' | 'autre', Partial<Record<DimensionSlug, number>>>>
  contributorCount: number
}

/** Le delta entre les deux miroirs — cœur de la valeur. */
export type Blindspot = {
  dimension: DimensionSlug
  externalScore: number   // ce que les autres voient
  internalScore: number   // ce que l'user pense
  divergence: number      // |ext - int|
  attributionCount: number
  direction: 'over' | 'under'  // over: les autres te voient PLUS que tu te vois
}

export type PortraitDelta = {
  userId: string
  tension: 'converge' | 'diverge' | 'unknown'
  gapScore: number               // 0 = convergence parfaite, 100 = divergence totale
  blindspots: Blindspot[]
  hiddenGarden: Blindspot[]      // traits que l'user valorise mais que les autres n'ont pas captés
  strongestBlindspot: Blindspot | null
  computedForKudosCount: number
}
