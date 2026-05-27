'use client'

import { useRouter } from 'next/navigation'

type NavItem = {
  id: string
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'profil',
    label: 'Profil',
    href: '/kudos/profil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id: 'activite',
    label: 'Activité',
    href: '/kudos/activite',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'contacts',
    label: 'Contacts',
    href: '/kudos/contacts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'explorer',
    label: 'Explorer',
    href: '/kudos/explorer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: 'tribu',
    label: 'Tribu',
    href: '/kudos/tribu',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

type Props = { active: string; theme?: 'light' | 'dark' }

export function KudosBottomNav({ active, theme = 'light' }: Props) {
  const isDark = theme === 'dark'
  const router = useRouter()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: isDark
        ? 'rgba(8,8,12,.92)'
        : 'linear-gradient(180deg,rgba(255,255,255,.28) 0%,rgba(240,246,255,.18) 100%)',
      backdropFilter: 'blur(48px) saturate(2.2) brightness(1.06)',
      WebkitBackdropFilter: 'blur(48px) saturate(2.2) brightness(1.06)',
      borderTop: isDark ? '0.5px solid rgba(255,255,255,.08)' : '1.5px solid rgba(255,255,255,.65)',
      boxShadow: isDark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,.85), 0 -8px 32px rgba(180,210,255,.2)',
      display: 'flex',
      padding: '10px 6px 28px',
      overflow: 'hidden',
    }}>
      {/* Shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '32%', height: '100%',
        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)',
        animation: 'glassShimmer 6s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '7px 4px', borderRadius: 18, border: 'none', cursor: 'pointer',
              position: 'relative', zIndex: 1,
              background: isActive
                ? isDark
                  ? 'rgba(139,92,246,.18)'
                  : 'linear-gradient(180deg,rgba(255,255,255,.82) 0%,rgba(255,255,255,.52) 100%)'
                : 'transparent',
              color: isActive
                ? isDark ? '#C0DD97' : 'rgba(10,18,50,.95)'
                : isDark ? 'rgba(255,255,255,.28)' : 'rgba(15,25,60,.44)',
              boxShadow: isActive && !isDark
                ? '0 2px 16px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.95)'
                : 'none',
              transition: 'all .24s cubic-bezier(.34,1.4,.64,1)',
              fontFamily: 'inherit',
            }}
          >
            <div style={{
              width: 23, height: 23,
              stroke: 'currentColor',
              strokeWidth: 1.8,
            }}>
              {item.icon}
            </div>
            <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
          </button>
        )
      })}

      <style>{`
        @keyframes glassShimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(320%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  )
}
