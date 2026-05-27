/**
 * Génération des 3 livrables IA + garde-fous + persistence.
 *
 * Appelle OpenAI 3 fois (en parallèle) avec les prompts du doc Partie 4.
 * Valide l'Avatar Hybride contre la blacklist — RÉGÉNÈRE si rejet (max 3 essais).
 */

import OpenAI from 'openai'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAvatarTitle } from '../avatar-guardrail'
import { aggregateInner, aggregatePerceived } from '../portrait/aggregate'
import { computeDelta } from '../portrait/delta'
import {
  buildAngleMortPrompt,
  buildAvatarHybridePrompt,
  buildDefiLienPrompt,
  type LivrableContext,
} from './prompts'
import type {
  GeneratedLivrables,
  LivrableAngleMort,
  LivrableAvatarHybride,
  LivrableDefiLien,
} from './types'

const MODEL = 'gpt-4o-mini'
const AVATAR_MAX_RETRIES = 3

function client(): OpenAI {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY missing')
  return new OpenAI({ apiKey: key })
}

// ─────────────────────────────────────────────────────────────
// Helpers IA
// ─────────────────────────────────────────────────────────────
async function callJSON<T>(system: string, user: string): Promise<T> {
  const oai = client()
  const res = await oai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })
  const content = res.choices[0]?.message?.content
  if (!content) throw new Error('IA returned empty content')
  return JSON.parse(content) as T
}

// ─────────────────────────────────────────────────────────────
// Génération des 3 livrables
// ─────────────────────────────────────────────────────────────
async function generateAngleMort(ctx: LivrableContext): Promise<LivrableAngleMort> {
  const { system, user } = buildAngleMortPrompt(ctx)
  return callJSON<LivrableAngleMort>(system, user)
}

async function generateAvatarHybride(ctx: LivrableContext): Promise<LivrableAvatarHybride> {
  const { system, user } = buildAvatarHybridePrompt(ctx)

  // Boucle de validation : si le titre contient un mot interdit, on régénère.
  for (let attempt = 0; attempt < AVATAR_MAX_RETRIES; attempt++) {
    const result = await callJSON<LivrableAvatarHybride>(system, user)
    const validation = validateAvatarTitle(result.title)
    if (validation.ok) return result
    console.warn(`[avatar] rejected attempt ${attempt + 1}:`, validation, 'title:', result.title)
  }

  // Fallback safe — n'arrive jamais avec un prompt bien fait, mais on garantit qu'on ne crashe pas.
  return {
    rarity: 'Rare',
    emoji: '✨',
    title: "L'Être Singulier",
    stats: [
      { label: 'Authenticité', value: 88 },
      { label: 'Présence rare', value: 82 },
    ],
    tagline: 'Tu es plus que ce que tu montres.',
  }
}

async function generateDefiLien(ctx: LivrableContext): Promise<LivrableDefiLien> {
  const { system, user } = buildDefiLienPrompt(ctx)
  return callJSON<LivrableDefiLien>(system, user)
}

// ─────────────────────────────────────────────────────────────
// Orchestrateur principal
// ─────────────────────────────────────────────────────────────
export async function generateAllLivrables(ctx: LivrableContext): Promise<GeneratedLivrables> {
  const [angleMort, avatarHybride, defiLien] = await Promise.all([
    generateAngleMort(ctx),
    generateAvatarHybride(ctx),
    generateDefiLien(ctx),
  ])
  return { angleMort, avatarHybride, defiLien }
}

// ─────────────────────────────────────────────────────────────
// Entry point haute-niveau : charge le contexte + génère + persiste
// ─────────────────────────────────────────────────────────────
export async function generateAndSaveLivrables(opts: {
  userId: string
  seasonId: string
}): Promise<GeneratedLivrables> {
  const sb = createAdminClient()

  const { data: userRow } = await sb
    .from('kudos_users')
    .select('name')
    .eq('id', opts.userId)
    .maybeSingle()
  if (!userRow) throw new Error(`user ${opts.userId} not found`)

  const [inner, perceived] = await Promise.all([
    aggregateInner(opts.userId),
    aggregatePerceived(opts.userId),
  ])
  const delta = computeDelta(inner, perceived)

  // Choix d'une cible pour le défi : le top contact qui apparaît dans les kudos envoyés par l'user
  const { data: targetCandidate } = await sb
    .from('kudos_kudos')
    .select(`
      receiver_id, badge:kudos_badges_catalog(name),
      receiver:kudos_users!receiver_id(name)
    `)
    .eq('sender_id', opts.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  type TargetRow = {
    receiver: { name?: string } | { name?: string }[] | null
    badge: { name?: string } | { name?: string }[] | null
  } | null

  const tc = targetCandidate as TargetRow
  const targetUser = tc ? (Array.isArray(tc.receiver) ? tc.receiver[0] : tc.receiver) : null
  const targetBadge = tc ? (Array.isArray(tc.badge) ? tc.badge[0] : tc.badge) : null

  const ctx: LivrableContext = {
    userName: userRow.name ?? 'toi',
    inner,
    perceived,
    delta,
    targetFriend: targetUser?.name
      ? { name: targetUser.name, positiveSignal: targetBadge?.name ?? 'une qualité que tu lui as déjà reconnue' }
      : undefined,
  }

  const generated = await generateAllLivrables(ctx)

  // Persistence
  await sb.from('kudos_season_deliverables').upsert({
    season_id: opts.seasonId,
    user_id: opts.userId,
    angle_mort_sans_savoir: generated.angleMort.blockSansLeSavoir,
    angle_mort_situations: generated.angleMort.troisSituations,
    avatar_rarity: generated.avatarHybride.rarity,
    avatar_emoji: generated.avatarHybride.emoji,
    avatar_title: generated.avatarHybride.title,
    avatar_stats: generated.avatarHybride.stats,
    avatar_tagline: generated.avatarHybride.tagline,
    defi_mission_text: generated.defiLien.missionText,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'season_id' })

  return generated
}
