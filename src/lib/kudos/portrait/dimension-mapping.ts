/**
 * Mapping badge → dimension de valeur.
 *
 * Quand un user reçoit un kudos avec le badge "Bienveillant", ça incrémente
 * sa dimension chaleur_vs_distance vers le pôle "chaleur" (score haut).
 *
 * Chaque badge tire la dimension vers un pôle (0 = bas, 1 = haut).
 * weight = à quel point ce badge est un signal fort pour cette dimension.
 */

import type { DimensionSlug } from './types'

type BadgeSignal = {
  dimension: DimensionSlug
  targetScore: number  // 0..1 — le pôle vers lequel ce badge tire
  weight: number       // 0..1 — la force du signal
}

/**
 * Clé : nom du badge en minuscules (normalisé, sans accents).
 * Source : kudos_badges_catalog (voir migration 20260517140000).
 */
export const BADGE_TO_SIGNALS: Record<string, BadgeSignal[]> = {
  // ── HUMAIN ──────────────────────────────────────────────────
  'bienveillant': [
    { dimension: 'chaleur_vs_distance', targetScore: 0.85, weight: 0.8 },
  ],
  'a l\'ecoute': [
    { dimension: 'chaleur_vs_distance', targetScore: 0.75, weight: 0.7 },
    { dimension: 'profondeur_vs_brillance', targetScore: 0.2, weight: 0.5 },
  ],
  'de bons conseils': [
    { dimension: 'leadership', targetScore: 0.7, weight: 0.6 },
    { dimension: 'profondeur_vs_brillance', targetScore: 0.3, weight: 0.4 },
  ],
  'soutien moral': [
    { dimension: 'chaleur_vs_distance', targetScore: 0.85, weight: 0.7 },
    { dimension: 'regularite_vs_intensite', targetScore: 0.3, weight: 0.5 },
  ],
  'festif': [
    { dimension: 'discretion_vs_visibilite', targetScore: 0.9, weight: 0.8 },
    { dimension: 'profondeur_vs_brillance', targetScore: 0.8, weight: 0.6 },
  ],
  'calme': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.15, weight: 0.8 },
    { dimension: 'chaleur_vs_distance', targetScore: 0.4, weight: 0.3 },
  ],

  // ── VIE QUOTIDIENNE ─────────────────────────────────────────
  'propre': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.25, weight: 0.4 },
  ],
  'fiable': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.2, weight: 0.7 },
    { dimension: 'leadership', targetScore: 0.55, weight: 0.3 },
  ],
  'bonne humeur': [
    { dimension: 'discretion_vs_visibilite', targetScore: 0.75, weight: 0.5 },
    { dimension: 'chaleur_vs_distance', targetScore: 0.8, weight: 0.5 },
  ],
  'discret': [
    { dimension: 'discretion_vs_visibilite', targetScore: 0.1, weight: 0.9 },
  ],

  // ── VOISIN ──────────────────────────────────────────────────
  'bon voisin': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.3, weight: 0.5 },
    { dimension: 'chaleur_vs_distance', targetScore: 0.65, weight: 0.4 },
  ],
  'respectueux animaux': [
    { dimension: 'chaleur_vs_distance', targetScore: 0.7, weight: 0.3 },
  ],

  // ── PRO ─────────────────────────────────────────────────────
  'ponctuel': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.15, weight: 0.7 },
  ],
  'organise': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.2, weight: 0.7 },
    { dimension: 'leadership', targetScore: 0.65, weight: 0.4 },
  ],
  'discret pro': [
    { dimension: 'discretion_vs_visibilite', targetScore: 0.15, weight: 0.7 },
  ],
  'livraison soignee': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.25, weight: 0.5 },
  ],
  'bonne communication': [
    { dimension: 'chaleur_vs_distance', targetScore: 0.7, weight: 0.5 },
    { dimension: 'discretion_vs_visibilite', targetScore: 0.65, weight: 0.4 },
  ],
  'de confiance': [
    { dimension: 'regularite_vs_intensite', targetScore: 0.25, weight: 0.6 },
    { dimension: 'leadership', targetScore: 0.55, weight: 0.3 },
  ],
}

/** Normalise un nom de badge pour la lookup. */
export function normalizeBadgeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

export function getBadgeSignals(badgeName: string): BadgeSignal[] {
  return BADGE_TO_SIGNALS[normalizeBadgeName(badgeName)] ?? []
}
