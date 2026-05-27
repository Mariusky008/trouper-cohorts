'use client'

import { useState } from 'react'
import { KudosBottomNav } from './KudosBottomNav'

const NOTIFS = [
  {
    id: '1',
    type: 'kudos_received',
    sender: { name: 'Pierre D.', avatar: 'https://i.pravatar.cc/160?img=12', username: 'pierre' },
    badge: { emoji: '❤️', name: 'Bienveillante' },
    message: 'J\'ai vécu 6 mois avec toi à Lyon, tu as été la meilleure colocataire possible. Merci pour tout ✨',
    time: 'il y a 2h',
    read: false,
  },
  {
    id: '2',
    type: 'profile_viewed',
    viewer: { name: 'Sophie L.', location: 'Montpellier' },
    sections: ['badges', 'évaluations'],
    time: 'il y a 4h',
    read: false,
  },
  {
    id: '3',
    type: 'kudos_received',
    sender: { name: 'Marie T.', avatar: 'https://i.pravatar.cc/160?img=32', username: 'marie' },
    badge: { emoji: '✨', name: 'Propre' },
    message: null,
    time: 'hier',
    read: true,
  },
  {
    id: '4',
    type: 'badge_unlocked',
    badge: { emoji: '🔑', name: 'De confiance' },
    milestone: 9,
    time: 'hier',
    read: true,
  },
  {
    id: '5',
    type: 'kudos_received',
    sender: { name: 'Lucas B.', avatar: 'https://i.pravatar.cc/160?img=53', username: 'lucas' },
    badge: { emoji: '😄', name: 'Bonne humeur' },
    message: 'Toujours le sourire, c\'est rare !',
    time: 'il y a 3j',
    read: true,
  },
]

type KudosMomentData = {
  sender: { name: string; avatar: string }
  badge: { emoji: string; name: string }
  message: string | null
}

export function KudosActivite() {
  const [kudosMoment, setKudosMoment] = useState<KudosMomentData | null>(null)
  const [thanked, setThanked] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  function openKudosMoment(n: typeof NOTIFS[0]) {
    if (n.type !== 'kudos_received' || !n.sender) return
    setThanked(false)
    setKudosMoment({ sender: n.sender as any, badge: n.badge as any, message: n.message ?? null })
  }

  function closeKudosMoment(thank: boolean) {
    if (thank) showToast(`💌 Remerciement envoyé à ${kudosMoment?.sender.name.split(' ')[0]} !`)
    setKudosMoment(null)
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F7F8FC', paddingBottom: 90,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>

      {/* Header */}
      <div style={{ padding: '52px 16px 16px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Activité</div>
          <div style={{
            background: '#4F7DF3', color: '#fff', borderRadius: 100,
            padding: '3px 10px', fontSize: 12, fontWeight: 800,
          }}>2 nouveaux</div>
        </div>
      </div>

      {/* Liste notifications */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {NOTIFS.map((n) => (
          <div
            key={n.id}
            onClick={() => openKudosMoment(n as any)}
            style={{
              background: '#fff', borderRadius: 20, padding: '14px 16px',
              boxShadow: '0 2px 12px rgba(0,0,0,.06)',
              border: n.read ? '1px solid transparent' : '1px solid rgba(79,125,243,.2)',
              cursor: n.type === 'kudos_received' ? 'pointer' : 'default',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              position: 'relative',
            }}
          >
            {/* Dot non-lu */}
            {!n.read && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                width: 8, height: 8, background: '#4F7DF3', borderRadius: '50%',
              }} />
            )}

            {/* Icône / avatar */}
            <div style={{ flexShrink: 0 }}>
              {n.type === 'kudos_received' && (
                <img
                  src={(n as any).sender.avatar}
                  style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  alt=""
                />
              )}
              {n.type === 'profile_viewed' && (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>👁</div>
              )}
              {n.type === 'badge_unlocked' && (
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>{(n as any).badge.emoji}</div>
              )}
            </div>

            {/* Contenu */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {n.type === 'kudos_received' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>
                    <strong>{(n as any).sender.name}</strong> pense que tu es{' '}
                    <span style={{ color: '#4F7DF3' }}>{(n as any).badge.emoji} {(n as any).badge.name}</span>
                  </div>
                  {(n as any).message && (
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 3 }}>
                      &ldquo;{(n as any).message.substring(0, 80)}{(n as any).message.length > 80 ? '...' : ''}&rdquo;
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{n.time} · Appuie pour voir le Kudos ✨</div>
                </>
              )}

              {n.type === 'profile_viewed' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>
                    Quelqu&apos;un à <strong>{(n as any).viewer.location}</strong> a visité ton profil
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 3 }}>
                    A consulté : {(n as any).sections.join(', ')}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{n.time}</div>
                </>
              )}

              {n.type === 'badge_unlocked' && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>
                    🏆 Badge débloqué — <span style={{ color: '#F59E0B' }}>{(n as any).badge.emoji} {(n as any).badge.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 3 }}>
                    {(n as any).milestone} personnes ont confirmé cette qualité
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{n.time}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <KudosBottomNav active="activite" />

      {/* Kudos Moment overlay */}
      {kudosMoment && (
        <KudosMomentOverlay
          data={kudosMoment}
          onClose={closeKudosMoment}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: '#0F172A', color: '#fff', borderRadius: 100,
          padding: '10px 20px', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,.3)', whiteSpace: 'nowrap', zIndex: 500,
          animation: 'fadeUp .3s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  )
}

function KudosMomentOverlay({
  data, onClose,
}: {
  data: KudosMomentData
  onClose: (thank: boolean) => void
}) {
  const [closing, setClosing] = useState(false)

  function handleClose(thank: boolean) {
    setClosing(true)
    setTimeout(() => onClose(thank), 280)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'linear-gradient(160deg,#0F172A 0%,#1e3a5f 55%,#2563EB 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '28px 24px', textAlign: 'center',
      opacity: closing ? 0 : 1,
      transform: closing ? 'scale(1.04)' : 'scale(1)',
      transition: 'all .28s ease',
      animation: 'fdin .35s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      {/* Avatar expéditeur */}
      <img
        src={data.sender.avatar}
        alt={data.sender.name}
        style={{
          width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
          border: '3px solid rgba(255,255,255,.35)',
          boxShadow: '0 0 0 6px rgba(255,255,255,.08)',
          marginBottom: 16,
        }}
      />

      <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', marginBottom: 24 }}>
        <strong style={{ color: '#fff' }}>{data.sender.name}</strong> pense que tu es
      </div>

      {/* Badge principal */}
      <div style={{
        background: 'rgba(255,255,255,.12)',
        backdropFilter: 'blur(20px)',
        borderRadius: 28, padding: '24px 40px', marginBottom: 24,
        border: '1px solid rgba(255,255,255,.2)',
        animation: 'revealArch .7s cubic-bezier(.34,1.56,.64,1) .2s both',
      }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>{data.badge.emoji}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{data.badge.name}</div>
      </div>

      {/* Message perso */}
      {data.message && (
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,.7)', fontStyle: 'italic',
          lineHeight: 1.7, maxWidth: 280, marginBottom: 32,
          background: 'rgba(255,255,255,.08)', borderRadius: 16,
          padding: '14px 18px', borderLeft: '3px solid rgba(255,255,255,.3)',
          textAlign: 'left',
          animation: 'fadeUp .5s ease .5s both',
        }}>
          &ldquo;{data.message}&rdquo;
        </div>
      )}

      {!data.message && <div style={{ marginBottom: 32 }} />}

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
        <button
          onClick={() => handleClose(true)}
          style={{
            padding: '16px', borderRadius: 16, border: 'none',
            background: '#fff', color: '#0F172A',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✨ Remercier {data.sender.name.split(' ')[0]}
        </button>
        <button
          onClick={() => handleClose(false)}
          style={{
            padding: '14px', borderRadius: 16,
            background: 'transparent', border: '1px solid rgba(255,255,255,.25)',
            color: 'rgba(255,255,255,.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Plus tard
        </button>
      </div>

      <style>{`
        @keyframes fdin { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes revealArch { 0% { opacity: 0; transform: scale(.72); } 60% { transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
