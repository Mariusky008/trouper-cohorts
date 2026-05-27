'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicProfile } from '@/lib/kudos/types'

const TRAIT_BARS = [
  { label: '❤️ Bienveillance', pct: 95, color: '#EC4899', badgeName: 'Bienveillante' },
  { label: '✨ Propreté', pct: 88, color: '#8B5CF6', badgeName: 'Propre' },
  { label: '👂 Écoute', pct: 82, color: '#3B82F6', badgeName: 'À l\'écoute' },
  { label: '😄 Bonne humeur', pct: 64, color: '#F59E0B', badgeName: 'Bonne humeur' },
]

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 30) return 'ce mois'
  if (days < 365) return `${Math.floor(days / 30)} mois`
  const years = Math.floor(days / 365)
  return years === 1 ? '1 an' : `${years} ans`
}

function BadgePill({ ub, isNew }: { ub: any; isNew?: boolean }) {
  const since = timeSince(ub.first_kudos_at)
  const isRecent = since === 'ce mois'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: isNew ? 'linear-gradient(135deg,#EEF2FF,#F5F3FF)' : '#F8FAFF',
      border: isNew ? '1px solid rgba(139,92,246,.25)' : '1px solid rgba(0,0,0,.06)',
      borderRadius: 100, padding: '8px 14px', cursor: 'pointer',
      transition: 'all .18s',
      boxShadow: isNew ? '0 2px 12px rgba(139,92,246,.12)' : 'none',
    }}>
      <span style={{ fontSize: 16 }}>{ub.badge?.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{ub.badge?.name ?? ub.custom_name}</span>
      <span style={{
        fontSize: 11, fontWeight: 800, color: isRecent ? '#22C55E' : '#64748B',
        background: isRecent ? 'rgba(34,197,94,.1)' : 'rgba(0,0,0,.06)',
        borderRadius: 20, padding: '1px 7px',
      }}>
        {ub.count} · {since}
      </span>
    </div>
  )
}

type Props = { profile: PublicProfile & { user_badges: any[] }; isDemo?: boolean }

export function KudosPublicProfile({ profile, isDemo }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const isMyProfile = false // TODO: comparer avec session auth

  function handleCopyLink() {
    navigator.clipboard?.writeText(`https://kudos.app/${profile.username}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F7F8FC',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: 180, flexShrink: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg,#0F172A 0%,#1e3a5f 55%,#2563EB 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to bottom, transparent, #F7F8FC)',
        }} />
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 48, left: 16, background: 'rgba(255,255,255,.18)',
            border: '1px solid rgba(255,255,255,.25)', borderRadius: 12,
            padding: '8px 14px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Retour
        </button>
        {/* Options */}
        <button
          onClick={handleCopyLink}
          style={{
            position: 'absolute', top: 48, right: 16, background: 'rgba(255,255,255,.18)',
            border: '1px solid rgba(255,255,255,.25)', borderRadius: 12,
            padding: '8px 14px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {copied ? '✓ Copié' : '🔗 Partager'}
        </button>
      </div>

      {/* Reputation Card */}
      <div style={{
        margin: '-48px 16px 12px', background: '#fff', borderRadius: 24,
        padding: '52px 16px 18px', boxShadow: '0 4px 32px rgba(0,0,0,.09)',
        position: 'relative', textAlign: 'center',
      }}>
        {/* Avatar */}
        <div style={{
          position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
        }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={profile.avatar_url ?? `https://ui-avatars.com/api/?name=${profile.name}&background=2563EB&color=fff`}
              alt={profile.name}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}
            />
            {profile.verified && (
              <div style={{
                position: 'absolute', bottom: 0, right: -2, width: 20, height: 20,
                background: '#4F7DF3', borderRadius: '50%', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#fff', fontWeight: 800,
              }}>✓</div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
          {profile.name}
        </div>
        {profile.archetype && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6', marginBottom: 8 }}>
            {profile.archetype}
          </div>
        )}

        {/* Compteur évaluations */}
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#0F172A' }}>{profile.kudos_count}</span>
          <span style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>évaluations</span>
        </div>
        {profile.city && (
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
            📍 {profile.city} · Top 5% Montpellier
          </div>
        )}

        {/* Citation identité */}
        <div style={{
          fontSize: 12, color: '#64748B', fontStyle: 'italic', lineHeight: 1.6,
          padding: '10px 13px', background: '#F7F8FC', borderRadius: 14,
          marginBottom: 14, textAlign: 'left', borderLeft: '3px solid #8B5CF6',
        }}>
          &ldquo;La colocataire idéale : bienveillante, propre et toujours à l&apos;écoute.&rdquo;
        </div>

        {/* Barres de traits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, textAlign: 'left' }}>
          {TRAIT_BARS.map((t) => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A', width: 100, flexShrink: 0 }}>
                {t.label}
              </span>
              <div style={{ flex: 1, height: 5, background: '#EEF2F8', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${t.pct}%`, background: t.color,
                  borderRadius: 3, transition: 'width 1s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', width: 26, textAlign: 'right' }}>
                {t.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => router.push(`/kudos/${profile.username}/envoyer`)}
          style={{
            width: '100%', padding: '16px', borderRadius: 20,
            background: 'linear-gradient(180deg,rgba(255,255,255,.38) 0%,rgba(255,255,255,.14) 55%,rgba(240,245,255,.08) 100%)',
            backdropFilter: 'blur(28px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
            border: '1px solid rgba(255,255,255,.7)',
            boxShadow: '0 6px 24px rgba(0,0,0,.09),inset 0 1px 0 rgba(255,255,255,.95)',
            fontSize: 15, fontWeight: 800, color: '#0F172A', cursor: 'pointer',
          }}
        >
          ✨ Envoyer un Kudos à {profile.name.split(' ')[0]}
        </button>

        <button
          onClick={() => {}}
          style={{
            width: '100%', padding: '13px', borderRadius: 20,
            background: 'transparent', border: '1.5px solid rgba(15,23,42,.12)',
            fontSize: 14, fontWeight: 700, color: '#64748B', cursor: 'pointer',
          }}
        >
          📤 Demander un avis sur moi
        </button>
      </div>

      {/* Section badges */}
      <div style={{ padding: '0 16px', marginBottom: 100 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Mes Kudos</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>{profile.user_badges.length} badges</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {profile.user_badges.map((ub, i) => (
            <BadgePill key={ub.id} ub={ub} isNew={i === 0} />
          ))}
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', borderRadius: 100,
          padding: '10px 20px', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,.3)', whiteSpace: 'nowrap', zIndex: 100,
        }}>
          Mode démo · <button onClick={() => router.push('/kudos')} style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', fontWeight: 700, padding: 0, fontSize: 13 }}>Rejoindre →</button>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        button { font-family: inherit; }
      `}</style>
    </div>
  )
}
