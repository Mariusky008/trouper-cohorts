/**
 * Algorithme de composition de tribu par DIVERSITÉ d'archétypes.
 * Voir Partie 5.2 du doc de vision : 5 caractères qui s'emboîtent — pas 5 piliers.
 *
 * Stratégie pour Phase 4 (mode 'friends_clan' d'abord) :
 *   1. Pool = users opted-in d'une ville, sans tribu active
 *   2. Group by archétype
 *   3. Tant que 5 archétypes différents ont au moins 1 user disponible
 *      → on en prend 1 de chaque → on forme une tribu
 *
 * Mode 'new_encounters' (Phase 5) : ajoutera vérification profil + densité
 * minimum + safety checks.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { ARCHETYPES, type ArchetypeId } from './archetype'

const TRIBE_SIZE = 5

export type CandidatePool = {
  city: string
  byArchetype: Map<ArchetypeId, string[]>  // archetype → [userId, ...]
  totalCandidates: number
}

/**
 * Charge le pool de candidats d'une ville :
 * users qui ont opt-in, qui ont un archétype défini, et qui ne sont
 * pas déjà dans une tribu active (forming/proposed/sealed).
 */
export async function loadCandidatePool(city: string): Promise<CandidatePool> {
  const sb = createAdminClient()

  // Users de la ville, opt-in, avec archétype
  const { data: candidates } = await sb
    .from('kudos_users')
    .select('id, archetype_id')
    .eq('city', city)
    .eq('tribe_opt_in', true)
    .not('archetype_id', 'is', null)

  // Users déjà dans une tribu non terminée → exclus
  const { data: busyMembers } = await sb
    .from('kudos_tribe_members')
    .select('user_id, tribe:kudos_tribes!inner(status)')
    .in('status', ['invited', 'accepted'])

  type BusyRow = { user_id: string; tribe: { status?: string } | { status?: string }[] | null }
  const busyIds = new Set(
    ((busyMembers ?? []) as BusyRow[])
      .filter((m) => {
        const t = Array.isArray(m.tribe) ? m.tribe[0] : m.tribe
        return t?.status && ['forming', 'proposed', 'sealed'].includes(t.status)
      })
      .map((m) => m.user_id),
  )

  const byArchetype = new Map<ArchetypeId, string[]>()
  let total = 0
  for (const c of candidates ?? []) {
    if (!c.id || !c.archetype_id) continue
    if (busyIds.has(c.id)) continue
    const archetype = c.archetype_id as ArchetypeId
    if (!byArchetype.has(archetype)) byArchetype.set(archetype, [])
    byArchetype.get(archetype)!.push(c.id)
    total += 1
  }

  return { city, byArchetype, totalCandidates: total }
}

export type ComposedTribe = {
  city: string
  members: { userId: string; archetypeId: ArchetypeId }[]
}

/**
 * Compose autant de tribus que possible depuis un pool.
 * Algorithme glouton : à chaque itération, on prend 1 user de chaque
 * archétype encore disponible, en visant 5 archétypes différents.
 */
export function composeTribesFromPool(pool: CandidatePool): ComposedTribe[] {
  const buckets = new Map<ArchetypeId, string[]>()
  for (const [k, v] of pool.byArchetype.entries()) buckets.set(k, [...v])

  const tribes: ComposedTribe[] = []

  while (true) {
    // Trier archétypes par densité (le plus rare en premier — meilleur matching)
    const available: ArchetypeId[] = ARCHETYPES
      .map((a) => a.id)
      .filter((id) => (buckets.get(id) ?? []).length > 0)
      .sort((a, b) => (buckets.get(a)!.length) - (buckets.get(b)!.length))

    if (available.length < TRIBE_SIZE) break  // pas assez d'archétypes différents

    const picks = available.slice(0, TRIBE_SIZE)
    const members = picks.map((archetypeId) => ({
      userId: buckets.get(archetypeId)!.shift()!,
      archetypeId,
    }))
    tribes.push({ city: pool.city, members })
  }

  return tribes
}

/**
 * Persiste les tribus composées dans Supabase. Crée la tribu + les membres
 * (status 'invited') + (Phase 5) génère les notifications WhatsApp.
 */
export async function persistComposedTribes(
  tribes: ComposedTribe[],
  opts: { mode: 'friends_clan' | 'new_encounters'; proposedPlace?: string; proposedDate?: string } = { mode: 'friends_clan' },
): Promise<string[]> {
  const sb = createAdminClient()
  const tribeIds: string[] = []

  for (const tribe of tribes) {
    const archetypeMix = tribe.members.map((m) => m.archetypeId)

    const { data: created, error } = await sb
      .from('kudos_tribes')
      .insert({
        mode: opts.mode,
        city: tribe.city,
        status: 'proposed',  // direct en proposed une fois les 5 trouvés
        archetype_mix: archetypeMix,
        proposed_place: opts.proposedPlace,
        proposed_date: opts.proposedDate,
      })
      .select('id')
      .single()

    if (error || !created) {
      console.error('[compose] failed to create tribe', error)
      continue
    }

    const memberRows = tribe.members.map((m) => ({
      tribe_id: created.id,
      user_id: m.userId,
      archetype_id: m.archetypeId,
      status: 'invited',
    }))

    const { error: memErr } = await sb.from('kudos_tribe_members').insert(memberRows)
    if (memErr) {
      console.error('[compose] failed to add members', memErr)
      continue
    }

    tribeIds.push(created.id)
  }

  return tribeIds
}
