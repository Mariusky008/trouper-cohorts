export type KudosUser = {
  id: string
  phone: string
  name: string
  username: string | null
  bio: string | null
  avatar_url: string | null
  city: string | null
  archetype: string | null
  verified: boolean
  created_at: string
}

export type BadgeCatalog = {
  id: string
  emoji: string
  name: string
  category: 'vie' | 'pro' | 'humain' | 'voisin'
  is_official: boolean
}

export type UserBadge = {
  id: string
  user_id: string
  badge_id: string
  custom_name: string | null
  custom_emoji: string | null
  count: number
  first_kudos_at: string
  last_kudos_at: string
  is_public: boolean
  badge?: BadgeCatalog
}

export type Kudos = {
  id: string
  sender_id: string
  receiver_id: string
  badge_id: string | null
  custom_badge_name: string | null
  custom_badge_emoji: string | null
  message: string | null
  relation: 'coloc' | 'collegue' | 'ami' | 'voisin' | 'autre'
  duration: '1m' | '6m' | '2a' | '2a+'
  is_public: boolean
  created_at: string
  sender?: KudosUser
  badge?: BadgeCatalog
}

export type KudosNotification = {
  id: string
  user_id: string
  type: 'kudos_received' | 'profile_viewed' | 'contact_request' | 'badge_unlocked' | 'match'
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export type PublicProfile = KudosUser & {
  user_badges: (UserBadge & { badge: BadgeCatalog })[]
  kudos_count: number
  top_trait: string | null
}

// Archétypes calculés selon les badges dominants
export const ARCHETYPES: Record<string, { label: string; emoji: string; description: string }> = {
  perle_coloc: {
    label: 'La Perle de coloc',
    emoji: '🌟',
    description: 'La colocataire idéale : bienveillante, propre et toujours à l\'écoute.',
  },
  pilier_ami: {
    label: 'Le Pilier',
    emoji: '🏛️',
    description: 'Toujours là quand ça compte. Fiable, discret et de bon conseil.',
  },
  ame_festive: {
    label: 'L\'Âme festive',
    emoji: '🎉',
    description: 'Là où tu vas, l\'ambiance suit. Généreux et communicatif.',
  },
  pro_beton: {
    label: 'Le Pro béton',
    emoji: '⚡',
    description: 'Ponctuel, organisé, de confiance. La personne qu\'on veut dans son équipe.',
  },
  ancre: {
    label: 'L\'Ancre',
    emoji: '⚓',
    description: 'Calme, stable, rassurant. Le soutien moral dont tout le monde a besoin.',
  },
}
