import { createAdminClient } from '@/lib/supabase/admin'
import type { PublicProfile, Kudos, KudosNotification } from './types'

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = createAdminClient()

  const { data: user, error } = await supabase
    .from('kudos_users')
    .select('*')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (error || !user) return null

  const { data: user_badges } = await supabase
    .from('kudos_user_badges')
    .select('*, badge:kudos_badges_catalog(*)')
    .eq('user_id', user.id)
    .eq('is_public', true)
    .order('count', { ascending: false })
    .limit(12)

  const kudos_count = user_badges?.reduce((sum, b) => sum + b.count, 0) ?? 0
  const top_trait = user_badges?.[0]?.badge?.name ?? null

  return {
    ...user,
    user_badges: user_badges ?? [],
    kudos_count,
    top_trait,
  }
}

export async function getRecentKudos(userId: string, limit = 10): Promise<Kudos[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('kudos_kudos')
    .select('*, sender:kudos_users!sender_id(id,name,avatar_url,username), badge:kudos_badges_catalog(*)')
    .eq('receiver_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data as Kudos[]) ?? []
}

export async function getNotifications(userId: string): Promise<KudosNotification[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('kudos_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  return data ?? []
}

export async function getBadgesCatalog() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('kudos_badges_catalog')
    .select('*')
    .order('category')
  return data ?? []
}

export async function recordProfileView(profileId: string, fingerprint: string, source: string) {
  const supabase = createAdminClient()
  await supabase.from('kudos_profile_views').insert({
    profile_id: profileId,
    viewer_fingerprint: fingerprint,
    source,
  })
}
