/**
 * Calcul de l'archétype d'un utilisateur depuis son portrait.
 *
 * Voir Partie 5.2 du doc de vision : la Tribu se compose par
 * complémentarité d'archétypes — JAMAIS par % de compatibilité prédictif.
 *
 * Chaque archétype est défini par un "profil cible" sur les dimensions.
 * L'archétype assigné = celui dont le profil est le plus proche
 * du portrait MIXTE de l'user (mi-intérieur, mi-perçu).
 */

import type { DimensionSlug, InnerPortrait, PerceivedPortrait } from '../portrait/types'
import { ALL_DIMENSIONS } from '../portrait/types'

export type ArchetypeId = 'pilier' | 'createur' | 'audacieux' | 'analyste' | 'liant' | 'sage'

export type Archetype = {
  id: ArchetypeId
  emoji: string
  label: string
  role: string
  /** Profil cible : score 0..1 sur chaque dimension. Si dimension absente → ignorée. */
  profile: Partial<Record<DimensionSlug, number>>
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'pilier',
    emoji: '⚓',
    label: 'Le Pilier',
    role: 'stabilise le groupe',
    profile: {
      regularite_vs_intensite: 0.15,   // très régulier
      leadership: 0.55,
      chaleur_vs_distance: 0.55,
      self_image: 0.7,
    },
  },
  {
    id: 'createur',
    emoji: '🎨',
    label: 'Le Créateur',
    role: 'apporte les idées',
    profile: {
      profondeur_vs_brillance: 0.75,   // brillant, idées
      discretion_vs_visibilite: 0.65,
      leadership: 0.5,
    },
  },
  {
    id: 'audacieux',
    emoji: '🔥',
    label: "L'Audacieux",
    role: 'ose, lance les choses',
    profile: {
      discretion_vs_visibilite: 0.9,
      regularite_vs_intensite: 0.85,   // intense
      leadership: 0.85,
      self_image: 0.85,
    },
  },
  {
    id: 'analyste',
    emoji: '🔍',
    label: "L'Analyste",
    role: 'pose les bonnes questions',
    profile: {
      profondeur_vs_brillance: 0.15,   // profond
      discretion_vs_visibilite: 0.25,
      leadership: 0.45,
    },
  },
  {
    id: 'liant',
    emoji: '🤝',
    label: 'Le Liant',
    role: 'crée du lien entre tous',
    profile: {
      chaleur_vs_distance: 0.9,
      discretion_vs_visibilite: 0.6,
      leadership: 0.4,
    },
  },
  {
    id: 'sage',
    emoji: '🧭',
    label: 'Le Sage',
    role: 'apporte le recul',
    profile: {
      profondeur_vs_brillance: 0.2,    // profond
      regularite_vs_intensite: 0.25,   // posé
      leadership: 0.4,
      self_image: 0.55,
    },
  },
]

export function getArchetype(id: ArchetypeId): Archetype {
  const a = ARCHETYPES.find((x) => x.id === id)
  if (!a) throw new Error(`Unknown archetype: ${id}`)
  return a
}

/**
 * Fusionne le portrait intérieur et extérieur en un portrait "mixte".
 * Quand on a les deux → moyenne pondérée 50/50.
 * Quand on n'a que l'un → on prend ce qu'on a.
 */
function blendDimensions(
  inner: InnerPortrait,
  perceived: PerceivedPortrait,
): Partial<Record<DimensionSlug, number>> {
  const out: Partial<Record<DimensionSlug, number>> = {}
  for (const dim of ALL_DIMENSIONS) {
    const i = inner.dimensions[dim]
    const e = perceived.dimensions[dim]
    if (i !== undefined && e !== undefined) {
      // 60% perçu, 40% intérieur — les autres ont souvent un signal plus fiable
      out[dim] = 0.6 * e + 0.4 * i
    } else if (i !== undefined) {
      out[dim] = i
    } else if (e !== undefined) {
      out[dim] = e
    }
  }
  return out
}

/**
 * Distance euclidienne entre un portrait et un profil d'archétype.
 * Ne compare que les dimensions définies dans le profil cible.
 */
function archetypeDistance(
  portrait: Partial<Record<DimensionSlug, number>>,
  archetype: Archetype,
): number {
  let sumSq = 0
  let count = 0
  for (const [dim, target] of Object.entries(archetype.profile) as [DimensionSlug, number][]) {
    const actual = portrait[dim]
    if (actual === undefined) continue
    sumSq += (actual - target) ** 2
    count += 1
  }
  if (count === 0) return Number.POSITIVE_INFINITY
  return Math.sqrt(sumSq / count)
}

/**
 * Calcule l'archétype principal + un score de confiance + un top-3.
 */
export type ArchetypeAssignment = {
  primary: ArchetypeId
  confidence: number    // 0..1 — proximité au profil cible
  ranking: { id: ArchetypeId; distance: number }[]
}

export function computeArchetype(
  inner: InnerPortrait,
  perceived: PerceivedPortrait,
): ArchetypeAssignment {
  const portrait = blendDimensions(inner, perceived)
  const ranking = ARCHETYPES
    .map((a) => ({ id: a.id, distance: archetypeDistance(portrait, a) }))
    .sort((a, b) => a.distance - b.distance)

  const primary = ranking[0].id
  // Confidence : 1 si distance proche de 0, décroît avec la distance
  const bestDist = ranking[0].distance
  const confidence = Number.isFinite(bestDist) ? Math.max(0, 1 - bestDist) : 0

  return { primary, confidence, ranking: ranking.slice(0, 3) }
}
