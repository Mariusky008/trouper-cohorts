/**
 * Cycle de vie d'une tribu :
 *   proposed → membres répondent (accept/decline)
 *   → si tous accepted → sealed
 *   → si decline → chercher un remplaçant du même archétype
 *   → après le café → met (Phase 5 : feedback)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { ArchetypeId } from './archetype'

export type RespondAction = 'accept' | 'decline'

/**
 * L'utilisateur répond à son invitation.
 */
export async function respondToTribeInvitation(opts: {
  tribeId: string
  userId: string
  action: RespondAction
}): Promise<{ sealed: boolean; replacementSought: boolean }> {
  const sb = createAdminClient()

  const newStatus = opts.action === 'accept' ? 'accepted' : 'declined'
  const { error } = await sb
    .from('kudos_tribe_members')
    .update({ status: newStatus, responded_at: new Date().toISOString() })
    .eq('tribe_id', opts.tribeId)
    .eq('user_id', opts.userId)

  if (error) throw error

  if (opts.action === 'decline') {
    const replaced = await seekReplacement(opts.tribeId, opts.userId)
    return { sealed: false, replacementSought: replaced }
  }

  // accept → vérifier si tout le monde a accepté
  const { data: members } = await sb
    .from('kudos_tribe_members')
    .select('status')
    .eq('tribe_id', opts.tribeId)

  const allAccepted = (members ?? []).length === 5 && members!.every((m) => m.status === 'accepted')
  if (allAccepted) {
    await sb.from('kudos_tribes')
      .update({ status: 'sealed', sealed_at: new Date().toISOString() })
      .eq('id', opts.tribeId)
    return { sealed: true, replacementSought: false }
  }

  return { sealed: false, replacementSought: false }
}

/**
 * Cherche un remplaçant pour un membre qui a décliné.
 * Critères : même archétype, même ville, opted-in, pas dans une autre tribu active.
 */
async function seekReplacement(tribeId: string, declinerId: string): Promise<boolean> {
  const sb = createAdminClient()

  // Récupère le contexte : ville + archétype du décliné
  const { data: tribe } = await sb
    .from('kudos_tribes')
    .select('city')
    .eq('id', tribeId)
    .single()

  const { data: declinerMember } = await sb
    .from('kudos_tribe_members')
    .select('archetype_id')
    .eq('tribe_id', tribeId)
    .eq('user_id', declinerId)
    .single()

  if (!tribe || !declinerMember) return false

  // Pool de candidats du même archétype dans la même ville
  const { data: candidates } = await sb
    .from('kudos_users')
    .select('id')
    .eq('city', tribe.city)
    .eq('tribe_opt_in', true)
    .eq('archetype_id', declinerMember.archetype_id)

  if (!candidates || candidates.length === 0) return false

  // Exclure ceux déjà dans une tribu active
  const { data: busy } = await sb
    .from('kudos_tribe_members')
    .select('user_id, tribe:kudos_tribes!inner(status)')
    .in('status', ['invited', 'accepted'])

  type BusyRow = { user_id: string; tribe: { status?: string } | { status?: string }[] | null }
  const busyIds = new Set(
    ((busy ?? []) as BusyRow[])
      .filter((m) => {
        const t = Array.isArray(m.tribe) ? m.tribe[0] : m.tribe
        return t?.status && ['forming', 'proposed', 'sealed'].includes(t.status)
      })
      .map((m) => m.user_id),
  )

  const replacement = candidates.find((c) => c.id && !busyIds.has(c.id))
  if (!replacement) return false

  await sb.from('kudos_tribe_members').insert({
    tribe_id: tribeId,
    user_id: replacement.id,
    archetype_id: declinerMember.archetype_id as ArchetypeId,
    status: 'invited',
  })

  return true
}

/**
 * Récupère l'état complet d'une tribu pour affichage UI.
 */
export async function getTribeForUser(userId: string) {
  const sb = createAdminClient()

  const { data: membership } = await sb
    .from('kudos_tribe_members')
    .select(`
      status,
      archetype_id,
      tribe:kudos_tribes!inner(
        id, mode, city, status, archetype_mix, proposed_date, proposed_place, sealed_at
      )
    `)
    .eq('user_id', userId)
    .in('status', ['invited', 'accepted'])
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership) return null

  type Membership = {
    status: string
    archetype_id: string
    tribe: {
      id: string
      mode: string
      city: string
      status: string
      archetype_mix: ArchetypeId[]
      proposed_date: string | null
      proposed_place: string | null
      sealed_at: string | null
    } | {
      id: string
      mode: string
      city: string
      status: string
      archetype_mix: ArchetypeId[]
      proposed_date: string | null
      proposed_place: string | null
      sealed_at: string | null
    }[]
  }

  const m = membership as Membership
  const tribe = Array.isArray(m.tribe) ? m.tribe[0] : m.tribe
  if (!tribe) return null

  // Si scellée → on révèle les autres membres
  let members: Array<{ userId: string; archetypeId: ArchetypeId; name: string | null; avatarUrl: string | null }> = []
  if (tribe.status === 'sealed') {
    const { data: memberRows } = await sb
      .from('kudos_tribe_members')
      .select(`
        user_id, archetype_id,
        user:kudos_users!user_id(name, avatar_url)
      `)
      .eq('tribe_id', tribe.id)
      .eq('status', 'accepted')

    type MemberRow = {
      user_id: string
      archetype_id: ArchetypeId
      user: { name?: string; avatar_url?: string } | { name?: string; avatar_url?: string }[] | null
    }

    members = ((memberRows ?? []) as MemberRow[]).map((r) => {
      const u = Array.isArray(r.user) ? r.user[0] : r.user
      return {
        userId: r.user_id,
        archetypeId: r.archetype_id,
        name: u?.name ?? null,
        avatarUrl: u?.avatar_url ?? null,
      }
    })
  }

  return {
    tribeId: tribe.id,
    status: tribe.status as 'forming' | 'proposed' | 'sealed' | 'met',
    mode: tribe.mode,
    city: tribe.city,
    myArchetype: m.archetype_id as ArchetypeId,
    myStatus: m.status,
    archetypeMix: tribe.archetype_mix,
    proposedDate: tribe.proposed_date,
    proposedPlace: tribe.proposed_place,
    sealedAt: tribe.sealed_at,
    members,
  }
}
