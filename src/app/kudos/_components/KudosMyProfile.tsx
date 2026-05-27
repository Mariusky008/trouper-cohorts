'use client'

import { useState } from 'react'
import { KudosBottomNav } from './KudosBottomNav'

const MY_PROFILE = {
  name: 'Chloé M.',
  username: 'chloe',
  avatar_url: 'https://i.pravatar.cc/160?img=47',
  city: 'Montpellier',
  archetype: '🌟 La Perle de coloc',
  verified: true,
  kudos_count: 22,
  identity_quote: 'La colocataire idéale : bienveillante, propre et toujours à l\'écoute.',
}

const MY_BADGES = [
  { id: '1', emoji: '✨', name: 'Propre', count: 22, since: 'ce mois', color: '#8B5CF6', isNew: true, first_kudos_at: '2026-04-20' },
  { id: '2', emoji: '❤️', name: 'Bienveillante', count: 20, since: '2 ans', color: '#EC4899', isNew: false, first_kudos_at: '2024-01-15' },
  { id: '3', emoji: '👂', name: 'À l\'écoute', count: 18, since: '1 an', color: '#3B82F6', isNew: false, first_kudos_at: '2025-03-01' },
  { id: '4', emoji: '😄', name: 'Bonne humeur', count: 14, since: '6 mois', color: '#F59E0B', isNew: false, first_kudos_at: '2025-11-01' },
  { id: '5', emoji: '🔑', name: 'De confiance', count: 9, since: '1 an', color: '#10B981', isNew: false, first_kudos_at: '2025-03-10' },
  { id: '6', emoji: '🏡', name: 'Bon voisin', count: 7, since: '5 mois', color: '#6366F1', isNew: false, first_kudos_at: '2025-12-05' },
]

const TRAIT_BARS = [
  { label: '❤️ Bienveillance', pct: 95, color: '#EC4899' },
  { label: '✨ Propreté', pct: 88, color: '#8B5CF6' },
  { label: '👂 Écoute', pct: 82, color: '#3B82F6' },
  { label: '😄 Bonne humeur', pct: 64, color: '#F59E0B' },
]

type Sheet = 'export' | 'badge' | null

export function KudosMyProfile() {
  const [sheet, setSheet] = useState<Sheet>(null)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard?.writeText(`https://kudos.app/${MY_PROFILE.username}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F7F8FC', paddingBottom: 90,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg,#0F172A 0%,#1e3a5f 55%,#2563EB 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to bottom, transparent, #F7F8FC)',
        }} />
        {/* Options / Export */}
        <button
          onClick={() => setSheet('export')}
          style={{
            position: 'absolute', top: 52, right: 16,
            background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.25)',
            borderRadius: 12, padding: '8px 14px', color: '#fff',
            fontSize: 20, cursor: 'pointer', lineHeight: 1,
          }}
        >···</button>
      </div>

      {/* Reputation Card */}
      <div style={{
        margin: '-48px 16px 12px', background: '#fff', borderRadius: 24,
        padding: '52px 16px 18px', boxShadow: '0 4px 32px rgba(0,0,0,.09)',
        position: 'relative', textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={MY_PROFILE.avatar_url}
              alt={MY_PROFILE.name}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, right: -2, width: 20, height: 20,
              background: '#4F7DF3', borderRadius: '50%', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#fff', fontWeight: 800,
            }}>✓</div>
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{MY_PROFILE.name}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8B5CF6', marginBottom: 8 }}>{MY_PROFILE.archetype}</div>

        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 26, fontWeight: 900 }}>{MY_PROFILE.kudos_count}</span>
          <span style={{ fontSize: 14, color: '#64748B', marginLeft: 4 }}>évaluations</span>
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
          📍 {MY_PROFILE.city} · Top 5% Montpellier
        </div>

        <div style={{
          fontSize: 12, color: '#64748B', fontStyle: 'italic', lineHeight: 1.6,
          padding: '10px 13px', background: '#F7F8FC', borderRadius: 14,
          marginBottom: 14, textAlign: 'left', borderLeft: '3px solid #8B5CF6',
        }}>
          &ldquo;{MY_PROFILE.identity_quote}&rdquo;
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, textAlign: 'left' }}>
          {TRAIT_BARS.map((t) => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A', width: 100, flexShrink: 0 }}>{t.label}</span>
              <div style={{ flex: 1, height: 5, background: '#EEF2F8', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${t.pct}%`, background: t.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B', width: 26, textAlign: 'right' }}>{t.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleCopy}
          style={{
            width: '100%', padding: '16px', borderRadius: 20,
            background: 'linear-gradient(180deg,rgba(255,255,255,.38) 0%,rgba(255,255,255,.14) 55%)',
            backdropFilter: 'blur(28px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
            border: '1px solid rgba(255,255,255,.7)',
            boxShadow: '0 6px 24px rgba(0,0,0,.09),inset 0 1px 0 rgba(255,255,255,.95)',
            fontSize: 15, fontWeight: 800, color: '#0F172A', cursor: 'pointer',
          }}
        >
          {copied ? '✓ Lien copié !' : '🔗 Partager mon profil'}
        </button>
        <button
          onClick={() => {}}
          style={{
            width: '100%', padding: '13px', borderRadius: 20,
            background: 'transparent', border: '1.5px solid rgba(15,23,42,.12)',
            fontSize: 14, fontWeight: 700, color: '#64748B', cursor: 'pointer',
          }}
        >
          📤 Demander un Kudos
        </button>
      </div>

      {/* Section badges */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Mes Kudos</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>{MY_BADGES.length} badges</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MY_BADGES.map((b) => (
            <button
              key={b.id}
              onClick={() => setSheet('badge')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: b.isNew ? 'linear-gradient(135deg,#EEF2FF,#F5F3FF)' : '#fff',
                border: b.isNew ? '1px solid rgba(139,92,246,.25)' : '1px solid rgba(0,0,0,.06)',
                borderRadius: 100, padding: '8px 14px', cursor: 'pointer',
                boxShadow: b.isNew ? '0 2px 12px rgba(139,92,246,.12)' : 'none',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 16 }}>{b.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{b.name}</span>
              <span style={{
                fontSize: 11, fontWeight: 800,
                color: b.isNew ? '#22C55E' : '#64748B',
                background: b.isNew ? 'rgba(34,197,94,.1)' : 'rgba(0,0,0,.06)',
                borderRadius: 20, padding: '1px 7px',
              }}>
                {b.count} · {b.since}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <KudosBottomNav active="profil" />

      {/* Sheet Export */}
      {sheet === 'export' && (
        <ExportSheet onClose={() => setSheet(null)} onCopy={handleCopy} copied={copied} />
      )}

      <style>{`* { box-sizing: border-box; } button { font-family: inherit; }`}</style>
    </div>
  )
}

function ExportSheet({ onClose, onCopy, copied }: { onClose: () => void; onCopy: () => void; copied: boolean }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
          backdropFilter: 'blur(4px)', zIndex: 200,
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderRadius: '24px 24px 0 0',
        padding: '20px 20px 40px', zIndex: 201,
        boxShadow: '0 -8px 40px rgba(0,0,0,.15)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 20px' }} />

        <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>Partager mon profil</div>

        {/* Apple Wallet-style card preview */}
        <div style={{
          background: 'linear-gradient(135deg,#0F172A,#1e3a5f,#2563EB)',
          borderRadius: 22, padding: '20px', marginBottom: 20, color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <img src="https://i.pravatar.cc/160?img=47" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)' }} alt="" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Chloé M.</div>
              <div style={{ fontSize: 12, opacity: .7 }}>🌟 La Perle de coloc · 22 évaluations</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['✨ Propre', '❤️ Bienveillante', '👂 À l\'écoute'].map(b => (
              <span key={b} style={{ background: 'rgba(255,255,255,.15)', borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>{b}</span>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 10, opacity: .5 }}>kudos.app/chloe</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onCopy} style={{
            width: '100%', padding: '15px', borderRadius: 16, border: 'none',
            background: '#0F172A', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}>
            {copied ? '✓ Lien copié !' : '🔗 Copier mon lien public'}
          </button>
          <button onClick={() => {
            if (navigator.share) navigator.share({ title: 'Mon profil Kudos', url: 'https://kudos.app/chloe' })
          }} style={{
            width: '100%', padding: '14px', borderRadius: 16,
            border: '1.5px solid rgba(0,0,0,.1)', background: 'transparent',
            fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: 'pointer',
          }}>
            📤 Partager via WhatsApp / SMS
          </button>
        </div>
      </div>
    </>
  )
}
