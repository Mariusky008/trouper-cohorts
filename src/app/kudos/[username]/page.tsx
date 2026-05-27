import { notFound } from 'next/navigation'
import { getPublicProfile } from '@/lib/kudos/queries'
import { KudosPublicProfile } from '../_components/KudosPublicProfile'

// Profil démo statique (pas encore en DB)
const DEMO_PROFILE = {
  id: 'demo',
  phone: '',
  name: 'Chloé M.',
  username: 'chloe',
  bio: null,
  avatar_url: 'https://i.pravatar.cc/160?img=47',
  city: 'Montpellier',
  archetype: '🌟 La Perle de coloc',
  verified: true,
  created_at: '2024-01-15',
  kudos_count: 22,
  top_trait: 'Bienveillante',
  user_badges: [
    { id: '1', user_id: 'demo', badge_id: 'b1', custom_name: null, custom_emoji: null, count: 22, first_kudos_at: '2024-01-15', last_kudos_at: '2026-05-17', is_public: true, badge: { id: 'b1', emoji: '✨', name: 'Propre', category: 'vie' as const, is_official: true } },
    { id: '2', user_id: 'demo', badge_id: 'b2', custom_name: null, custom_emoji: null, count: 20, first_kudos_at: '2024-01-15', last_kudos_at: '2026-05-17', is_public: true, badge: { id: 'b2', emoji: '❤️', name: 'Bienveillante', category: 'humain' as const, is_official: true } },
    { id: '3', user_id: 'demo', badge_id: 'b3', custom_name: null, custom_emoji: null, count: 18, first_kudos_at: '2024-01-15', last_kudos_at: '2025-03-12', is_public: true, badge: { id: 'b3', emoji: '👂', name: 'À l\'écoute', category: 'humain' as const, is_official: true } },
    { id: '4', user_id: 'demo', badge_id: 'b4', custom_name: null, custom_emoji: null, count: 14, first_kudos_at: '2024-06-01', last_kudos_at: '2026-04-20', is_public: true, badge: { id: 'b4', emoji: '😄', name: 'Bonne humeur', category: 'humain' as const, is_official: true } },
    { id: '5', user_id: 'demo', badge_id: 'b5', custom_name: null, custom_emoji: null, count: 9, first_kudos_at: '2024-09-01', last_kudos_at: '2026-02-10', is_public: true, badge: { id: 'b5', emoji: '🔑', name: 'De confiance', category: 'pro' as const, is_official: true } },
    { id: '6', user_id: 'demo', badge_id: 'b6', custom_name: null, custom_emoji: null, count: 7, first_kudos_at: '2025-01-01', last_kudos_at: '2026-01-05', is_public: true, badge: { id: 'b6', emoji: '🏡', name: 'Bon voisin', category: 'voisin' as const, is_official: true } },
  ],
}

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  if (username === 'chloe') {
    return { title: 'Chloé M. — Profil Kudos', description: '🌟 La Perle de coloc · 22 évaluations' }
  }
  const profile = await getPublicProfile(username)
  if (!profile) return { title: 'Profil introuvable' }
  return {
    title: `${profile.name} — Profil Kudos`,
    description: `${profile.archetype ?? ''} · ${profile.kudos_count} évaluations`,
  }
}

export default async function KudosProfilePage({ params }: Props) {
  const { username } = await params

  if (username === 'chloe') {
    return <KudosPublicProfile profile={DEMO_PROFILE as any} isDemo />
  }

  const profile = await getPublicProfile(username)
  if (!profile) notFound()

  return <KudosPublicProfile profile={profile} />
}
